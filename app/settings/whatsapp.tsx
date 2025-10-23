
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { getSupabase } from '@/lib/supabase';
import { WhatsAppConfig } from '@/types';

export default function WhatsAppSettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [formData, setFormData] = useState({
    verify_token: '',
    access_token: '',
    phone_number_id: '',
    webhook_url: '',
    is_active: false,
    auto_reply_enabled: true,
    auto_reply_message: '¡Gracias por tu pedido! Lo hemos recibido y lo procesaremos pronto.',
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('whatsapp_config')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfig(data);
        setFormData({
          verify_token: data.verify_token || '',
          access_token: data.access_token || '',
          phone_number_id: data.phone_number_id || '',
          webhook_url: data.webhook_url || '',
          is_active: data.is_active,
          auto_reply_enabled: data.auto_reply_enabled,
          auto_reply_message: data.auto_reply_message,
        });
      }
    } catch (error) {
      console.error('Error loading WhatsApp config:', error);
      Alert.alert('Error', 'No se pudo cargar la configuración de WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const supabase = getSupabase();

      const dataToSave = {
        verify_token: formData.verify_token || null,
        access_token: formData.access_token || null,
        phone_number_id: formData.phone_number_id || null,
        webhook_url: formData.webhook_url || null,
        is_active: formData.is_active,
        auto_reply_enabled: formData.auto_reply_enabled,
        auto_reply_message: formData.auto_reply_message,
        updated_at: new Date().toISOString(),
      };

      if (config) {
        const { error } = await supabase
          .from('whatsapp_config')
          .update(dataToSave)
          .eq('id', config.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('whatsapp_config')
          .insert([dataToSave]);

        if (error) throw error;
      }

      Alert.alert('Éxito', 'Configuración guardada correctamente');
      loadConfig();
    } catch (error) {
      console.error('Error saving WhatsApp config:', error);
      Alert.alert('Error', 'No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!formData.access_token || !formData.phone_number_id) {
      Alert.alert('Error', 'Por favor completa Access Token y Phone Number ID');
      return;
    }

    try {
      setTesting(true);
      // Here you would call your Edge Function to test the connection
      Alert.alert(
        'Test de Conexión',
        'La funcionalidad de test estará disponible cuando se implemente el Edge Function de WhatsApp'
      );
    } catch (error) {
      console.error('Error testing connection:', error);
      Alert.alert('Error', 'No se pudo probar la conexión');
    } finally {
      setTesting(false);
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
          title: 'WhatsApp Integration',
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <IconSymbol name="info.circle.fill" size={24} color={colors.info} />
          <Text style={styles.infoText}>
            Configura la integración con WhatsApp Business API para recibir pedidos automáticamente.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado</Text>
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <IconSymbol
                  name={formData.is_active ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                  size={24}
                  color={formData.is_active ? colors.success : colors.error}
                />
                <Text style={styles.switchLabel}>Integración Activa</Text>
              </View>
              <Switch
                value={formData.is_active}
                onValueChange={(value) => setFormData({ ...formData, is_active: value })}
                trackColor={{ false: colors.border, true: colors.success }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Credenciales</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Verify Token</Text>
              <TextInput
                style={styles.input}
                value={formData.verify_token}
                onChangeText={(text) => setFormData({ ...formData, verify_token: text })}
                placeholder="Tu verify token"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Access Token</Text>
              <TextInput
                style={styles.input}
                value={formData.access_token}
                onChangeText={(text) => setFormData({ ...formData, access_token: text })}
                placeholder="Tu access token"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number ID</Text>
              <TextInput
                style={styles.input}
                value={formData.phone_number_id}
                onChangeText={(text) => setFormData({ ...formData, phone_number_id: text })}
                placeholder="ID del número de teléfono"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Webhook URL</Text>
              <TextInput
                style={styles.input}
                value={formData.webhook_url}
                onChangeText={(text) => setFormData({ ...formData, webhook_url: text })}
                placeholder="https://tu-proyecto.supabase.co/functions/v1/whatsapp-webhook"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Respuesta Automática</Text>
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <IconSymbol name="message.fill" size={24} color={colors.primary} />
                <Text style={styles.switchLabel}>Respuesta Automática</Text>
              </View>
              <Switch
                value={formData.auto_reply_enabled}
                onValueChange={(value) =>
                  setFormData({ ...formData, auto_reply_enabled: value })
                }
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            {formData.auto_reply_enabled && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mensaje de Respuesta</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.auto_reply_message}
                  onChangeText={(text) =>
                    setFormData({ ...formData, auto_reply_message: text })
                  }
                  placeholder="Mensaje que se enviará automáticamente"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                />
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.parserTestButton}
          onPress={() => router.push('/settings/whatsapp-test')}
        >
          <IconSymbol name="text.bubble.fill" size={20} color={colors.primary} />
          <Text style={styles.parserTestButtonText}>Probar Parser de Mensajes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, testing && styles.buttonDisabled]}
          onPress={handleTestConnection}
          disabled={testing}
        >
          {testing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <IconSymbol name="bolt.fill" size={20} color="#FFFFFF" />
              <Text style={styles.testButtonText}>Probar Conexión</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSave}
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
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
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  parserTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  parserTestButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    borderRadius: 12,
    padding: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
