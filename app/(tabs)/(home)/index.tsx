
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Stack, router } from 'expo-router';
import { usePrinter } from '@/hooks/usePrinter';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
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
import { useOrders } from '@/hooks/useOrders';
import { Order, OrderStatus } from '@/types';
import { 
  registerForPushNotificationsAsync, 
  setupNotificationResponseHandler,
  checkNotificationPermissions,
  requestNotificationPermissions 
} from '@/utils/pushNotifications';
import { 
  registerBackgroundAutoPrintTask, 
  unregisterBackgroundAutoPrintTask 
} from '@/utils/backgroundAutoPrintTask';

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
const ORDERS_TO_PRINT_KEY = '@orders_to_print';
const PRINTED_ORDERS_KEY = '@printed_orders';

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

export default function HomeScreen() {
  const { user, session, isAuthenticated, authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig | null>(null);
  const [printedOrderIds, setPrintedOrderIds] = useState<string[]>([]);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const notificationListenerRef = useRef<any>(null);
  const responseListenerRef = useRef<any>(null);
  const isPrintingRef = useRef(false);
  const lastPrintCheckRef = useRef<number>(0);
  const autoPrintIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const keepAwakeTagRef = useRef<string>('auto-print-home');
  const isKeepAwakeActiveRef = useRef<boolean>(false);

  const { orders, loading, error, refetch } = useOrders(
    statusFilter === 'all' ? undefined : statusFilter
  );

  const { isConnected, printReceipt } = usePrinter();

  // Load printer configuration and printed orders
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
        });
      } else {
        console.log('[HomeScreen] No printer config found');
      }

      // Load printed orders list
      const printedStr = await AsyncStorage.getItem(PRINTED_ORDERS_KEY);
      if (printedStr) {
        const printed: string[] = JSON.parse(printedStr);
        setPrintedOrderIds(printed);
        console.log('[HomeScreen] Loaded printed orders:', printed.length);
      }
    } catch (error) {
      console.error('[HomeScreen] Error loading printer config:', error);
    }
  }, []);

  // Generate receipt text - memoized with useCallback
  const generateReceiptText = useCallback((order: Order): string => {
    const width = printerConfig?.paper_size === '58mm' ? 32 : 48;
    
    let receipt = '';
    
    if (printerConfig?.include_logo !== false) {
      receipt += centerText('PEDIDO', width) + '\n';
      receipt += '='.repeat(width) + '\n\n';
    }
    
    receipt += `Pedido: ${order.order_number}\n`;
    receipt += `Estado: ${getStatusLabel(order.status)}\n`;
    receipt += `Fecha: ${formatDate(order.created_at)}\n`;
    receipt += '-'.repeat(width) + '\n\n';
    
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
        receipt += `  ${formatCLP(item.unit_price)}\n`;
      }
      receipt += '\n';
    }
    
    if (printerConfig?.include_totals !== false) {
      receipt += '-'.repeat(width) + '\n';
      const total = order.items?.reduce((sum, item) => sum + item.unit_price, 0) || 0;
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
  }, [printerConfig]);

  const centerText = (text: string, width: number): string => {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  };

  // Save printed orders to AsyncStorage
  const savePrintedOrders = useCallback(async (orderIds: string[]) => {
    try {
      await AsyncStorage.setItem(PRINTED_ORDERS_KEY, JSON.stringify(orderIds));
      console.log('[HomeScreen] Saved printed orders:', orderIds.length);
    } catch (error) {
      console.error('[HomeScreen] Error saving printed orders:', error);
    }
  }, []);

  // Auto-print function that checks for new orders
  // IMPORTANT: This must be defined BEFORE any useEffect that uses it in dependencies
  const checkAndPrintNewOrders = useCallback(async () => {
    // Only run if auto-print is enabled and printer is connected
    if (!printerConfig?.auto_print_enabled || !isConnected) {
      return;
    }

    // If already printing, skip
    if (isPrintingRef.current) {
      console.log('[HomeScreen] Already printing, skipping');
      return;
    }

    console.log('[HomeScreen] Checking for orders to auto-print...');

    // Check for orders from background task
    try {
      const ordersToPrintStr = await AsyncStorage.getItem(ORDERS_TO_PRINT_KEY);
      if (ordersToPrintStr) {
        const ordersToPrint: string[] = JSON.parse(ordersToPrintStr);
        console.log('[HomeScreen] Found orders to print from background:', ordersToPrint.length);
        
        // Clear the list immediately to prevent re-printing
        await AsyncStorage.removeItem(ORDERS_TO_PRINT_KEY);
        
        // Process each order
        for (const orderId of ordersToPrint) {
          // Skip if already printed
          if (printedOrderIds.includes(orderId)) {
            console.log('[HomeScreen] Order already printed, skipping:', orderId);
            continue;
          }

          const order = orders.find(o => o.id === orderId);
          if (order && order.status === 'pending') {
            isPrintingRef.current = true;
            
            try {
              console.log('[HomeScreen] Auto-printing order:', order.order_number);
              const receiptText = generateReceiptText(order);
              const autoCut = printerConfig?.auto_cut_enabled ?? true;
              const textSize = printerConfig?.text_size || 'medium';
              const encoding = printerConfig?.encoding || 'CP850';
              
              await printReceipt(receiptText, autoCut, textSize, encoding);
              
              // Mark as printed
              const newPrintedIds = [...printedOrderIds, orderId];
              setPrintedOrderIds(newPrintedIds);
              await savePrintedOrders(newPrintedIds);
              
              console.log('[HomeScreen] Order auto-printed successfully:', order.order_number);
              
              // Small delay between prints
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
              console.error('[HomeScreen] Error auto-printing order:', error);
            } finally {
              isPrintingRef.current = false;
            }
          }
        }
      }
    } catch (error) {
      console.error('[HomeScreen] Error checking orders to print:', error);
    }

    // Check for new pending orders in the current list
    const pendingOrders = orders.filter(o => o.status === 'pending');
    console.log('[HomeScreen] Found', pendingOrders.length, 'pending orders');
    
    for (const order of pendingOrders) {
      // Skip if already printed or currently printing
      if (printedOrderIds.includes(order.id) || isPrintingRef.current) {
        continue;
      }

      isPrintingRef.current = true;
      
      try {
        console.log('[HomeScreen] Auto-printing new order:', order.order_number);
        const receiptText = generateReceiptText(order);
        const autoCut = printerConfig?.auto_cut_enabled ?? true;
        const textSize = printerConfig?.text_size || 'medium';
        const encoding = printerConfig?.encoding || 'CP850';
        
        await printReceipt(receiptText, autoCut, textSize, encoding);
        
        // Mark as printed
        const newPrintedIds = [...printedOrderIds, order.id];
        setPrintedOrderIds(newPrintedIds);
        await savePrintedOrders(newPrintedIds);
        
        console.log('[HomeScreen] Order auto-printed successfully:', order.order_number);
      } catch (error) {
        console.error('[HomeScreen] Error auto-printing order:', error);
      } finally {
        isPrintingRef.current = false;
      }
      
      // Only print one order at a time, then wait for next check
      break;
    }
  }, [orders, printerConfig, isConnected, printedOrderIds, printReceipt, generateReceiptText, savePrintedOrders]);

  useEffect(() => {
    loadPrinterConfig();
  }, [loadPrinterConfig]);

  // Manage keep awake based on auto-print status
  // This keeps the device awake even when the screen is off
  useEffect(() => {
    const shouldKeepAwake = printerConfig?.auto_print_enabled === true && isConnected;
    
    // Copy ref value to variable inside effect
    const keepAwakeTag = keepAwakeTagRef.current;
    
    const manageKeepAwake = async () => {
      if (shouldKeepAwake) {
        // Only activate if not already active
        if (!isKeepAwakeActiveRef.current) {
          try {
            console.log('[HomeScreen] Activating keep awake to prevent sleep');
            await activateKeepAwake(keepAwakeTag);
            isKeepAwakeActiveRef.current = true;
            console.log('[HomeScreen] Keep awake activated successfully');
          } catch (error) {
            console.error('[HomeScreen] Error activating keep awake:', error);
          }
        }
      } else {
        // Only deactivate if currently active
        if (isKeepAwakeActiveRef.current) {
          try {
            console.log('[HomeScreen] Deactivating keep awake');
            await deactivateKeepAwake(keepAwakeTag);
            isKeepAwakeActiveRef.current = false;
            console.log('[HomeScreen] Keep awake deactivated successfully');
          } catch (error) {
            console.error('[HomeScreen] Error deactivating keep awake:', error);
          }
        }
      }
    };

    manageKeepAwake();

    // Cleanup on unmount - only deactivate if active
    return () => {
      if (isKeepAwakeActiveRef.current) {
        console.log('[HomeScreen] Cleanup: Deactivating keep awake');
        deactivateKeepAwake(keepAwakeTag).catch((error) => {
          console.error('[HomeScreen] Error deactivating keep awake in cleanup:', error);
        });
        isKeepAwakeActiveRef.current = false;
      }
    };
  }, [printerConfig?.auto_print_enabled, isConnected]);

  // Monitor app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      console.log('[HomeScreen] App state changed:', appState, '->', nextAppState);
      setAppState(nextAppState);
      
      // When app comes to foreground, check for pending prints
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[HomeScreen] App came to foreground, checking for pending prints');
        checkAndPrintNewOrders();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [appState, checkAndPrintNewOrders]);

  // Register/unregister background task based on auto-print setting
  useEffect(() => {
    const manageBackgroundTask = async () => {
      if (printerConfig?.auto_print_enabled && isConnected) {
        console.log('[HomeScreen] Registering background auto-print task');
        try {
          await registerBackgroundAutoPrintTask();
        } catch (error) {
          console.error('[HomeScreen] Error registering background task:', error);
        }
      } else {
        console.log('[HomeScreen] Unregistering background auto-print task');
        try {
          await unregisterBackgroundAutoPrintTask();
        } catch (error) {
          console.error('[HomeScreen] Error unregistering background task:', error);
        }
      }
    };

    manageBackgroundTask();
  }, [printerConfig?.auto_print_enabled, isConnected]);

  // Setup notification permissions and handlers
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const setupNotifications = async () => {
      try {
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
        
        await registerForPushNotificationsAsync(user.id);
        
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

    return () => {
      // Capture current ref values to avoid stale references in cleanup
      const notificationListener = notificationListenerRef.current;
      const responseListener = responseListenerRef.current;
      
      if (notificationListener) {
        notificationListener.remove();
      }
      if (responseListener) {
        responseListener.remove();
      }
    };
  }, [isAuthenticated, user]);

  // Set up periodic auto-print checking
  useEffect(() => {
    // Clear any existing interval
    if (autoPrintIntervalRef.current) {
      clearInterval(autoPrintIntervalRef.current);
      autoPrintIntervalRef.current = null;
    }

    // Only set up interval if auto-print is enabled and printer is connected
    if (printerConfig?.auto_print_enabled && isConnected) {
      console.log('[HomeScreen] Setting up auto-print interval');
      
      // Run immediately
      checkAndPrintNewOrders();
      
      // Then run every 5 seconds
      autoPrintIntervalRef.current = setInterval(() => {
        console.log('[HomeScreen] Auto-print interval triggered');
        checkAndPrintNewOrders();
      }, 5000);
    }

    return () => {
      if (autoPrintIntervalRef.current) {
        console.log('[HomeScreen] Clearing auto-print interval');
        clearInterval(autoPrintIntervalRef.current);
        autoPrintIntervalRef.current = null;
      }
    };
  }, [printerConfig?.auto_print_enabled, isConnected, checkAndPrintNewOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    await loadPrinterConfig();
    setRefreshing(false);
  }, [refetch, loadPrinterConfig]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const renderOrderCard = ({ item }: { item: Order }) => {
    // Fixed: Sum unit_price instead of multiplying by quantity
    const total = item.items?.reduce(
      (sum, orderItem) => sum + orderItem.unit_price,
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
        
        {/* Order Source Badge */}
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
        {total > 0 && <Text style={styles.orderTotal}>{formatCLP(total)}</Text>}
      </TouchableOpacity>
    );
  };

  const autoPrintWorking = printerConfig?.auto_print_enabled === true && isConnected;
  const showAutoPrintBanner = printerConfig?.auto_print_enabled === true;

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
              ? 'Auto-impresión activa (funciona con pantalla apagada)'
              : 'Impresora no conectada - Toca para configurar'}
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
    </View>
  );
}
