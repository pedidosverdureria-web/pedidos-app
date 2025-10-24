
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
let keepAliveInterval: NodeJS.Timeout | null = null;

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
  FONT_SIZE_SMALL: GS + '!' + '\x00',      // Normal size
  FONT_SIZE_MEDIUM: GS + '!' + '\x11',     // Double height and width
  FONT_SIZE_LARGE: GS + '!' + '\x22',      // Triple height and width
  // Set code page to CP850 (supports Spanish characters)
  SET_CODEPAGE_850: ESC + 't' + '\x02',
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
const KEEP_ALIVE_INTERVAL = 30000; // 30 seconds

// Character mapping for Spanish characters to CP850 encoding
const CHAR_MAP: { [key: string]: string } = {
  'á': '\xA0', 'é': '\x82', 'í': '\xA1', 'ó': '\xA2', 'ú': '\xA3',
  'Á': '\xB5', 'É': '\x90', 'Í': '\xD6', 'Ó': '\xE0', 'Ú': '\xE9',
  'ñ': '\xA4', 'Ñ': '\xA5',
  'ü': '\x81', 'Ü': '\x9A',
  '¿': '\xA8', '¡': '\xAD',
  '°': '\xF8', '€': '\xEE',
};

// Function to convert text with Spanish characters to CP850 encoding
const convertToCP850 = (text: string): string => {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (CHAR_MAP[char]) {
      result += CHAR_MAP[char];
    } else {
      result += char;
    }
  }
  return result;
};

// Keep-alive mechanism to prevent Bluetooth disconnection
const startKeepAlive = (device: Device, characteristic: { serviceUUID: string; characteristicUUID: string }) => {
  console.log('[usePrinter] Starting keep-alive mechanism');
  
  // Clear any existing interval
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
  
  // Send a small command periodically to keep the connection alive
  keepAliveInterval = setInterval(async () => {
    try {
      if (device && characteristic) {
        console.log('[usePrinter] Sending keep-alive ping');
        // Send a simple status request command (ESC v - doesn't print anything)
        const keepAliveCommand = ESC + 'v';
        const base64Data = Buffer.from(keepAliveCommand, 'binary').toString('base64');
        
        await device.writeCharacteristicWithResponseForService(
          characteristic.serviceUUID,
          characteristic.characteristicUUID,
          base64Data
        );
        console.log('[usePrinter] Keep-alive ping sent successfully');
      }
    } catch (error) {
      console.error('[usePrinter] Keep-alive ping failed:', error);
      // If keep-alive fails, the connection might be lost
      // We'll let the next print attempt handle reconnection
    }
  }, KEEP_ALIVE_INTERVAL);
};

