
import { useState, useEffect, useCallback, useRef } from 'react';
import { BleManager, Device } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';

// Initialize BleManager as a singleton to persist across component mounts
let bleManager: BleManager | null = null;
let globalConnectedDevice: Device | null = null;
let globalPrinterCharacteristic: {
  serviceUUID: string;
  characteristicUUID: string;
} | null = null;

const getBleManager = () => {
  if (!bleManager) {
    bleManager = new BleManager();
  }
  return bleManager;
};

// ESC/POS Commands
const ESC = '\x1B';
const GS = '\x1D';

// Common ESC/POS commands
const COMMANDS = {
  INIT: ESC + '@',
  LINE_FEED: '\n',
  CUT_PAPER: GS + 'V' + '\x41' + '\x00', // Full cut
  CUT_PAPER_PARTIAL: GS + 'V' + '\x42' + '\x00', // Partial cut
  ALIGN_LEFT: ESC + 'a' + '\x00',
  ALIGN_CENTER: ESC + 'a' + '\x01',
  ALIGN_RIGHT: ESC + 'a' + '\x02',
  BOLD_ON: ESC + 'E' + '\x01',
  BOLD_OFF: ESC + 'E' + '\x00',
  FONT_SIZE_NORMAL: GS + '!' + '\x00',
  FONT_SIZE_DOUBLE: GS + '!' + '\x11',
  FONT_SIZE_TRIPLE: GS + '!' + '\x22',
};

// Generic printer service UUID (commonly used by thermal printers)
const PRINTER_SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb';
const PRINTER_CHARACTERISTIC_UUID = '00002af1-0000-1000-8000-00805f9b34fb';

// Alternative UUIDs to try
const ALTERNATIVE_SERVICE_UUIDS = [
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Common for some Chinese printers
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Another common UUID
];

const ALTERNATIVE_CHARACTERISTIC_UUIDS = [
  '49535343-8841-43f4-a8d4-ecbe34729bb3',
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
];

const SAVED_PRINTER_KEY = '@saved_printer_device';

