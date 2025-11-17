
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';

export default function AboutScreen() {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url).catch((err) =>
      console.error('Error opening URL:', err)
    );
  };

  const handleManualPress = (path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as any);
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
    logoContainer: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    logo: {
      width: 120,
      height: 120,
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
    guideSection: {
      marginBottom: 8,
    },
    guideHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    guideIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    guideTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
    },
    guideContent: {
      paddingLeft: 52,
    },
    guideStep: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 24,
      marginBottom: 8,
    },
    guideNote: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginTop: 8,
      fontStyle: 'italic',
      backgroundColor: colors.background,
      padding: 12,
      borderRadius: 8,
    },
    guideDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 20,
    },
    statusItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    statusDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 12,
    },
    statusText: {
      fontSize: 15,
      color: colors.text,
      flex: 1,
    },
    manualItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    manualItemLast: {
      borderBottomWidth: 0,
    },
    manualIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    manualContent: {
      flex: 1,
    },
    manualTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    manualDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 18,
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

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Acerca de',
          headerBackTitle: 'Atrás',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/64897504-f76f-4cb3-a1f3-a82b594f1121.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>{appInfo.name}</Text>
          <Text style={styles.version}>
            Version {appInfo.version} ({appInfo.buildNumber})
          </Text>
        </View>

        <View style={styles.descriptionCard}>
          <Text style={styles.description}>{appInfo.description}</Text>
        </View>

        {/* Quick Start Guide for New Customers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guía Rápida para Nuevos Clientes</Text>
          <View style={styles.card}>
            <View style={styles.guideSection}>
              <View style={styles.guideHeader}>
                <View style={[styles.guideIcon, { backgroundColor: '#3B82F6' }]}>
                  <IconSymbol name="cart.fill.badge.plus" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.guideTitle}>1. Cómo Hacer un Pedido</Text>
              </View>
              <View style={styles.guideContent}>
                <Text style={styles.guideStep}>• Envía tu pedido por WhatsApp al número configurado</Text>
                <Text style={styles.guideStep}>• Escribe solo la lista de productos con cantidades</Text>
                <Text style={styles.guideStep}>• Ejemplo: &quot;2 kg tomate, 1/2 kg cebolla, 3 lechugas&quot;</Text>
                <Text style={styles.guideStep}>• Recibirás una confirmación automática con el número de pedido</Text>
                <Text style={styles.guideNote}>
                  💡 Tip: No incluyas saludos ni texto adicional, solo la lista de productos
                </Text>
              </View>
            </View>

            <View style={styles.guideDivider} />

            <View style={styles.guideSection}>
              <View style={styles.guideHeader}>
                <View style={[styles.guideIcon, { backgroundColor: '#10B981' }]}>
                  <IconSymbol name="questionmark.circle.fill" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.guideTitle}>2. Cómo Hacer Consultas</Text>
              </View>
              <View style={styles.guideContent}>
                <Text style={styles.guideStep}>• Envía tu pregunta por WhatsApp mencionando tu número de pedido</Text>
                <Text style={styles.guideStep}>• Ejemplo: &quot;¿Cuándo estará listo mi pedido #1234?&quot;</Text>
                <Text style={styles.guideStep}>• El sistema registrará tu consulta automáticamente</Text>
                <Text style={styles.guideStep}>• Recibirás una respuesta del equipo lo antes posible</Text>
                <Text style={styles.guideNote}>
                  💡 Tip: Incluye siempre tu número de pedido para una respuesta más rápida
                </Text>
              </View>
            </View>

            <View style={styles.guideDivider} />

            <View style={styles.guideSection}>
              <View style={styles.guideHeader}>
                <View style={[styles.guideIcon, { backgroundColor: '#F59E0B' }]}>
                  <IconSymbol name="arrow.triangle.2.circlepath" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.guideTitle}>3. Pedidos Adicionales</Text>
              </View>
              <View style={styles.guideContent}>
                <Text style={styles.guideStep}>• Puedes enviar un nuevo pedido aunque tengas uno activo</Text>
                <Text style={styles.guideStep}>• Cada pedido recibirá su propio número de seguimiento</Text>
                <Text style={styles.guideStep}>• Los pedidos se procesarán en orden de llegada</Text>
                <Text style={styles.guideStep}>• Recibirás notificaciones del estado de cada pedido</Text>
                <Text style={styles.guideNote}>
                  💡 Tip: Puedes consultar el estado de cualquier pedido en cualquier momento
                </Text>
              </View>
            </View>

            <View style={styles.guideDivider} />

            <View style={styles.guideSection}>
              <View style={styles.guideHeader}>
                <View style={[styles.guideIcon, { backgroundColor: '#8B5CF6' }]}>
                  <IconSymbol name="info.circle.fill" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.guideTitle}>Estados del Pedido</Text>
              </View>
              <View style={styles.guideContent}>
                <View style={styles.statusItem}>
                  <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.statusText}>Pendiente - Tu pedido fue recibido</Text>
                </View>
                <View style={styles.statusItem}>
                  <View style={[styles.statusDot, { backgroundColor: '#3B82F6' }]} />
                  <Text style={styles.statusText}>Preparando - Estamos preparando tu pedido</Text>
                </View>
                <View style={styles.statusItem}>
                  <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.statusText}>Listo - Tu pedido está listo para recoger</Text>
                </View>
                <View style={styles.statusItem}>
                  <View style={[styles.statusDot, { backgroundColor: '#6B7280' }]} />
                  <Text style={styles.statusText}>Entregado - Pedido completado</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Manuals Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manuales</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.manualItem}
              onPress={() => handleManualPress('/settings/user-manual')}
            >
              <View style={[styles.manualIcon, { backgroundColor: '#3B82F6' }]}>
                <IconSymbol name="book.fill" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.manualContent}>
                <Text style={styles.manualTitle}>Manual de Usuario</Text>
                <Text style={styles.manualDescription}>
                  Guía completa para usar todas las funciones de la aplicación
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.manualItem, styles.manualItemLast]}
              onPress={() => handleManualPress('/settings/technical-manual')}
            >
              <View style={[styles.manualIcon, { backgroundColor: '#8B5CF6' }]}>
                <IconSymbol name="wrench.and.screwdriver.fill" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.manualContent}>
                <Text style={styles.manualTitle}>Manual Técnico</Text>
                <Text style={styles.manualDescription}>
                  Configuración avanzada y administración del sistema
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
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