const stopKeepAlive = () => {
  console.log('[usePrinter] Stopping keep-alive mechanism');
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
};

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
        console.error('[usePrinter] Error requesting permissions:', error);
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
        console.log('[usePrinter] Found saved printer:', printerData.name);
        
        // If we already have a global connection, use it
        if (globalConnectedDevice && globalPrinterCharacteristic) {
          console.log('[usePrinter] Using existing global connection');
          setConnectedDevice(globalConnectedDevice);
          setPrinterCharacteristic(globalPrinterCharacteristic);
          
          // Start keep-alive for existing connection
          startKeepAlive(globalConnectedDevice, globalPrinterCharacteristic);
        }
      }
    } catch (error) {
      console.error('[usePrinter] Error loading saved printer:', error);
    }
  }, []);

  // Load saved printer on mount and try to reconnect
  useEffect(() => {
    console.log('[usePrinter] Initializing');
    isMounted.current = true;
    requestPermissions();
    loadAndReconnectSavedPrinter();
    
    return () => {
      console.log('[usePrinter] Component unmounting, but keeping connection alive');
      isMounted.current = false;
      // DO NOT disconnect here - keep the connection alive
      // DO NOT stop keep-alive here - let it continue
    };
  }, [requestPermissions, loadAndReconnectSavedPrinter]);

  const savePrinter = async (device: Device) => {
    try {
      const printerData = {
        id: device.id,
        name: device.name,
      };
      await AsyncStorage.setItem(SAVED_PRINTER_KEY, JSON.stringify(printerData));
      console.log('[usePrinter] Printer saved:', device.name);
    } catch (error) {
      console.error('[usePrinter] Error saving printer:', error);
    }
  };

  const scanForDevices = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permiso Requerido', 'Se requieren permisos de Bluetooth para buscar impresoras');
        return;
      }

      console.log('[usePrinter] Starting device scan');
      setScanning(true);
      setDevices([]);

      const manager = getBleManager();
      manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('[usePrinter] Scan error:', error);
          setScanning(false);
          Alert.alert('Error', 'Error al escanear dispositivos Bluetooth');
          return;
        }

        if (device && device.name) {
          setDevices((prevDevices) => {
            const exists = prevDevices.find((d) => d.id === device.id);
            if (!exists) {
              console.log('[usePrinter] Found device:', device.name);
              return [...prevDevices, device];
            }
            return prevDevices;
          });
        }
      });

      setTimeout(() => {
        console.log('[usePrinter] Stopping device scan after timeout');
        manager.stopDeviceScan();
        setScanning(false);
      }, 10000);
    } catch (error) {
      console.error('[usePrinter] Error in scanForDevices:', error);
      setScanning(false);
      Alert.alert('Error', 'Error al buscar dispositivos');
    }
  };

  const findPrinterCharacteristic = async (device: Device) => {
    try {
      console.log('[usePrinter] Discovering services and characteristics...');
      await device.discoverAllServicesAndCharacteristics();
      
      const services = await device.services();
      console.log('[usePrinter] Found services:', services.map(s => s.uuid));

      // Try to find the printer service and characteristic
      for (const service of services) {
        const characteristics = await service.characteristics();
        console.log(`[usePrinter] Service ${service.uuid} has characteristics:`, characteristics.map(c => c.uuid));
        
        for (const characteristic of characteristics) {
          // Check if characteristic is writable
          if (characteristic.isWritableWithResponse || characteristic.isWritableWithoutResponse) {
            console.log('[usePrinter] Found writable characteristic:', characteristic.uuid);
            return {
              serviceUUID: service.uuid,
              characteristicUUID: characteristic.uuid,
            };
          }
        }
      }

      console.log('[usePrinter] No suitable characteristic found');
      return null;
    } catch (error) {
      console.error('[usePrinter] Error finding characteristic:', error);
      return null;
    }
  };

  const connectToDevice = async (device: Device) => {
    try {
      console.log('[usePrinter] Connecting to device:', device.name);
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
      
      // Start keep-alive mechanism
      startKeepAlive(connected, characteristic);
      
      console.log('[usePrinter] Connected successfully with keep-alive enabled');
    } catch (error) {
      console.error('[usePrinter] Connection error:', error);
      throw error;
    }
  };

  const disconnectDevice = async () => {
    if (connectedDevice || globalConnectedDevice) {
      try {
        console.log('[usePrinter] Disconnecting device');
        
        // Stop keep-alive
        stopKeepAlive();
        
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
        console.error('[usePrinter] Error disconnecting:', error);
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
      console.log('[usePrinter] Sending data to printer, length:', data.length);
      
      // Check if device is still connected
      const isConnected = await device.isConnected();
      if (!isConnected) {
        console.log('[usePrinter] Device disconnected, attempting to reconnect...');
        throw new Error('La impresora se desconectó. Por favor, reconecta la impresora.');
      }
      
      // Convert string to binary buffer (not UTF-8, use binary encoding)
      const buffer = Buffer.from(data, 'binary');
      const base64Data = buffer.toString('base64');
      
      // Write to characteristic
      await device.writeCharacteristicWithResponseForService(
        characteristic.serviceUUID,
        characteristic.characteristicUUID,
        base64Data
      );
      
      console.log('[usePrinter] Data sent successfully');
    } catch (error) {
      console.error('[usePrinter] Error sending data:', error);
      throw error;
    }
  };

  const getFontSizeCommand = (textSize: 'small' | 'medium' | 'large'): string => {
    switch (textSize) {
      case 'small':
        return COMMANDS.FONT_SIZE_SMALL;
      case 'medium':
        return COMMANDS.FONT_SIZE_MEDIUM;
      case 'large':
        return COMMANDS.FONT_SIZE_LARGE;
      default:
        return COMMANDS.FONT_SIZE_MEDIUM;
    }
  };

  const printReceipt = async (
    content: string, 
    autoCut: boolean = true, 
    textSize: 'small' | 'medium' | 'large' = 'medium'
  ) => {
    const device = connectedDevice || globalConnectedDevice;
    
    if (!device) {
      throw new Error('No hay impresora conectada');
    }

    try {
      console.log('[usePrinter] Printing receipt with text size:', textSize);
      console.log('[usePrinter] Original content preview:', content.substring(0, 100));
      
      // Convert Spanish characters to CP850 encoding
      const convertedContent = convertToCP850(content);
      console.log('[usePrinter] Converted content preview:', convertedContent.substring(0, 100));
      
      // Build the print command
      let printData = COMMANDS.INIT; // Initialize printer
      printData += COMMANDS.SET_CODEPAGE_850; // Set code page to CP850
      printData += COMMANDS.ALIGN_LEFT; // Align left for better readability
      printData += getFontSizeCommand(textSize); // Set font size based on config
      printData += convertedContent;
      printData += COMMANDS.FONT_SIZE_SMALL; // Reset to normal size
      printData += COMMANDS.LINE_FEED;
      printData += COMMANDS.LINE_FEED;
      printData += COMMANDS.LINE_FEED;
      
      // Add cut command if enabled
      if (autoCut) {
        printData += COMMANDS.CUT_PAPER;
      }
      
      await sendDataToPrinter(printData);
      console.log('[usePrinter] Print completed successfully');
    } catch (error) {
      console.error('[usePrinter] Print error:', error);
      throw error;
    }
  };

  const testPrint = async (autoCut: boolean = true) => {
    const testContent = `
=================================
   IMPRESIÓN DE PRUEBA
=================================

Esta es una prueba de impresión.

Caracteres especiales:
á é í ó ú ñ Ñ ¿ ¡

Si puedes leer esto correctamente,
tu impresora funciona bien.

Fecha: ${new Date().toLocaleString('es-ES')}

=================================
`;
    
    try {
      await printReceipt(testContent, autoCut, 'medium');
    } catch (error) {
      console.error('[usePrinter] Test print error:', error);
      throw error;
    }
  };

  const stopScanFunc = useCallback(() => {
    console.log('[usePrinter] Stopping scan manually');
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
