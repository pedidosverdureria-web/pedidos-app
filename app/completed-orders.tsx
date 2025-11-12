
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { getSupabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/IconSymbol';
import { Order, OrderStatus } from '@/types';
import { getStatusColor, getStatusLabel, formatCLP, formatDate } from '@/utils/orderHelpers';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import * as Haptics from 'expo-haptics';

export default function CompletedOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { currentTheme } = useTheme();
  const { colors } = useThemedStyles();

  // Create dynamic styles based on theme
  const styles = useMemo(() => createStyles(colors), [colors]);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      
      // Fetch orders with "delivered", "paid", or "finalizado" status
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .in('status', ['delivered', 'paid', 'finalizado'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error('[CompletedOrders] Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, [loadOrders]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const paidCount = orders.filter(o => o.status === 'paid').length;
  const finalizadoCount = orders.filter(o => o.status === 'finalizado').length;
  const totalAmount = orders.reduce((sum, order) => {
    const orderTotal = order.items?.reduce((itemSum, item) => itemSum + item.unit_price, 0) || 0;
    return sum + orderTotal;
  }, 0);

  const renderOrderCard = ({ item }: { item: Order }) => {
    const total = item.items?.reduce((sum, orderItem) => sum + orderItem.unit_price, 0) || 0;
    const statusColor = getStatusColor(item.status, currentTheme);

    return (
      <TouchableOpacity
        style={[styles.orderCard, { borderLeftColor: statusColor }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/order/${item.id}`);
        }}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>{item.order_number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>
        <Text style={styles.customerName}>{item.customer_name}</Text>
        {item.customer_phone && (
          <Text style={styles.orderInfo}>📞 {item.customer_phone}</Text>
        )}
        {item.items && item.items.length > 0 && (
          <Text style={styles.orderInfo}>
            {item.items.length} {item.items.length === 1 ? 'producto' : 'productos'}
          </Text>
        )}
        <Text style={styles.orderDate}>📅 {formatDate(item.created_at)}</Text>
        {total > 0 && <Text style={styles.orderTotal}>{formatCLP(total)}</Text>}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Pedidos Completados',
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
        }}
      />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pedidos Completados</Text>
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={20} color="#fff" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar pedidos..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {orders.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{deliveredCount}</Text>
            <Text style={styles.statLabel}>Entregados</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{paidCount}</Text>
            <Text style={styles.statLabel}>Pagados</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{finalizadoCount}</Text>
            <Text style={styles.statLabel}>Finalizados</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCLP(totalAmount)}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      )}

      {filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="checkmark.circle" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>
            {searchQuery
              ? 'No se encontraron pedidos completados'
              : 'No hay pedidos completados aún'}
          </Text>
        </View>
      ) : (
        <FlatList
          style={styles.content}
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderCard}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 16,
      paddingTop: 60,
      backgroundColor: colors.primary,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: 16,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 8,
      paddingHorizontal: 12,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      height: 40,
      color: '#fff',
      fontSize: 16,
    },
    content: {
      flex: 1,
    },
    orderCard: {
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginVertical: 8,
      padding: 16,
      borderRadius: 12,
      borderLeftWidth: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    orderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    orderNumber: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    customerName: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 4,
    },
    orderInfo: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    orderDate: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
      fontStyle: 'italic',
    },
    orderTotal: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.primary,
      marginTop: 8,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyText: {
      fontSize: 18,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      padding: 16,
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 8,
      borderRadius: 12,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
  });
}
