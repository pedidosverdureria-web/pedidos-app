
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import { CustomDialog, DialogButton } from '@/components/CustomDialog';

interface DialogState {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  buttons?: DialogButton[];
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
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

  const handleSignOut = () => {
    showDialog(
      'warning',
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: closeDialog,
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            closeDialog();
            try {
              await signOut();
              router.replace('/login');
            } catch (error) {
              console.error('[Profile] Error signing out:', error);
              showDialog('error', 'Error', 'No se pudo cerrar sesión');
            }
          },
        },
      ]
    );
  };

  const renderHeaderRight = () => (
    <TouchableOpacity
      onPress={() => router.push('/settings')}
      style={{ marginRight: 16 }}
    >
      <IconSymbol name="gearshape.fill" size={24} color={colors.primary} />
    </TouchableOpacity>
  );

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'worker':
        return 'Trabajador';
      case 'printer':
        return 'Impresor';
      case 'desarrollador':
        return 'Desarrollador';
      default:
        return 'Usuario';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return colors.success;
      case 'worker':
        return colors.info;
      case 'printer':
        return '#8B5CF6';
      case 'desarrollador':
        return '#F59E0B'; // Orange color for developer
      default:
        return colors.primary;
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Perfil',
          headerRight: renderHeaderRight,
        }}
      />
      <ScrollView style={styles.container}>
        {/* User Info Card */}
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              {/* Display app logo instead of user icon */}
              <Image
                source={require('@/assets/images/64897504-f76f-4cb3-a1f3-a82b594f1121.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>

          <Text style={styles.name}>{user?.full_name || 'Usuario'}</Text>
          <View style={styles.roleContainer}>
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: getRoleColor(user?.role || '') + '20' },
              ]}
            >
              <Text
                style={[
                  styles.roleText,
                  { color: getRoleColor(user?.role || '') },
                ]}
              >
                {getRoleDisplayName(user?.role || '')}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>

          {user?.role === 'printer' ? (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/printer-queue')}
            >
              <View style={styles.menuItemLeft}>
                <IconSymbol name="printer.fill" size={24} color="#8B5CF6" />
                <Text style={styles.menuItemText}>Cola de Impresión</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/completed-orders')}
            >
              <View style={styles.menuItemLeft}>
                <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
                <Text style={styles.menuItemText}>Pedidos Completados</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/settings')}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol name="gearshape.fill" size={24} color={colors.primary} />
              <Text style={styles.menuItemText}>Configuración</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {user?.role !== 'printer' && (
            <>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/activity')}
              >
                <View style={styles.menuItemLeft}>
                  <IconSymbol name="clock.fill" size={24} color={colors.primary} />
                  <Text style={styles.menuItemText}>Actividad</Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/stats')}
              >
                <View style={styles.menuItemLeft}>
                  <IconSymbol name="chart.bar.fill" size={24} color={colors.primary} />
                  <Text style={styles.menuItemText}>Estadísticas</Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/settings/pdf-manager')}
              >
                <View style={styles.menuItemLeft}>
                  <IconSymbol name="doc.text.fill" size={24} color="#EF4444" />
                  <Text style={styles.menuItemText}>Gestor PDF Pedidos</Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Manuals Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manuales</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/settings/user-manual')}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol name="book.fill" size={24} color="#3B82F6" />
              <Text style={styles.menuItemText}>Guía de Usuario</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/settings/admin-manual')}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol name="person.badge.key.fill" size={24} color="#10B981" />
              <Text style={styles.menuItemText}>Guía de Administrador</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/settings/special-functions-manual')}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol name="sparkles" size={24} color="#F59E0B" />
              <Text style={styles.menuItemText}>Guía de Funciones Especiales</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/settings/technical-manual')}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol name="wrench.and.screwdriver.fill" size={24} color="#8B5CF6" />
              <Text style={styles.menuItemText}>Guía Técnica</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/settings/developer-manual')}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color="#EF4444" />
              <Text style={styles.menuItemText}>Guía de Desarrollador</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/settings/troubleshooting-manual')}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol name="wrench.adjustable.fill" size={24} color="#EC4899" />
              <Text style={styles.menuItemText}>Guía para Resolver Problemas</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Admin and Desarrollador Only Section */}
        {(user?.role === 'admin' || user?.role === 'desarrollador') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Administración</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/settings/users')}
            >
              <View style={styles.menuItemLeft}>
                <IconSymbol name="person.2.fill" size={24} color={colors.primary} />
                <Text style={styles.menuItemText}>Gestión de Usuarios</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/settings/whatsapp')}
            >
              <View style={styles.menuItemLeft}>
                <IconSymbol name="message.fill" size={24} color={colors.primary} />
                <Text style={styles.menuItemText}>WhatsApp</Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Sign Out */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.menuItem, styles.signOutButton]}
            onPress={handleSignOut}
          >
            <View style={styles.menuItemLeft}>
              <IconSymbol name="rectangle.portrait.and.arrow.right" size={24} color={colors.error} />
              <Text style={[styles.menuItemText, styles.signOutText]}>Cerrar Sesión</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Order Manager v1.0.0</Text>
          <Text style={styles.footerText}>Aplicación de uso privado</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.card,
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary,
    overflow: 'hidden',
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  roleContainer: {
    marginTop: 8,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  signOutButton: {
    borderColor: colors.error + '40',
  },
  signOutText: {
    color: colors.error,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
});
