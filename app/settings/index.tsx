
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import * as Haptics from 'expo-haptics';

export default function SettingsScreen() {
  const { user } = useAuth();
  const { currentTheme } = useTheme();
  const isAdmin = user?.role === 'admin';

  const handleNavigation = (path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as any);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.colors.background,
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
      color: currentTheme.colors.textSecondary,
      marginLeft: 4,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    card: {
      backgroundColor: currentTheme.colors.card,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.colors.border,
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
      color: currentTheme.colors.text,
      marginBottom: 2,
    },
    menuDescription: {
      fontSize: 13,
      color: currentTheme.colors.textSecondary,
    },
    menuChevron: {
      marginLeft: 8,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aplicación</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigation('/settings/theme')}
            >
              <View style={[styles.menuIcon, { backgroundColor: currentTheme.colors.primary }]}>
                <IconSymbol ios_icon_name="paintbrush.fill" android_material_icon_name="palette" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Color de la App</Text>
                <Text style={styles.menuDescription}>
                  Personaliza el color principal de la aplicación
                </Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron_right"
                size={20}
                color={currentTheme.colors.textSecondary}
                style={styles.menuChevron}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigation('/settings/permissions')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#3B82F6' }]}>
                <IconSymbol ios_icon_name="lock.shield.fill" android_material_icon_name="security" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Permisos</Text>
                <Text style={styles.menuDescription}>
                  Revisar y gestionar permisos de la app
                </Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron_right"
                size={20}
                color={currentTheme.colors.textSecondary}
                style={styles.menuChevron}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigation('/settings/notifications')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#10B981' }]}>
                <IconSymbol ios_icon_name="bell.badge.fill" android_material_icon_name="notifications" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Notificaciones</Text>
                <Text style={styles.menuDescription}>
                  Configurar alertas y notificaciones
                </Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron_right"
                size={20}
                color={currentTheme.colors.textSecondary}
                style={styles.menuChevron}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={() => handleNavigation('/settings/printer')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#8B5CF6' }]}>
                <IconSymbol ios_icon_name="printer.fill" android_material_icon_name="print" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Impresora</Text>
                <Text style={styles.menuDescription}>
                  Configurar impresora y auto-impresión
                </Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron_right"
                size={20}
                color={currentTheme.colors.textSecondary}
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
              style={styles.menuItem}
              onPress={() => handleNavigation('/settings/whatsapp')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#25D366' }]}>
                <IconSymbol ios_icon_name="message.fill" android_material_icon_name="message" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>WhatsApp</Text>
                <Text style={styles.menuDescription}>
                  Configurar integración con WhatsApp
                </Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron_right"
                size={20}
                color={currentTheme.colors.textSecondary}
                style={styles.menuChevron}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={() => handleNavigation('/settings/units')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#F59E0B' }]}>
                <IconSymbol ios_icon_name="ruler.fill" android_material_icon_name="straighten" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Unidades de Medida</Text>
                <Text style={styles.menuDescription}>
                  Gestionar unidades y sus definiciones
                </Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron_right"
                size={20}
                color={currentTheme.colors.textSecondary}
                style={styles.menuChevron}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Financial Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gestión Financiera</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={() => handleNavigation('/settings/check-control')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#06B6D4' }]}>
                <IconSymbol ios_icon_name="doc.text.fill" android_material_icon_name="receipt_long" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Control de Cheques</Text>
                <Text style={styles.menuDescription}>
                  Gestionar cheques pendientes y pagados
                </Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron_right"
                size={20}
                color={currentTheme.colors.textSecondary}
                style={styles.menuChevron}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Reports */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reportes</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={() => handleNavigation('/settings/pdf-manager')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#EF4444' }]}>
                <IconSymbol ios_icon_name="doc.text.fill" android_material_icon_name="picture_as_pdf" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Gestor de PDF Pedidos</Text>
                <Text style={styles.menuDescription}>
                  Generar reportes PDF de pedidos
                </Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron_right"
                size={20}
                color={currentTheme.colors.textSecondary}
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
                  <IconSymbol ios_icon_name="person.2.fill" android_material_icon_name="people" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>Usuarios</Text>
                  <Text style={styles.menuDescription}>
                    Gestionar usuarios y permisos
                  </Text>
                </View>
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="chevron_right"
                  size={20}
                  color={currentTheme.colors.textSecondary}
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
                <IconSymbol ios_icon_name="printer.fill" android_material_icon_name="print" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Prueba de Impresora</Text>
                <Text style={styles.menuDescription}>
                  Probar impresión con diferentes configuraciones
                </Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron_right"
                size={20}
                color={currentTheme.colors.textSecondary}
                style={styles.menuChevron}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemLast]}
              onPress={() => handleNavigation('/settings/whatsapp-test')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#6B7280' }]}>
                <IconSymbol ios_icon_name="message.fill" android_material_icon_name="message" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Prueba de WhatsApp Parser</Text>
                <Text style={styles.menuDescription}>
                  Probar el análisis de mensajes de WhatsApp
                </Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron_right"
                size={20}
                color={currentTheme.colors.textSecondary}
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
                <IconSymbol ios_icon_name="info.circle.fill" android_material_icon_name="info" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>Acerca de</Text>
                <Text style={styles.menuDescription}>
                  Información de la aplicación
                </Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron_right"
                size={20}
                color={currentTheme.colors.textSecondary}
                style={styles.menuChevron}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}
