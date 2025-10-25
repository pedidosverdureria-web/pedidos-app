
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
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [formData, setFormData] = useState({
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
            Las credenciales se configuran directamente en Supabase Edge Functions.
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
          <Text style={styles.sectionTitle}>Configuración del Webhook</Text>
          <View style={styles.card}>
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
              <Text style={styles.helperText}>
                Esta es la URL que debes configurar en WhatsApp Business API
              </Text>
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
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
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
