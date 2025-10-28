
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';

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
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  menuChevron: {
    marginLeft: 8,
  },
});

export default function SettingsScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const handleNavigation = (path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as any);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Configuración',
          headerBackTitle: 'Atrás',
        }}
      />
      <ScrollView style={styles.content}>
        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aplicación</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigation('/settings/permissions')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#3B82F6' }]}>
                <IconSymbol name="lock.shield.fill" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Permisos</Text>
                <Text style={styles.menuDescription}>
                  Revisar y gestionar permisos de la app
                </Text>
              </View>
              <IconSymbol
                name="chevron.right"
                size={20}
                color={colors.textSecondary}
                style={styles.menuChevron}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigation('/settings/notifications')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#10B981' }]}>
                <IconSymbol name="bell.badge.fill" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Notificaciones</Text>
                <Text style={styles.menuDescription}>
                  Configurar alertas y notificaciones
                </Text>
              </View>
              <IconSymbol
                name="chevron.right"
                size={20}
                color={colors.textSecondary}
                style={styles.menuChevron}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigation('/settings/printer')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#8B5CF6' }]}>
                <IconSymbol name="printer.fill" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Impresora</Text>
                <Text style={styles.menuDescription}>
                  Configurar impresora y auto-impresión
                </Text>
              </View>
              <IconSymbol
                name="chevron.right"
                size={20}
                color={colors.textSecondary}
                style={styles.menuChevron}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={() => handleNavigation('/settings/backup')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#EF4444' }]}>
                <IconSymbol name="arrow.clockwise.circle.fill" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Backup</Text>
                <Text style={styles.menuDescription}>
                  Crear y descargar copias de seguridad
                </Text>
              </View>
              <IconSymbol
                name="chevron.right"
                size={20}
                color={colors.textSecondary}
                style={styles.menuChevron}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Integration Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Integraciones</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={() => handleNavigation('/settings/whatsapp')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#25D366' }]}>
                <IconSymbol name="message.fill" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>WhatsApp</Text>
                <Text style={styles.menuDescription}>
                  Configurar integración con WhatsApp
                </Text>
              </View>
              <IconSymbol
                name="chevron.right"
                size={20}
                color={colors.textSecondary}
                style={styles.menuChevron}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Admin Settings */}
        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Administración</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={[styles.menuItem, styles.menuItemLast]}
                onPress={() => handleNavigation('/settings/users')}
              >
                <View style={[styles.menuIcon, { backgroundColor: '#F59E0B' }]}>
                  <IconSymbol name="person.2.fill" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Usuarios</Text>
                  <Text style={styles.menuDescription}>
                    Gestionar usuarios y permisos
                  </Text>
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.menuChevron}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Testing & Debug */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pruebas y Depuración</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigation('/settings/printer-test')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#6B7280' }]}>
                <IconSymbol name="printer.fill" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Prueba de Impresora</Text>
                <Text style={styles.menuDescription}>
                  Probar impresión con diferentes configuraciones
                </Text>
              </View>
              <IconSymbol
                name="chevron.right"
                size={20}
                color={colors.textSecondary}
                style={styles.menuChevron}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={() => handleNavigation('/settings/whatsapp-test')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#6B7280' }]}>
                <IconSymbol name="message.fill" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Prueba de WhatsApp Parser</Text>
                <Text style={styles.menuDescription}>
                  Probar el análisis de mensajes de WhatsApp
                </Text>
              </View>
              <IconSymbol
                name="chevron.right"
                size={20}
                color={colors.textSecondary}
                style={styles.menuChevron}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acerca de</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={() => handleNavigation('/settings/about')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#6B7280' }]}>
                <IconSymbol name="info.circle.fill" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Acerca de</Text>
                <Text style={styles.menuDescription}>
                  Información de la aplicación
                </Text>
              </View>
              <IconSymbol
                name="chevron.right"
                size={20}
                color={colors.textSecondary}
                style={styles.menuChevron}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
