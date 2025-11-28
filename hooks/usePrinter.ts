
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

// FIXED: Track print requests with a Set to prevent duplicates
// Using a Set with order IDs and timestamps to prevent duplicate prints
const recentPrintRequests = new Set<string>();
const PRINT_DEBOUNCE_TIME = 3000; // 3 seconds debounce

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
const MAX_CHUNK_SIZE = 180; // Maximum bytes per write operation (safe for most printers)
const RECONNECT_TIMEOUT = 2000; // 2 seconds timeout for auto-reconnect (reduced from 3)

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
        // Send a simple status request command (ESC v - does not print anything)
        const keepAliveCommand = ESC + 'v';
        const buffer = Buffer.from(keepAliveCommand, 'binary');
        const base64Data = buffer.toString('base64');
        
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
      // We will let the next print attempt handle reconnection
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
  const reconnectAttemptedRef = useRef(false);
  const initializationStartedRef = useRef(false);

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

  const findPrinterCharacteristic = async (device: Device) => {
    try {
      console.log('[usePrinter] Discovering services and characteristics...');
      await device.discoverAllServicesAndCharacteristics();
      
      const services = await device.services();
      console.log('[usePrinter] Found services:', services.map(s => s.uuid));

      // Try to find the printer service and characteristic
      for (const service of services) {
        const characteristics = await service.characteristics();
        console.log('[usePrinter] Service ' + service.uuid + ' has characteristics:', characteristics.map(c => c.uuid));
        
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
      console.log('[usePrinter] Printer will auto-reconnect on app restart');
    } catch (error) {
      console.error('[usePrinter] Connection error:', error);
      throw error;
    }
  };

  const loadAndReconnectSavedPrinter = useCallback(async () => {
    try {
      // If we already have a global connection, use it
      if (globalConnectedDevice && globalPrinterCharacteristic) {
        console.log('[usePrinter] Using existing global connection');
        setConnectedDevice(globalConnectedDevice);
        setPrinterCharacteristic(globalPrinterCharacteristic);
        
        // Verify the connection is still active
        try {
          const isConnected = await globalConnectedDevice.isConnected();
          if (isConnected) {
            console.log('[usePrinter] Global connection is active');
            // Start keep-alive for existing connection
            startKeepAlive(globalConnectedDevice, globalPrinterCharacteristic);
            return;
          } else {
            console.log('[usePrinter] Global connection is not active, clearing');
            globalConnectedDevice = null;
            globalPrinterCharacteristic = null;
            setConnectedDevice(null);
            setPrinterCharacteristic(null);
          }
        } catch (error) {
          console.error('[usePrinter] Error checking global connection:', error);
          globalConnectedDevice = null;
          globalPrinterCharacteristic = null;
          setConnectedDevice(null);
          setPrinterCharacteristic(null);
        }
      }

      // Try to reconnect to saved printer with timeout
      const savedPrinter = await AsyncStorage.getItem(SAVED_PRINTER_KEY);
      if (savedPrinter && !reconnectAttemptedRef.current) {
        const printerData = JSON.parse(savedPrinter);
        console.log('[usePrinter] Found saved printer, attempting to reconnect:', printerData.name);
        reconnectAttemptedRef.current = true;

        // Request permissions first
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
          console.log('[usePrinter] No Bluetooth permissions, cannot reconnect');
          return;
        }

        const manager = getBleManager();
        
        // Try to connect directly to the saved device with timeout
        try {
          console.log('[usePrinter] Attempting to connect to saved device ID:', printerData.id);
          
          // Create a promise that rejects after timeout
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Connection timeout')), RECONNECT_TIMEOUT);
          });
          
          // Race between connection and timeout
          const device = await Promise.race([
            manager.connectToDevice(printerData.id, {
              timeout: RECONNECT_TIMEOUT,
            }),
            timeoutPromise
          ]) as Device;
          
          console.log('[usePrinter] Successfully connected to saved device');
          
          // Find the printer characteristic
          const characteristic = await findPrinterCharacteristic(device);
          
          if (characteristic) {
            // Store in global variables
            globalConnectedDevice = device;
            globalPrinterCharacteristic = characteristic;
            
            setPrinterCharacteristic(characteristic);
            setConnectedDevice(device);
            
            // Start keep-alive mechanism
            startKeepAlive(device, characteristic);
            
            console.log('[usePrinter] Auto-reconnected successfully to saved printer');
          } else {
            console.log('[usePrinter] Could not find printer characteristic on saved device');
            await device.cancelConnection();
          }
        } catch (error) {
          console.log('[usePrinter] Could not auto-reconnect to saved printer (timeout or error)');
          // Do not show alert here, just log the error
        }
      }
    } catch (error) {
      console.error('[usePrinter] Error loading saved printer:', error);
    }
  }, [requestPermissions]);

  // Load saved printer on mount and try to reconnect
  // FIXED: Defer initialization significantly to prevent blocking app startup
  useEffect(() => {
    if (initializationStartedRef.current) {
      return; // Already initialized
    }
    
    console.log('[usePrinter] Initializing printer hook (deferred)');
    isMounted.current = true;
    initializationStartedRef.current = true;
    
    // Defer initialization significantly to prevent blocking splash screen
    const initTimer = setTimeout(() => {
      console.log('[usePrinter] Starting deferred initialization');
      requestPermissions().catch(err => {
        console.error('[usePrinter] Error requesting permissions:', err);
      });
      loadAndReconnectSavedPrinter().catch(err => {
        console.error('[usePrinter] Error loading saved printer:', err);
      });
    }, 3000); // Wait 3 seconds before initializing (reduced from 5)
    
    return () => {
      console.log('[usePrinter] Component unmounting, but keeping connection alive');
      clearTimeout(initTimer);
      isMounted.current = false;
      // DO NOT disconnect here - keep the connection alive
      // DO NOT stop keep-alive here - let it continue
    };
  }, [requestPermissions, loadAndReconnectSavedPrinter]); // Include dependencies

  const savePrinter = async (device: Device) => {
    try {
      const printerData = {
        id: device.id,
        name: device.name,
      };
      await AsyncStorage.setItem(SAVED_PRINTER_KEY, JSON.stringify(printerData));
      console.log('[usePrinter] Printer saved to AsyncStorage:', device.name);
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
        console.log('[usePrinter] Printer removed from saved devices');
        
        // Reset reconnect flag
        reconnectAttemptedRef.current = false;
      } catch (error) {
        console.error('[usePrinter] Error disconnecting:', error);
        throw error;
      }
    }
  };

  /**
   * Send data to printer in chunks to avoid buffer overflow
   * This is critical for printing large receipts with many items
   */
  const sendDataToPrinter = async (data: Uint8Array) => {
    const device = connectedDevice || globalConnectedDevice;
    const characteristic = printerCharacteristic || globalPrinterCharacteristic;
    
    if (!device || !characteristic) {
      throw new Error('No hay impresora conectada');
    }

    try {
      console.log('[usePrinter] Sending data to printer, total bytes:', data.length);
      
      // Check if device is still connected
      const isConnected = await device.isConnected();
      if (!isConnected) {
        console.log('[usePrinter] Device disconnected, attempting to reconnect...');
        throw new Error('La impresora se desconectó. Por favor, reconecta la impresora.');
      }
      
      // Split data into chunks to avoid buffer overflow
      const chunks: Uint8Array[] = [];
      for (let i = 0; i < data.length; i += MAX_CHUNK_SIZE) {
        const chunk = data.slice(i, Math.min(i + MAX_CHUNK_SIZE, data.length));
        chunks.push(chunk);
      }
      
      console.log('[usePrinter] Split data into ' + chunks.length + ' chunks');
      
      // Send each chunk with a small delay to ensure printer processes it
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const buffer = Buffer.from(chunk);
        const base64Data = buffer.toString('base64');
        
        console.log('[usePrinter] Sending chunk ' + (i + 1) + '/' + chunks.length + ', size: ' + chunk.length + ' bytes');
        
        await device.writeCharacteristicWithResponseForService(
          characteristic.serviceUUID,
          characteristic.characteristicUUID,
          base64Data
        );
        
        // Small delay between chunks to prevent buffer overflow
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      console.log('[usePrinter] All data sent successfully');
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
    textSize: 'small' | 'medium' | 'large' = 'medium',
    orderId?: string
  ) => {
    const device = connectedDevice || globalConnectedDevice;
    
    if (!device) {
      throw new Error('No hay impresora conectada');
    }

    // FIXED: Improved duplicate prevention using Set with order ID and timestamp
    const printKey = orderId ? `${orderId}-${Date.now()}` : `print-${Date.now()}`;
    
    // Check if this exact print request was made recently
    if (orderId && recentPrintRequests.has(orderId)) {
      console.log('[usePrinter] Duplicate print request detected for order:', orderId);
      console.log('[usePrinter] Skipping duplicate print to prevent double printing');
      return;
    }

    try {
      // Add to recent print requests
      if (orderId) {
        recentPrintRequests.add(orderId);
        console.log('[usePrinter] Added order to recent print requests:', orderId);
      }
      
      console.log('[usePrinter] Printing receipt');
      console.log('[usePrinter] Settings:', { textSize, autoCut, orderId });
      console.log('[usePrinter] Content length:', content.length);
      
      // Build the complete print command
      let printData = COMMANDS.INIT;
      printData += COMMANDS.ALIGN_LEFT;
      printData += getFontSizeCommand(textSize);
      printData += content;
      printData += COMMANDS.FONT_SIZE_SMALL; // Reset to normal size
      printData += COMMANDS.LINE_FEED + COMMANDS.LINE_FEED + COMMANDS.LINE_FEED;
      
      if (autoCut) {
        printData += COMMANDS.CUT_PAPER;
      }
      
      // Convert to bytes
      const encoder = new TextEncoder();
      const data = encoder.encode(printData);
      
      // Send to printer
      await sendDataToPrinter(data);
      
      console.log('[usePrinter] Print completed successfully');
    } catch (error) {
      console.error('[usePrinter] Print error:', error);
      // Remove from recent requests on error so it can be retried
      if (orderId) {
        recentPrintRequests.delete(orderId);
      }
      throw error;
    } finally {
      // Remove from recent print requests after debounce time
      if (orderId) {
        setTimeout(() => {
          recentPrintRequests.delete(orderId);
          console.log('[usePrinter] Removed order from recent print requests:', orderId);
        }, PRINT_DEBOUNCE_TIME);
      }
    }
  };

  const testPrint = async (autoCut: boolean = true) => {
    const testContent = `
=================================
   IMPRESION DE PRUEBA
=================================

Esta es una prueba de impresion
para verificar la conexion con
la impresora termica.

Fecha: ${new Date().toLocaleString('es-ES')}

Si puedes leer este texto,
tu impresora esta funcionando
correctamente.

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
    // Device management
    devices,
    availableDevices: devices, // Add alias for backward compatibility
    connectedDevice: connectedDevice || globalConnectedDevice,
    scanning,
    isScanning: scanning,
    isConnected: !!(connectedDevice || globalConnectedDevice),
    
    // Connection functions
    scanForDevices,
    scan: scanForDevices, // Add alias for backward compatibility
    startScan: scanForDevices,
    stopScan: stopScanFunc,
    connectToDevice,
    connect: connectToDevice, // Add alias for backward compatibility
    disconnectDevice,
    disconnect: disconnectDevice,
    
    // Printing functions
    printReceipt,
    testPrint,
    printer: connectedDevice || globalConnectedDevice, // Add alias for backward compatibility
  };
};
