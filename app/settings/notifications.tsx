
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Notification } from '@/types';
import { 
  registerForPushNotificationsAsync, 
  checkNotificationPermissions,
  requestNotificationPermissions,
  hasRegisteredPushToken,
  removeDevicePushToken,
  FirebaseConfigError
} from '@/utils/pushNotifications';
import { CustomDialog, DialogButton } from '@/components/CustomDialog';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

interface DialogState {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  buttons?: DialogButton[];
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);
  const [settings, setSettings] = useState({
    newOrderNotifications: true,
    statusChangeNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
    pushNotificationsEnabled: false,
  });
  const [savingSettings, setSavingSettings] = useState(false);
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

  // Check notification permissions and token registration on mount
  useEffect(() => {
    const checkPermissionsAndToken = async () => {
      if (Platform.OS === 'web') {
        setCheckingPermissions(false);
        return;
      }

      try {
        console.log('[NotificationsScreen] Checking permissions and token registration...');
        
        const granted = await checkNotificationPermissions();
        setPermissionsGranted(granted);
        console.log('[NotificationsScreen] Permissions granted:', granted);
        
        // Check if device has a registered token
        const hasToken = await hasRegisteredPushToken();
        console.log('[NotificationsScreen] Has registered token:', hasToken);
        
        setSettings(prev => ({ ...prev, pushNotificationsEnabled: granted && hasToken }));
      } catch (error) {
        console.error('[NotificationsScreen] Error checking permissions:', error);
      } finally {
        setCheckingPermissions(false);
      }
    };

    checkPermissionsAndToken();
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      
      console.log('[NotificationsScreen] Loading notifications...');
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[NotificationsScreen] Error loading notifications:', error);
        throw error;
      }

      console.log('[NotificationsScreen] Loaded notifications:', data?.length || 0);
      setNotifications(data || []);
    } catch (error) {
      console.error('[NotificationsScreen] Error loading notifications:', error);
      showDialog('error', 'Error', 'No se pudieron cargar las notificaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();

    const supabase = getSupabase();
    if (supabase) {
      console.log('[NotificationsScreen] Setting up realtime subscription for notifications...');
      
      const channel = supabase
        .channel('notifications_changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications' },
          (payload) => {
            console.log('[NotificationsScreen] New notification received:', payload);
            loadNotifications();
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'notifications' },
          (payload) => {
            console.log('[NotificationsScreen] Notification updated:', payload);
            loadNotifications();
          }
        )
        .subscribe((status) => {
          console.log('[NotificationsScreen] Notifications subscription status:', status);
        });

      return () => {
        console.log('[NotificationsScreen] Cleaning up notifications subscription...');
        supabase.removeChannel(channel);
      };
    }
  }, [loadNotifications]);

  const handlePushNotificationToggle = async (value: boolean) => {
    if (Platform.OS === 'web') {
      showDialog('info', 'No disponible', 'Las notificaciones push no están disponibles en la web');
      return;
    }

    if (value) {
      try {
        setSavingSettings(true);
        
        console.log('[NotificationsScreen] Enabling push notifications...');
        
        const granted = await requestNotificationPermissions();
        
        if (!granted) {
          console.log('[NotificationsScreen] Permissions not granted');
          showDialog(
            'warning', 
            'Permisos requeridos', 
            'Debes otorgar permisos de notificaciones en la configuración de tu dispositivo para recibir notificaciones push.',
            [
              { text: 'Cancelar', style: 'cancel', onPress: closeDialog },
              {
                text: 'Abrir Configuración',
                style: 'default',
                onPress: async () => {
                  closeDialog();
                  try {
                    if (Platform.OS === 'ios') {
                      await Linking.openURL('app-settings:');
                    } else {
                      await Linking.openSettings();
                    }
                  } catch (error) {
                    console.error('[NotificationsScreen] Error opening settings:', error);
                    Alert.alert(
                      'Configuración de Notificaciones',
                      'Ve a Configuración > Aplicaciones > Pedidos > Notificaciones y activa las notificaciones.'
                    );
                  }
                },
              },
            ]
          );
          return;
        }

        setPermissionsGranted(true);

        console.log('[NotificationsScreen] Registering push notifications for role:', user?.role);
        
        try {
          const token = await registerForPushNotificationsAsync(user?.role);
          
          if (token) {
            console.log('[NotificationsScreen] Push token registered successfully:', token);
            
            // Verify the token was saved
            const hasToken = await hasRegisteredPushToken();
            
            if (hasToken) {
              setSettings({ ...settings, pushNotificationsEnabled: true });
              showDialog(
                'success', 
                '✅ Notificaciones Activadas', 
                'Las notificaciones push se han activado correctamente.\n\n' +
                '🔔 Recibirás alertas de nuevos pedidos en este dispositivo.\n\n' +
                '💡 Las notificaciones funcionarán incluso con la pantalla apagada.'
              );
              console.log('[NotificationsScreen] Push notifications enabled and verified');
            } else {
              throw new Error('Token no se guardó en la base de datos');
            }
          } else {
            throw new Error('No se pudo obtener el token de notificaciones push');
          }
        } catch (tokenError: any) {
          console.error('[NotificationsScreen] Error registering push token:', tokenError);
          
          // Check if it's a Firebase configuration error
          if (tokenError instanceof FirebaseConfigError) {
            showDialog(
              'error', 
              '⚠️ Firebase No Configurado', 
              '🔧 Para usar notificaciones push en Android, necesitas configurar Firebase Cloud Messaging (FCM).\n\n' +
              '📋 PASOS NECESARIOS:\n\n' +
              '1️⃣ Crear proyecto en Firebase Console\n' +
              '   → https://console.firebase.google.com\n\n' +
              '2️⃣ Agregar app Android\n' +
              '   → Package: com.pedidosapp.mobile\n\n' +
              '3️⃣ Descargar google-services.json\n' +
              '   → Colocar en raíz del proyecto\n\n' +
              '4️⃣ Configurar credenciales en EAS\n' +
              '   → Comando: eas credentials\n\n' +
              '5️⃣ Hacer nuevo build\n' +
              '   → Comando: eas build -p android\n\n' +
              '💡 ALTERNATIVA: Usa notificaciones locales sin Firebase. Funcionan cuando la app está abierta o en segundo plano.\n\n' +
              '📚 Consulta FIREBASE_FCM_SETUP_GUIDE.md para más detalles.',
              [
                { text: 'Cerrar', style: 'cancel', onPress: closeDialog },
                {
                  text: 'Ver Guía Completa',
                  style: 'default',
                  onPress: async () => {
                    closeDialog();
                    try {
                      await Linking.openURL('https://docs.expo.dev/push-notifications/fcm-credentials/');
                    } catch (error) {
                      console.error('[NotificationsScreen] Error opening URL:', error);
                      showDialog(
                        'info',
                        'Documentación',
                        'Visita: https://docs.expo.dev/push-notifications/fcm-credentials/\n\n' +
                        'O consulta el archivo FIREBASE_FCM_SETUP_GUIDE.md en el proyecto.'
                      );
                    }
                  },
                },
              ]
            );
          } else {
            // Other errors
            showDialog(
              'error', 
              'Error', 
              'No se pudieron activar las notificaciones push.\n\n' +
              'Error: ' + (tokenError.message || 'Error desconocido') + '\n\n' +
              '💡 Intenta:\n' +
              '- Verificar permisos del sistema\n' +
              '- Reiniciar la aplicación\n' +
              '- Verificar conexión a internet'
            );
          }
        }
      } catch (error: any) {
        console.error('[NotificationsScreen] Error enabling push notifications:', error);
        showDialog(
          'error', 
          'Error', 
          'No se pudieron activar las notificaciones push.\n\n' +
          'Error: ' + (error.message || 'Error desconocido')
        );
      } finally {
        setSavingSettings(false);
      }
    } else {
      // Disable push notifications
      try {
        setSavingSettings(true);
        console.log('[NotificationsScreen] Disabling push notifications...');
        
        await removeDevicePushToken();
        
        setSettings({ ...settings, pushNotificationsEnabled: false });
        showDialog(
          'info', 
          'Desactivado', 
          'Las notificaciones push han sido desactivadas en este dispositivo.\n\n' +
          '🔕 Ya no recibirás alertas de nuevos pedidos.\n\n' +
          '💡 Puedes reactivarlas en cualquier momento.'
        );
        console.log('[NotificationsScreen] Push notifications disabled');
      } catch (error: any) {
        console.error('[NotificationsScreen] Error disabling push notifications:', error);
        showDialog(
          'error', 
          'Error', 
          'No se pudieron desactivar las notificaciones push: ' + error.message
        );
      } finally {
        setSavingSettings(false);
      }
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
      console.error('[NotificationsScreen] Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const supabase = getSupabase();
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);

      if (unreadIds.length === 0) {
        showDialog('info', 'Info', 'No hay notificaciones sin leer');
        return;
      }

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      showDialog('success', 'Éxito', 'Todas las notificaciones marcadas como leídas');
    } catch (error) {
      console.error('[NotificationsScreen] Error marking all as read:', error);
      showDialog('error', 'Error', 'No se pudieron marcar las notificaciones');
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
      console.error('[NotificationsScreen] Error deleting notification:', error);
      showDialog('error', 'Error', 'No se pudo eliminar la notificación');
    }
  };

  const clearAll = () => {
    showDialog(
      'warning',
      'Confirmar',
      '¿Estás seguro de que quieres eliminar todas las notificaciones?',
      [
        { text: 'Cancelar', style: 'cancel', onPress: closeDialog },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            closeDialog();
            try {
              const supabase = getSupabase();
              const notificationIds = notifications.map((n) => n.id);

              const { error } = await supabase
                .from('notifications')
                .delete()
                .in('id', notificationIds);

              if (error) throw error;

              setNotifications([]);
              showDialog('success', 'Éxito', 'Todas las notificaciones eliminadas');
            } catch (error) {
              console.error('[NotificationsScreen] Error clearing notifications:', error);
              showDialog('error', 'Error', 'No se pudieron eliminar las notificaciones');
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
    warningBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: 'rgba(251, 191, 36, 0.1)',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'rgba(251, 191, 36, 0.3)',
    },
    warningContent: {
      flex: 1,
      marginLeft: 12,
    },
    warningTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.warning,
      marginBottom: 4,
    },
    warningText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
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
    switchTextContainer: {
      flex: 1,
      marginLeft: 12,
    },
    switchLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginLeft: 12,
    },
    switchSubtext: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 12,
      marginTop: 2,
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

  if (loading || checkingPermissions) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración</Text>
          
          {Platform.OS !== 'web' && !permissionsGranted && (
            <View style={styles.warningBanner}>
              <IconSymbol ios_icon_name="exclamationmark.triangle.fill" android_material_icon_name="warning" size={24} color={colors.warning} />
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Permisos de notificaciones desactivados</Text>
                <Text style={styles.warningText}>
                  Activa los permisos de notificaciones para recibir alertas de nuevos pedidos
                </Text>
              </View>
            </View>
          )}

          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <IconSymbol ios_icon_name="bell.badge.fill" android_material_icon_name="notifications_active" size={24} color={colors.primary} />
                <View style={styles.switchTextContainer}>
                  <Text style={styles.switchLabel}>Notificaciones Push</Text>
                  <Text style={styles.switchSubtext}>
                    {Platform.OS === 'web' 
                      ? 'No disponible en web' 
                      : settings.pushNotificationsEnabled
                        ? 'Activadas - Recibirás alertas de pedidos' 
                        : permissionsGranted
                          ? 'Toca para activar notificaciones'
                          : 'Requiere permisos del sistema'}
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.pushNotificationsEnabled}
                onValueChange={handlePushNotificationToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
                disabled={savingSettings || Platform.OS === 'web'}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <IconSymbol ios_icon_name="bell.fill" android_material_icon_name="notifications" size={24} color={colors.primary} />
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
                <IconSymbol ios_icon_name="arrow.triangle.2.circlepath" android_material_icon_name="sync" size={24} color={colors.info} />
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
                <IconSymbol ios_icon_name="speaker.wave.2.fill" android_material_icon_name="volume_up" size={24} color={colors.success} />
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
                <IconSymbol ios_icon_name="iphone.radiowaves.left.and.right" android_material_icon_name="vibration" size={24} color={colors.accent} />
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
                        ios_icon_name={getNotificationIcon(notification.type) as any}
                        android_material_icon_name="notifications"
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
                    <IconSymbol ios_icon_name="trash" android_material_icon_name="delete" size={18} color={colors.error} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <IconSymbol ios_icon_name="bell.slash.fill" android_material_icon_name="notifications_off" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No hay notificaciones</Text>
              <Text style={styles.emptySubtext}>
                Las notificaciones aparecerán aquí cuando recibas nuevos pedidos o actualizaciones
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <CustomDialog
        visible={dialog.visible}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        buttons={dialog.buttons}
        onClose={closeDialog}
      />
    </>
  );
}
