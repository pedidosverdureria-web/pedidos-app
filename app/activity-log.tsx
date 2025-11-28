
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { getSupabase } from '@/lib/supabase';

interface ActivityLog {
  id: string;
  user_id: string;
  user_email: string;
  action_type: 'create' | 'update' | 'delete' | 'status_change' | 'payment';
  entity_type: 'order' | 'customer' | 'product' | 'user' | 'payment';
  entity_id: string;
  entity_name?: string;
  description: string;
  metadata?: any;
  created_at: string;
}

export default function ActivityLogScreen() {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filter, setFilter] = useState<'all' | 'order' | 'customer' | 'product'>('all');

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('entity_type', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading activity logs:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return { ios: 'plus.circle.fill', android: 'add_circle', color: colors.success };
      case 'update':
        return { ios: 'pencil.circle.fill', android: 'edit', color: colors.info };
      case 'delete':
        return { ios: 'trash.circle.fill', android: 'delete', color: colors.error };
      case 'status_change':
        return { ios: 'arrow.triangle.2.circlepath', android: 'sync', color: colors.warning };
      case 'payment':
        return { ios: 'dollarsign.circle.fill', android: 'attach_money', color: colors.primary };
      default:
        return { ios: 'circle.fill', android: 'circle', color: colors.textSecondary };
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'order':
        return { ios: 'bag.fill', android: 'shopping_bag' };
      case 'customer':
        return { ios: 'person.fill', android: 'person' };
      case 'product':
        return { ios: 'cube.box.fill', android: 'inventory_2' };
      case 'user':
        return { ios: 'person.2.fill', android: 'people' };
      case 'payment':
        return { ios: 'dollarsign.circle.fill', android: 'attach_money' };
      default:
        return { ios: 'circle.fill', android: 'circle' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderLog = ({ item }: { item: ActivityLog }) => {
    const actionIcon = getActionIcon(item.action_type);
    const entityIcon = getEntityIcon(item.entity_type);

    return (
      <View style={[styles.logCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.logHeader}>
          <View style={[styles.actionIcon, { backgroundColor: actionIcon.color + '20' }]}>
            <IconSymbol 
              ios_icon_name={actionIcon.ios} 
              android_material_icon_name={actionIcon.android} 
              size={24} 
              color={actionIcon.color} 
            />
          </View>
          <View style={styles.logInfo}>
            <View style={styles.logTitleRow}>
              <IconSymbol 
                ios_icon_name={entityIcon.ios} 
                android_material_icon_name={entityIcon.android} 
                size={16} 
                color={colors.textSecondary} 
              />
              <Text style={[styles.logTitle, { color: colors.text }]}>
                {item.entity_name || item.entity_type}
              </Text>
            </View>
            <Text style={[styles.logDescription, { color: colors.textSecondary }]}>
              {item.description}
            </Text>
            <View style={styles.logFooter}>
              <Text style={[styles.logUser, { color: colors.textSecondary }]}>
                {item.user_email}
              </Text>
              <Text style={[styles.logTime, { color: colors.textSecondary }]}>
                {formatDate(item.created_at)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    filterContainer: {
      flexDirection: 'row',
      padding: 16,
      gap: 8,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    filterButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
    },
    filterButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    listContent: {
      padding: 16,
      paddingBottom: 100,
    },
    logCard: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
    },
    logHeader: {
      flexDirection: 'row',
      gap: 12,
    },
    actionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logInfo: {
      flex: 1,
    },
    logTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
    },
    logTitle: {
      fontSize: 16,
      fontWeight: '700',
    },
    logDescription: {
      fontSize: 14,
      marginBottom: 8,
    },
    logFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    logUser: {
      fontSize: 12,
    },
    logTime: {
      fontSize: 12,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 16,
    },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen
          options={{
            title: 'Registro de Actividad',
            headerShown: true,
            headerBackVisible: true,
            headerBackTitle: 'Atrás',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#FFFFFF',
          }}
        />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Registro de Actividad',
          headerShown: true,
          headerBackVisible: true,
          headerBackTitle: 'Atrás',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
        }}
      />
      <View style={styles.container}>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor: filter === 'all' ? colors.primary : 'transparent',
                borderColor: filter === 'all' ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setFilter('all')}
          >
            <Text
              style={[
                styles.filterButtonText,
                { color: filter === 'all' ? '#fff' : colors.textSecondary },
              ]}
            >
              Todos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor: filter === 'order' ? colors.primary : 'transparent',
                borderColor: filter === 'order' ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setFilter('order')}
          >
            <Text
              style={[
                styles.filterButtonText,
                { color: filter === 'order' ? '#fff' : colors.textSecondary },
              ]}
            >
              Pedidos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor: filter === 'customer' ? colors.primary : 'transparent',
                borderColor: filter === 'customer' ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setFilter('customer')}
          >
            <Text
              style={[
                styles.filterButtonText,
                { color: filter === 'customer' ? '#fff' : colors.textSecondary },
              ]}
            >
              Clientes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor: filter === 'product' ? colors.primary : 'transparent',
                borderColor: filter === 'product' ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setFilter('product')}
          >
            <Text
              style={[
                styles.filterButtonText,
                { color: filter === 'product' ? '#fff' : colors.textSecondary },
              ]}
            >
              Productos
            </Text>
          </TouchableOpacity>
        </View>

        {logs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol 
              ios_icon_name="clock.arrow.circlepath" 
              android_material_icon_name="history" 
              size={64} 
              color={colors.textSecondary} 
            />
            <Text style={styles.emptyText}>No hay actividad registrada</Text>
          </View>
        ) : (
          <FlatList
            data={logs}
            renderItem={renderLog}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </>
  );
}
