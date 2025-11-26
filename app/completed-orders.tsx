
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
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { getSupabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/IconSymbol';
import { Order, OrderStatus } from '@/types';
import { getStatusColor, getStatusLabel, formatCLP, formatDate } from '@/utils/orderHelpers';
import { useTheme } from '@/contexts/ThemeContext';
import * as Haptics from 'expo-haptics';

export default function CompletedOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;

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

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

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
    const itemCount = item.items?.length || 0;
    const statusColor = getStatusColor(item.status);

    return (
      <TouchableOpacity
        style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/order/${item.id}`);
        }}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <View style={styles.orderInfo}>
              <View style={styles.orderNumberRow}>
                <Text style={[styles.orderNumber, { color: colors.text }]}>{item.order_number}</Text>
                {/* Source icon - WhatsApp or Manual */}
                {item.source && (
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
                )}
              </View>
              <Text style={[styles.orderCustomer, { color: colors.textSecondary }]}>{item.customer_name}</Text>
            </View>
          </View>
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

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Custom Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Pedidos Completados</Text>
            <Text style={styles.headerSubtitle}>{orders.length} pedidos</Text>
          </View>
        </View>
      </View>
      
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <IconSymbol ios_icon_name="magnifyingglass" android_material_icon_name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Buscar pedidos..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {orders.length > 0 && (
        <View style={[styles.statsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{deliveredCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Entregados</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{paidCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pagados</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{finalizadoCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Finalizados</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{formatCLP(totalAmount)}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
          </View>
        </View>
      )}

      {filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol ios_icon_name="checkmark.circle" android_material_icon_name="check_circle" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin Pedidos Completados</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
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
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
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
  orderCustomer: {
    fontSize: 14,
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
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
});
