
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Stack, router } from 'expo-router';
import { usePrinter } from '@/hooks/usePrinter';
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
import { useOrders } from '@/hooks/useOrders';
import { Order, OrderStatus } from '@/types';
import { 
  registerForPushNotificationsAsync, 
  setupNotificationResponseHandler,
  checkNotificationPermissions,
  requestNotificationPermissions 
} from '@/utils/pushNotifications';

type TextSize = 'small' | 'medium' | 'large';
type PaperSize = '58mm' | '80mm';
type Encoding = 'CP850' | 'UTF-8' | 'ISO-8859-1' | 'Windows-1252';

interface PrinterConfig {
  auto_print_enabled?: boolean;
  auto_cut_enabled?: boolean;
  text_size?: TextSize;
  paper_size?: PaperSize;
  include_logo?: boolean;
  include_customer_info?: boolean;
  include_totals?: boolean;
  use_webhook_format?: boolean;
  encoding?: Encoding;
}

const STATUS_FILTERS: (OrderStatus | 'all')[] = [
  'all',
  'pending',
  'preparing',
  'ready',
  'delivered',
  'cancelled',
];

const PRINTER_CONFIG_KEY = '@printer_config';
const POLLING_INTERVAL = 20000; // 20 seconds

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  autoPrintBanner: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoPrintBannerWorking: {
    backgroundColor: '#10B981',
  },
  autoPrintBannerNotWorking: {
    backgroundColor: '#F59E0B',
  },
  autoPrintBannerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  header: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
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
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterButtonActive: {
    backgroundColor: '#fff',
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: colors.primary,
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
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
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

function getUnitFromNotes(notes: string | null | undefined): string {
  if (!notes) return '';
  const lowerNotes = notes.toLowerCase();
  if (lowerNotes.includes('kg') || lowerNotes.includes('kilo')) return 'kg';
  if (lowerNotes.includes('gr') || lowerNotes.includes('gramo')) return 'gr';
  if (lowerNotes.includes('lt') || lowerNotes.includes('litro')) return 'lt';
  if (lowerNotes.includes('ml')) return 'ml';
  if (lowerNotes.includes('un') || lowerNotes.includes('unidad')) return 'un';
  return '';
}

export default function HomeScreen() {
  const { user, session, isAuthenticated, authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig | null>(null);
  const [printedOrderIds, setPrintedOrderIds] = useState<Set<string>>(new Set());
  const notificationListenerRef = useRef<any>(null);
  const responseListenerRef = useRef<any>(null);

  const { orders, loading, error, refetch } = useOrders(
    statusFilter === 'all' ? undefined : statusFilter
  );

  const { isConnected, printReceipt } = usePrinter();

  // Load printer configuration
  const loadPrinterConfig = useCallback(async () => {
    try {
      console.log('[HomeScreen] Loading printer config...');
      const configStr = await AsyncStorage.getItem(PRINTER_CONFIG_KEY);
      if (configStr) {
        const config = JSON.parse(configStr);
        setPrinterConfig(config);
        console.log('[HomeScreen] Printer config loaded:', config);
      } else {
        console.log('[HomeScreen] No printer config found');
      }
    } catch (error) {
      console.error('[HomeScreen] Error loading printer config:', error);
    }
  }, []);

  useEffect(() => {
    loadPrinterConfig();
  }, [loadPrinterConfig]);

  // Setup notification permissions and handlers
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const setupNotifications = async () => {
      try {
        // Check if permissions are already granted
        const hasPermissions = await checkNotificationPermissions();
        
        if (!hasPermissions) {
          console.log('Requesting notification permissions...');
          const granted = await requestNotificationPermissions();
          
          if (!granted) {
            console.log('Notification permissions not granted');
            return;
          }
        }

        console.log('Notification permissions granted');
        
        // Register for push notifications
        await registerForPushNotificationsAsync(user.id);
        
        // Setup notification response handler (when user taps notification)
        responseListenerRef.current = setupNotificationResponseHandler((response) => {
          console.log('Notification tapped:', response);
          const orderId = response.notification.request.content.data?.orderId;
          if (orderId) {
            router.push(`/order/${orderId}`);
          }
        });
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };

    setupNotifications();

    // Cleanup
    return () => {
      if (notificationListenerRef.current) {
        notificationListenerRef.current.remove();
      }
      if (responseListenerRef.current) {
        responseListenerRef.current.remove();
      }
    };
  }, [isAuthenticated, user]);

  // Auto-print new orders
  useEffect(() => {
    if (!printerConfig?.auto_print_enabled || !isConnected) {
      console.log('[HomeScreen] Auto-print disabled or printer not connected', {
        autoPrintEnabled: printerConfig?.auto_print_enabled,
        isConnected,
      });
      return;
    }

    const autoPrintNewOrders = async () => {
      for (const order of orders) {
        // Only auto-print pending orders that haven't been printed yet
        if (order.status === 'pending' && !printedOrderIds.has(order.id)) {
          console.log('[HomeScreen] Auto-printing new order:', order.order_number);
          
          try {
            // Generate receipt text
            const receiptText = generateReceiptText(order);
            
            // Print the receipt
            const autoCut = printerConfig?.auto_cut_enabled ?? true;
            const textSize = printerConfig?.text_size || 'medium';
            const encoding = printerConfig?.encoding || 'CP850';
            await printReceipt(receiptText, autoCut, textSize, encoding);
            
            // Mark as printed
            setPrintedOrderIds(prev => new Set(prev).add(order.id));
            
            console.log('[HomeScreen] Order auto-printed successfully:', order.order_number);
          } catch (error) {
            console.error('[HomeScreen] Error auto-printing order:', error);
          }
        }
      }
    };

    autoPrintNewOrders();
  }, [orders, printerConfig, isConnected, printedOrderIds, printReceipt]);

  const generateReceiptText = (order: Order): string => {
    const width = printerConfig?.paper_size === '58mm' ? 32 : 48;
    const textSize = printerConfig?.text_size || 'medium';
    
    let receipt = '';
    
    // Header
    if (printerConfig?.include_logo !== false) {
      receipt += centerText('PEDIDO', width) + '\n';
      receipt += '='.repeat(width) + '\n\n';
    }
    
    // Order info
    receipt += `Pedido: ${order.order_number}\n`;
    receipt += `Estado: ${getStatusLabel(order.status)}\n`;
    receipt += `Fecha: ${new Date(order.created_at).toLocaleString('es-CL')}\n`;
    receipt += '-'.repeat(width) + '\n\n';
    
    // Customer info
    if (printerConfig?.include_customer_info !== false) {
      receipt += `Cliente: ${order.customer_name}\n`;
      if (order.customer_phone) {
        receipt += `Telefono: ${order.customer_phone}\n`;
      }
      if (order.customer_address) {
        receipt += `Direccion: ${order.customer_address}\n`;
      }
      receipt += '-'.repeat(width) + '\n\n';
    }
    
    // Items
    receipt += 'PRODUCTOS:\n\n';
    for (const item of order.items || []) {
      const unit = getUnitFromNotes(item.notes);
      const quantityStr = unit ? `${item.quantity}${unit}` : `${item.quantity}x`;
      
      receipt += `${quantityStr} ${item.product_name}\n`;
      
      if (item.notes) {
        const cleanNotes = item.notes.replace(/\d+\s*(kg|gr|lt|ml|un|kilo|gramo|litro|unidad)/gi, '').trim();
        if (cleanNotes) {
          receipt += `  ${cleanNotes}\n`;
        }
      }
      
      if (item.unit_price > 0) {
        receipt += `  ${formatCLP(item.unit_price * item.quantity)}\n`;
      }
      receipt += '\n';
    }
    
    // Totals
    if (printerConfig?.include_totals !== false) {
      receipt += '-'.repeat(width) + '\n';
      const total = order.items?.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0) || 0;
      receipt += `TOTAL: ${formatCLP(total)}\n`;
      
      if (order.amount_paid > 0) {
        receipt += `Pagado: ${formatCLP(order.amount_paid)}\n`;
        const pending = total - order.amount_paid;
        if (pending > 0) {
          receipt += `Pendiente: ${formatCLP(pending)}\n`;
        }
      }
    }
    
    receipt += '\n' + '='.repeat(width) + '\n';
    receipt += centerText('Gracias por su compra!', width) + '\n\n\n';
    
    return receipt;
  };

  const centerText = (text: string, width: number): string => {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const renderOrderCard = ({ item }: { item: Order }) => {
    const total = item.items?.reduce(
      (sum, orderItem) => sum + orderItem.unit_price * orderItem.quantity,
      0
    ) || 0;

    return (
      <TouchableOpacity
        style={[styles.orderCard, { borderLeftColor: getStatusColor(item.status) }]}
        onPress={() => router.push(`/order/${item.id}`)}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>{item.order_number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
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
        {total > 0 && <Text style={styles.orderTotal}>{formatCLP(total)}</Text>}
      </TouchableOpacity>
    );
  };

  // Determine auto-print status
  const autoPrintWorking = printerConfig?.auto_print_enabled && isConnected;
  const showAutoPrintBanner = printerConfig?.auto_print_enabled !== undefined;

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.emptyContainer}>
          <IconSymbol name="exclamationmark.triangle" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Debes iniciar sesión para ver los pedidos</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Auto-print status banner */}
      {showAutoPrintBanner && (
        <TouchableOpacity
          style={[
            styles.autoPrintBanner,
            autoPrintWorking ? styles.autoPrintBannerWorking : styles.autoPrintBannerNotWorking,
          ]}
          onPress={() => router.push('/settings/printer')}
        >
          <IconSymbol
            name={autoPrintWorking ? 'checkmark.circle.fill' : 'exclamationmark.triangle.fill'}
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.autoPrintBannerText}>
            {autoPrintWorking
              ? 'Auto-impresión activa'
              : isConnected
              ? 'Auto-impresión desactivada'
              : 'Impresora no conectada'}
          </Text>
        </TouchableOpacity>
      )}
      
      <View style={styles.header}>
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

        <FlatList
          horizontal
          data={STATUS_FILTERS}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                statusFilter === item && styles.filterButtonActive,
              ]}
              onPress={() => setStatusFilter(item)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  statusFilter === item && styles.filterButtonTextActive,
                ]}
              >
                {item === 'all' ? 'Todos' : getStatusLabel(item as OrderStatus)}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="exclamationmark.triangle" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Error al cargar pedidos: {error}</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="tray" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No se encontraron pedidos' : 'No hay pedidos'}
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

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/order/new')}>
        <IconSymbol name="plus" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
