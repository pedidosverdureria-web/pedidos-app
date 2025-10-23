
import React, { useEffect } from 'react';
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

export default function UserManagementScreen() {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role !== 'admin') {
      Alert.alert('Acceso Denegado', 'Solo los administradores pueden acceder a esta pantalla');
      router.back();
    }
  }, [user?.role]);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Gestión de Usuarios',
          headerBackTitle: 'Atrás',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <IconSymbol name="info.circle.fill" size={48} color={colors.info} />
          <Text style={styles.infoTitle}>Sistema de Autenticación Simplificado</Text>
          <Text style={styles.infoText}>
            La aplicación ahora utiliza un sistema de autenticación basado en PIN para facilitar el acceso.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="person.badge.shield.checkmark.fill" size={32} color={colors.success} />
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Administrador</Text>
              <Text style={styles.cardSubtitle}>Acceso completo al sistema</Text>
            </View>
          </View>
          <View style={styles.pinContainer}>
            <Text style={styles.pinLabel}>PIN de Acceso:</Text>
            <View style={styles.pinBadge}>
              <Text style={styles.pinText}>5050</Text>
            </View>
          </View>
          <View style={styles.permissionsList}>
            <View style={styles.permissionItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
              <Text style={styles.permissionText}>Gestión completa de pedidos</Text>
            </View>
            <View style={styles.permissionItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
              <Text style={styles.permissionText}>Configuración de WhatsApp</Text>
            </View>
            <View style={styles.permissionItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
              <Text style={styles.permissionText}>Configuración de impresora</Text>
            </View>
            <View style={styles.permissionItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
              <Text style={styles.permissionText}>Acceso a estadísticas</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="person.fill" size={32} color={colors.info} />
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Trabajador</Text>
              <Text style={styles.cardSubtitle}>Gestión de pedidos</Text>
            </View>
          </View>
          <View style={styles.pinContainer}>
            <Text style={styles.pinLabel}>PIN de Acceso:</Text>
            <View style={styles.pinBadge}>
              <Text style={styles.pinText}>5030</Text>
            </View>
          </View>
          <View style={styles.permissionsList}>
            <View style={styles.permissionItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
              <Text style={styles.permissionText}>Ver y gestionar pedidos</Text>
            </View>
            <View style={styles.permissionItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
              <Text style={styles.permissionText}>Crear nuevos pedidos</Text>
            </View>
            <View style={styles.permissionItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
              <Text style={styles.permissionText}>Imprimir tickets</Text>
            </View>
            <View style={styles.permissionItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
              <Text style={styles.permissionText}>Actualizar estados</Text>
            </View>
          </View>
        </View>

        <View style={styles.noteCard}>
          <IconSymbol name="lock.shield.fill" size={24} color={colors.textSecondary} />
          <Text style={styles.noteText}>
            Esta es una aplicación de uso privado. Los PINs proporcionan acceso rápido sin necesidad de gestión de usuarios en base de datos.
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
  infoCard: {
    backgroundColor: colors.card,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  pinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  pinLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  pinBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  pinText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  permissionsList: {
    gap: 12,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  permissionText: {
    fontSize: 15,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  noteCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  noteText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
