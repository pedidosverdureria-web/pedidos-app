
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function AboutScreen() {
  const appInfo = {
    name: 'Order Management',
    version: '1.0.0',
    buildNumber: '1',
    description:
      'Aplicación profesional para gestión de pedidos con integración de WhatsApp, impresión térmica por Bluetooth, y backend completo en Supabase.',
  };

  const features = [
    {
      icon: 'message.fill',
      title: 'Integración WhatsApp',
      description: 'Recibe pedidos automáticamente desde WhatsApp Business API',
    },
    {
      icon: 'printer.fill',
      title: 'Impresión Térmica',
      description: 'Imprime tickets de pedidos en impresoras Bluetooth',
    },
    {
      icon: 'person.2.fill',
      title: 'Gestión de Usuarios',
      description: 'Control de roles y permisos para administradores y trabajadores',
    },
    {
      icon: 'cart.fill',
      title: 'Gestión de Pedidos',
      description: 'Crea, edita y gestiona pedidos de forma eficiente',
    },
    {
      icon: 'bell.fill',
      title: 'Notificaciones',
      description: 'Recibe alertas en tiempo real de nuevos pedidos',
    },
    {
      icon: 'chart.bar.fill',
      title: 'Estadísticas',
      description: 'Visualiza métricas y estadísticas de tus pedidos',
    },
  ];

  const links = [
    {
      icon: 'globe',
      label: 'Sitio Web',
      url: 'https://natively.dev',
    },
    {
      icon: 'envelope.fill',
      label: 'Soporte',
      url: 'mailto:support@natively.dev',
    },
    {
      icon: 'doc.text.fill',
      label: 'Documentación',
      url: 'https://docs.natively.dev',
    },
  ];

  const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error('Error opening URL:', err)
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'About',
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <IconSymbol name="cart.fill" size={64} color="#FFFFFF" />
          </View>
          <Text style={styles.appName}>{appInfo.name}</Text>
          <Text style={styles.version}>
            Version {appInfo.version} ({appInfo.buildNumber})
          </Text>
        </View>

        <View style={styles.descriptionCard}>
          <Text style={styles.description}>{appInfo.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Características</Text>
          <View style={styles.card}>
            {features.map((feature, index) => (
              <View
                key={index}
                style={[
                  styles.featureItem,
                  index < features.length - 1 && styles.featureItemBorder,
                ]}
              >
                <View style={[styles.featureIcon, { backgroundColor: colors.primary }]}>
                  <IconSymbol name={feature.icon as any} size={20} color="#FFFFFF" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enlaces</Text>
          <View style={styles.card}>
            {links.map((link, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.linkItem,
                  index < links.length - 1 && styles.linkItemBorder,
                ]}
                onPress={() => handleLinkPress(link.url)}
              >
                <View style={styles.linkLeft}>
                  <IconSymbol name={link.icon as any} size={20} color={colors.primary} />
                  <Text style={styles.linkLabel}>{link.label}</Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tecnologías</Text>
          <View style={styles.card}>
            <View style={styles.techItem}>
              <Text style={styles.techLabel}>Frontend</Text>
              <Text style={styles.techValue}>React Native + Expo</Text>
            </View>
            <View style={styles.techItem}>
              <Text style={styles.techLabel}>Backend</Text>
              <Text style={styles.techValue}>Supabase</Text>
            </View>
            <View style={styles.techItem}>
              <Text style={styles.techLabel}>Database</Text>
              <Text style={styles.techValue}>PostgreSQL</Text>
            </View>
            <View style={styles.techItem}>
              <Text style={styles.techLabel}>Authentication</Text>
              <Text style={styles.techValue}>Supabase Auth</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Made with ❤️ by Natively
          </Text>
          <Text style={styles.copyright}>
            © 2024 Natively. All rights reserved.
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
    paddingBottom: 32,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  version: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  descriptionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  description: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    textAlign: 'center',
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
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  featureItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  linkItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  linkLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 12,
  },
  techItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  techLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  techValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  copyright: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