export const usePrinter = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(globalConnectedDevice);
  const [scanning, setScanning] = useState(false);
  const [printerCharacteristic, setPrinterCharacteristic] = useState<{
    serviceUUID: string;
    characteristicUUID: string;
  } | null>(globalPrinterCharacteristic);
  const isMounted = useRef(true);

  const requestPermissions = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        if (Platform.Version >= 31) {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ]);
          
          return Object.values(granted).every(
            (status) => status === PermissionsAndroid.RESULTS.GRANTED
          );
        } else {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (error) {
        console.error('usePrinter: Error requesting permissions:', error);
        return false;
      }
    }
    return true;
  }, []);

  const loadAndReconnectSavedPrinter = useCallback(async () => {
    try {
      const savedPrinter = await AsyncStorage.getItem(SAVED_PRINTER_KEY);
      if (savedPrinter) {
        const printerData = JSON.parse(savedPrinter);
        console.log('usePrinter: Found saved printer:', printerData.name);
        
        // If we already have a global connection, use it
        if (globalConnectedDevice && globalPrinterCharacteristic) {
          console.log('usePrinter: Using existing global connection');
          setConnectedDevice(globalConnectedDevice);
          setPrinterCharacteristic(globalPrinterCharacteristic);
        }
      }
    } catch (error) {
      console.error('usePrinter: Error loading saved printer:', error);
    }
  }, []);

  // Load saved printer on mount and try to reconnect
  useEffect(() => {
    console.log('usePrinter: Initializing');
    isMounted.current = true;
    requestPermissions();
    loadAndReconnectSavedPrinter();
    
    return () => {
      console.log('usePrinter: Component unmounting, but keeping connection alive');
      isMounted.current = false;
      // DO NOT disconnect here - keep the connection alive
    };
  }, [requestPermissions, loadAndReconnectSavedPrinter]);

  const savePrinter = async (device: Device) => {
    try {
      const printerData = {
        id: device.id,
        name: device.name,
      };
      await AsyncStorage.setItem(SAVED_PRINTER_KEY, JSON.stringify(printerData));
      console.log('usePrinter: Printer saved:', device.name);
    } catch (error) {
      console.error('usePrinter: Error saving printer:', error);
    }
  };

  const scanForDevices = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permiso Requerido', 'Se requieren permisos de Bluetooth para buscar impresoras');
        return;
      }

      console.log('usePrinter: Starting device scan');
      setScanning(true);
      setDevices([]);

      const manager = getBleManager();
      manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('usePrinter: Scan error:', error);
          setScanning(false);
          Alert.alert('Error', 'Error al escanear dispositivos Bluetooth');
          return;
        }

        if (device && device.name) {
          setDevices((prevDevices) => {
            const exists = prevDevices.find((d) => d.id === device.id);
            if (!exists) {
              console.log('usePrinter: Found device:', device.name);
              return [...prevDevices, device];
            }
            return prevDevices;
          });
        }
      });

      setTimeout(() => {
        console.log('usePrinter: Stopping device scan after timeout');
        manager.stopDeviceScan();
        setScanning(false);
      }, 10000);
    } catch (error) {
      console.error('usePrinter: Error in scanForDevices:', error);
      setScanning(false);
      Alert.alert('Error', 'Error al buscar dispositivos');
    }
  };

  const findPrinterCharacteristic = async (device: Device) => {
    try {
      console.log('usePrinter: Discovering services and characteristics...');
      await device.discoverAllServicesAndCharacteristics();
      
      const services = await device.services();
      console.log('usePrinter: Found services:', services.map(s => s.uuid));

      // Try to find the printer service and characteristic
      for (const service of services) {
        const characteristics = await service.characteristics();
        console.log(`usePrinter: Service ${service.uuid} has characteristics:`, characteristics.map(c => c.uuid));
        
        for (const characteristic of characteristics) {
          // Check if characteristic is writable
          if (characteristic.isWritableWithResponse || characteristic.isWritableWithoutResponse) {
            console.log('usePrinter: Found writable characteristic:', characteristic.uuid);
            return {
              serviceUUID: service.uuid,
              characteristicUUID: characteristic.uuid,
            };
          }
        }
      }

      console.log('usePrinter: No suitable characteristic found');
      return null;
    } catch (error) {
      console.error('usePrinter: Error finding characteristic:', error);
      return null;
    }
  };

  const connectToDevice = async (device: Device) => {
    try {
      console.log('usePrinter: Connecting to device:', device.name);
      const connected = await device.connect();
      
      // Find the printer characteristic
      const characteristic = await findPrinterCharacteristic(connected);
      
      if (!characteristic) {
        await connected.cancelConnection();
        throw new Error('No se encontró una característica de impresora válida');
      }

      // Store in global variables to persist across component mounts
      globalConnectedDevice = connected;
      globalPrinterCharacteristic = characteristic;
      
      setPrinterCharacteristic(characteristic);
      setConnectedDevice(connected);
      await savePrinter(connected);
      console.log('usePrinter: Connected successfully');
    } catch (error) {
      console.error('usePrinter: Connection error:', error);
      throw error;
    }
  };

  const disconnectDevice = async () => {
    if (connectedDevice || globalConnectedDevice) {
      try {
        console.log('usePrinter: Disconnecting device');
        const deviceToDisconnect = connectedDevice || globalConnectedDevice;
        if (deviceToDisconnect) {
          await deviceToDisconnect.cancelConnection();
        }
        
        // Clear both local and global state
        setConnectedDevice(null);
        setPrinterCharacteristic(null);
        globalConnectedDevice = null;
        globalPrinterCharacteristic = null;
        
        // Clear saved printer
        await AsyncStorage.removeItem(SAVED_PRINTER_KEY);
      } catch (error) {
        console.error('usePrinter: Error disconnecting:', error);
        throw error;
      }
    }
  };

  const sendDataToPrinter = async (data: string) => {
    const device = connectedDevice || globalConnectedDevice;
    const characteristic = printerCharacteristic || globalPrinterCharacteristic;
    
    if (!device || !characteristic) {
      throw new Error('No hay impresora conectada');
    }

    try {
      console.log('usePrinter: Sending data to printer...');
      
      // Convert string to base64
      const base64Data = Buffer.from(data, 'utf-8').toString('base64');
      
      // Write to characteristic
      await device.writeCharacteristicWithResponseForService(
        characteristic.serviceUUID,
        characteristic.characteristicUUID,
        base64Data
      );
      
      console.log('usePrinter: Data sent successfully');
    } catch (error) {
      console.error('usePrinter: Error sending data:', error);
      throw error;
    }
  };

  const printReceipt = async (content: string, autoCut: boolean = true) => {
    const device = connectedDevice || globalConnectedDevice;
    
    if (!device) {
      throw new Error('No hay impresora conectada');
    }

    try {
      console.log('usePrinter: Printing receipt...');
      
      // Build the print command
      let printData = COMMANDS.INIT; // Initialize printer
      printData += COMMANDS.ALIGN_CENTER;
      printData += COMMANDS.BOLD_ON;
      printData += COMMANDS.FONT_SIZE_DOUBLE;
      printData += content;
      printData += COMMANDS.BOLD_OFF;
      printData += COMMANDS.FONT_SIZE_NORMAL;
      printData += COMMANDS.LINE_FEED;
      printData += COMMANDS.LINE_FEED;
      printData += COMMANDS.LINE_FEED;
      
      // Add cut command if enabled
      if (autoCut) {
        printData += COMMANDS.CUT_PAPER;
      }
      
      await sendDataToPrinter(printData);
      console.log('usePrinter: Print completed');
    } catch (error) {
      console.error('usePrinter: Print error:', error);
      throw error;
    }
  };

  const testPrint = async (autoCut: boolean = true) => {
    const testContent = `
=================================
   IMPRESIÓN DE PRUEBA
=================================

Esta es una prueba de impresión.

Si puedes leer esto, tu 
impresora funciona correctamente.

Fecha: ${new Date().toLocaleString('es-ES')}

=================================
`;
    
    try {
      await printReceipt(testContent, autoCut);
    } catch (error) {
      console.error('usePrinter: Test print error:', error);
      throw error;
    }
  };

  const stopScanFunc = useCallback(() => {
    console.log('usePrinter: Stopping scan manually');
    const manager = getBleManager();
    manager.stopDeviceScan();
    setScanning(false);
  }, []);

  return {
    devices,
    connectedDevice: connectedDevice || globalConnectedDevice,
    scanning,
    scanForDevices,
    connectToDevice,
    disconnectDevice,
    printReceipt,
    testPrint,
    isScanning: scanning,
    isConnected: !!(connectedDevice || globalConnectedDevice),
    startScan: scanForDevices,
    stopScan: stopScanFunc,
    disconnect: disconnectDevice,
  };
};
