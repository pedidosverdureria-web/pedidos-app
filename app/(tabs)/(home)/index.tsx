
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useOrders } from '@/hooks/useOrders';
import { Order, OrderStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const STATUS_FILTERS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Pendiente', value: 'pending' },
  { label: 'Preparando', value: 'preparing' },
  { label: 'Listo', value: 'ready' },
  { label: 'Entregado', value: 'delivered' },
  { label: 'Cancelado', value: 'cancelled' },
];

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'pending':
      return colors.statusPending;
    case 'preparing':
      return colors.statusPreparing;
    case 'ready':
      return colors.statusReady;
    case 'delivered':
      return colors.statusDelivered;
    case 'cancelled':
      return colors.statusCancelled;
    default:
      return colors.textSecondary;
  }
};

const getStatusLabel = (status: OrderStatus) => {
  const labels: Record<OrderStatus, string> = {
    pending: 'Pendiente',
    preparing: 'Preparando',
    ready: 'Listo',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  };
  return labels[status] || status;
};

// Format currency as Chilean Pesos
const formatCLP = (amount: number): string => {
  return `$${amount.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export default function HomeScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { orders, loading, refetch } = useOrders(
    statusFilter === 'all' ? undefined : statusFilter
  );

  useEffect(() => {
    console.log('HomeScreen: Auth state -', { isAuthenticated, authLoading });
    
    // Only redirect if auth is not loading and user is not authenticated
    if (!authLoading && !isAuthenticated) {
      console.log('HomeScreen: User not authenticated, redirecting to login');
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  // Don't render the main content if not authenticated
  if (!isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Redirigiendo...</Text>
      </View>
    );
  }

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.order_number.toLowerCase().includes(query) ||
      order.customer_name.toLowerCase().includes(query) ||
      (order.customer_phone && order.customer_phone.includes(query))
    );
  });

  const unreadCount = orders.filter((o) => !o.is_read).length;

  const renderOrderCard = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={[styles.orderCard, !item.is_read && styles.orderCardUnread]}
      onPress={() => router.push(`/order/${item.id}`)}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderLeft}>
          <Text style={styles.orderNumber}>#{item.order_number}</Text>
          {!item.is_read && <View style={styles.unreadDot} />}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>

      <View style={styles.orderInfo}>
        <View style={styles.infoRow}>
          <IconSymbol name="person.fill" size={16} color={colors.textSecondary} />
          <Text style={styles.infoText}>{item.customer_name}</Text>
        </View>
        {item.customer_phone && (
          <View style={styles.infoRow}>
            <IconSymbol name="phone.fill" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{item.customer_phone}</Text>
          </View>
        )}
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.sourceTag}>
          <IconSymbol
            name={item.source === 'whatsapp' ? 'message.fill' : 'pencil'}
            size={14}
            color={item.source === 'whatsapp' ? colors.success : colors.textSecondary}
          />
          <Text style={[
            styles.sourceText,
            item.source === 'whatsapp' && { color: colors.success }
          ]}>
            {item.source === 'whatsapp' ? 'WhatsApp' : 'Manual'}
          </Text>
        </View>
        <Text style={styles.totalText}>{formatCLP(item.total_amount)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <View style={styles.searchContainer}>
        <IconSymbol name="magnifyingglass" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar pedidos..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={(item) => item.value}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              statusFilter === item.value && styles.filterChipActive,
            ]}
            onPress={() => setStatusFilter(item.value)}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === item.value && styles.filterChipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
      />
    </View>
  );

  const renderHeaderRight = () => (
    <TouchableOpacity
      onPress={() => router.push('/order/new')}
      style={styles.headerButton}
    >
      <IconSymbol name="plus.circle.fill" color={colors.primary} size={28} />
    </TouchableOpacity>
  );

  const renderHeaderLeft = () => (
    <TouchableOpacity
      onPress={() => router.push('/settings')}
      style={styles.headerButton}
    >
      <IconSymbol name="gear" color={colors.primary} size={24} />
    </TouchableOpacity>
  );

  return (
    <>
      {Platform.OS === 'ios' && (
        <Stack.Screen
          options={{
            title: 'Pedidos',
            headerRight: renderHeaderRight,
            headerLeft: renderHeaderLeft,
          }}
        />
      )}
      <View style={styles.container}>
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={[
            styles.listContent,
            Platform.OS !== 'ios' && styles.listContentWithTabBar,
          ]}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <IconSymbol name="tray.fill" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No hay pedidos</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery
                  ? 'Intenta ajustar tu búsqueda'
                  : 'Los nuevos pedidos aparecerán aquí automáticamente'}
              </Text>
            </View>
          }
        />

        {unreadCount > 0 && (
          <View style={styles.unreadBanner}>
            <IconSymbol name="bell.badge.fill" size={20} color="#FFFFFF" />
            <Text style={styles.unreadBannerText}>
              {unreadCount} pedido{unreadCount > 1 ? 's' : ''} nuevo{unreadCount > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>
    </>
  );
}

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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  headerButton: {
    padding: 8,
  },
  headerContent: {
    padding: 16,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.text,
  },
  filterList: {
    paddingVertical: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 16,
  },
  listContentWithTabBar: {
    paddingBottom: 100,
  },
  orderCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  orderCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
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
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  orderInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sourceText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  totalText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  unreadBanner: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
    elevation: 6,
  },
  unreadBannerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
