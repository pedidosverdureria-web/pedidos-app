
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
  // Alternative code pages
  SET_CODEPAGE_437: ESC + 't' + '\x00',    // USA
  SET_CODEPAGE_858: ESC + 't' + '\x13',    // Euro
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

// Complete and accurate CP850 character mapping for Spanish and special characters
// CP850 is the standard code page for thermal printers with Spanish support
// This mapping ensures that ñ, accented vowels, and special characters print correctly
const CP850_MAP: { [key: string]: number } = {
  // ===== SPANISH CHARACTERS (MOST IMPORTANT) =====
  // Ñ and ñ - THE MOST CRITICAL FOR SPANISH
  'ñ': 164,  // LATIN SMALL LETTER N WITH TILDE
  'Ñ': 165,  // LATIN CAPITAL LETTER N WITH TILDE
  
  // Lowercase vowels with acute accents
  'á': 160,  // LATIN SMALL LETTER A WITH ACUTE
  'é': 130,  // LATIN SMALL LETTER E WITH ACUTE
  'í': 161,  // LATIN SMALL LETTER I WITH ACUTE
  'ó': 162,  // LATIN SMALL LETTER O WITH ACUTE
  'ú': 163,  // LATIN SMALL LETTER U WITH ACUTE
  
  // Uppercase vowels with acute accents
  'Á': 181,  // LATIN CAPITAL LETTER A WITH ACUTE
  'É': 144,  // LATIN CAPITAL LETTER E WITH ACUTE
  'Í': 214,  // LATIN CAPITAL LETTER I WITH ACUTE
  'Ó': 224,  // LATIN CAPITAL LETTER O WITH ACUTE
  'Ú': 233,  // LATIN CAPITAL LETTER U WITH ACUTE
  
  // Ü and ü (used in Spanish)
  'ü': 129,  // LATIN SMALL LETTER U WITH DIAERESIS
  'Ü': 154,  // LATIN CAPITAL LETTER U WITH DIAERESIS
  
  // Spanish punctuation
  '¿': 168,  // INVERTED QUESTION MARK
  '¡': 173,  // INVERTED EXCLAMATION MARK
  
  // ===== ADDITIONAL ACCENTED CHARACTERS =====
  // Lowercase vowels with grave accents
  'à': 133,  // LATIN SMALL LETTER A WITH GRAVE
  'è': 138,  // LATIN SMALL LETTER E WITH GRAVE
  'ì': 141,  // LATIN SMALL LETTER I WITH GRAVE
  'ò': 149,  // LATIN SMALL LETTER O WITH GRAVE
  'ù': 151,  // LATIN SMALL LETTER U WITH GRAVE
  
  // Uppercase vowels with grave accents
  'À': 183,  // LATIN CAPITAL LETTER A WITH GRAVE
  'È': 212,  // LATIN CAPITAL LETTER E WITH GRAVE
  'Ì': 222,  // LATIN CAPITAL LETTER I WITH GRAVE
  'Ò': 227,  // LATIN CAPITAL LETTER O WITH GRAVE
  'Ù': 235,  // LATIN CAPITAL LETTER U WITH GRAVE
  
  // Lowercase vowels with circumflex
  'â': 131,  // LATIN SMALL LETTER A WITH CIRCUMFLEX
  'ê': 136,  // LATIN SMALL LETTER E WITH CIRCUMFLEX
  'î': 140,  // LATIN SMALL LETTER I WITH CIRCUMFLEX
  'ô': 147,  // LATIN SMALL LETTER O WITH CIRCUMFLEX
  'û': 150,  // LATIN SMALL LETTER U WITH CIRCUMFLEX
  
  // Uppercase vowels with circumflex
  'Â': 182,  // LATIN CAPITAL LETTER A WITH CIRCUMFLEX
  'Ê': 210,  // LATIN CAPITAL LETTER E WITH CIRCUMFLEX
  'Î': 215,  // LATIN CAPITAL LETTER I WITH CIRCUMFLEX
  'Ô': 226,  // LATIN CAPITAL LETTER O WITH CIRCUMFLEX
  'Û': 234,  // LATIN CAPITAL LETTER U WITH CIRCUMFLEX
  
  // ===== OTHER SPECIAL CHARACTERS =====
  // Currency and symbols
  '°': 248,  // DEGREE SIGN
  '€': 213,  // EURO SIGN
  '£': 156,  // POUND SIGN
  '¥': 157,  // YEN SIGN
  '¢': 189,  // CENT SIGN
  'ª': 166,  // FEMININE ORDINAL INDICATOR
  'º': 167,  // MASCULINE ORDINAL INDICATOR
  
  // C with cedilla
  'ç': 135,  // LATIN SMALL LETTER C WITH CEDILLA
  'Ç': 128,  // LATIN CAPITAL LETTER C WITH CEDILLA
  
  // Other accented letters
  'ä': 132,  // LATIN SMALL LETTER A WITH DIAERESIS
  'Ä': 142,  // LATIN CAPITAL LETTER A WITH DIAERESIS
  'ë': 137,  // LATIN SMALL LETTER E WITH DIAERESIS
  'Ë': 211,  // LATIN CAPITAL LETTER E WITH DIAERESIS
  'ï': 139,  // LATIN SMALL LETTER I WITH DIAERESIS
  'Ï': 216,  // LATIN CAPITAL LETTER I WITH DIAERESIS
  'ö': 148,  // LATIN SMALL LETTER O WITH DIAERESIS
  'Ö': 153,  // LATIN CAPITAL LETTER O WITH DIAERESIS
  
  // Additional letters
  'å': 134,  // LATIN SMALL LETTER A WITH RING ABOVE
  'Å': 143,  // LATIN CAPITAL LETTER A WITH RING ABOVE
  'æ': 145,  // LATIN SMALL LETTER AE
  'Æ': 146,  // LATIN CAPITAL LETTER AE
  'ø': 155,  // LATIN SMALL LETTER O WITH STROKE
  'Ø': 157,  // LATIN CAPITAL LETTER O WITH STROKE (alternative)
  
  // ===== BOX DRAWING CHARACTERS =====
  // Single line box drawing
  '─': 196,  // BOX DRAWINGS LIGHT HORIZONTAL
  '│': 179,  // BOX DRAWINGS LIGHT VERTICAL
  '┌': 218,  // BOX DRAWINGS LIGHT DOWN AND RIGHT
  '┐': 191,  // BOX DRAWINGS LIGHT DOWN AND LEFT
  '└': 192,  // BOX DRAWINGS LIGHT UP AND RIGHT
  '┘': 217,  // BOX DRAWINGS LIGHT UP AND LEFT
  '├': 195,  // BOX DRAWINGS LIGHT VERTICAL AND RIGHT
  '┤': 180,  // BOX DRAWINGS LIGHT VERTICAL AND LEFT
  '┬': 194,  // BOX DRAWINGS LIGHT DOWN AND HORIZONTAL
  '┴': 193,  // BOX DRAWINGS LIGHT UP AND HORIZONTAL
  '┼': 197,  // BOX DRAWINGS LIGHT VERTICAL AND HORIZONTAL
  
  // Double line box drawing
  '═': 205,  // BOX DRAWINGS DOUBLE HORIZONTAL
  '║': 186,  // BOX DRAWINGS DOUBLE VERTICAL
  '╔': 201,  // BOX DRAWINGS DOUBLE DOWN AND RIGHT
  '╗': 187,  // BOX DRAWINGS DOUBLE DOWN AND LEFT
  '╚': 200,  // BOX DRAWINGS DOUBLE UP AND RIGHT
  '╝': 188,  // BOX DRAWINGS DOUBLE UP AND LEFT
  '╠': 204,  // BOX DRAWINGS DOUBLE VERTICAL AND RIGHT
  '╣': 185,  // BOX DRAWINGS DOUBLE VERTICAL AND LEFT
  '╦': 203,  // BOX DRAWINGS DOUBLE DOWN AND HORIZONTAL
  '╩': 202,  // BOX DRAWINGS DOUBLE UP AND HORIZONTAL
  '╬': 206,  // BOX DRAWINGS DOUBLE VERTICAL AND HORIZONTAL
  
  // ===== BLOCK AND SHADE CHARACTERS =====
  '░': 176,  // LIGHT SHADE
  '▒': 177,  // MEDIUM SHADE
  '▓': 178,  // DARK SHADE
  '█': 219,  // FULL BLOCK
  '▄': 220,  // LOWER HALF BLOCK
  '▌': 221,  // LEFT HALF BLOCK
  '▐': 222,  // RIGHT HALF BLOCK
  '▀': 223,  // UPPER HALF BLOCK
  
  // ===== MATHEMATICAL AND SPECIAL SYMBOLS =====
  '±': 241,  // PLUS-MINUS SIGN
  '×': 158,  // MULTIPLICATION SIGN
  '÷': 246,  // DIVISION SIGN
  '¼': 172,  // VULGAR FRACTION ONE QUARTER
  '½': 171,  // VULGAR FRACTION ONE HALF
  '¾': 243,  // VULGAR FRACTION THREE QUARTERS
  '²': 253,  // SUPERSCRIPT TWO
  '³': 252,  // SUPERSCRIPT THREE
  '¹': 251,  // SUPERSCRIPT ONE
  'µ': 230,  // MICRO SIGN
  '¶': 244,  // PILCROW SIGN
  '§': 245,  // SECTION SIGN
  '·': 250,  // MIDDLE DOT
  '¬': 170,  // NOT SIGN
  
  // ===== ADDITIONAL PUNCTUATION =====
  '«': 174,  // LEFT-POINTING DOUBLE ANGLE QUOTATION MARK
  '»': 175,  // RIGHT-POINTING DOUBLE ANGLE QUOTATION MARK
  '"': 34,   // QUOTATION MARK (ASCII)
  '"': 147,  // LEFT DOUBLE QUOTATION MARK (alternative)
  '"': 148,  // RIGHT DOUBLE QUOTATION MARK (alternative)
  ''': 39,   // APOSTROPHE (ASCII)
  ''': 145,  // LEFT SINGLE QUOTATION MARK (alternative)
  ''': 146,  // RIGHT SINGLE QUOTATION MARK (alternative)
  '–': 150,  // EN DASH (alternative)
  '—': 151,  // EM DASH (alternative)
};

// ISO-8859-1 (Latin-1) character mapping
const ISO_8859_1_MAP: { [key: string]: number } = {
  'á': 225, 'é': 233, 'í': 237, 'ó': 243, 'ú': 250,
  'Á': 193, 'É': 201, 'Í': 205, 'Ó': 211, 'Ú': 218,
  'ñ': 241, 'Ñ': 209,
  'ü': 252, 'Ü': 220,
  '¿': 191, '¡': 161,
  '°': 176, '€': 128,
};

type Encoding = 'CP850' | 'UTF-8' | 'ISO-8859-1' | 'Windows-1252';

/**
 * Convert text to the specified encoding
 */
const convertToEncoding = (text: string, encoding: Encoding): Uint8Array => {
  console.log(`[usePrinter] Converting text to ${encoding}, length: ${text.length}`);
  
  switch (encoding) {
    case 'CP850':
      return convertToCP850(text);
    case 'UTF-8':
      return convertToUTF8(text);
    case 'ISO-8859-1':
      return convertToISO88591(text);
    case 'Windows-1252':
      return convertToWindows1252(text);
    default:
      console.warn(`[usePrinter] Unknown encoding ${encoding}, using CP850`);
      return convertToCP850(text);
  }
};

/**
 * Convert text with Spanish characters to CP850 encoding
 * This function properly handles ñ, accented characters, and special symbols
 * 
 * IMPORTANT: CP850 is the standard code page for thermal printers with Spanish support.
 * The printer MUST be set to CP850 mode using ESC t 2 command before printing.
 */
const convertToCP850 = (text: string): Uint8Array => {
  const bytes: number[] = [];
  
  console.log('[usePrinter] ========================================');
  console.log('[usePrinter] CP850 ENCODING CONVERSION');
  console.log(`[usePrinter] Input text length: ${text.length} characters`);
  console.log(`[usePrinter] First 200 chars: "${text.substring(0, 200)}"`);
  console.log('[usePrinter] ========================================');
  
  let specialCharsFound = 0;
  let unmappedCharsFound = 0;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const charCode = char.charCodeAt(0);
    
    // Check if character has a CP850 mapping
    if (CP850_MAP[char] !== undefined) {
      const mappedValue = CP850_MAP[char];
      bytes.push(mappedValue);
      specialCharsFound++;
      console.log(`[usePrinter] ✓ Mapped '${char}' (U+${charCode.toString(16).toUpperCase().padStart(4, '0')}) → CP850: ${mappedValue} (0x${mappedValue.toString(16).toUpperCase().padStart(2, '0')})`);
    } 
    // ASCII characters (0-127) can be used directly
    else if (charCode < 128) {
      bytes.push(charCode);
    }
    // For unmapped characters, use a space as fallback
    else {
      unmappedCharsFound++;
      console.warn(`[usePrinter] ✗ Unmapped character '${char}' (U+${charCode.toString(16).toUpperCase().padStart(4, '0')}), using space`);
      bytes.push(32); // Space character
    }
  }
  
  console.log('[usePrinter] ========================================');
  console.log('[usePrinter] CP850 CONVERSION SUMMARY');
  console.log(`[usePrinter] Input: ${text.length} characters`);
  console.log(`[usePrinter] Output: ${bytes.length} bytes`);
  console.log(`[usePrinter] Special chars mapped: ${specialCharsFound}`);
  console.log(`[usePrinter] Unmapped chars: ${unmappedCharsFound}`);
  console.log('[usePrinter] ========================================');
  
  // Log a sample of the converted bytes for debugging
  const sampleSize = Math.min(100, bytes.length);
  const sampleBytes = bytes.slice(0, sampleSize).map(b => `0x${b.toString(16).toUpperCase().padStart(2, '0')}`).join(' ');
  console.log(`[usePrinter] First ${sampleSize} bytes: ${sampleBytes}`);
  
  return new Uint8Array(bytes);
};

/**
 * Convert text to UTF-8 encoding
 */
const convertToUTF8 = (text: string): Uint8Array => {
  const encoder = new TextEncoder();
  return encoder.encode(text);
};

/**
 * Convert text to ISO-8859-1 (Latin-1) encoding
 */
const convertToISO88591 = (text: string): Uint8Array => {
  const bytes: number[] = [];
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const charCode = char.charCodeAt(0);
    
    // Check if character has an ISO-8859-1 mapping
    if (ISO_8859_1_MAP[char] !== undefined) {
      bytes.push(ISO_8859_1_MAP[char]);
    }
    // Characters 0-255 are directly supported in ISO-8859-1
    else if (charCode < 256) {
      bytes.push(charCode);
    }
    // For unmapped characters, use space
    else {
      console.warn(`[usePrinter] Unmapped character in ISO-8859-1: ${char} (code: ${charCode}), using space`);
      bytes.push(32); // Space character
    }
  }
  
  return new Uint8Array(bytes);
};

/**
 * Convert text to Windows-1252 encoding
 */
const convertToWindows1252 = (text: string): Uint8Array => {
  // Windows-1252 is very similar to ISO-8859-1 with some differences in the 0x80-0x9F range
  const bytes: number[] = [];
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const charCode = char.charCodeAt(0);
    
    // Check if character has an ISO-8859-1 mapping (works for most Windows-1252 chars)
    if (ISO_8859_1_MAP[char] !== undefined) {
      bytes.push(ISO_8859_1_MAP[char]);
    }
    // Characters 0-255 are mostly supported in Windows-1252
    else if (charCode < 256) {
      bytes.push(charCode);
    }
    // For unmapped characters, use space
    else {
      console.warn(`[usePrinter] Unmapped character in Windows-1252: ${char} (code: ${charCode}), using space`);
      bytes.push(32); // Space character
    }
  }
  
  return new Uint8Array(bytes);
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
      
      console.log(`[usePrinter] Split data into ${chunks.length} chunks`);
      
      // Send each chunk with a small delay to ensure printer processes it
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const buffer = Buffer.from(chunk);
        const base64Data = buffer.toString('base64');
        
        console.log(`[usePrinter] Sending chunk ${i + 1}/${chunks.length}, size: ${chunk.length} bytes`);
        
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
    encoding: Encoding = 'CP850'
  ) => {
    const device = connectedDevice || globalConnectedDevice;
    
    if (!device) {
      throw new Error('No hay impresora conectada');
    }

    try {
      console.log('[usePrinter] ========================================');
      console.log('[usePrinter] PRINTING RECEIPT');
      console.log('[usePrinter] Settings:', { textSize, encoding, autoCut });
      console.log('[usePrinter] Original content length:', content.length);
      console.log('[usePrinter] Content preview:', content.substring(0, 200));
      console.log('[usePrinter] ========================================');
      
      // CRITICAL: Build initialization commands separately and send as raw bytes
      // This ensures the CP850 command is properly interpreted by the printer
      const initCommands: number[] = [];
      
      // 1. Initialize printer (ESC @)
      initCommands.push(0x1B, 0x40);
      
      // 2. Set code page to CP850 (ESC t 2) - MUST be sent as raw bytes
      if (encoding === 'CP850') {
        console.log('[usePrinter] ⚠️ CRITICAL: Setting printer to CP850 code page');
        console.log('[usePrinter] Sending command: ESC t 2 (0x1B 0x74 0x02)');
        initCommands.push(0x1B, 0x74, 0x02);
      }
      
      // 3. Set alignment to left (ESC a 0)
      initCommands.push(0x1B, 0x61, 0x00);
      
      // 4. Set font size (GS ! n)
      const fontSizeValue = textSize === 'small' ? 0x00 : textSize === 'large' ? 0x22 : 0x11;
      initCommands.push(0x1D, 0x21, fontSizeValue);
      
      console.log('[usePrinter] Initialization commands:', initCommands.map(b => `0x${b.toString(16).toUpperCase().padStart(2, '0')}`).join(' '));
      
      // Send initialization commands first
      const initData = new Uint8Array(initCommands);
      await sendDataToPrinter(initData);
      
      // Small delay to ensure printer processes the initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Now convert and send the content
      console.log('[usePrinter] Converting content to', encoding);
      const encodedContent = convertToEncoding(content, encoding);
      console.log('[usePrinter] Encoded content length:', encodedContent.length, 'bytes');
      
      // Send the content
      await sendDataToPrinter(encodedContent);
      
      // Build footer commands
      const footerCommands: number[] = [];
      
      // Reset font size to normal (GS ! 0)
      footerCommands.push(0x1D, 0x21, 0x00);
      
      // Add line feeds
      footerCommands.push(0x0A, 0x0A, 0x0A);
      
      // Add cut command if enabled (GS V A 0)
      if (autoCut) {
        footerCommands.push(0x1D, 0x56, 0x41, 0x00);
      }
      
      // Send footer commands
      const footerData = new Uint8Array(footerCommands);
      await sendDataToPrinter(footerData);
      
      console.log('[usePrinter] ========================================');
      console.log('[usePrinter] PRINT COMPLETED SUCCESSFULLY');
      console.log('[usePrinter] ========================================');
    } catch (error) {
      console.error('[usePrinter] Print error:', error);
      throw error;
    }
  };

  const testPrint = async (autoCut: boolean = true, encoding: Encoding = 'CP850') => {
    const testContent = `
=================================
   IMPRESIÓN DE PRUEBA
=================================

Esta es una prueba de impresión
con codificación ${encoding}.

CARACTERES ESPECIALES ESPAÑOLES:

Vocales con acento:
á é í ó ú
Á É Í Ó Ú

La letra Ñ (más importante):
ñ Ñ

Diéresis:
ü Ü

Puntuación española:
¿ ¡

PALABRAS COMUNES:

- Año (no "Ano")
- Niño (no "Nino")
- Señor (no "Senor")
- Mañana (no "Manana")
- España (no "Espana")
- Jalapeño (no "Jalapeno")
- Teléfono (no "Telefono")
- Dirección (no "Direccion")
- Atención (no "Atencion")
- Información (no "Informacion")
- Pequeño (no "Pequeno")
- Tamaño (no "Tamano")
- Baño (no "Bano")
- Compañía (no "Compania")
- Montaña (no "Montana")

FRASES COMPLETAS:

¿Cómo está usted?
¡Qué día tan hermoso!
El niño pequeño juega en la montaña.
Mañana será un año más.
La señora de España habla español.

SÍMBOLOS ESPECIALES:

Grado: 15°C
Euro: €10.50
Libra: £8.25

Si puedes leer TODOS estos
caracteres correctamente, tu
impresora está configurada
correctamente con CP850.

Fecha: ${new Date().toLocaleString('es-ES')}

=================================
`;
    
    try {
      await printReceipt(testContent, autoCut, 'medium', encoding);
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
