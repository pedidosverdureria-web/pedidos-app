
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { getSupabase } from '@/lib/supabase';
import { Order, OrderStatus } from '@/types';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    preparing: 0,
    ready: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    todayOrders: 0,
    weekOrders: 0,
    monthOrders: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const ordersData = data || [];
      setOrders(ordersData);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const totalRevenue = ordersData
        .filter((o) => o.status === 'delivered')
        .reduce((sum, o) => sum + o.total_amount, 0);

      const deliveredCount = ordersData.filter((o) => o.status === 'delivered').length;

      setStats({
        total: ordersData.length,
        pending: ordersData.filter((o) => o.status === 'pending').length,
        preparing: ordersData.filter((o) => o.status === 'preparing').length,
        ready: ordersData.filter((o) => o.status === 'ready').length,
        delivered: deliveredCount,
        cancelled: ordersData.filter((o) => o.status === 'cancelled').length,
        totalRevenue,
        averageOrderValue: deliveredCount > 0 ? totalRevenue / deliveredCount : 0,
        todayOrders: ordersData.filter(
          (o) => new Date(o.created_at) >= today
        ).length,
        weekOrders: ordersData.filter(
          (o) => new Date(o.created_at) >= weekAgo
        ).length,
        monthOrders: ordersData.filter(
          (o) => new Date(o.created_at) >= monthAgo
        ).length,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusPercentage = (status: OrderStatus) => {
    if (stats.total === 0) return 0;
    const count = stats[status];
    return (count / stats.total) * 100;
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
    heroCard: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      padding: 32,
      alignItems: 'center',
      marginBottom: 24,
    },
    heroValue: {
      fontSize: 64,
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: 8,
    },
    heroLabel: {
      fontSize: 18,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.9)',
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
    periodGrid: {
      flexDirection: 'row',
      gap: 12,
    },
    periodCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    periodValue: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginTop: 8,
      marginBottom: 4,
    },
    periodLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    revenueItem: {
      paddingVertical: 8,
    },
    revenueLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    revenueTextContainer: {
      marginLeft: 16,
    },
    revenueLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    revenueValue: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 12,
    },
    statusItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    statusLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 12,
    },
    statusLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    statusRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    statusCount: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    statusPercentage: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      minWidth: 40,
      textAlign: 'right',
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.background,
      borderRadius: 4,
      marginBottom: 16,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen
          options={{
            title: 'Order Statistics',
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
          title: 'Order Statistics',
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroValue}>{stats.total}</Text>
          <Text style={styles.heroLabel}>Total de Pedidos</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Período</Text>
          <View style={styles.periodGrid}>
            <View style={styles.periodCard}>
              <IconSymbol ios_icon_name="calendar" android_material_icon_name="calendar_today" size={24} color={colors.primary} />
              <Text style={styles.periodValue}>{stats.todayOrders}</Text>
              <Text style={styles.periodLabel}>Hoy</Text>
            </View>
            <View style={styles.periodCard}>
              <IconSymbol ios_icon_name="calendar" android_material_icon_name="calendar_today" size={24} color={colors.info} />
              <Text style={styles.periodValue}>{stats.weekOrders}</Text>
              <Text style={styles.periodLabel}>Esta Semana</Text>
            </View>
            <View style={styles.periodCard}>
              <IconSymbol ios_icon_name="calendar" android_material_icon_name="calendar_today" size={24} color={colors.accent} />
              <Text style={styles.periodValue}>{stats.monthOrders}</Text>
              <Text style={styles.periodLabel}>Este Mes</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingresos</Text>
          <View style={styles.card}>
            <View style={styles.revenueItem}>
              <View style={styles.revenueLeft}>
                <IconSymbol ios_icon_name="dollarsign.circle.fill" android_material_icon_name="attach_money" size={32} color={colors.success} />
                <View style={styles.revenueTextContainer}>
                  <Text style={styles.revenueLabel}>Ingresos Totales</Text>
                  <Text style={styles.revenueValue}>
                    ${stats.totalRevenue.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.revenueItem}>
              <View style={styles.revenueLeft}>
                <IconSymbol ios_icon_name="chart.bar.fill" android_material_icon_name="bar_chart" size={32} color={colors.primary} />
                <View style={styles.revenueTextContainer}>
                  <Text style={styles.revenueLabel}>Valor Promedio</Text>
                  <Text style={styles.revenueValue}>
                    ${stats.averageOrderValue.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estados de Pedidos</Text>
          <View style={styles.card}>
            <View style={styles.statusItem}>
              <View style={styles.statusLeft}>
                <View style={[styles.statusDot, { backgroundColor: colors.warning }]} />
                <Text style={styles.statusLabel}>Pendiente</Text>
              </View>
              <View style={styles.statusRight}>
                <Text style={styles.statusCount}>{stats.pending}</Text>
                <Text style={styles.statusPercentage}>
                  {getStatusPercentage('pending').toFixed(0)}%
                </Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${getStatusPercentage('pending')}%`,
                    backgroundColor: colors.warning,
                  },
                ]}
              />
            </View>

            <View style={styles.statusItem}>
              <View style={styles.statusLeft}>
                <View style={[styles.statusDot, { backgroundColor: colors.info }]} />
                <Text style={styles.statusLabel}>Preparando</Text>
              </View>
              <View style={styles.statusRight}>
                <Text style={styles.statusCount}>{stats.preparing}</Text>
                <Text style={styles.statusPercentage}>
                  {getStatusPercentage('preparing').toFixed(0)}%
                </Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${getStatusPercentage('preparing')}%`,
                    backgroundColor: colors.info,
                  },
                ]}
              />
            </View>

            <View style={styles.statusItem}>
              <View style={styles.statusLeft}>
                <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                <Text style={styles.statusLabel}>Listo</Text>
              </View>
              <View style={styles.statusRight}>
                <Text style={styles.statusCount}>{stats.ready}</Text>
                <Text style={styles.statusPercentage}>
                  {getStatusPercentage('ready').toFixed(0)}%
                </Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${getStatusPercentage('ready')}%`,
                    backgroundColor: colors.success,
                  },
                ]}
              />
            </View>

            <View style={styles.statusItem}>
              <View style={styles.statusLeft}>
                <View style={[styles.statusDot, { backgroundColor: colors.textSecondary }]} />
                <Text style={styles.statusLabel}>Entregado</Text>
              </View>
              <View style={styles.statusRight}>
                <Text style={styles.statusCount}>{stats.delivered}</Text>
                <Text style={styles.statusPercentage}>
                  {getStatusPercentage('delivered').toFixed(0)}%
                </Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${getStatusPercentage('delivered')}%`,
                    backgroundColor: colors.textSecondary,
                  },
                ]}
              />
            </View>

            <View style={styles.statusItem}>
              <View style={styles.statusLeft}>
                <View style={[styles.statusDot, { backgroundColor: colors.error }]} />
                <Text style={styles.statusLabel}>Cancelado</Text>
              </View>
              <View style={styles.statusRight}>
                <Text style={styles.statusCount}>{stats.cancelled}</Text>
                <Text style={styles.statusPercentage}>
                  {getStatusPercentage('cancelled').toFixed(0)}%
                </Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${getStatusPercentage('cancelled')}%`,
                    backgroundColor: colors.error,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
