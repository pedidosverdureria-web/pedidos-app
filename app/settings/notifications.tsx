
import React, { useState, useEffect, useCallback } from 'react';
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
import { Stack, router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Notification } from '@/types';
import { registerForPushNotificationsAsync } from '@/utils/pushNotifications';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState({
    newOrderNotifications: true,
    statusChangeNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
    pushNotificationsEnabled: false,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      
      console.log('Loading notifications for user:', user?.id);
      
      // Fetch all notifications (both user-specific and global)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading notifications:', error);
        throw error;
      }

      console.log('Loaded notifications:', data?.length || 0);
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'No se pudieron cargar las notificaciones');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadNotifications();

    // Set up real-time subscription for new notifications
    const supabase = getSupabase();
    if (supabase) {
      console.log('Setting up realtime subscription for notifications...');
      
      const channel = supabase
        .channel('notifications_changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications' },
          (payload) => {
            console.log('New notification received:', payload);
            loadNotifications();
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'notifications' },
          (payload) => {
            console.log('Notification updated:', payload);
            loadNotifications();
          }
        )
        .subscribe((status) => {
          console.log('Notifications subscription status:', status);
        });

      return () => {
        console.log('Cleaning up notifications subscription...');
        supabase.removeChannel(channel);
      };
    }
  }, [loadNotifications]);

  const handlePushNotificationToggle = async (value: boolean) => {
    if (value && user?.user_id) {
      try {
        setSavingSettings(true);
        const token = await registerForPushNotificationsAsync(user.user_id);
        if (token) {
          setSettings({ ...settings, pushNotificationsEnabled: true });
          Alert.alert('Éxito', 'Notificaciones push activadas');
        } else {
          Alert.alert('Error', 'No se pudieron activar las notificaciones push');
        }
      } catch (error) {
        console.error('Error enabling push notifications:', error);
        Alert.alert('Error', 'No se pudieron activar las notificaciones push');
      } finally {
        setSavingSettings(false);
      }
    } else {
      setSettings({ ...settings, pushNotificationsEnabled: false });
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const supabase = getSupabase();
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);

      if (unreadIds.length === 0) {
        Alert.alert('Info', 'No hay notificaciones sin leer');
        return;
      }

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      Alert.alert('Éxito', 'Todas las notificaciones marcadas como leídas');
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'No se pudieron marcar las notificaciones');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'No se pudo eliminar la notificación');
    }
  };

  const clearAll = () => {
    Alert.alert(
      'Confirmar',
      '¿Estás seguro de que quieres eliminar todas las notificaciones?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const supabase = getSupabase();
              const notificationIds = notifications.map((n) => n.id);

              const { error } = await supabase
                .from('notifications')
                .delete()
                .in('id', notificationIds);

              if (error) throw error;

              setNotifications([]);
              Alert.alert('Éxito', 'Todas las notificaciones eliminadas');
            } catch (error) {
              console.error('Error clearing notifications:', error);
              Alert.alert('Error', 'No se pudieron eliminar las notificaciones');
            }
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return 'cart.fill';
      case 'success':
        return 'checkmark.circle.fill';
      case 'warning':
        return 'exclamationmark.triangle.fill';
      case 'error':
        return 'xmark.circle.fill';
      default:
        return 'info.circle.fill';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order':
        return colors.primary;
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'error':
        return colors.error;
      default:
        return colors.info;
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.related_order_id) {
      router.push(`/order/${notification.related_order_id}` as any);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Notificaciones',
          headerBackTitle: 'Atrás',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración</Text>
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <IconSymbol name="bell.badge.fill" size={24} color={colors.primary} />
                <Text style={styles.switchLabel}>Notificaciones Push</Text>
              </View>
              <Switch
                value={settings.pushNotificationsEnabled}
                onValueChange={handlePushNotificationToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
                disabled={savingSettings}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <IconSymbol name="bell.fill" size={24} color={colors.primary} />
                <Text style={styles.switchLabel}>Nuevos Pedidos</Text>
              </View>
              <Switch
                value={settings.newOrderNotifications}
                onValueChange={(value) =>
                  setSettings({ ...settings, newOrderNotifications: value })
                }
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <IconSymbol name="arrow.triangle.2.circlepath" size={24} color={colors.info} />
                <Text style={styles.switchLabel}>Cambios de Estado</Text>
              </View>
              <Switch
                value={settings.statusChangeNotifications}
                onValueChange={(value) =>
                  setSettings({ ...settings, statusChangeNotifications: value })
                }
                trackColor={{ false: colors.border, true: colors.info }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <IconSymbol name="speaker.wave.2.fill" size={24} color={colors.success} />
                <Text style={styles.switchLabel}>Sonido</Text>
              </View>
              <Switch
                value={settings.soundEnabled}
                onValueChange={(value) => setSettings({ ...settings, soundEnabled: value })}
                trackColor={{ false: colors.border, true: colors.success }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <IconSymbol name="iphone.radiowaves.left.and.right" size={24} color={colors.accent} />
                <Text style={styles.switchLabel}>Vibración</Text>
              </View>
              <Switch
                value={settings.vibrationEnabled}
                onValueChange={(value) =>
                  setSettings({ ...settings, vibrationEnabled: value })
                }
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Notificaciones ({unreadCount} sin leer)
            </Text>
            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity style={styles.headerButton} onPress={markAllAsRead}>
                  <Text style={styles.headerButtonText}>Marcar todas</Text>
                </TouchableOpacity>
              )}
              {notifications.length > 0 && (
                <TouchableOpacity style={styles.headerButton} onPress={clearAll}>
                  <Text style={[styles.headerButtonText, { color: colors.error }]}>
                    Limpiar
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {notifications.length > 0 ? (
            <View style={styles.card}>
              {notifications.map((notification, index) => (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    !notification.is_read && styles.notificationUnread,
                    index < notifications.length - 1 && styles.notificationBorder,
                  ]}
                  onPress={() => handleNotificationPress(notification)}
                >
                  <View style={styles.notificationLeft}>
                    <View
                      style={[
                        styles.notificationIcon,
                        { backgroundColor: getNotificationColor(notification.type) },
                      ]}
                    >
                      <IconSymbol
                        name={getNotificationIcon(notification.type) as any}
                        size={20}
                        color="#FFFFFF"
                      />
                    </View>
                    <View style={styles.notificationContent}>
                      <Text style={styles.notificationTitle}>{notification.title}</Text>
                      <Text style={styles.notificationMessage}>{notification.message}</Text>
                      <Text style={styles.notificationTime}>
                        {new Date(notification.created_at).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteNotification(notification.id)}
                  >
                    <IconSymbol name="trash" size={18} color={colors.error} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <IconSymbol name="bell.slash.fill" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No hay notificaciones</Text>
              <Text style={styles.emptySubtext}>
                Las notificaciones aparecerán aquí cuando recibas nuevos pedidos o actualizaciones
              </Text>
            </View>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerButtonText: {
    fontSize: 12,
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
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  notificationUnread: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  notificationBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginLeft: 8,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
