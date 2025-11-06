
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Stack, router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
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
  AppState,
  AppStateStatus,
} from 'react-native';
import { 
  registerForPushNotificationsAsync, 
  setupNotificationResponseHandler,
  checkNotificationPermissions,
  requestNotificationPermissions 
} from '@/utils/pushNotifications';
import { getSupabase } from '@/lib/supabase';
import { 
  registerBackgroundAutoPrintTask, 
  unregisterBackgroundAutoPrintTask 
} from '@/utils/backgroundAutoPrintTask';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { usePrinter } from '@/hooks/usePrinter';
import { IconSymbol } from '@/components/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateReceiptText, PrinterConfig } from '@/utils/receiptGenerator';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { Order, OrderStatus } from '@/types';
import { useOrders } from '@/hooks/useOrders';

const STATUS_FILTERS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Pendiente', value: 'pending' },
  { label: 'Preparando', value: 'preparing' },
  { label: 'Listo', value: 'ready' },
  { label: 'Entregado', value: 'delivered' },
  { label: 'Cancelado', value: 'cancelled' },
];

const PRINTER_CONFIG_KEY = '@printer_config';
const ORDERS_TO_PRINT_KEY = '@orders_to_print';
const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

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
      return '#10B981';
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

function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);
}

function formatDate(dateString: string): string {
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
  });
}

