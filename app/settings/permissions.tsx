
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { CustomDialog, DialogButton } from '@/components/CustomDialog';
import * as Haptics from 'expo-haptics';
import {
  getAllPermissionsStatus,
  requestPermission,
  requestAllRequiredPermissions,
  openAppSettings,
  getPermissionStatusColor,
  getPermissionStatusLabel,
  PermissionInfo,
} from '@/utils/permissions';

interface DialogState {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  buttons?: DialogButton[];
}

export default function PermissionsScreen() {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [permissions, setPermissions] = useState<PermissionInfo[]>([]);
  const [requesting, setRequesting] = useState<string | null>(null);
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

  const loadPermissions = useCallback(async () => {
    try {
      console.log('[PermissionsScreen] Loading permissions...');
      const permissionsStatus = await getAllPermissionsStatus();
      setPermissions(permissionsStatus);
      console.log('[PermissionsScreen] Permissions loaded:', permissionsStatus);
    } catch (error) {
      console.error('[PermissionsScreen] Error loading permissions:', error);
      showDialog('error', 'Error', 'No se pudieron cargar los permisos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPermissions();
  }, [loadPermissions]);

  const handleRequestPermission = async (permission: PermissionInfo) => {
    try {
      setRequesting(permission.name);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      console.log('[PermissionsScreen] Requesting permission:', permission.name);
      const status = await requestPermission(permission.name);
      console.log('[PermissionsScreen] Permission result:', status);
      
      await loadPermissions();
      
      if (status === 'granted') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showDialog(
          'success',
          '✅ Permiso Concedido',
          `El permiso de ${permission.name} ha sido concedido correctamente.`
        );
      } else if (status === 'denied') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showDialog(
          'error',
          '❌ Permiso Denegado',
          `El permiso de ${permission.name} fue denegado. Puedes habilitarlo manualmente en la configuración del sistema.`,
          [
            { text: 'Cancelar', style: 'cancel', onPress: closeDialog },
            { text: 'Abrir Configuración', style: 'primary', onPress: openAppSettings },
          ]
        );
      }
    } catch (error) {
      console.error('[PermissionsScreen] Error requesting permission:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showDialog('error', 'Error', 'No se pudo solicitar el permiso');
    } finally {
      setRequesting(null);
    }
  };

  const handleRequestAllPermissions = async () => {
    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      console.log('[PermissionsScreen] Requesting all permissions...');
      await requestAllRequiredPermissions();
      
      await loadPermissions();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showDialog(
        'success',
        '✅ Permisos Solicitados',
        'Se han solicitado todos los permisos necesarios. Revisa el estado de cada uno abajo.'
      );
    } catch (error) {
      console.error('[PermissionsScreen] Error requesting all permissions:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showDialog('error', 'Error', 'No se pudieron solicitar todos los permisos');
    } finally {
      setLoading(false);
    }
  };

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
      marginLeft: 4,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoCard: {
      backgroundColor: colors.info + '20',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.info + '40',
    },
    infoText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    permissionItem: {
      marginBottom: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    permissionItemLast: {
      marginBottom: 0,
      paddingBottom: 0,
      borderBottomWidth: 0,
    },
    permissionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    permissionIcon: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    permissionInfo: {
      flex: 1,
    },
    permissionName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    permissionDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    permissionStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      gap: 6,
    },
    statusText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    requestButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    requestButtonDisabled: {
      backgroundColor: colors.border,
    },
    requestButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 12,
    },
    buttonSecondary: {
      backgroundColor: colors.secondary,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    summaryCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    summaryLabel: {
      fontSize: 15,
      color: colors.text,
      fontWeight: '500',
    },
    summaryValue: {
      fontSize: 15,
      fontWeight: '600',
    },
    warningCard: {
      backgroundColor: colors.warning + '20',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.warning + '40',
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    warningIcon: {
      marginRight: 12,
      marginTop: 2,
    },
    warningText: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
  });

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen
          options={{
            title: 'Permisos',
            headerBackTitle: 'Atrás',
          }}
        />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const grantedCount = permissions.filter(p => p.status === 'granted').length;
  const totalCount = permissions.length;
  const allGranted = grantedCount === totalCount;
  const hasIssues = permissions.some(p => p.required && p.status !== 'granted');

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Permisos',
          headerBackTitle: 'Atrás',
        }}
      />
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Esta aplicación necesita ciertos permisos para funcionar correctamente, especialmente para la auto-impresión en segundo plano y las notificaciones de nuevos pedidos.
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Permisos concedidos:</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: allGranted ? colors.success : colors.warning },
              ]}
            >
              {grantedCount} de {totalCount}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Estado general:</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: allGranted ? colors.success : colors.warning },
              ]}
            >
              <IconSymbol
                name={allGranted ? 'checkmark.circle.fill' : 'exclamationmark.triangle.fill'}
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.statusText}>
                {allGranted ? 'Completo' : 'Incompleto'}
              </Text>
            </View>
          </View>
        </View>

        {hasIssues && (
          <View style={styles.warningCard}>
            <IconSymbol
              name="exclamationmark.triangle.fill"
              size={24}
              color={colors.warning}
              style={styles.warningIcon}
            />
            <Text style={styles.warningText}>
              Algunos permisos necesarios no están concedidos. La auto-impresión en segundo plano y las notificaciones pueden no funcionar correctamente.
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permisos Requeridos</Text>
          <View style={styles.card}>
            {permissions.map((permission, index) => (
              <View
                key={permission.name}
                style={[
                  styles.permissionItem,
                  index === permissions.length - 1 && styles.permissionItemLast,
                ]}
              >
                <View style={styles.permissionHeader}>
                  <View style={styles.permissionIcon}>
                    <IconSymbol
                      name={permission.icon as any}
                      size={20}
                      color="#FFFFFF"
                    />
                  </View>
                  <View style={styles.permissionInfo}>
                    <Text style={styles.permissionName}>{permission.name}</Text>
                  </View>
                </View>
                <Text style={styles.permissionDescription}>
                  {permission.description}
                </Text>
                <View style={styles.permissionStatus}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getPermissionStatusColor(permission.status) },
                    ]}
                  >
                    <IconSymbol
                      name={
                        permission.status === 'granted'
                          ? 'checkmark.circle.fill'
                          : permission.status === 'denied'
                          ? 'xmark.circle.fill'
                          : 'questionmark.circle.fill'
                      }
                      size={16}
                      color="#FFFFFF"
                    />
                    <Text style={styles.statusText}>
                      {getPermissionStatusLabel(permission.status)}
                    </Text>
                  </View>
                  {permission.status !== 'granted' && (
                    <TouchableOpacity
                      style={[
                        styles.requestButton,
                        requesting === permission.name && styles.requestButtonDisabled,
                      ]}
                      onPress={() => handleRequestPermission(permission)}
                      disabled={requesting === permission.name}
                    >
                      <Text style={styles.requestButtonText}>
                        {requesting === permission.name ? 'Solicitando...' : 'Solicitar'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones</Text>
          {!allGranted && (
            <TouchableOpacity
              style={styles.button}
              onPress={handleRequestAllPermissions}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Solicitando...' : 'Solicitar Todos los Permisos'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={openAppSettings}
          >
            <Text style={styles.buttonText}>Abrir Configuración del Sistema</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Adicional</Text>
          <View style={styles.card}>
            <Text style={styles.permissionDescription}>
              • <Text style={{ fontWeight: '600' }}>Notificaciones:</Text> Necesarias para recibir alertas de nuevos pedidos incluso cuando la app está cerrada.{'\n\n'}
              • <Text style={{ fontWeight: '600' }}>Bluetooth:</Text> Necesario para conectar y usar la impresora térmica.{'\n\n'}
              • <Text style={{ fontWeight: '600' }}>Tareas en Segundo Plano:</Text> Permite que la app imprima pedidos automáticamente incluso con la pantalla apagada.{'\n\n'}
              • <Text style={{ fontWeight: '600' }}>Ubicación (Android):</Text> Requerido por Android para escanear dispositivos Bluetooth cercanos.
            </Text>
          </View>
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
    </View>
  );
}
