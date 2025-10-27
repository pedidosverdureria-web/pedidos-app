
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { usePrinter } from '@/hooks/usePrinter';
import { IconSymbol } from '@/components/IconSymbol';

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
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  testButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  encodingButton: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: colors.border,
  },
  encodingButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  encodingButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  encodingButtonDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  previewBox: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: colors.text,
    lineHeight: 18,
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  successBox: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    gap: 10,
  },
  successText: {
    flex: 1,
    fontSize: 14,
    color: '#065F46',
    lineHeight: 20,
  },
});

type Encoding = 'CP850' | 'UTF-8' | 'ISO-8859-1' | 'Windows-1252';

export default function PrinterTestScreen() {
  const { printReceipt, isConnected } = usePrinter();
  const [selectedEncoding, setSelectedEncoding] = useState<Encoding>('CP850');
  const [printing, setPrinting] = useState(false);

  const encodingOptions = [
    {
      value: 'CP850' as Encoding,
      label: 'CP850 (Recomendado)',
      description: 'Estándar para impresoras térmicas con soporte español. Incluye ñ, acentos y caracteres especiales.',
    },
    {
      value: 'ISO-8859-1' as Encoding,
      label: 'ISO-8859-1 (Latin-1)',
      description: 'Codificación alternativa para caracteres latinos. Puede funcionar en algunas impresoras.',
    },
    {
      value: 'Windows-1252' as Encoding,
      label: 'Windows-1252',
      description: 'Similar a ISO-8859-1 con algunos caracteres adicionales.',
    },
    {
      value: 'UTF-8' as Encoding,
      label: 'UTF-8',
      description: 'Codificación universal. Puede no funcionar en impresoras térmicas antiguas.',
    },
  ];

  const testContent = `
=================================
   PRUEBA DE CARACTERES
=================================

VOCALES CON ACENTO:
Minúsculas: á é í ó ú
Mayúsculas: Á É Í Ó Ú

LETRA Ñ:
Minúscula: ñ
Mayúscula: Ñ

DIÉRESIS:
Minúscula: ü
Mayúscula: Ü

PUNTUACIÓN ESPAÑOLA:
¿Pregunta?
¡Exclamación!

PALABRAS COMUNES:
- Año
- Niño
- Señor
- Señora
- Mañana
- España
- Jalapeño
- Piñata
- Ñandú
- Añejo

FRASES:
El niño comió piña en España.
¿Cuántos años tienes?
¡Qué día tan hermoso!

NÚMEROS Y SÍMBOLOS:
Precio: $1.234
Temperatura: 25°C
Euro: €10

=================================
`;

  const handleTest = async () => {
    if (!isConnected) {
      Alert.alert('Error', 'No hay impresora conectada. Por favor, conecta una impresora primero.');
      return;
    }

    try {
      setPrinting(true);
      await printReceipt(testContent, true, 'medium', selectedEncoding);
      Alert.alert(
        'Prueba Completada',
        `La prueba se imprimió con codificación ${selectedEncoding}.\n\nVerifica que todos los caracteres especiales (ñ, acentos, ¿, ¡) se vean correctamente en el ticket impreso.`
      );
    } catch (error) {
      console.error('[PrinterTest] Error:', error);
      Alert.alert('Error', 'No se pudo imprimir la prueba');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Prueba de Caracteres',
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
        }}
      />
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prueba de Codificación</Text>
          <Text style={styles.description}>
            Esta herramienta te ayuda a verificar que los caracteres especiales del español (ñ, acentos, ¿, ¡) se impriman correctamente en tu impresora térmica.
          </Text>

          {!isConnected && (
            <View style={styles.warningBox}>
              <IconSymbol name="exclamationmark.triangle" size={20} color="#92400E" />
              <Text style={styles.warningText}>
                No hay impresora conectada. Ve a Configuración de Impresora para conectar una impresora.
              </Text>
            </View>
          )}

          {isConnected && (
            <View style={styles.successBox}>
              <IconSymbol name="checkmark.circle" size={20} color="#065F46" />
              <Text style={styles.successText}>
                Impresora conectada. Puedes realizar la prueba de impresión.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selecciona Codificación</Text>
          <Text style={styles.description}>
            Prueba diferentes codificaciones para encontrar la que funciona mejor con tu impresora:
          </Text>

          {encodingOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.encodingButton,
                selectedEncoding === option.value && styles.encodingButtonActive,
              ]}
              onPress={() => setSelectedEncoding(option.value)}
            >
              <Text style={styles.encodingButtonText}>{option.label}</Text>
              <Text style={styles.encodingButtonDescription}>{option.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vista Previa</Text>
          <Text style={styles.description}>
            Esto es lo que se imprimirá:
          </Text>
          <View style={styles.previewBox}>
            <Text style={styles.previewText}>{testContent}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.testButton}
          onPress={handleTest}
          disabled={!isConnected || printing}
        >
          {printing ? (
            <>
              <ActivityIndicator color="#fff" />
              <Text style={styles.testButtonText}>Imprimiendo...</Text>
            </>
          ) : (
            <>
              <IconSymbol name="printer" size={22} color="#fff" />
              <Text style={styles.testButtonText}>Imprimir Prueba</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instrucciones</Text>
          <Text style={styles.description}>
            1. Conecta tu impresora térmica en Configuración de Impresora{'\n'}
            2. Selecciona una codificación (recomendamos CP850){'\n'}
            3. Presiona "Imprimir Prueba"{'\n'}
            4. Verifica que todos los caracteres se vean correctamente{'\n'}
            5. Si algunos caracteres no se ven bien, prueba otra codificación{'\n'}
            6. Una vez que encuentres la codificación correcta, guárdala en la configuración de la impresora
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Solución de Problemas</Text>
          <Text style={styles.description}>
            <Text style={{ fontWeight: 'bold' }}>Si la ñ o los acentos no se imprimen correctamente:</Text>
            {'\n\n'}
            • Prueba con CP850 (la más compatible){'\n'}
            • Verifica que tu impresora soporte caracteres españoles{'\n'}
            • Algunas impresoras muy antiguas pueden no soportar estos caracteres{'\n'}
            • Consulta el manual de tu impresora para ver qué codificaciones soporta
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
