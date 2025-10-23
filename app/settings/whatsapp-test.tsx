
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { parseWhatsAppMessage, ParsedOrderItem } from '@/utils/whatsappParser';

export default function WhatsAppTestScreen() {
  const [testMessage, setTestMessage] = useState(
    '2 kg tomatoes\n1/2 kg cheese\n1 unit bread\n1.5 l milk\n3 pza eggs'
  );
  const [parsedResult, setParsedResult] = useState<ParsedOrderItem[]>([]);
  const [showResult, setShowResult] = useState(false);

  const handleTest = () => {
    try {
      const result = parseWhatsAppMessage(testMessage);
      setParsedResult(result);
      setShowResult(true);
      
      if (result.length === 0) {
        Alert.alert(
          'Sin Resultados',
          'No se pudo parsear ningún item del mensaje. Verifica el formato.'
        );
      } else {
        Alert.alert(
          'Éxito',
          `Se parsearon ${result.length} item(s) correctamente`
        );
      }
    } catch (error) {
      console.error('Error parsing message:', error);
      Alert.alert('Error', `Error al parsear el mensaje: ${error.message}`);
    }
  };

  const handleClear = () => {
    setTestMessage('');
    setParsedResult([]);
    setShowResult(false);
  };

  const loadExample1 = () => {
    setTestMessage('2 kg tomatoes\n1/2 kg cheese\n1 unit bread');
    setShowResult(false);
  };

  const loadExample2 = () => {
    setTestMessage('1.5 l milk\n3 pza eggs\n0.5 kg butter');
    setShowResult(false);
  };

  const loadExample3 = () => {
    setTestMessage('1 kg arroz\n2 litros aceite\n1/4 kg mantequilla\n3 unidades pan');
    setShowResult(false);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Test WhatsApp Parser',
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <IconSymbol name="info.circle.fill" size={24} color={colors.info} />
          <Text style={styles.infoText}>
            Prueba el parser de mensajes de WhatsApp. Ingresa un mensaje con el formato:
            {'\n\n'}
            <Text style={styles.codeText}>cantidad unidad producto</Text>
            {'\n\n'}
            Ejemplo: "2 kg tomatoes"
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ejemplos Rápidos</Text>
          <View style={styles.examplesRow}>
            <TouchableOpacity style={styles.exampleButton} onPress={loadExample1}>
              <Text style={styles.exampleButtonText}>Ejemplo 1</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exampleButton} onPress={loadExample2}>
              <Text style={styles.exampleButtonText}>Ejemplo 2</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exampleButton} onPress={loadExample3}>
              <Text style={styles.exampleButtonText}>Ejemplo 3</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mensaje de Prueba</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.textArea}
              value={testMessage}
              onChangeText={setTestMessage}
              placeholder="Ingresa el mensaje de WhatsApp aquí..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={8}
            />
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.testButton]}
            onPress={handleTest}
          >
            <IconSymbol name="play.fill" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Probar Parser</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={handleClear}
          >
            <IconSymbol name="trash.fill" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Limpiar</Text>
          </TouchableOpacity>
        </View>

        {showResult && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Resultado ({parsedResult.length} items)
            </Text>
            {parsedResult.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.emptyText}>
                  No se pudo parsear ningún item del mensaje
                </Text>
              </View>
            ) : (
              <View style={styles.card}>
                {parsedResult.map((item, index) => (
                  <View key={index} style={styles.resultItem}>
                    <View style={styles.resultHeader}>
                      <IconSymbol
                        name="checkmark.circle.fill"
                        size={20}
                        color={colors.success}
                      />
                      <Text style={styles.resultTitle}>Item {index + 1}</Text>
                    </View>
                    <View style={styles.resultDetails}>
                      <View style={styles.resultRow}>
                        <Text style={styles.resultLabel}>Cantidad:</Text>
                        <Text style={styles.resultValue}>{item.quantity}</Text>
                      </View>
                      <View style={styles.resultRow}>
                        <Text style={styles.resultLabel}>Unidad:</Text>
                        <Text style={styles.resultValue}>{item.unit}</Text>
                      </View>
                      <View style={styles.resultRow}>
                        <Text style={styles.resultLabel}>Producto:</Text>
                        <Text style={styles.resultValue}>{item.product}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Formato Soportado</Text>
          <View style={styles.card}>
            <View style={styles.formatItem}>
              <IconSymbol name="checkmark.circle" size={20} color={colors.success} />
              <Text style={styles.formatText}>
                <Text style={styles.bold}>Cantidades:</Text> Enteros (2), decimales (1.5), fracciones (1/2)
              </Text>
            </View>
            <View style={styles.formatItem}>
              <IconSymbol name="checkmark.circle" size={20} color={colors.success} />
              <Text style={styles.formatText}>
                <Text style={styles.bold}>Unidades:</Text> kg, g, l, ml, unit, pza, unidad
              </Text>
            </View>
            <View style={styles.formatItem}>
              <IconSymbol name="checkmark.circle" size={20} color={colors.success} />
              <Text style={styles.formatText}>
                <Text style={styles.bold}>Producto:</Text> Cualquier texto después de la unidad
              </Text>
            </View>
          </View>
        </View>
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
  codeText: {
    fontFamily: 'monospace',
    backgroundColor: colors.background,
    padding: 4,
    borderRadius: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  examplesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  exampleButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  exampleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    minHeight: 150,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  testButton: {
    backgroundColor: colors.primary,
  },
  clearButton: {
    backgroundColor: colors.error,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  resultItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  resultDetails: {
    marginLeft: 28,
  },
  resultRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 100,
  },
  resultValue: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  formatItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  formatText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
  },
});
