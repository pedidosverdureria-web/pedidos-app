
import { useState, useEffect } from 'react';
import { BleManager, Device } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform, Alert } from 'react-native';

const bleManager = new BleManager();

export const usePrinter = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    console.log('usePrinter: Initializing');
    requestPermissions();
    
    return () => {
      console.log('usePrinter: Cleaning up');
      if (connectedDevice) {
        connectedDevice.cancelConnection().catch((err) => {
          console.error('usePrinter: Error disconnecting:', err);
        });
      }
    };
  }, []);

  const requestPermissions = async () => {
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
  };

  const scanForDevices = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Bluetooth permissions are required to scan for printers');
        return;
      }

      console.log('usePrinter: Starting device scan');
      setScanning(true);
      setDevices([]);

      bleManager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.error('usePrinter: Scan error:', error);
          setScanning(false);
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
        console.log('usePrinter: Stopping device scan');
        bleManager.stopDeviceScan();
        setScanning(false);
      }, 10000);
    } catch (error) {
      console.error('usePrinter: Error in scanForDevices:', error);
      setScanning(false);
    }
  };

  const connectToDevice = async (device: Device) => {
    try {
      console.log('usePrinter: Connecting to device:', device.name);
      const connected = await device.connect();
      await connected.discoverAllServicesAndCharacteristics();
      setConnectedDevice(connected);
      console.log('usePrinter: Connected successfully');
      Alert.alert('Success', `Connected to ${device.name}`);
    } catch (error) {
      console.error('usePrinter: Connection error:', error);
      Alert.alert('Error', 'Failed to connect to printer');
    }
  };

  const disconnectDevice = async () => {
    if (connectedDevice) {
      try {
        console.log('usePrinter: Disconnecting device');
        await connectedDevice.cancelConnection();
        setConnectedDevice(null);
      } catch (error) {
        console.error('usePrinter: Error disconnecting:', error);
      }
    }
  };

  const printReceipt = async (content: string) => {
    if (!connectedDevice) {
      Alert.alert('Error', 'No printer connected');
      return;
    }

    try {
      // This is a simplified version. In production, you'd need to:
      // 1. Find the correct service and characteristic UUIDs for your printer
      // 2. Format the content according to ESC/POS commands
      // 3. Send the data in chunks if needed
      
      console.log('usePrinter: Printing:', content);
      Alert.alert('Print', 'Print command sent (demo mode)');
    } catch (error) {
      console.error('usePrinter: Print error:', error);
      Alert.alert('Error', 'Failed to print');
    }
  };

  return {
    devices,
    connectedDevice,
    scanning,
    scanForDevices,
    connectToDevice,
    disconnectDevice,
    printReceipt,
  };
};
