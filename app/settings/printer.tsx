
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
  Modal,
} from 'react-native';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { getSupabase } from '@/lib/supabase';
import { 
  registerBackgroundAutoPrintTask, 
  unregisterBackgroundAutoPrintTask,
  getBackgroundTaskStatus 
} from '@/utils/backgroundAutoPrintTask';
import { generateSampleReceipt, PrinterConfig as ReceiptPrinterConfig } from '@/utils/receiptGenerator';

type TextSize = 'small' | 'medium' | 'large';
type PaperSize = '58mm' | '80mm';
type Encoding = 'CP850' | 'UTF-8' | 'ISO-8859-1' | 'Windows-1252';

const PRINTER_CONFIG_KEY = '@printer_config';

const ENCODING_OPTIONS: { label: string; value: Encoding }[] = [
  { label: 'CP850 (Recomendado para español)', value: 'CP850' },
  { label: 'UTF-8', value: 'UTF-8' },
  { label: 'ISO-8859-1 (Latin-1)', value: 'ISO-8859-1' },
  { label: 'Windows-1252', value: 'Windows-1252' },
];

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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  previewContainer: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
  },
  previewText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
  },
  previewButton: {
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.border,
  },
  modalButtonConfirm: {
    backgroundColor: colors.primary,
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
  const [textSize, setTextSize] = useState<TextSize>('medium');
  const [paperSize, setPaperSize] = useState<PaperSize>('80mm');
  const [encoding, setEncoding] = useState<Encoding>('CP850');
  const [includeLogo, setIncludeLogo] = useState(true);
  const [includeCustomerInfo, setIncludeCustomerInfo] = useState(true);
  const [includeTotals, setIncludeTotals] = useState(true);
  const [loading, setLoading] = useState(false);
  const [backgroundTaskStatus, setBackgroundTaskStatus] = useState<any>(null);
  const [printerConfigId, setPrinterConfigId] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      console.log('[PrinterSettings] Loading config...');
      
      // Load from AsyncStorage first (fastest)
      const configStr = await AsyncStorage.getItem(PRINTER_CONFIG_KEY);
      if (configStr) {
        const config = JSON.parse(configStr);
        console.log('[PrinterSettings] Config loaded from AsyncStorage:', config);
        
        // Apply all settings from AsyncStorage
        setAutoPrintEnabled(config.auto_print_enabled ?? false);
        setAutoCutEnabled(config.auto_cut_enabled ?? true);
        setTextSize(config.text_size || 'medium');
        setPaperSize(config.paper_size || '80mm');
        setEncoding(config.encoding || 'CP850');
        setIncludeLogo(config.include_logo ?? true);
        setIncludeCustomerInfo(config.include_customer_info ?? true);
        setIncludeTotals(config.include_totals ?? true);
      }
      
      // Then try to load from Supabase database (for sync across devices)
      if (user?.id) {
        const supabase = getSupabase();
        const { data: dbConfig, error } = await supabase
          .from('printer_config')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('[PrinterSettings] Error loading from database:', error);
        } else if (dbConfig) {
          console.log('[PrinterSettings] Config loaded from database:', dbConfig);
          setPrinterConfigId(dbConfig.id);
          
          // Update state with database values (they take precedence)
          setAutoPrintEnabled(dbConfig.auto_print_enabled ?? false);
          setAutoCutEnabled(dbConfig.auto_cut_enabled ?? true);
          setIncludeLogo(dbConfig.include_logo ?? true);
          setIncludeCustomerInfo(dbConfig.include_customer_info ?? true);
          setIncludeTotals(dbConfig.include_totals ?? true);
          
          // Sync to AsyncStorage
          const syncedConfig = {
            auto_print_enabled: dbConfig.auto_print_enabled ?? false,
            auto_cut_enabled: dbConfig.auto_cut_enabled ?? true,
            text_size: textSize,
            paper_size: paperSize,
            encoding: encoding,
            include_logo: dbConfig.include_logo ?? true,
            include_customer_info: dbConfig.include_customer_info ?? true,
            include_totals: dbConfig.include_totals ?? true,
          };
          await AsyncStorage.setItem(PRINTER_CONFIG_KEY, JSON.stringify(syncedConfig));
        }
      }
      
      // Load background task status
      const status = await getBackgroundTaskStatus();
      setBackgroundTaskStatus(status);
      console.log('[PrinterSettings] Background task status:', status);
    } catch (error) {
      console.error('[PrinterSettings] Error loading config:', error);
    }
  }, [user?.id, textSize, paperSize, encoding]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSaveConfig = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          '❌ Error',
          'Debes iniciar sesión para guardar la configuración',
          [{ text: 'OK' }]
        );
        return;
      }

      const config = {
        auto_print_enabled: autoPrintEnabled,
        auto_cut_enabled: autoCutEnabled,
        text_size: textSize,
        paper_size: paperSize,
        encoding: encoding,
        include_logo: includeLogo,
        include_customer_info: includeCustomerInfo,
        include_totals: includeTotals,
      };
      
      console.log('[PrinterSettings] Saving config:', config);
      
      // Save to AsyncStorage for quick local access
      await AsyncStorage.setItem(PRINTER_CONFIG_KEY, JSON.stringify(config));
      console.log('[PrinterSettings] Config saved to AsyncStorage');
      
      // Save to Supabase database for persistence
      const supabase = getSupabase();
      
      // Prepare database record (only fields that exist in the schema)
      const dbConfig = {
        user_id: user.id,
        printer_name: connectedDevice?.name || null,
        printer_address: connectedDevice?.id || null,
        is_default: true,
        auto_print_enabled: autoPrintEnabled,
        auto_cut_enabled: autoCutEnabled,
        include_logo: includeLogo,
        include_customer_info: includeCustomerInfo,
        include_totals: includeTotals,
        updated_at: new Date().toISOString(),
      };
      
      let savedConfigId = printerConfigId;
      
      if (printerConfigId) {
        // Update existing config
        console.log('[PrinterSettings] Updating existing config in database:', printerConfigId);
        const { error } = await supabase
          .from('printer_config')
          .update(dbConfig)
          .eq('id', printerConfigId);
        
        if (error) {
          console.error('[PrinterSettings] Error updating database:', error);
          throw error;
        }
        console.log('[PrinterSettings] Config updated in database');
      } else {
        // Insert new config
        console.log('[PrinterSettings] Inserting new config in database');
        const { data, error } = await supabase
          .from('printer_config')
          .insert([dbConfig])
          .select()
          .single();
        
        if (error) {
          console.error('[PrinterSettings] Error inserting into database:', error);
          throw error;
        }
        
        if (data) {
          savedConfigId = data.id;
          setPrinterConfigId(data.id);
          console.log('[PrinterSettings] Config inserted in database with ID:', data.id);
        }
      }
      
      // Register or unregister background task based on auto-print setting
      if (autoPrintEnabled && isConnected) {
        console.log('[PrinterSettings] Registering background task');
        await registerBackgroundAutoPrintTask();
      } else {
        console.log('[PrinterSettings] Unregistering background task');
        await unregisterBackgroundAutoPrintTask();
      }
      
      // Reload status
      const status = await getBackgroundTaskStatus();
      setBackgroundTaskStatus(status);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Configuración Guardada',
        'La configuración de la impresora se guardó correctamente en la base de datos',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[PrinterSettings] Error saving config:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error al Guardar',
        'No se pudo guardar la configuración: ' + (error as Error).message,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTestPrint = async () => {
    try {
      setLoading(true);
      await testPrint(autoCutEnabled, encoding);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Impresión de Prueba',
        'La impresión de prueba se envió correctamente',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[PrinterSettings] Test print error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error de Impresión',
        'No se pudo imprimir. Verifica la conexión con la impresora.',
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
        '❌ Error al Escanear',
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
          '✅ Conectado',
          `Conectado exitosamente a ${device.name || 'la impresora'}`,
          [{ text: 'OK' }]
        );
        
        // If auto-print is enabled, register background task
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
        '❌ Error de Conexión',
        'No se pudo conectar a la impresora. Verifica que esté encendida y cerca.',
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
      
      // Unregister background task when disconnecting
      await unregisterBackgroundAutoPrintTask();
      const status = await getBackgroundTaskStatus();
      setBackgroundTaskStatus(status);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Desconectado',
        'La impresora se desconectó correctamente',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[PrinterSettings] Disconnect error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error',
        'No se pudo desconectar la impresora',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleShowPreview = () => {
    setShowPreviewModal(true);
  };

  const getCurrentConfig = (): ReceiptPrinterConfig => {
    return {
      auto_print_enabled: autoPrintEnabled,
      auto_cut_enabled: autoCutEnabled,
      text_size: textSize,
      paper_size: paperSize,
      encoding: encoding,
      include_logo: includeLogo,
      include_customer_info: includeCustomerInfo,
      include_totals: includeTotals,
    };
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Configuración de Impresora',
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
        }}
      />
      <ScrollView style={styles.content}>
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
              trackColor={{ false: colors.border, true: colors.primary }}
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
                      ? '✓ Tarea en segundo plano activa'
                      : '⚠ Tarea en segundo plano no registrada'}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Ticket Format Preview Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vista Previa del Ticket</Text>
          <Text style={styles.infoText}>
            Visualiza cómo se verá el ticket con la configuración actual
          </Text>
          <TouchableOpacity
            style={styles.previewButton}
            onPress={handleShowPreview}
          >
            <IconSymbol name="doc.text" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Ver Vista Previa</Text>
          </TouchableOpacity>
        </View>

        {/* Print Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración de Impresión</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Corte automático</Text>
            <Switch
              value={autoCutEnabled}
              onValueChange={setAutoCutEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
          
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              const sizes: TextSize[] = ['small', 'medium', 'large'];
              const currentIndex = sizes.indexOf(textSize);
              const nextIndex = (currentIndex + 1) % sizes.length;
              setTextSize(sizes[nextIndex]);
            }}
          >
            <Text style={styles.settingLabel}>Tamaño de texto</Text>
            <Text style={styles.settingValue}>
              {textSize === 'small' ? 'Pequeño' : textSize === 'medium' ? 'Mediano' : 'Grande'}
            </Text>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              setPaperSize(paperSize === '58mm' ? '80mm' : '58mm');
            }}
          >
            <Text style={styles.settingLabel}>Tamaño de papel</Text>
            <Text style={styles.settingValue}>{paperSize}</Text>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              const currentIndex = ENCODING_OPTIONS.findIndex(opt => opt.value === encoding);
              const nextIndex = (currentIndex + 1) % ENCODING_OPTIONS.length;
              setEncoding(ENCODING_OPTIONS[nextIndex].value);
            }}
          >
            <Text style={styles.settingLabel}>Codificación</Text>
            <Text style={styles.settingValue}>
              {ENCODING_OPTIONS.find(opt => opt.value === encoding)?.label || encoding}
            </Text>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Incluir logo</Text>
            <Switch
              value={includeLogo}
              onValueChange={setIncludeLogo}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Incluir info del cliente</Text>
            <Switch
              value={includeCustomerInfo}
              onValueChange={setIncludeCustomerInfo}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
          
          <View style={[styles.settingRow, styles.settingRowLast]}>
            <Text style={styles.settingLabel}>Incluir totales</Text>
            <Switch
              value={includeTotals}
              onValueChange={setIncludeTotals}
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

      {/* Preview Modal */}
      <Modal
        visible={showPreviewModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPreviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Vista Previa del Ticket</Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
              Así se verá el ticket con tu configuración actual:
            </Text>
            
            <ScrollView style={{ maxHeight: 400 }}>
              <View style={styles.previewContainer}>
                <Text style={styles.previewText}>
                  {generateSampleReceipt(getCurrentConfig())}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowPreviewModal(false)}
              >
                <Text style={styles.modalButtonText}>Cerrar</Text>
              </TouchableOpacity>
              {isConnected && (
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={async () => {
                    setShowPreviewModal(false);
                    await handleTestPrint();
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                    Imprimir Prueba
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
