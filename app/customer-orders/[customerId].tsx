
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
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { Order, OrderStatus } from '@/types';
import { getStatusColor, getStatusLabel, formatCLP, formatDate } from '@/utils/orderHelpers';
import * as Haptics from 'expo-haptics';

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

export default function CustomerOrdersScreen() {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
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
    const total = item.items?.reduce((sum, orderItem) => sum + orderItem.unit_price, 0) || 0;
    const itemCount = item.items?.length || 0;
    const statusColor = getStatusColor(item.status);
    const hasMessages = item.queries && item.queries.length > 0;

    return (
      <TouchableOpacity
        style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => handleOrderPress(item.id)}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <View style={styles.orderInfo}>
              <View style={styles.orderNumberRow}>
                <Text style={[styles.orderNumber, { color: colors.text }]}>{item.order_number}</Text>
                {/* Source icon - WhatsApp or Manual */}
                <View style={[
                  styles.sourceIconContainer,
                  { backgroundColor: item.source === 'whatsapp' ? '#25D366' : colors.textSecondary }
                ]}>
                  <IconSymbol 
                    ios_icon_name={item.source === 'whatsapp' ? 'message.fill' : 'pencil'}
                    android_material_icon_name={item.source === 'whatsapp' ? 'message' : 'edit'}
                    size={12} 
                    color="#fff" 
                  />
                </View>
                {/* Message indicator */}
                {hasMessages && (
                  <View style={styles.messageIndicator}>
                    <IconSymbol ios_icon_name="message.fill" android_material_icon_name="message" size={12} color="#fff" />
                    <Text style={styles.messageCount}>{item.queries.length}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.orderCustomer, { color: colors.textSecondary }]}>{item.customer_name}</Text>
            </View>
          </View>
          {!item.is_read && <View style={[styles.unreadBadge, { backgroundColor: colors.error }]} />}
        </View>
        
        <View style={styles.orderDetails}>
          <View style={styles.orderDetailRow}>
            <IconSymbol ios_icon_name="clock.fill" android_material_icon_name="schedule" size={14} color={colors.textSecondary} />
            <Text style={[styles.orderDetailText, { color: colors.textSecondary }]}>{formatDate(item.created_at)}</Text>
          </View>
          <View style={styles.orderDetailRow}>
            <IconSymbol ios_icon_name="bag.fill" android_material_icon_name="shopping_bag" size={14} color={colors.textSecondary} />
            <Text style={[styles.orderDetailText, { color: colors.textSecondary }]}>
              {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
            </Text>
          </View>
          {total > 0 && (
            <View style={styles.orderDetailRow}>
              <IconSymbol ios_icon_name="dollarsign.circle.fill" android_material_icon_name="attach_money" size={14} color={colors.textSecondary} />
              <Text style={[styles.orderDetailText, { color: colors.textSecondary }]}>{formatCLP(total)}</Text>
            </View>
          )}
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Calculate summary statistics
  const totalAmount = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const totalPaid = orders.reduce((sum, order) => sum + order.paid_amount, 0);
  const totalDebt = totalAmount - totalPaid;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 16,
      paddingTop: Platform.OS === 'ios' ? 60 : 48,
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
    statusBadgeHeader: {
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
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
    },
    orderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    orderHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    statusDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    orderInfo: {
      flex: 1,
    },
    orderNumberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 2,
    },
    orderNumber: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    sourceIconContainer: {
      width: 22,
      height: 22,
      borderRadius: 11,
      justifyContent: 'center',
      alignItems: 'center',
    },
    messageIndicator: {
      backgroundColor: '#25D366',
      borderRadius: 12,
      paddingHorizontal: 6,
      paddingVertical: 2,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    messageCount: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '700',
    },
    orderCustomer: {
      fontSize: 14,
    },
    unreadBadge: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    orderDetails: {
      gap: 8,
      marginBottom: 12,
    },
    orderDetailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    orderDetailText: {
      fontSize: 13,
    },
    statusBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
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
    summaryCard: {
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 8,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
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
    listContent: {
      padding: 16,
      paddingBottom: 100,
    },
  });

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
            <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{customerName}</Text>
            <Text style={styles.headerSubtitle}>{getFilterLabel(statusFilter)}</Text>
          </View>
          <View style={styles.statusBadgeHeader}>
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
          <IconSymbol ios_icon_name="tray" android_material_icon_name="inbox" size={64} color={colors.textSecondary} />
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
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}
