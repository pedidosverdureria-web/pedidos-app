
import React, { useState, useEffect, useCallback } from 'react';
import { usePrinter } from '@/hooks/usePrinter';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { CustomDialog, DialogButton } from '@/components/CustomDialog';
import { 
  registerBackgroundAutoPrintTask, 
  unregisterBackgroundAutoPrintTask,
  getBackgroundTaskStatus 
} from '@/utils/backgroundAutoPrintTask';
import { PrinterConfig } from '@/utils/receiptGenerator';

type PaperSize = '58mm' | '80mm';

const PRINTER_CONFIG_KEY = '@printer_config';

interface DialogState {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  buttons?: DialogButton[];
}

export default function PrinterSettingsScreen() {
  const { user } = useAuth();
  const { currentTheme } = useTheme();
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
  const [dialog, setDialog] = useState<DialogState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showDialog = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    buttons?: DialogButton[]
  ) => {
    setDialog({ visible: true, type, title, message, buttons });
  };

  const closeDialog = () => {
    setDialog({ ...dialog, visible: false });
  };

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

      // Load existing config first to preserve receipt editor settings
      const configStr = await AsyncStorage.getItem(PRINTER_CONFIG_KEY);
      const existingConfig = configStr ? JSON.parse(configStr) : {};

      // Merge with existing config, preserving advanced_config from receipt editor
      const config = {
        ...existingConfig, // Preserve all existing settings
        auto_print_enabled: autoPrintEnabled,
        auto_cut_enabled: autoCutEnabled,
        text_size: 'small', // Fixed to small
        paper_size: paperSize,
        include_customer_info: includeCustomerInfo,
        include_totals: includeTotals,
        print_special_chars: printSpecialChars,
        printer_name: connectedDevice?.name || null,
        printer_address: connectedDevice?.id || null,
        // Keep advanced_config if it exists
        advanced_config: existingConfig.advanced_config || undefined,
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
      showDialog(
        'success',
        'Configuración Guardada',
        'La configuración de la impresora se guardó correctamente y se aplicará en las próximas impresiones'
      );
    } catch (error) {
      console.error('[PrinterSettings] Error saving config:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showDialog(
        'error',
        'Error al Guardar',
        'No se pudo guardar la configuración: ' + (error as Error).message
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
      showDialog(
        'success',
        'Impresión de Prueba',
        'La impresión de prueba se envió correctamente'
      );
    } catch (error) {
      console.error('[PrinterSettings] Test print error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showDialog(
        'error',
        'Error de Impresión',
        'No se pudo imprimir. Verifica la conexión con la impresora.'
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
      showDialog(
        'error',
        'Error al Escanear',
        'No se pudo escanear dispositivos Bluetooth'
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
        showDialog(
          'success',
          'Conectado',
          `Conectado exitosamente a ${device.name || 'la impresora'}`
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
      showDialog(
        'error',
        'Error de Conexión',
        'No se pudo conectar a la impresora. Verifica que esté encendida y cerca.'
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
      showDialog(
        'success',
        'Desconectado',
        'La impresora se desconectó correctamente'
      );
    } catch (error) {
      console.error('[PrinterSettings] Disconnect error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showDialog(
        'error',
        'Error',
        'No se pudo desconectar la impresora'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToReceiptEditor = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/settings/receipt-editor');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.colors.background,
    },
    content: {
      padding: 16,
    },
    section: {
      backgroundColor: currentTheme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentTheme.colors.text,
      marginBottom: 12,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.colors.border,
    },
    settingRowLast: {
      borderBottomWidth: 0,
    },
    settingLabel: {
      fontSize: 16,
      color: currentTheme.colors.text,
      flex: 1,
    },
    settingValue: {
      fontSize: 16,
      color: currentTheme.colors.textSecondary,
      marginRight: 8,
    },
    deviceItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.colors.border,
    },
    deviceItemLast: {
      borderBottomWidth: 0,
    },
    deviceName: {
      fontSize: 16,
      color: currentTheme.colors.text,
      flex: 1,
    },
    connectedBadge: {
      backgroundColor: currentTheme.colors.success,
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
      backgroundColor: currentTheme.colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 8,
    },
    buttonSecondary: {
      backgroundColor: currentTheme.colors.secondary,
    },
    buttonDanger: {
      backgroundColor: currentTheme.colors.error,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    emptyText: {
      fontSize: 14,
      color: currentTheme.colors.textSecondary,
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
      color: currentTheme.colors.textSecondary,
      marginTop: 8,
      lineHeight: 20,
    },
    navigationRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.colors.border,
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
      color: currentTheme.colors.text,
      marginBottom: 4,
    },
    navigationDescription: {
      fontSize: 14,
      color: currentTheme.colors.textSecondary,
      lineHeight: 18,
    },
  });

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Configuración de Impresora',
          headerShown: true,
          headerStyle: { backgroundColor: currentTheme.colors.primary },
          headerTintColor: '#fff',
        }}
      />
      <ScrollView style={styles.content}>
        {/* Advanced Receipt Editor Navigation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Edición Avanzada</Text>
          
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
            <IconSymbol name="chevron.right" size={24} color={currentTheme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Connection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conexión</Text>
          
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
                  <ActivityIndicator size="large" color={currentTheme.colors.primary} />
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
                  {isScanning ? 'Detener búsqueda' : 'Buscar impresoras'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Auto-Print Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Auto-impresión</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Activar auto-impresión</Text>
            <Switch
              value={autoPrintEnabled}
              onValueChange={setAutoPrintEnabled}
              trackColor={{ false: currentTheme.colors.border, true: currentTheme.colors.primary }}
            />
          </View>
          
          {autoPrintEnabled && (
            <>
              <Text style={styles.infoText}>
                La auto-impresión funcionará en segundo plano y con la pantalla apagada. 
                Los pedidos nuevos se imprimirán automáticamente cuando lleguen.
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
          <Text style={styles.sectionTitle}>Configuración de Impresión</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Corte automático</Text>
            <Switch
              value={autoCutEnabled}
              onValueChange={setAutoCutEnabled}
              trackColor={{ false: currentTheme.colors.border, true: currentTheme.colors.primary }}
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
            <Text style={styles.settingLabel}>Tamaño de papel</Text>
            <Text style={styles.settingValue}>{paperSize}</Text>
            <IconSymbol name="chevron.right" size={20} color={currentTheme.colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Incluir info del cliente</Text>
            <Switch
              value={includeCustomerInfo}
              onValueChange={(value) => {
                setIncludeCustomerInfo(value);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              trackColor={{ false: currentTheme.colors.border, true: currentTheme.colors.primary }}
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
              trackColor={{ false: currentTheme.colors.border, true: currentTheme.colors.primary }}
            />
          </View>
          
          <View style={[styles.settingRow, styles.settingRowLast]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Imprimir caracteres especiales</Text>
              <Text style={[styles.infoText, { marginTop: 4 }]}>
                Si se desactiva, la ñ y los acentos se reemplazarán (ej: piña → pina)
              </Text>
            </View>
            <Switch
              value={printSpecialChars}
              onValueChange={(value) => {
                setPrintSpecialChars(value);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              trackColor={{ false: currentTheme.colors.border, true: currentTheme.colors.primary }}
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
              {loading ? 'Guardando...' : 'Guardar configuración'}
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

      {/* Custom Dialog */}
      <CustomDialog
        visible={dialog.visible}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        buttons={dialog.buttons}
        onClose={closeDialog}
      />
    </View>
  );
}
