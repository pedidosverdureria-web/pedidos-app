
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
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
import { useAuth } from '@/contexts/AuthContext';
import { usePrinter } from '@/hooks/usePrinter';
import React, { useState, useEffect, useCallback } from 'react';

type TextSize = 'small' | 'medium' | 'large';
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
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
  settingDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  buttonSecondary: {
    backgroundColor: colors.info,
  },
  buttonDanger: {
    backgroundColor: colors.error,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  statusCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  deviceCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  deviceId: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  connectButton: {
    backgroundColor: colors.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sizeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  sizeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sizeButtonText: {
    fontSize: 14,
    color: colors.text,
  },
  sizeButtonTextActive: {
    color: '#FFFFFF',
  },
  sizeButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

export default function PrinterSettingsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(false);
  const [autoCutEnabled, setAutoCutEnabled] = useState(true);
  const [textSize, setTextSize] = useState<TextSize>('medium');
  const [paperSize, setPaperSize] = useState<PaperSize>('80mm');
  const [includeLogo, setIncludeLogo] = useState(true);
  const [includeCustomerInfo, setIncludeCustomerInfo] = useState(true);
  const [includeTotals, setIncludeTotals] = useState(true);
  const [useWebhookFormat, setUseWebhookFormat] = useState(true);

  const {
    isConnected,
    connectedDevice,
    availableDevices,
    connect,
    disconnect,
    scan,
    printReceipt,
  } = usePrinter();

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      console.log('[PrinterSettings] Loading config from AsyncStorage...');
      const savedConfig = await AsyncStorage.getItem(PRINTER_CONFIG_KEY);
      
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        console.log('[PrinterSettings] Loaded config:', config);
        setAutoPrintEnabled(config.auto_print_enabled ?? false);
        setAutoCutEnabled(config.auto_cut_enabled ?? true);
        setTextSize(config.text_size || 'medium');
        setPaperSize(config.paper_size || '80mm');
        setIncludeLogo(config.include_logo ?? true);
        setIncludeCustomerInfo(config.include_customer_info ?? true);
        setIncludeTotals(config.include_totals ?? true);
        setUseWebhookFormat(config.use_webhook_format ?? true);
      } else {
        console.log('[PrinterSettings] No saved config found, using defaults');
      }
    } catch (error) {
      console.error('[PrinterSettings] Error loading config:', error);
      Alert.alert('Error', 'No se pudo cargar la configuración');
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
      const config = {
        auto_print_enabled: autoPrintEnabled,
        auto_cut_enabled: autoCutEnabled,
        text_size: textSize,
        paper_size: paperSize,
        include_logo: includeLogo,
        include_customer_info: includeCustomerInfo,
        include_totals: includeTotals,
        use_webhook_format: useWebhookFormat,
      };
      
      console.log('[PrinterSettings] Saving config:', config);
      await AsyncStorage.setItem(PRINTER_CONFIG_KEY, JSON.stringify(config));
      console.log('[PrinterSettings] Config saved successfully');
      Alert.alert('Éxito', 'Configuración guardada correctamente');
    } catch (error) {
      console.error('[PrinterSettings] Error saving config:', error);
      Alert.alert('Error', 'No se pudo guardar la configuración');
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
      setLoading(true);
      console.log('[PrinterSettings] Starting test print...');
      
      const width = paperSize === '58mm' ? 32 : 48;
      const centerText = (text: string) => {
        const padding = Math.max(0, Math.floor((width - text.length) / 2));
        return ' '.repeat(padding) + text;
      };

      let testReceipt = '\n';
      testReceipt += '='.repeat(width) + '\n';
      testReceipt += centerText('IMPRESION DE PRUEBA') + '\n';
      testReceipt += '='.repeat(width) + '\n';
      testReceipt += '\n';
      testReceipt += 'Configuracion:\n';
      testReceipt += `- Tamano de papel: ${paperSize}\n`;
      testReceipt += `- Tamano de texto: ${textSize}\n`;
      testReceipt += `- Corte automatico: ${autoCutEnabled ? 'Si' : 'No'}\n`;
      testReceipt += `- Impresion automatica: ${autoPrintEnabled ? 'Si' : 'No'}\n`;
      testReceipt += '\n';
      testReceipt += '-'.repeat(width) + '\n';
      testReceipt += 'Caracteres especiales:\n';
      testReceipt += 'Acentos: áéíóú ÁÉÍÓÚ\n';
      testReceipt += 'Enie: ñ Ñ\n';
      testReceipt += 'Simbolos: $1.000 50%\n';
      testReceipt += '\n';
      testReceipt += '='.repeat(width) + '\n';
      testReceipt += centerText('Prueba exitosa!') + '\n';
      testReceipt += '='.repeat(width) + '\n';
      testReceipt += '\n\n\n';

      console.log('[PrinterSettings] Test receipt generated, length:', testReceipt.length);
      await printReceipt(testReceipt, autoCutEnabled, textSize);
      console.log('[PrinterSettings] Test print completed');
      Alert.alert('Éxito', 'Impresión de prueba enviada');
    } catch (error) {
      console.error('[PrinterSettings] Error in test print:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      Alert.alert('Error', `No se pudo imprimir: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    try {
      setScanning(true);
      console.log('[PrinterSettings] Starting Bluetooth scan...');
      await scan();
      console.log('[PrinterSettings] Scan completed');
    } catch (error) {
      console.error('[PrinterSettings] Error scanning:', error);
      Alert.alert('Error', 'No se pudo escanear dispositivos Bluetooth');
    } finally {
      setScanning(false);
    }
  };

  const handleConnect = async (deviceId: string) => {
    try {
      setLoading(true);
      console.log('[PrinterSettings] Connecting to device:', deviceId);
      await connect(deviceId);
      console.log('[PrinterSettings] Connected successfully');
      Alert.alert('Éxito', 'Impresora conectada correctamente');
    } catch (error) {
      console.error('[PrinterSettings] Error connecting:', error);
      Alert.alert('Error', 'No se pudo conectar a la impresora');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      console.log('[PrinterSettings] Disconnecting...');
      await disconnect();
      console.log('[PrinterSettings] Disconnected successfully');
      Alert.alert('Éxito', 'Impresora desconectada');
    } catch (error) {
      console.error('[PrinterSettings] Error disconnecting:', error);
      Alert.alert('Error', 'No se pudo desconectar la impresora');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !scanning) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Stack.Screen options={{ title: 'Configuración de Impresora' }} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Configuración de Impresora' }} />
      
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado de Conexión</Text>
          <View style={styles.card}>
            <View style={styles.statusCard}>
              <View style={styles.statusRow}>
                <IconSymbol
                  name={isConnected ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                  size={20}
                  color={isConnected ? colors.success : colors.error}
                />
                <Text style={styles.statusLabel}>Estado:</Text>
                <Text style={styles.statusValue}>
                  {isConnected ? 'Conectada' : 'Desconectada'}
                </Text>
              </View>
              {connectedDevice && (
                <View style={styles.statusRow}>
                  <IconSymbol name="printer.fill" size={20} color={colors.primary} />
                  <Text style={styles.statusLabel}>Dispositivo:</Text>
                  <Text style={styles.statusValue}>{connectedDevice.name}</Text>
                </View>
              )}
            </View>

            {isConnected ? (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={handleTestPrint}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <IconSymbol name="printer.fill" size={20} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Imprimir Prueba</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonDanger]}
                  onPress={handleDisconnect}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <IconSymbol name="xmark.circle.fill" size={20} color="#FFFFFF" />
                      <Text style={styles.buttonText}>Desconectar</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.button}
                onPress={handleScan}
                disabled={scanning}
              >
                {scanning ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <IconSymbol name="magnifyingglass" size={20} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Buscar Impresoras</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {availableDevices.length > 0 && !isConnected && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dispositivos Disponibles</Text>
            <View style={styles.card}>
              {availableDevices.map((device) => (
                <View key={device.id} style={styles.deviceCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deviceName}>{device.name || 'Dispositivo sin nombre'}</Text>
                    <Text style={styles.deviceId}>{device.id}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.connectButton}
                    onPress={() => handleConnect(device.id)}
                    disabled={loading}
                  >
                    <Text style={styles.connectButtonText}>Conectar</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración de Impresión</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Impresión Automática</Text>
                <Text style={styles.settingDescription}>
                  Imprimir automáticamente los pedidos nuevos
                </Text>
              </View>
              <Switch
                value={autoPrintEnabled}
                onValueChange={setAutoPrintEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Corte Automático</Text>
                <Text style={styles.settingDescription}>
                  Cortar el papel automáticamente después de imprimir
                </Text>
              </View>
              <Switch
                value={autoCutEnabled}
                onValueChange={setAutoCutEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Incluir Logo</Text>
                <Text style={styles.settingDescription}>
                  Mostrar encabezado en el ticket
                </Text>
              </View>
              <Switch
                value={includeLogo}
                onValueChange={setIncludeLogo}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Información del Cliente</Text>
                <Text style={styles.settingDescription}>
                  Incluir datos del cliente en el ticket
                </Text>
              </View>
              <Switch
                value={includeCustomerInfo}
                onValueChange={setIncludeCustomerInfo}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Totales</Text>
                <Text style={styles.settingDescription}>
                  Mostrar totales en el ticket
                </Text>
              </View>
              <Switch
                value={includeTotals}
                onValueChange={setIncludeTotals}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Formato WhatsApp</Text>
                <Text style={styles.settingDescription}>
                  Usar formato de WhatsApp para productos (ej: &quot;2 kilos de papas&quot;)
                </Text>
              </View>
              <Switch
                value={useWebhookFormat}
                onValueChange={setUseWebhookFormat}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Tamaño de Papel</Text>
                <View style={[styles.sizeButtonsContainer, { marginTop: 8 }]}>
                  <TouchableOpacity
                    style={[
                      styles.sizeButton,
                      paperSize === '58mm' && styles.sizeButtonActive,
                    ]}
                    onPress={() => setPaperSize('58mm')}
                  >
                    <Text
                      style={[
                        styles.sizeButtonText,
                        paperSize === '58mm' && styles.sizeButtonTextActive,
                      ]}
                    >
                      58mm
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.sizeButton,
                      paperSize === '80mm' && styles.sizeButtonActive,
                    ]}
                    onPress={() => setPaperSize('80mm')}
                  >
                    <Text
                      style={[
                        styles.sizeButtonText,
                        paperSize === '80mm' && styles.sizeButtonTextActive,
                      ]}
                    >
                      80mm
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={[styles.settingRow, styles.settingRowLast]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Tamaño de Texto</Text>
                <View style={[styles.sizeButtonsContainer, { marginTop: 8 }]}>
                  <TouchableOpacity
                    style={[
                      styles.sizeButton,
                      textSize === 'small' && styles.sizeButtonActive,
                    ]}
                    onPress={() => setTextSize('small')}
                  >
                    <Text
                      style={[
                        styles.sizeButtonText,
                        textSize === 'small' && styles.sizeButtonTextActive,
                      ]}
                    >
                      Pequeño
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.sizeButton,
                      textSize === 'medium' && styles.sizeButtonActive,
                    ]}
                    onPress={() => setTextSize('medium')}
                  >
                    <Text
                      style={[
                        styles.sizeButtonText,
                        textSize === 'medium' && styles.sizeButtonTextActive,
                      ]}
                    >
                      Mediano
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.sizeButton,
                      textSize === 'large' && styles.sizeButtonActive,
                    ]}
                    onPress={() => setTextSize('large')}
                  >
                    <Text
                      style={[
                        styles.sizeButtonText,
                        textSize === 'large' && styles.sizeButtonTextActive,
                      ]}
                    >
                      Grande
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSaveConfig}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <IconSymbol name="checkmark.circle.fill" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Guardar Configuración</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
