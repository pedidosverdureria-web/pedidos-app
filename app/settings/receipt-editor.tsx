
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  TextInput,
  Switch,
  Modal,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { generateSampleReceipt, PrinterConfig } from '@/utils/receiptGenerator';
import { AdvancedReceiptConfig, ReceiptStyle } from '@/types';
import { RECEIPT_STYLES, getStyleName, getStyleDescription } from '@/utils/receiptStyles';

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
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
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
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    marginTop: 8,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
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
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  previewSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  previewContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    maxHeight: 400,
  },
  previewText: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#000000',
    lineHeight: 16,
  },
  styleCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  styleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  styleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  styleDescription: {
    fontSize: 14,
    color: colors.textSecondary,
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
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  customFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  customFieldInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: colors.text,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  addFieldButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addFieldButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sliderContainer: {
    paddingVertical: 12,
  },
  sliderLabel: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  sliderValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderValue: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
  },
  sliderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sliderButton: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 40,
    alignItems: 'center',
  },
  sliderButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default function ReceiptEditorScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showStyleModal, setShowStyleModal] = useState(false);
  
  // Basic config
  const [paperSize, setPaperSize] = useState<'58mm' | '80mm'>('80mm');
  const [textSize, setTextSize] = useState<'small' | 'medium' | 'large'>('small');
  const [includeCustomerInfo, setIncludeCustomerInfo] = useState(true);
  const [includeTotals, setIncludeTotals] = useState(true);
  
  // Advanced config
  const [advancedConfig, setAdvancedConfig] = useState<AdvancedReceiptConfig>({
    ...RECEIPT_STYLES.classic,
    product_price_alignment: 'right',
    show_product_notes: true,
    product_name_max_width: 70,
  });

  const loadConfig = useCallback(async () => {
    try {
      console.log('[ReceiptEditor] Loading config...');
      const configStr = await AsyncStorage.getItem(PRINTER_CONFIG_KEY);
      if (configStr) {
        const config = JSON.parse(configStr);
        console.log('[ReceiptEditor] Config loaded:', config);
        
        setPaperSize(config.paper_size || '80mm');
        setTextSize(config.text_size || 'small');
        setIncludeCustomerInfo(config.include_customer_info ?? true);
        setIncludeTotals(config.include_totals ?? true);
        
        if (config.advanced_config) {
          // Ensure new fields have default values
          setAdvancedConfig({
            ...config.advanced_config,
            product_price_alignment: config.advanced_config.product_price_alignment || 'right',
            show_product_notes: config.advanced_config.show_product_notes ?? true,
            product_name_max_width: config.advanced_config.product_name_max_width || 70,
          });
        }
      }
    } catch (error) {
      console.error('[ReceiptEditor] Error loading config:', error);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const previewReceipt = useMemo(() => {
    const config: PrinterConfig = {
      paper_size: paperSize,
      text_size: textSize,
      include_customer_info: includeCustomerInfo,
      include_totals: includeTotals,
      advanced_config: advancedConfig,
    };
    
    return generateSampleReceipt(config);
  }, [paperSize, textSize, includeCustomerInfo, includeTotals, advancedConfig]);

  const handleSaveConfig = async () => {
    try {
      setLoading(true);

      const configStr = await AsyncStorage.getItem(PRINTER_CONFIG_KEY);
      const existingConfig = configStr ? JSON.parse(configStr) : {};

      const newConfig = {
        ...existingConfig,
        paper_size: paperSize,
        text_size: textSize,
        include_customer_info: includeCustomerInfo,
        include_totals: includeTotals,
        advanced_config: advancedConfig,
      };
      
      console.log('[ReceiptEditor] Saving config:', newConfig);
      await AsyncStorage.setItem(PRINTER_CONFIG_KEY, JSON.stringify(newConfig));
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Configuración Guardada',
        'El estilo del recibo se guardó correctamente y se aplicará en todas las impresiones: auto-impresión, impresión manual, consultas y pagos.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[ReceiptEditor] Error saving config:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error al Guardar',
        'No se pudo guardar la configuración: ' + (error as Error).message,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStyle = (style: ReceiptStyle) => {
    setAdvancedConfig(RECEIPT_STYLES[style]);
    setShowStyleModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const updateAdvancedConfig = (key: keyof AdvancedReceiptConfig, value: any) => {
    setAdvancedConfig({ ...advancedConfig, [key]: value });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const addCustomField = () => {
    const newFields = [...advancedConfig.custom_fields, { label: '', value: '' }];
    updateAdvancedConfig('custom_fields', newFields);
  };

  const updateCustomField = (index: number, key: 'label' | 'value', value: string) => {
    const newFields = [...advancedConfig.custom_fields];
    newFields[index][key] = value;
    updateAdvancedConfig('custom_fields', newFields);
  };

  const deleteCustomField = (index: number) => {
    const newFields = advancedConfig.custom_fields.filter((_, i) => i !== index);
    updateAdvancedConfig('custom_fields', newFields);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const adjustProductNameWidth = (delta: number) => {
    const newWidth = Math.max(30, Math.min(100, advancedConfig.product_name_max_width + delta));
    updateAdvancedConfig('product_name_max_width', newWidth);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Editor de Recibos',
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
        }}
      />
      <ScrollView style={styles.content}>
        {/* Live Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Vista Previa en Vivo</Text>
          <Text style={styles.sectionDescription}>
            Los cambios se reflejan automáticamente en la vista previa
          </Text>
          
          <ScrollView style={styles.previewContainer} nestedScrollEnabled>
            <Text style={styles.previewText}>{previewReceipt}</Text>
          </ScrollView>
        </View>

        {/* Style Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estilo de Recibo</Text>
          <Text style={styles.sectionDescription}>
            Selecciona un estilo predefinido como punto de partida
          </Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={() => setShowStyleModal(true)}
          >
            <Text style={styles.buttonText}>
              Estilo Actual: {getStyleName(advancedConfig.style)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Header Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Encabezado</Text>
          
          <Text style={styles.settingLabel}>Texto del Encabezado</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={advancedConfig.header_text}
            onChangeText={(text) => updateAdvancedConfig('header_text', text)}
            placeholder="Texto del encabezado"
            placeholderTextColor={colors.textSecondary}
            multiline
          />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              const alignments: Array<'left' | 'center' | 'right'> = ['left', 'center', 'right'];
              const currentIndex = alignments.indexOf(advancedConfig.header_alignment);
              const nextIndex = (currentIndex + 1) % alignments.length;
              updateAdvancedConfig('header_alignment', alignments[nextIndex]);
            }}
          >
            <Text style={styles.settingLabel}>Alineación</Text>
            <Text style={styles.settingValue}>
              {advancedConfig.header_alignment === 'left' ? 'Izquierda' : 
               advancedConfig.header_alignment === 'center' ? 'Centro' : 'Derecha'}
            </Text>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingRow, styles.settingRowLast]}
            onPress={() => {
              const newSpacing = (advancedConfig.header_spacing + 1) % 4;
              updateAdvancedConfig('header_spacing', newSpacing);
            }}
          >
            <Text style={styles.settingLabel}>Espaciado Superior</Text>
            <Text style={styles.settingValue}>{advancedConfig.header_spacing} líneas</Text>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Product Section Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sección de Productos</Text>
          <Text style={styles.sectionDescription}>
            Personaliza cómo se muestran los productos en el recibo
          </Text>
          
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              const newAlignment = advancedConfig.product_price_alignment === 'left' ? 'right' : 'left';
              updateAdvancedConfig('product_price_alignment', newAlignment);
            }}
          >
            <Text style={styles.settingLabel}>Alineación del Precio</Text>
            <Text style={styles.settingValue}>
              {advancedConfig.product_price_alignment === 'left' ? 'Izquierda' : 'Derecha'}
            </Text>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Mostrar Notas del Producto</Text>
            <Switch
              value={advancedConfig.show_product_notes}
              onValueChange={(value) => updateAdvancedConfig('show_product_notes', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <View style={[styles.settingRow, styles.settingRowLast]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sliderLabel}>Ancho Máximo del Nombre</Text>
              <Text style={styles.sectionDescription}>
                Controla hasta qué parte del recibo se extiende el nombre del producto
              </Text>
              <View style={styles.sliderValueContainer}>
                <Text style={styles.sliderValue}>{advancedConfig.product_name_max_width}%</Text>
                <View style={styles.sliderButtons}>
                  <TouchableOpacity
                    style={styles.sliderButton}
                    onPress={() => adjustProductNameWidth(-10)}
                  >
                    <Text style={styles.sliderButtonText}>-10</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sliderButton}
                    onPress={() => adjustProductNameWidth(-5)}
                  >
                    <Text style={styles.sliderButtonText}>-5</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sliderButton}
                    onPress={() => adjustProductNameWidth(5)}
                  >
                    <Text style={styles.sliderButtonText}>+5</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sliderButton}
                    onPress={() => adjustProductNameWidth(10)}
                  >
                    <Text style={styles.sliderButtonText}>+10</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Footer Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pie de Página</Text>
          
          <Text style={styles.settingLabel}>Texto del Pie de Página</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={advancedConfig.footer_text}
            onChangeText={(text) => updateAdvancedConfig('footer_text', text)}
            placeholder="Texto del pie de página"
            placeholderTextColor={colors.textSecondary}
            multiline
          />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              const alignments: Array<'left' | 'center' | 'right'> = ['left', 'center', 'right'];
              const currentIndex = alignments.indexOf(advancedConfig.footer_alignment);
              const nextIndex = (currentIndex + 1) % alignments.length;
              updateAdvancedConfig('footer_alignment', alignments[nextIndex]);
            }}
          >
            <Text style={styles.settingLabel}>Alineación</Text>
            <Text style={styles.settingValue}>
              {advancedConfig.footer_alignment === 'left' ? 'Izquierda' : 
               advancedConfig.footer_alignment === 'center' ? 'Centro' : 'Derecha'}
            </Text>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingRow, styles.settingRowLast]}
            onPress={() => {
              const newSpacing = (advancedConfig.footer_spacing + 1) % 5;
              updateAdvancedConfig('footer_spacing', newSpacing);
            }}
          >
            <Text style={styles.settingLabel}>Espaciado Inferior</Text>
            <Text style={styles.settingValue}>{advancedConfig.footer_spacing} líneas</Text>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Content Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contenido</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Mostrar Líneas Separadoras</Text>
            <Switch
              value={advancedConfig.show_separator_lines}
              onValueChange={(value) => updateAdvancedConfig('show_separator_lines', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          {advancedConfig.show_separator_lines && (
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => {
                const chars = ['=', '-', '═', '─', '*'];
                const currentIndex = chars.indexOf(advancedConfig.separator_char);
                const nextIndex = (currentIndex + 1) % chars.length;
                updateAdvancedConfig('separator_char', chars[nextIndex]);
              }}
            >
              <Text style={styles.settingLabel}>Carácter Separador</Text>
              <Text style={styles.settingValue}>{advancedConfig.separator_char}</Text>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              const newSpacing = (advancedConfig.item_spacing + 1) % 4;
              updateAdvancedConfig('item_spacing', newSpacing);
            }}
          >
            <Text style={styles.settingLabel}>Espaciado entre Productos</Text>
            <Text style={styles.settingValue}>{advancedConfig.item_spacing} líneas</Text>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Mostrar Precios</Text>
            <Switch
              value={advancedConfig.show_prices}
              onValueChange={(value) => updateAdvancedConfig('show_prices', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Mostrar Totales</Text>
            <Switch
              value={advancedConfig.show_item_totals}
              onValueChange={(value) => updateAdvancedConfig('show_item_totals', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Mostrar Número de Pedido</Text>
            <Switch
              value={advancedConfig.show_order_number}
              onValueChange={(value) => updateAdvancedConfig('show_order_number', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <View style={[styles.settingRow, styles.settingRowLast]}>
            <Text style={styles.settingLabel}>Mostrar Estado</Text>
            <Switch
              value={advancedConfig.show_status}
              onValueChange={(value) => updateAdvancedConfig('show_status', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <TouchableOpacity
            style={[styles.settingRow, styles.settingRowLast]}
            onPress={() => {
              const formats: Array<'short' | 'long' | 'time'> = ['short', 'long', 'time'];
              const currentIndex = formats.indexOf(advancedConfig.date_format);
              const nextIndex = (currentIndex + 1) % formats.length;
              updateAdvancedConfig('date_format', formats[nextIndex]);
            }}
          >
            <Text style={styles.settingLabel}>Formato de Fecha</Text>
            <Text style={styles.settingValue}>
              {advancedConfig.date_format === 'short' ? 'Corto' : 
               advancedConfig.date_format === 'long' ? 'Largo' : 'Solo Hora'}
            </Text>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Custom Fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Campos Personalizados</Text>
          <Text style={styles.sectionDescription}>
            Agrega información adicional al final del recibo
          </Text>
          
          {advancedConfig.custom_fields.map((field, index) => (
            <View key={index} style={styles.customFieldRow}>
              <TextInput
                style={styles.customFieldInput}
                value={field.label}
                onChangeText={(text) => updateCustomField(index, 'label', text)}
                placeholder="Etiqueta"
                placeholderTextColor={colors.textSecondary}
              />
              <TextInput
                style={styles.customFieldInput}
                value={field.value}
                onChangeText={(text) => updateCustomField(index, 'value', text)}
                placeholder="Valor"
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteCustomField(index)}
              >
                <IconSymbol name="trash" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          
          <TouchableOpacity style={styles.addFieldButton} onPress={addCustomField}>
            <Text style={styles.addFieldButtonText}>+ Agregar Campo</Text>
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleSaveConfig}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Guardando...' : 'Guardar Configuración'}
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.sectionDescription, { marginTop: 12, textAlign: 'center' }]}>
            Esta configuración se aplicará a todos los recibos: auto-impresión, impresión manual, consultas y pagos.
          </Text>
        </View>
      </ScrollView>

      {/* Style Selection Modal */}
      <Modal
        visible={showStyleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStyleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Estilo</Text>
            
            <ScrollView>
              {(Object.keys(RECEIPT_STYLES) as ReceiptStyle[]).map((style) => (
                <TouchableOpacity
                  key={style}
                  style={[
                    styles.styleCard,
                    advancedConfig.style === style && styles.styleCardSelected,
                  ]}
                  onPress={() => handleSelectStyle(style)}
                >
                  <Text style={styles.styleName}>{getStyleName(style)}</Text>
                  <Text style={styles.styleDescription}>{getStyleDescription(style)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowStyleModal(false)}
            >
              <Text style={styles.modalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
