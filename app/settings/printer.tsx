
import React, { useState, useEffect, useCallback } from 'react';
import { usePrinter } from '@/hooks/usePrinter';
import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { Stack, router } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { 
  registerBackgroundAutoPrintTask, 
  unregisterBackgroundAutoPrintTask,
  getBackgroundTaskStatus 
} from '@/utils/backgroundAutoPrintTask';
import { PrinterConfig } from '@/utils/receiptGenerator';

type PaperSize = '58mm' | '80mm';

const PRINTER_CONFIG_KEY = '@printer_config';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  settingValue: {
    fontSize: 16,
    color: colors.textSecondary,
    marginRight: 8,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  deviceItemLast: {
    borderBottomWidth: 0,
  },
  deviceName: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  connectedBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  connectedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonSecondary: {
    backgroundColor: colors.secondary,
  },
  buttonDanger: {
    backgroundColor: colors.error,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 16,
  },
  loadingContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  statusBadgeSuccess: {
    backgroundColor: '#10B981',
  },
  statusBadgeWarning: {
    backgroundColor: '#F59E0B',
  },
  statusBadgeError: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navigationRowLast: {
    borderBottomWidth: 0,
  },
  navigationContent: {
    flex: 1,
  },
  navigationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  navigationDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

export default function PrinterSettingsScreen() {
  const { user } = useAuth();
  const {
    availableDevices,
    connectedDevice,
    isScanning,
    isConnected,
    scan,
    stopScan,
    connect,
    disconnect,
    testPrint,
  } = usePrinter();

  const [autoPrintEnabled, setAutoPrintEnabled] = useState(false);
  const [autoCutEnabled, setAutoCutEnabled] = useState(true);
  const [paperSize, setPaperSize] = useState<PaperSize>('80mm');
  const [includeCustomerInfo, setIncludeCustomerInfo] = useState(true);
  const [includeTotals, setIncludeTotals] = useState(true);
  const [printSpecialChars, setPrintSpecialChars] = useState(true);
  const [loading, setLoading] = useState(false);
  const [backgroundTaskStatus, setBackgroundTaskStatus] = useState<any>(null);

  const loadConfig = useCallback(async () => {
    try {
      console.log('[PrinterSettings] Loading config from local storage...');
      
      const configStr = await AsyncStorage.getItem(PRINTER_CONFIG_KEY);
      if (configStr) {
        const config = JSON.parse(configStr);
        console.log('[PrinterSettings] Config loaded from AsyncStorage:', config);
        
        setAutoPrintEnabled(config.auto_print_enabled ?? false);
        setAutoCutEnabled(config.auto_cut_enabled ?? true);
        setPaperSize(config.paper_size || '80mm');
        setIncludeCustomerInfo(config.include_customer_info ?? true);
        setIncludeTotals(config.include_totals ?? true);
        setPrintSpecialChars(config.print_special_chars ?? true);
      } else {
        console.log('[PrinterSettings] No config found, using defaults');
        setAutoPrintEnabled(false);
        setAutoCutEnabled(true);
        setPaperSize('80mm');
        setIncludeCustomerInfo(true);
        setIncludeTotals(true);
        setPrintSpecialChars(true);
      }
      
      const status = await getBackgroundTaskStatus();
      setBackgroundTaskStatus(status);
      console.log('[PrinterSettings] Background task status:', status);
    } catch (error) {
      console.error('[PrinterSettings] Error loading config:', error);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSaveConfig = async () => {
    try {
      setLoading(true);

      const config = {
        auto_print_enabled: autoPrintEnabled,
        auto_cut_enabled: autoCutEnabled,
        text_size: 'small', // Fixed to small
        paper_size: paperSize,
        include_customer_info: includeCustomerInfo,
        include_totals: includeTotals,
        print_special_chars: printSpecialChars,
        printer_name: connectedDevice?.name || null,
        printer_address: connectedDevice?.id || null,
      };
      
      console.log('[PrinterSettings] Saving config to local storage:', config);
      
      await AsyncStorage.setItem(PRINTER_CONFIG_KEY, JSON.stringify(config));
      console.log('[PrinterSettings] Config saved to AsyncStorage successfully');
      
      if (autoPrintEnabled && isConnected) {
        console.log('[PrinterSettings] Registering background task');
        await registerBackgroundAutoPrintTask();
      } else {
        console.log('[PrinterSettings] Unregistering background task');
        await unregisterBackgroundAutoPrintTask();
      }
      
      const status = await getBackgroundTaskStatus();
      setBackgroundTaskStatus(status);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Configuracion Guardada',
        'La configuracion de la impresora se guardo correctamente y se aplicara en las proximas impresiones',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[PrinterSettings] Error saving config:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error al Guardar',
        'No se pudo guardar la configuracion: ' + (error as Error).message,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTestPrint = async () => {
    try {
      setLoading(true);
      await testPrint(autoCutEnabled);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Impresion de Prueba',
        'La impresion de prueba se envio correctamente',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[PrinterSettings] Test print error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error de Impresion',
        'No se pudo imprimir. Verifica la conexion con la impresora.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    try {
      await scan();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('[PrinterSettings] Scan error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error al Escanear',
        'No se pudo escanear dispositivos Bluetooth',
        [{ text: 'OK' }]
      );
    }
  };

  const handleConnect = async (deviceId: string) => {
    try {
      setLoading(true);
      const device = availableDevices?.find((d) => d.id === deviceId);
      if (device) {
        await connect(device);
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Conectado',
          `Conectado exitosamente a ${device.name || 'la impresora'}`,
          [{ text: 'OK' }]
        );
        
        if (autoPrintEnabled) {
          await registerBackgroundAutoPrintTask();
          const status = await getBackgroundTaskStatus();
          setBackgroundTaskStatus(status);
        }
      }
    } catch (error) {
      console.error('[PrinterSettings] Connect error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error de Conexion',
        'No se pudo conectar a la impresora. Verifica que este encendida y cerca.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      await disconnect();
      
      await unregisterBackgroundAutoPrintTask();
      const status = await getBackgroundTaskStatus();
      setBackgroundTaskStatus(status);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Desconectado',
        'La impresora se desconecto correctamente',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[PrinterSettings] Disconnect error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error',
        'No se pudo desconectar la impresora',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToReceiptEditor = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/settings/receipt-editor');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Configuracion de Impresora',
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
        }}
      />
      <ScrollView style={styles.content}>
        {/* Advanced Receipt Editor Navigation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Edicion Avanzada</Text>
          
          <TouchableOpacity
            style={[styles.navigationRow, styles.navigationRowLast]}
            onPress={handleNavigateToReceiptEditor}
          >
            <View style={styles.navigationContent}>
              <Text style={styles.navigationTitle}>Editor de Recibos Avanzado</Text>
              <Text style={styles.navigationDescription}>
                Personaliza el diseño completo del recibo: encabezado, pie de página, espaciado, estilos predefinidos y más
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Connection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conexion</Text>
          
          {connectedDevice ? (
            <>
              <View style={styles.deviceItem}>
                <Text style={styles.deviceName}>{connectedDevice.name || 'Impresora'}</Text>
                <View style={styles.connectedBadge}>
                  <Text style={styles.connectedText}>Conectado</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.button, styles.buttonDanger]}
                onPress={handleDisconnect}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Desconectar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {isScanning ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.emptyText}>Buscando impresoras...</Text>
                </View>
              ) : availableDevices && availableDevices.length > 0 ? (
                availableDevices.map((device, index) => (
                  <View
                    key={device.id}
                    style={[
                      styles.deviceItem,
                      index === availableDevices.length - 1 && styles.deviceItemLast,
                    ]}
                  >
                    <Text style={styles.deviceName}>{device.name || 'Dispositivo sin nombre'}</Text>
                    <TouchableOpacity
                      style={[styles.button, { marginTop: 0 }]}
                      onPress={() => handleConnect(device.id)}
                      disabled={loading}
                    >
                      <Text style={styles.buttonText}>Conectar</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No se encontraron impresoras</Text>
              )}
              
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={isScanning ? stopScan : handleScan}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {isScanning ? 'Detener busqueda' : 'Buscar impresoras'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Auto-Print Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Auto-impresion</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Activar auto-impresion</Text>
            <Switch
              value={autoPrintEnabled}
              onValueChange={setAutoPrintEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
          
          {autoPrintEnabled && (
            <>
              <Text style={styles.infoText}>
                La auto-impresion funcionara en segundo plano y con la pantalla apagada. 
                Los pedidos nuevos se imprimiran automaticamente cuando lleguen.
              </Text>
              
              {backgroundTaskStatus && (
                <View
                  style={[
                    styles.statusBadge,
                    backgroundTaskStatus.isRegistered
                      ? styles.statusBadgeSuccess
                      : styles.statusBadgeWarning,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {backgroundTaskStatus.isRegistered
                      ? 'Tarea en segundo plano activa'
                      : 'Tarea en segundo plano no registrada'}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Print Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuracion de Impresion</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Corte automatico</Text>
            <Switch
              value={autoCutEnabled}
              onValueChange={setAutoCutEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
          
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              const sizes: PaperSize[] = ['58mm', '80mm'];
              const currentIndex = sizes.indexOf(paperSize);
              const nextIndex = (currentIndex + 1) % sizes.length;
              setPaperSize(sizes[nextIndex]);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={styles.settingLabel}>Tamano de papel</Text>
            <Text style={styles.settingValue}>{paperSize}</Text>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Incluir info del cliente</Text>
            <Switch
              value={includeCustomerInfo}
              onValueChange={(value) => {
                setIncludeCustomerInfo(value);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Incluir totales</Text>
            <Switch
              value={includeTotals}
              onValueChange={(value) => {
                setIncludeTotals(value);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
          
          <View style={[styles.settingRow, styles.settingRowLast]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Imprimir caracteres especiales</Text>
              <Text style={[styles.infoText, { marginTop: 4 }]}>
                Si se desactiva, la ñ y los acentos se reemplazaran (ej: piña → pina)
              </Text>
            </View>
            <Switch
              value={printSpecialChars}
              onValueChange={(value) => {
                setPrintSpecialChars(value);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones</Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={handleSaveConfig}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Guardando...' : 'Guardar configuracion'}
            </Text>
          </TouchableOpacity>
          
          {isConnected && (
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleTestPrint}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Imprimir prueba</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
