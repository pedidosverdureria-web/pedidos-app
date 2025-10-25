
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  const settingsSections = [
    {
      title: 'Configuración',
      items: [
        {
          icon: 'message.fill',
          label: 'Integración WhatsApp',
          route: '/settings/whatsapp',
          color: colors.success,
        },
        {
          icon: 'printer.fill',
          label: 'Configuración de Impresora',
          route: '/settings/printer',
          color: colors.primary,
        },
      ],
    },
    {
      title: 'Cuenta',
      items: [
        ...(user?.role === 'admin'
          ? [
              {
                icon: 'person.2.fill',
                label: 'Gestión de Usuarios',
                route: '/settings/users',
                color: colors.secondary,
              },
            ]
          : []),
      ],
    },
    {
      title: 'Aplicación',
      items: [
        {
          icon: 'bell.fill',
          label: 'Notificaciones',
          route: '/settings/notifications',
          color: colors.warning,
        },
        {
          icon: 'info.circle.fill',
          label: 'Acerca de',
          route: '/settings/about',
          color: colors.info,
        },
      ],
    },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Configuración',
          headerBackTitle: 'Atrás',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {user && (
          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <IconSymbol name="person.fill" size={40} color="#FFFFFF" />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.full_name || user.email}</Text>
              <Text style={styles.userRole}>
                {user.role === 'admin' ? 'ADMINISTRADOR' : 'TRABAJADOR'}
              </Text>
            </View>
          </View>
        )}

        {settingsSections.map((section, sectionIndex) => (
          section.items.length > 0 && (
            <View key={sectionIndex} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionCard}>
                {section.items.map((item, itemIndex) => (
                  <TouchableOpacity
                    key={itemIndex}
                    style={[
                      styles.settingItem,
                      itemIndex < section.items.length - 1 && styles.settingItemBorder,
                    ]}
                    onPress={() => router.push(item.route as any)}
                  >
                    <View style={styles.settingLeft}>
                      <View style={[styles.settingIcon, { backgroundColor: item.color }]}>
                        <IconSymbol name={item.icon as any} size={20} color="#FFFFFF" />
                      </View>
                      <Text style={styles.settingLabel}>{item.label}</Text>
                    </View>
                    <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )
        ))}

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <IconSymbol name="arrow.right.square.fill" size={20} color={colors.error} />
          <Text style={styles.signOutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Versión 1.0.0</Text>
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
  userCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
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
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.error,
    marginTop: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginLeft: 8,
  },
  version: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
  },
});
