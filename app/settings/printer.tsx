
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { usePrinter } from '@/hooks/usePrinter';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRINTER_CONFIG_KEY = '@printer_config';

export default function PrinterSettingsScreen() {
  const { user } = useAuth();
  const {
    isScanning,
    isConnected,
    connectedDevice,
    devices,
    startScan,
    stopScan,
    connectToDevice,
    disconnect,
    testPrint,
  } = usePrinter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState({
    auto_print_enabled: false,
    auto_cut_enabled: true,
    header_font_size: 2,
    separator_lines: 1,
    include_logo: true,
    include_customer_info: true,
    include_totals: true,
  });

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading printer config from AsyncStorage...');
      
      const savedConfig = await AsyncStorage.getItem(PRINTER_CONFIG_KEY);
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        console.log('Loaded printer config:', parsedConfig);
        setConfig({
          auto_print_enabled: parsedConfig.auto_print_enabled ?? false,
          auto_cut_enabled: parsedConfig.auto_cut_enabled ?? true,
          header_font_size: parsedConfig.header_font_size ?? 2,
          separator_lines: parsedConfig.separator_lines ?? 1,
          include_logo: parsedConfig.include_logo ?? true,
          include_customer_info: parsedConfig.include_customer_info ?? true,
          include_totals: parsedConfig.include_totals ?? true,
        });
      } else {
        console.log('No saved printer config found, using defaults');
      }
    } catch (error) {
      console.error('Error loading printer config:', error);
      Alert.alert('Error', 'No se pudo cargar la configuración de la impresora');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      console.log('Saving printer config...');

      // Create a clean config object with only the necessary fields
      const configToSave = {
        auto_print_enabled: config.auto_print_enabled,
        auto_cut_enabled: config.auto_cut_enabled,
        header_font_size: config.header_font_size,
        separator_lines: config.separator_lines,
        include_logo: config.include_logo,
        include_customer_info: config.include_customer_info,
        include_totals: config.include_totals,
        printer_name: connectedDevice?.name || null,
        printer_id: connectedDevice?.id || null,
        updated_at: new Date().toISOString(),
      };

      console.log('Config to save:', configToSave);

      // Save to AsyncStorage
      await AsyncStorage.setItem(PRINTER_CONFIG_KEY, JSON.stringify(configToSave));
      
      // Verify the save was successful
      const verification = await AsyncStorage.getItem(PRINTER_CONFIG_KEY);
      console.log('Verification - saved config:', verification);

      if (verification) {
        Alert.alert('Éxito', 'Configuración guardada correctamente');
      } else {
        throw new Error('La configuración no se guardó correctamente');
      }
    } catch (error) {
      console.error('Error saving printer config:', error);
      Alert.alert(
        'Error', 
        `No se pudo guardar la configuración: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTestPrint = async () => {
    if (!isConnected) {
      Alert.alert('Error', 'No hay impresora conectada');
      return;
    }

    try {
      setTesting(true);
      await testPrint(config.auto_cut_enabled);
      Alert.alert('Éxito', 'Impresión de prueba enviada correctamente');
    } catch (error) {
      console.error('Error testing print:', error);
      Alert.alert('Error', 'No se pudo imprimir. Verifica que la impresora esté encendida y cerca del dispositivo.');
    } finally {
      setTesting(false);
    }
  };

  const handleScan = async () => {
    console.log('handleScan called, isScanning:', isScanning);
    if (isScanning) {
      console.log('Stopping scan...');
      stopScan();
    } else {
      console.log('Starting scan...');
      await startScan();
    }
  };

  const handleConnect = async (deviceId: string) => {
    try {
      const device = devices.find(d => d.id === deviceId);
      if (!device) {
        Alert.alert('Error', 'Dispositivo no encontrado');
        return;
      }
      await connectToDevice(device);
      Alert.alert('Éxito', `Conectado a ${device.name || 'la impresora'}`);
    } catch (error) {
      console.error('Error connecting to printer:', error);
      Alert.alert('Error', 'No se pudo conectar a la impresora. Asegúrate de que esté encendida y cerca del dispositivo.');
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      Alert.alert('Éxito', 'Desconectado de la impresora');
    } catch (error) {
      console.error('Error disconnecting:', error);
      Alert.alert('Error', 'No se pudo desconectar');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Configuración de Impresora',
          headerBackTitle: 'Atrás',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <IconSymbol name="info.circle.fill" size={24} color={colors.info} />
          <Text style={styles.infoText}>
            Configura tu impresora térmica Bluetooth para imprimir tickets de pedidos automáticamente.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado de Conexión</Text>
          <View style={styles.card}>
            <View style={styles.statusRow}>
              <View style={styles.statusLeft}>
                <IconSymbol
                  name={isConnected ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                  size={24}
                  color={isConnected ? colors.success : colors.error}
                />
                <View style={styles.statusTextContainer}>
                  <Text style={styles.statusLabel}>
                    {isConnected ? 'Conectado' : 'Desconectado'}
                  </Text>
                  {connectedDevice && (
                    <Text style={styles.statusSubtext}>{connectedDevice.name}</Text>
                  )}
                </View>
              </View>
              {isConnected && (
                <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
                  <Text style={styles.disconnectButtonText}>Desconectar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dispositivos Disponibles</Text>
            <TouchableOpacity
              style={[styles.scanButton, isScanning && styles.scanButtonActive]}
              onPress={handleScan}
              disabled={isScanning}
            >
              {isScanning ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.scanButtonText}>Buscando...</Text>
                </>
              ) : (
                <>
                  <IconSymbol
                    name="magnifyingglass"
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.scanButtonText}>Buscar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {devices.length > 0 ? (
            <View style={styles.card}>
              {devices.map((device, index) => (
                <TouchableOpacity
                  key={device.id}
                  style={[
                    styles.deviceItem,
                    index < devices.length - 1 && styles.deviceItemBorder,
                  ]}
                  onPress={() => handleConnect(device.id)}
                  disabled={isConnected && connectedDevice?.id === device.id}
                >
                  <View style={styles.deviceLeft}>
                    <IconSymbol name="printer.fill" size={24} color={colors.primary} />
                    <View style={styles.deviceTextContainer}>
                      <Text style={styles.deviceName}>{device.name || 'Dispositivo sin nombre'}</Text>
                      <Text style={styles.deviceId}>{device.id}</Text>
                    </View>
                  </View>
                  {connectedDevice?.id === device.id && (
                    <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <IconSymbol name="printer.fill" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>
                {isScanning ? 'Buscando dispositivos...' : 'No se encontraron dispositivos'}
              </Text>
              <Text style={styles.emptySubtext}>
                Presiona &quot;Buscar&quot; para escanear impresoras Bluetooth
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración de Impresión</Text>
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <IconSymbol name="bolt.fill" size={24} color={colors.warning} />
                <Text style={styles.switchLabel}>Impresión Automática</Text>
              </View>
              <Switch
                value={config.auto_print_enabled}
                onValueChange={(value) =>
                  setConfig({ ...config, auto_print_enabled: value })
                }
                trackColor={{ false: colors.border, true: colors.success }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <IconSymbol name="scissors" size={24} color={colors.accent} />
                <Text style={styles.switchLabel}>Auto Corte</Text>
              </View>
              <Switch
                value={config.auto_cut_enabled}
                onValueChange={(value) =>
                  setConfig({ ...config, auto_cut_enabled: value })
                }
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <IconSymbol name="photo.fill" size={24} color={colors.primary} />
                <Text style={styles.switchLabel}>Incluir Logo</Text>
              </View>
              <Switch
                value={config.include_logo}
                onValueChange={(value) => setConfig({ ...config, include_logo: value })}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <IconSymbol name="person.fill" size={24} color={colors.info} />
                <Text style={styles.switchLabel}>Info del Cliente</Text>
              </View>
              <Switch
                value={config.include_customer_info}
                onValueChange={(value) =>
                  setConfig({ ...config, include_customer_info: value })
                }
                trackColor={{ false: colors.border, true: colors.info }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <IconSymbol name="dollarsign.circle.fill" size={24} color={colors.success} />
                <Text style={styles.switchLabel}>Incluir Totales</Text>
              </View>
              <Switch
                value={config.include_totals}
                onValueChange={(value) => setConfig({ ...config, include_totals: value })}
                trackColor={{ false: colors.border, true: colors.success }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.testButton, (!isConnected || testing) && styles.buttonDisabled]}
          onPress={handleTestPrint}
          disabled={!isConnected || testing}
        >
          {testing ? (
            <>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.testButtonText}>Imprimiendo...</Text>
            </>
          ) : (
            <>
              <IconSymbol name="printer.fill" size={20} color="#FFFFFF" />
              <Text style={styles.testButtonText}>Imprimir Prueba</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSaveConfig}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <IconSymbol name="checkmark.circle.fill" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Guardar Configuración</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  scanButtonActive: {
    backgroundColor: colors.warning,
  },
  scanButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusTextContainer: {
    marginLeft: 12,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  statusSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  disconnectButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  disconnectButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  deviceItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  deviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  deviceId: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 12,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
