
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { getSupabase } from '@/lib/supabase';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { Order, OrderStatus } from '@/types';
import * as Haptics from 'expo-haptics';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: colors.primary,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  messageIndicator: {
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  messageCount: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  orderStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  orderInfo: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  orderSourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 2,
  },
  orderSourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  orderSourceWhatsApp: {
    backgroundColor: '#25D366',
  },
  orderSourceManual: {
    backgroundColor: '#6B7280',
  },
  orderSourceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  },
  summaryCard: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  summaryTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
});

function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return '#F59E0B';
    case 'preparing':
      return '#3B82F6';
    case 'ready':
      return '#10B981';
    case 'delivered':
      return '#6B7280';
    case 'cancelled':
      return '#EF4444';
    case 'pending_payment':
      return '#8B5CF6';
    case 'paid':
      return '#059669';
    default:
      return '#6B7280';
  }
}

function getStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'preparing':
      return 'Preparando';
    case 'ready':
      return 'Listo';
    case 'delivered':
      return 'Entregado';
    case 'cancelled':
      return 'Cancelado';
    case 'pending_payment':
      return 'Pend. Pago';
    case 'paid':
      return 'Pagado';
    default:
      return status;
  }
}

function getFilterLabel(filter: string): string {
  switch (filter) {
    case 'all':
      return 'Todos los Pedidos';
    case 'pending':
      return 'Pedidos Pendientes';
    case 'delivered':
      return 'Pedidos Entregados';
    case 'cancelled':
      return 'Pedidos Cancelados';
    case 'paid':
      return 'Pedidos Pagados';
    default:
      return 'Pedidos';
  }
}

function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CustomerOrdersScreen() {
  const params = useLocalSearchParams();
  const customerId = params.customerId as string;
  const statusFilter = params.status as string || 'all';
  const customerName = params.customerName as string || 'Cliente';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();

      let query = supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            id,
            product_name,
            quantity,
            unit_price,
            notes
          ),
          queries:order_queries(
            id,
            query_text,
            direction,
            created_at
          )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (statusFilter === 'pending') {
        query = query.in('status', ['pending', 'preparing']);
      } else if (statusFilter === 'delivered') {
        query = query.in('status', ['delivered', 'paid']);
      } else if (statusFilter === 'cancelled') {
        query = query.eq('status', 'cancelled');
      } else if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log('[CustomerOrdersScreen] Loaded orders:', data?.length);
      setOrders(data || []);
    } catch (error) {
      console.error('[CustomerOrdersScreen] Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  }, [customerId, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, [loadOrders]);

  const handleOrderPress = (orderId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/order/${orderId}`);
  };

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const renderOrderCard = ({ item }: { item: Order }) => {
    const hasMessages = item.queries && item.queries.length > 0;
    const messageCount = item.queries?.length || 0;

    return (
      <TouchableOpacity
        style={[styles.orderCard, { borderLeftColor: getStatusColor(item.status) }]}
        onPress={() => handleOrderPress(item.id)}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <Text style={styles.orderNumber}>{item.order_number}</Text>
            {hasMessages && (
              <View style={styles.messageIndicator}>
                <IconSymbol name="message.fill" size={12} color="#fff" />
                <Text style={styles.messageCount}>{messageCount}</Text>
              </View>
            )}
          </View>
          <View style={[styles.orderStatusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.orderStatusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>

        {item.items && item.items.length > 0 && (
          <Text style={styles.orderInfo}>
            {item.items.length} {item.items.length === 1 ? 'producto' : 'productos'}
          </Text>
        )}

        <View style={styles.orderSourceRow}>
          <View style={[
            styles.orderSourceBadge,
            item.source === 'whatsapp' ? styles.orderSourceWhatsApp : styles.orderSourceManual
          ]}>
            <IconSymbol 
              name={item.source === 'whatsapp' ? 'message.fill' : 'pencil'} 
              size={12} 
              color="#fff" 
            />
            <Text style={styles.orderSourceText}>
              {item.source === 'whatsapp' ? 'WhatsApp' : 'Manual'}
            </Text>
          </View>
        </View>

        <Text style={styles.orderDate}>📅 {formatDate(item.created_at)}</Text>
        <Text style={styles.orderTotal}>{formatCLP(item.total_amount)}</Text>
      </TouchableOpacity>
    );
  };

  // Calculate summary statistics
  const totalAmount = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const totalPaid = orders.reduce((sum, order) => sum + order.paid_amount, 0);
  const totalDebt = totalAmount - totalPaid;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <IconSymbol name="chevron.left" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{customerName}</Text>
            <Text style={styles.headerSubtitle}>{getFilterLabel(statusFilter)}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{orders.length}</Text>
          </View>
        </View>
      </View>

      {orders.length > 0 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Pedidos:</Text>
            <Text style={styles.summaryValue}>{orders.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Monto Total:</Text>
            <Text style={styles.summaryTotal}>{formatCLP(totalAmount)}</Text>
          </View>
          {statusFilter === 'all' && (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Pagado:</Text>
                <Text style={styles.summaryValue}>{formatCLP(totalPaid)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Deuda Pendiente:</Text>
                <Text style={[styles.summaryValue, { color: totalDebt > 0 ? '#EF4444' : '#10B981' }]}>
                  {formatCLP(totalDebt)}
                </Text>
              </View>
            </>
          )}
        </View>
      )}

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="tray" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>
            No hay pedidos {statusFilter !== 'all' ? getFilterLabel(statusFilter).toLowerCase() : ''}
          </Text>
        </View>
      ) : (
        <FlatList
          style={styles.content}
          data={orders}
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
