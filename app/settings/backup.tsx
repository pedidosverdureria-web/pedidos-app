
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

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
  infoBox: {
    backgroundColor: '#3B82F620',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  backupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  backupButtonSecondary: {
    backgroundColor: '#8B5CF6',
  },
  backupButtonDisabled: {
    opacity: 0.5,
  },
  backupButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backupIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backupContent: {
    flex: 1,
  },
  backupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  backupDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scheduleCard: {
    backgroundColor: '#10B98120',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleIcon: {
    marginRight: 8,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  scheduleInfo: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  scheduleDetail: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98120',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
});

export default function BackupScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [backupType, setBackupType] = useState<'orders' | 'database' | null>(null);

  const isAdmin = user?.role === 'admin';

  const createOrdersBackup = async () => {
    try {
      setLoading(true);
      setBackupType('orders');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const supabase = getSupabase();

      // Fetch all orders with their items
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Create backup object
      const backup = {
        type: 'orders',
        created_at: new Date().toISOString(),
        version: '1.0.0',
        data: {
          orders: orders || [],
          total_orders: orders?.length || 0,
        },
      };

      // Convert to JSON
      const jsonString = JSON.stringify(backup, null, 2);
      const fileName = `orders_backup_${new Date().toISOString().split('T')[0]}.json`;

      if (Platform.OS === 'web') {
        // Web: Download file
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        
        Alert.alert('Éxito', 'Backup de pedidos descargado correctamente');
      } else {
        // Mobile: Save and share file
        const documentDirectory = FileSystem.documentDirectory;
        if (!documentDirectory) {
          throw new Error('Document directory not available');
        }
        const fileUri = `${documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, jsonString);

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Guardar Backup de Pedidos',
          });
        } else {
          Alert.alert('Éxito', `Backup guardado en: ${fileUri}`);
        }
      }

      console.log('[Backup] Orders backup created successfully');
    } catch (error) {
      console.error('[Backup] Error creating orders backup:', error);
      Alert.alert('Error', 'No se pudo crear el backup de pedidos');
    } finally {
      setLoading(false);
      setBackupType(null);
    }
  };

  const createDatabaseBackup = async () => {
    try {
      setLoading(true);
      setBackupType('database');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const supabase = getSupabase();

      // Fetch all data from all tables
      const [ordersRes, orderItemsRes, profilesRes, notificationsRes, whatsappConfigRes, printerConfigRes, knownUnitsRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('order_items').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }),
        supabase.from('whatsapp_config').select('*'),
        supabase.from('printer_config').select('*'),
        supabase.from('known_units').select('*'),
      ]);

      // Check for errors
      const errors = [
        ordersRes.error,
        orderItemsRes.error,
        profilesRes.error,
        notificationsRes.error,
        whatsappConfigRes.error,
        printerConfigRes.error,
        knownUnitsRes.error,
      ].filter(Boolean);

      if (errors.length > 0) {
        throw new Error(`Database backup failed: ${errors.map(e => e?.message).join(', ')}`);
      }

      // Create backup object
      const backup = {
        type: 'database',
        created_at: new Date().toISOString(),
        version: '1.0.0',
        data: {
          orders: ordersRes.data || [],
          order_items: orderItemsRes.data || [],
          profiles: profilesRes.data || [],
          notifications: notificationsRes.data || [],
          whatsapp_config: whatsappConfigRes.data || [],
          printer_config: printerConfigRes.data || [],
          known_units: knownUnitsRes.data || [],
        },
        metadata: {
          total_orders: ordersRes.data?.length || 0,
          total_order_items: orderItemsRes.data?.length || 0,
          total_profiles: profilesRes.data?.length || 0,
          total_notifications: notificationsRes.data?.length || 0,
        },
      };

      // Convert to JSON
      const jsonString = JSON.stringify(backup, null, 2);
      const fileName = `database_backup_${new Date().toISOString().split('T')[0]}.json`;

      if (Platform.OS === 'web') {
        // Web: Download file
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
        
        Alert.alert('Éxito', 'Backup completo de la base de datos descargado correctamente');
      } else {
        // Mobile: Save and share file
        const documentDirectory = FileSystem.documentDirectory;
        if (!documentDirectory) {
          throw new Error('Document directory not available');
        }
        const fileUri = `${documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, jsonString);

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Guardar Backup de Base de Datos',
          });
        } else {
          Alert.alert('Éxito', `Backup guardado en: ${fileUri}`);
        }
      }

      console.log('[Backup] Database backup created successfully');
    } catch (error) {
      console.error('[Backup] Error creating database backup:', error);
      Alert.alert('Error', 'No se pudo crear el backup de la base de datos');
    } finally {
      setLoading(false);
      setBackupType(null);
    }
  };

  const testScheduledBackup = async () => {
    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const supabase = getSupabase();

      // Call the edge function to test the scheduled backup
      const { data, error } = await supabase.functions.invoke('scheduled-backup', {
        body: { test: true },
      });

      if (error) throw error;

      Alert.alert(
        'Prueba Exitosa',
        'Se ha enviado un backup de prueba al correo configurado. Revisa tu bandeja de entrada.'
      );

      console.log('[Backup] Test scheduled backup sent:', data);
    } catch (error) {
      console.error('[Backup] Error testing scheduled backup:', error);
      Alert.alert('Error', 'No se pudo enviar el backup de prueba. Verifica la configuración.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Backup y Restauración',
          headerBackTitle: 'Atrás',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Info Box */}
        <View style={styles.infoBox}>
          <IconSymbol
            name="info.circle.fill"
            size={20}
            color="#3B82F6"
            style={styles.infoIcon}
          />
          <Text style={styles.infoText}>
            Los backups te permiten guardar una copia de seguridad de tus datos. 
            Puedes descargarlos manualmente o recibirlos automáticamente por correo cada día.
          </Text>
        </View>

        {/* Manual Backups */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Backups Manuales</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={[
                styles.backupButton,
                loading && backupType === 'orders' && styles.backupButtonDisabled,
              ]}
              onPress={createOrdersBackup}
              disabled={loading}
            >
              <View style={styles.backupButtonLeft}>
                <View style={styles.backupIcon}>
                  <IconSymbol name="doc.text.fill" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.backupContent}>
                  <Text style={styles.backupTitle}>Backup de Pedidos</Text>
                  <Text style={styles.backupDescription}>
                    Exportar todos los pedidos y sus items
                  </Text>
                </View>
              </View>
              {loading && backupType === 'orders' ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <IconSymbol name="arrow.down.circle.fill" size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.backupButton,
                styles.backupButtonSecondary,
                loading && backupType === 'database' && styles.backupButtonDisabled,
              ]}
              onPress={createDatabaseBackup}
              disabled={loading}
            >
              <View style={styles.backupButtonLeft}>
                <View style={styles.backupIcon}>
                  <IconSymbol name="cylinder.fill" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.backupContent}>
                  <Text style={styles.backupTitle}>Backup Completo</Text>
                  <Text style={styles.backupDescription}>
                    Exportar toda la base de datos
                  </Text>
                </View>
              </View>
              {loading && backupType === 'database' ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <IconSymbol name="arrow.down.circle.fill" size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Scheduled Backups */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Backups Automáticos</Text>
          <View style={styles.scheduleCard}>
            <View style={styles.scheduleHeader}>
              <IconSymbol
                name="clock.fill"
                size={24}
                color="#10B981"
                style={styles.scheduleIcon}
              />
              <Text style={styles.scheduleTitle}>Backup Diario Programado</Text>
            </View>
            <Text style={styles.scheduleInfo}>
              Se crea automáticamente un backup completo todos los días a las 12:00 AM 
              (horario de Chile Continental) y se envía al correo:
            </Text>
            <Text style={[styles.scheduleInfo, { fontWeight: '600' }]}>
              pedidos.verdureria@gmail.com
            </Text>
            <Text style={styles.scheduleDetail}>
              El backup incluye todos los pedidos, items, configuraciones y datos del sistema.
            </Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>ACTIVO</Text>
            </View>
          </View>
        </View>

        {/* Test Scheduled Backup */}
        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pruebas</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={[
                  styles.backupButton,
                  { backgroundColor: '#F59E0B' },
                  loading && !backupType && styles.backupButtonDisabled,
                ]}
                onPress={testScheduledBackup}
                disabled={loading}
              >
                <View style={styles.backupButtonLeft}>
                  <View style={styles.backupIcon}>
                    <IconSymbol name="paperplane.fill" size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.backupContent}>
                    <Text style={styles.backupTitle}>Probar Backup Automático</Text>
                    <Text style={styles.backupDescription}>
                      Enviar backup de prueba por correo
                    </Text>
                  </View>
                </View>
                {loading && !backupType ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <IconSymbol name="play.circle.fill" size={24} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Restore Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restauración</Text>
          <View style={styles.card}>
            <View style={styles.infoBox}>
              <IconSymbol
                name="exclamationmark.triangle.fill"
                size={20}
                color="#F59E0B"
                style={styles.infoIcon}
              />
              <Text style={styles.infoText}>
                Para restaurar un backup, contacta al administrador del sistema. 
                La restauración debe realizarse con precaución para evitar pérdida de datos.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
