
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { parseWhatsAppMessage, ParsedOrderItem } from '@/utils/whatsappParser';
import { CustomDialog, DialogButton } from '@/components/CustomDialog';

interface DialogState {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  buttons?: DialogButton[];
}

export default function WhatsAppTestScreen() {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<ParsedOrderItem[]>([]);
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

  const handleTest = () => {
    if (!message.trim()) {
      showDialog('error', 'Error', 'Por favor ingresa un mensaje para probar');
      return;
    }

    console.log('Testing message:', message);
    const parsed = parseWhatsAppMessage(message);
    setResult(parsed);

    if (parsed.length === 0) {
      showDialog(
        'warning',
        'Sin resultados',
        'No se pudo parsear ningún item del mensaje. Revisa el formato.'
      );
    } else {
      showDialog(
        'success',
        'Éxito',
        `Se parsearon ${parsed.length} item(s) correctamente`
      );
    }
  };

  const handleClear = () => {
    setMessage('');
    setResult([]);
  };

  const loadExample1 = () => {
    setMessage(`3 kilos de tomates
2 kilos de papas
1 kilo de cebollas`);
  };

  const loadExample2 = () => {
    setMessage(`3kilos de tomates
2k de papas
1kg de cebollas
12kilos de papas`);
  };

  const loadExample3 = () => {
    setMessage(`3 tomates
2 pepinos
1 lechuga
5 pepinos`);
  };

  const loadExample4 = () => {
    setMessage(`1/2 kilo de papas
1/4 de ají
1/8 kilo de cilantro
1/2 kg de tomates`);
  };

  const loadExample5 = () => {
    setMessage(`dos kilos de tomates
tres papas
un kilo de cebollas
una lechuga
cinco pepinos`);
  };

  const loadExample6 = () => {
    setMessage(`tomates 3 kilos
papas 2k
cebollas 1kg`);
  };

  const loadExample7 = () => {
    setMessage(`3kilos tomates 2kilos papas 1 lechuga
2k tomates 3 pepinos 1/2 kilo papas`);
  };

  const loadExample8 = () => {
    setMessage(`3 kilos de tomates, 2 kilos de papas, 1 lechuga
3k tomates, 2k papas, 5 pepinos`);
  };

  const loadExample9 = () => {
    setMessage(`3 mallas de cebolla
2 saco de papa
un cajón de tomate
6 cabezas de ajo
2 atados de cilantro`);
  };

  const loadExampleMixed = () => {
    setMessage(`3 kilos de tomates
2k papas
cinco pepinos
1/2 kilo de cilantro
tomates 2 kilos
3 lechugas, 1 cajón de ajo
un atado de cilantro`);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    input: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      minHeight: 200,
      textAlignVertical: 'top',
      borderWidth: 1,
      borderColor: colors.border,
    },
    buttonRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
    },
    button: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    buttonSecondary: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    buttonText: {
      color: colors.background,
      fontSize: 14,
      fontWeight: '600',
    },
    buttonTextSecondary: {
      color: colors.text,
    },
    resultContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    resultTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    resultItem: {
      backgroundColor: colors.background,
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    resultText: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 4,
    },
    resultLabel: {
      fontWeight: '600',
      color: colors.primary,
    },
    emptyResult: {
      fontSize: 14,
      color: colors.textSecondary,
      fontStyle: 'italic',
      textAlign: 'center',
      paddingVertical: 20,
    },
    exampleButton: {
      flex: 1,
      minWidth: 100,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
  });

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Test de Parser WhatsApp',
          headerBackTitle: 'Atrás',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mensaje de WhatsApp</Text>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Ingresa un mensaje para probar el parser..."
            placeholderTextColor={colors.textSecondary}
            multiline
          />
          
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={handleTest}>
              <IconSymbol name="play.fill" size={16} color={colors.background} />
              <Text style={styles.buttonText}>Probar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleClear}
            >
              <IconSymbol name="trash" size={16} color={colors.text} />
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                Limpiar
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ejemplos de Formatos</Text>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary, styles.exampleButton]}
              onPress={loadExample1}
            >
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                Formato 1
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary, styles.exampleButton]}
              onPress={loadExample2}
            >
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                Formato 2
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary, styles.exampleButton]}
              onPress={loadExample3}
            >
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                Formato 3
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary, styles.exampleButton]}
              onPress={loadExample4}
            >
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                Fracciones
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary, styles.exampleButton]}
              onPress={loadExample5}
            >
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                Números Texto
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary, styles.exampleButton]}
              onPress={loadExample6}
            >
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                Producto Primero
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary, styles.exampleButton]}
              onPress={loadExample7}
            >
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                Múltiples Items
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary, styles.exampleButton]}
              onPress={loadExample8}
            >
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                Con Comas
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary, styles.exampleButton]}
              onPress={loadExample9}
            >
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                Unidades Especiales
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={loadExampleMixed}
            >
              <IconSymbol name="sparkles" size={16} color={colors.text} />
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                Ejemplo Mixto Completo
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {result.length > 0 && (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{result.length}</Text>
                <Text style={styles.statLabel}>Items Parseados</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {result.reduce((sum, item) => sum + item.quantity, 0).toFixed(2)}
                </Text>
                <Text style={styles.statLabel}>Cantidad Total</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {new Set(result.map(item => item.unit)).size}
                </Text>
                <Text style={styles.statLabel}>Unidades Únicas</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Resultado del Parsing</Text>
              <View style={styles.resultContainer}>
                {result.map((item, index) => (
                  <View key={index} style={styles.resultItem}>
                    <Text style={styles.resultText}>
                      <Text style={styles.resultLabel}>Producto:</Text> {item.product}
                    </Text>
                    <Text style={styles.resultText}>
                      <Text style={styles.resultLabel}>Cantidad:</Text> {item.quantity}
                    </Text>
                    <Text style={styles.resultText}>
                      <Text style={styles.resultLabel}>Unidad:</Text> {item.unit}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {result.length === 0 && message.trim() !== '' && (
          <View style={styles.section}>
            <View style={styles.resultContainer}>
              <Text style={styles.emptyResult}>
                Presiona &quot;Probar&quot; para parsear el mensaje
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

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