export default function HomeScreen() {
  const { user, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const { orders, loading, refetch } = useOrders();
  const { printReceipt, isConnected } = usePrinter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig | null>(null);
  const [printedOrders, setPrintedOrders] = useState<Set<string>>(new Set());
  const [isPrinting, setIsPrinting] = useState(false);
  
  const appState = useRef(AppState.currentState);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load printer config
  const loadPrinterConfig = useCallback(async () => {
    try {
      console.log('[HomeScreen] Loading printer config...');
      const configStr = await AsyncStorage.getItem(PRINTER_CONFIG_KEY);
      if (configStr) {
        const config = JSON.parse(configStr);
        setPrinterConfig(config);
        console.log('[HomeScreen] Printer config loaded:', {
          auto_print_enabled: config.auto_print_enabled,
          encoding: config.encoding,
          text_size: config.text_size,
          paper_size: config.paper_size,
        });
      } else {
        console.log('[HomeScreen] No printer config found');
      }

      // Load printed orders
      const printedStr = await AsyncStorage.getItem(ORDERS_TO_PRINT_KEY);
      if (printedStr) {
        const printed = JSON.parse(printedStr);
        setPrintedOrders(new Set(printed));
        console.log('[HomeScreen] Loaded printed orders:', printed.length);
      }
    } catch (error) {
      console.error('[HomeScreen] Error loading printer config:', error);
    }
  }, []);

  useEffect(() => {
    loadPrinterConfig();
  }, [loadPrinterConfig]);

  // Auto-print new orders
  const checkAndPrintNewOrders = useCallback(async () => {
    if (!printerConfig?.auto_print_enabled || !isConnected || isPrinting) {
      return;
    }

    console.log('[HomeScreen] Checking for new orders to auto-print...');

    // Find pending orders that haven't been printed yet
    const pendingOrders = orders.filter(
      (order) => order.status === 'pending' && !printedOrders.has(order.id)
    );

    if (pendingOrders.length === 0) {
      console.log('[HomeScreen] No new orders to print');
      return;
    }

    console.log('[HomeScreen] Found', pendingOrders.length, 'new orders to print');

    // Print the first pending order
    const orderToPrint = pendingOrders[0];
    
    try {
      setIsPrinting(true);
      console.log('[HomeScreen] Auto-printing order:', orderToPrint.order_number);
      
      // Generate receipt with auto_print context
      const receiptText = generateReceiptText(orderToPrint, printerConfig, 'auto_print');
      const autoCut = printerConfig.auto_cut_enabled ?? true;
      const textSize = printerConfig.text_size || 'medium';
      const encoding = printerConfig.encoding || 'CP850';

      await printReceipt(receiptText, autoCut, textSize, encoding);
      
      // Mark as printed
      const newPrintedOrders = new Set(printedOrders);
      newPrintedOrders.add(orderToPrint.id);
      setPrintedOrders(newPrintedOrders);
      
      // Save to storage
      await AsyncStorage.setItem(
        ORDERS_TO_PRINT_KEY,
        JSON.stringify(Array.from(newPrintedOrders))
      );
      
      console.log('[HomeScreen] Order auto-printed successfully');
    } catch (error) {
      console.error('[HomeScreen] Error auto-printing order:', error);
    } finally {
      setIsPrinting(false);
    }
  }, [printerConfig, isConnected, orders, printedOrders, isPrinting, printReceipt]);

  // Auto-print effect
  useEffect(() => {
    if (printerConfig?.auto_print_enabled && isConnected) {
      console.log('[HomeScreen] Auto-print is enabled, checking for new orders...');
      checkAndPrintNewOrders();
    }
  }, [printerConfig?.auto_print_enabled, isConnected, checkAndPrintNewOrders]);

  // App state change handler
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('[HomeScreen] App has come to the foreground, checking for new orders');
        checkAndPrintNewOrders();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [checkAndPrintNewOrders]);

  // Setup push notifications
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const setupNotifications = async () => {
      try {
        console.log('[HomeScreen] Setting up push notifications...');
        
        // Check if we have permission
        const hasPermission = await checkNotificationPermissions();
        
        if (!hasPermission) {
          console.log('[HomeScreen] No notification permission, requesting...');
          const granted = await requestNotificationPermissions();
          
          if (!granted) {
            console.log('[HomeScreen] Notification permission denied');
            return;
          }
        }
        
        // Register for push notifications
        await registerForPushNotificationsAsync(user.id);
        
        // Setup notification response handler
        setupNotificationResponseHandler();
        
        console.log('[HomeScreen] Push notifications setup complete');
      } catch (error) {
        console.error('[HomeScreen] Error setting up notifications:', error);
      }
    };

    setupNotifications();
  }, [isAuthenticated, user]);

  // Auto-refresh orders
  useEffect(() => {
    console.log('[HomeScreen] Setting up auto-refresh interval');
    
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
    }

    autoRefreshIntervalRef.current = setInterval(() => {
      console.log('[HomeScreen] Auto-refreshing orders...');
      refetch();
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      if (autoRefreshIntervalRef.current) {
        console.log('[HomeScreen] Clearing auto-refresh interval');
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [refetch]);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const renderOrderCard = ({ item }: { item: Order }) => {
    const total = item.items?.reduce((sum, orderItem) => sum + orderItem.unit_price, 0) || 0;
    const itemCount = item.items?.length || 0;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => router.push(`/order/${item.id}`)}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <View style={styles.orderInfo}>
              <Text style={styles.orderNumber}>{item.order_number}</Text>
              <Text style={styles.orderCustomer}>{item.customer_name}</Text>
            </View>
          </View>
          {!item.is_read && <View style={styles.unreadBadge} />}
        </View>
        
        <View style={styles.orderDetails}>
          <View style={styles.orderDetailRow}>
            <IconSymbol name="clock.fill" size={14} color={colors.textSecondary} />
            <Text style={styles.orderDetailText}>{formatDate(item.created_at)}</Text>
          </View>
          <View style={styles.orderDetailRow}>
            <IconSymbol name="bag.fill" size={14} color={colors.textSecondary} />
            <Text style={styles.orderDetailText}>
              {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
            </Text>
          </View>
          {total > 0 && (
            <View style={styles.orderDetailRow}>
              <IconSymbol name="dollarsign.circle.fill" size={14} color={colors.textSecondary} />
              <Text style={styles.orderDetailText}>{formatCLP(total)}</Text>
            </View>
          )}
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Pedidos',
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 16, marginRight: 16 }}>
              <TouchableOpacity onPress={() => router.push('/order/new')}>
                <IconSymbol name="plus.circle.fill" size={28} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/settings')}>
                <IconSymbol name="gearshape.fill" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {/* Search Bar */}
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

      {/* Status Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={STATUS_FILTERS}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                statusFilter === item.value && styles.filterButtonActive,
              ]}
              onPress={() => setStatusFilter(item.value)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  statusFilter === item.value && styles.filterButtonTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        />
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="tray.fill" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>Sin Pedidos</Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? 'No se encontraron pedidos con ese criterio'
              : 'No hay pedidos registrados'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
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
    color: colors.text,
  },
  filtersContainer: {
    marginBottom: 8,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  orderCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
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
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  orderCustomer: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
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
    color: colors.textSecondary,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
