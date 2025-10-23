
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const { user } = useAuth();

  const profileSections = [
    {
      title: 'Quick Actions',
      items: [
        {
          icon: 'plus.circle.fill',
          label: 'Crear Pedido Manual',
          route: '/order/new',
          color: colors.success,
          description: 'Crear un nuevo pedido manualmente',
        },
        {
          icon: 'gear',
          label: 'Settings',
          route: '/settings',
          color: colors.primary,
          description: 'Configuración de la aplicación',
        },
        {
          icon: 'bell.fill',
          label: 'Notifications',
          route: '/settings/notifications',
          color: colors.warning,
          description: 'Gestionar notificaciones',
        },
      ],
    },
    {
      title: 'Statistics',
      items: [
        {
          icon: 'chart.bar.fill',
          label: 'Order Statistics',
          route: '/stats',
          color: colors.info,
          description: 'Ver estadísticas de pedidos',
        },
        {
          icon: 'clock.fill',
          label: 'Activity Log',
          route: '/activity',
          color: colors.accent,
          description: 'Historial de actividad',
        },
      ],
    },
  ];

  const renderHeaderRight = () => (
    <TouchableOpacity
      onPress={() => router.push('/settings')}
      style={styles.headerButton}
    >
      <IconSymbol name="gear" color={colors.primary} size={24} />
    </TouchableOpacity>
  );

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: 'Profile',
            headerRight: renderHeaderRight,
          }}
        />
      )}
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {user && (
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <IconSymbol name="person.fill" size={48} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.name}>{user.full_name || 'User'}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
            </View>
          </View>
        )}

        {/* Featured Action - Create Manual Order */}
        <TouchableOpacity
          style={styles.featuredAction}
          onPress={() => router.push('/order/new')}
        >
          <View style={styles.featuredIconContainer}>
            <IconSymbol name="plus.circle.fill" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.featuredContent}>
            <Text style={styles.featuredTitle}>Crear Pedido Manual</Text>
            <Text style={styles.featuredDescription}>
              Crea un nuevo pedido ingresando los datos del cliente y productos
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {profileSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.actionItem,
                    itemIndex < section.items.length - 1 && styles.actionItemBorder,
                  ]}
                  onPress={() => router.push(item.route as any)}
                >
                  <View style={styles.actionLeft}>
                    <View style={[styles.actionIcon, { backgroundColor: item.color }]}>
                      <IconSymbol name={item.icon as any} size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.actionTextContainer}>
                      <Text style={styles.actionLabel}>{item.label}</Text>
                      {item.description && (
                        <Text style={styles.actionDescription}>{item.description}</Text>
                      )}
                    </View>
                  </View>
                  <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.infoCard}>
          <IconSymbol name="info.circle.fill" size={24} color={colors.info} />
          <Text style={styles.infoText}>
            Gestiona tu perfil, crea pedidos manuales, visualiza estadísticas y configura la aplicación desde aquí.
          </Text>
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
    paddingBottom: 100,
  },
  headerButton: {
    padding: 8,
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  featuredAction: {
    backgroundColor: colors.success,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  featuredIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featuredContent: {
    flex: 1,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featuredDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
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
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  actionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
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
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
});
