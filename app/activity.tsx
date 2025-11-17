
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { getSupabase } from '@/lib/supabase';
import { Order } from '@/types';

interface ActivityItem {
  id: string;
  type: 'order_created' | 'order_updated' | 'status_changed';
  order: Order;
  timestamp: string;
  description: string;
}

export default function ActivityLogScreen() {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    loadActivity();
  }, []);

  const loadActivity = async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const activityItems: ActivityItem[] = (data || []).map((order) => ({
        id: order.id,
        type: 'order_updated',
        order,
        timestamp: order.updated_at,
        description: `Pedido #${order.order_number} - ${order.customer_name}`,
      }));

      setActivities(activityItems);
    } catch (error) {
      console.error('Error loading activity:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadActivity();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order_created':
        return 'plus.circle.fill';
      case 'order_updated':
        return 'pencil.circle.fill';
      case 'status_changed':
        return 'arrow.triangle.2.circlepath';
      default:
        return 'circle.fill';
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'preparing':
        return colors.info;
      case 'ready':
        return colors.success;
      case 'delivered':
        return colors.textSecondary;
      case 'cancelled':
        return colors.error;
      default:
        return colors.primary;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
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
      marginBottom: 24,
    },
    infoText: {
      flex: 1,
      marginLeft: 12,
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    timeline: {
      paddingLeft: 8,
    },
    timelineItem: {
      flexDirection: 'row',
      marginBottom: 16,
    },
    timelineLeft: {
      alignItems: 'center',
      marginRight: 16,
    },
    timelineDot: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },
    timelineLine: {
      width: 2,
      flex: 1,
      backgroundColor: colors.border,
      marginTop: 4,
    },
    timelineContent: {
      flex: 1,
      paddingBottom: 8,
    },
    activityCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    activityHeader: {
      marginBottom: 12,
    },
    activityTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    activityTime: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    activityDetails: {
      gap: 8,
    },
    activityDetail: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    activityDetailText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 8,
    },
    emptyCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 48,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen
          options={{
            title: 'Activity Log',
            headerBackTitle: 'Back',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#fff',
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
          title: 'Activity Log',
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.infoCard}>
          <IconSymbol ios_icon_name="info.circle.fill" android_material_icon_name="info" size={24} color={colors.info} />
          <Text style={styles.infoText}>
            Historial de actividad de los últimos 50 pedidos actualizados
          </Text>
        </View>

        {activities.length > 0 ? (
          <View style={styles.timeline}>
            {activities.map((activity, index) => (
              <View key={activity.id} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View
                    style={[
                      styles.timelineDot,
                      { backgroundColor: getActivityColor(activity.order.status) },
                    ]}
                  >
                    <IconSymbol
                      ios_icon_name={getActivityIcon(activity.type) as any}
                      android_material_icon_name={getActivityIcon(activity.type) as any}
                      size={16}
                      color="#FFFFFF"
                    />
                  </View>
                  {index < activities.length - 1 && <View style={styles.timelineLine} />}
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.activityCard}>
                    <View style={styles.activityHeader}>
                      <Text style={styles.activityTitle}>{activity.description}</Text>
                      <Text style={styles.activityTime}>
                        {formatTimestamp(activity.timestamp)}
                      </Text>
                    </View>
                    <View style={styles.activityDetails}>
                      <View style={styles.activityDetail}>
                        <IconSymbol ios_icon_name="tag.fill" android_material_icon_name="label" size={14} color={colors.textSecondary} />
                        <Text style={styles.activityDetailText}>
                          Estado: {activity.order.status}
                        </Text>
                      </View>
                      <View style={styles.activityDetail}>
                        <IconSymbol
                          ios_icon_name="dollarsign.circle.fill"
                          android_material_icon_name="attach_money"
                          size={14}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.activityDetailText}>
                          Total: ${activity.order.total_amount.toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.activityDetail}>
                        <IconSymbol ios_icon_name="clock.fill" android_material_icon_name="schedule" size={14} color={colors.textSecondary} />
                        <Text style={styles.activityDetailText}>
                          {new Date(activity.order.created_at).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <IconSymbol ios_icon_name="clock.fill" android_material_icon_name="schedule" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No hay actividad reciente</Text>
            <Text style={styles.emptySubtext}>
              La actividad de los pedidos aparecerá aquí
            </Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}
