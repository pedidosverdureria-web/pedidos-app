
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Stack, router } from 'expo-router';
import { usePrinter } from '@/hooks/usePrinter';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import { generateReceiptText, generateQueryReceiptText, PrinterConfig } from '@/utils/receiptGenerator';
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
import { getSupabase } from '@/lib/supabase';

const STATUS_FILTERS: (OrderStatus | 'all')[] = [
  'all',
  'pending',
  'preparing',
  'ready',
  'pending_payment',
  'cancelled',
];

const PRINTER_CONFIG_KEY = '@printer_config';
const ORDERS_TO_PRINT_KEY = '@orders_to_print';
const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

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
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const notificationListenerRef = useRef<any>(null);
  const responseListenerRef = useRef<any>(null);
  const isPrintingRef = useRef(false);
  const autoPrintIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const keepAwakeTagRef = useRef<string>('auto-print-home');
  const isKeepAwakeActiveRef = useRef<boolean>(false);

  // IMPORTANT: Pass excludeCompleted=true to hide delivered and paid orders from main list
  const { orders, loading, error, refetch } = useOrders(
    statusFilter === 'all' ? undefined : statusFilter,
    true // Exclude completed orders (delivered and paid)
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
        console.log('[HomeScreen] Printer config loaded:', {
          auto_print_enabled: config.auto_print_enabled,
          encoding: config.encoding,
          text_size: config.text_size,
          paper_size: config.paper_size,
          include_logo: config.include_logo,
          include_customer_info: config.include_customer_info,
          include_totals: config.include_totals,
        });
      } else {
        console.log('[HomeScreen] No printer config found');
      }
    } catch (error) {
      console.error('[HomeScreen] Error loading printer config:', error);
    }
  }, []);

  // Check if an order has already been printed by checking the database
  const isOrderAlreadyPrinted = useCallback(async (orderId: string): Promise<boolean> => {
    try {
      const supabase = getSupabase();
      
      // Check if there's a print queue entry for this order that's already printed
      const { data, error } = await supabase
        .from('print_queue')
        .select('id, status')
        .eq('item_type', 'order')
        .eq('item_id', orderId)
        .in('status', ['printed', 'failed'])
        .limit(1);

      if (error) {
        console.error('[HomeScreen] Error checking if order is printed:', error);
        return false;
      }

      const alreadyPrinted = data && data.length > 0;
      if (alreadyPrinted) {
        console.log('[HomeScreen] Order', orderId, 'already printed (found in print_queue)');
      }
      
      return alreadyPrinted;
    } catch (error) {
      console.error('[HomeScreen] Error checking if order is printed:', error);
      return false;
    }
  }, []);

  // Check if a query has already been printed by checking the database
  const isQueryAlreadyPrinted = useCallback(async (queryId: string): Promise<boolean> => {
    try {
      const supabase = getSupabase();
      
      // Check if there's a print queue entry for this query that's already printed
      const { data, error } = await supabase
        .from('print_queue')
        .select('id, status')
        .eq('item_type', 'query')
        .eq('item_id', queryId)
        .in('status', ['printed', 'failed'])
        .limit(1);

      if (error) {
        console.error('[HomeScreen] Error checking if query is printed:', error);
        return false;
      }

      const alreadyPrinted = data && data.length > 0;
      if (alreadyPrinted) {
        console.log('[HomeScreen] Query', queryId, 'already printed (found in print_queue)');
      }
      
      return alreadyPrinted;
    } catch (error) {
      console.error('[HomeScreen] Error checking if query is printed:', error);
      return false;
    }
  }, []);

  // Add order to print queue in database
  const addOrderToPrintQueue = useCallback(async (orderId: string): Promise<void> => {
    try {
      const supabase = getSupabase();
      
      // First check if it already exists in the queue
      const { data: existing } = await supabase
        .from('print_queue')
        .select('id')
        .eq('item_type', 'order')
        .eq('item_id', orderId)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log('[HomeScreen] Order already in print queue, skipping');
        return;
      }

      // Add to print queue
      const { error } = await supabase
        .from('print_queue')
        .insert({
          item_type: 'order',
          item_id: orderId,
          status: 'pending',
        });

      if (error) {
        console.error('[HomeScreen] Error adding order to print queue:', error);
      } else {
        console.log('[HomeScreen] Order added to print queue:', orderId);
      }
    } catch (error) {
      console.error('[HomeScreen] Error adding order to print queue:', error);
    }
  }, []);

  // Mark order as printed in database
  const markOrderAsPrinted = useCallback(async (orderId: string): Promise<void> => {
    try {
      const supabase = getSupabase();
      
      // Update or insert print queue entry
      const { data: existing } = await supabase
        .from('print_queue')
        .select('id')
        .eq('item_type', 'order')
        .eq('item_id', orderId)
        .limit(1);

      if (existing && existing.length > 0) {
        // Update existing entry
        await supabase
          .from('print_queue')
          .update({
            status: 'printed',
            printed_at: new Date().toISOString(),
          })
          .eq('id', existing[0].id);
      } else {
        // Insert new entry
        await supabase
          .from('print_queue')
          .insert({
            item_type: 'order',
            item_id: orderId,
            status: 'printed',
            printed_at: new Date().toISOString(),
          });
      }

      console.log('[HomeScreen] Order marked as printed in database:', orderId);
    } catch (error) {
      console.error('[HomeScreen] Error marking order as printed:', error);
    }
  }, []);

  // Auto-print function that checks for new orders AND queries
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

    console.log('[HomeScreen] Checking for orders and queries to auto-print...');

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
          // Check if already printed using database
          const alreadyPrinted = await isOrderAlreadyPrinted(orderId);
          if (alreadyPrinted) {
            console.log('[HomeScreen] Order already printed (database check), skipping:', orderId);
            continue;
          }

          const order = orders.find(o => o.id === orderId);
          if (order && order.status === 'pending') {
            isPrintingRef.current = true;
            
            try {
              console.log('[HomeScreen] Auto-printing order:', order.order_number);
              
              // Use the centralized receipt generator with the full printer config
              const receiptText = generateReceiptText(order, printerConfig);
              const autoCut = printerConfig?.auto_cut_enabled ?? true;
              const textSize = printerConfig?.text_size || 'medium';
              const encoding = printerConfig?.encoding || 'CP850';
              
              await printReceipt(receiptText, autoCut, textSize, encoding);
              
              // Mark as printed in database
              await markOrderAsPrinted(orderId);
              
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
      // Check if already printed using database
      const alreadyPrinted = await isOrderAlreadyPrinted(order.id);
      if (alreadyPrinted || isPrintingRef.current) {
        continue;
      }

      isPrintingRef.current = true;
      
      try {
        console.log('[HomeScreen] Auto-printing new order:', order.order_number);
        
        // Use the centralized receipt generator with the full printer config
        const receiptText = generateReceiptText(order, printerConfig);
        const autoCut = printerConfig?.auto_cut_enabled ?? true;
        const textSize = printerConfig?.text_size || 'medium';
        const encoding = printerConfig?.encoding || 'CP850';
        
        await printReceipt(receiptText, autoCut, textSize, encoding);
        
        // Mark as printed in database
        await markOrderAsPrinted(order.id);
        
        console.log('[HomeScreen] Order auto-printed successfully:', order.order_number);
      } catch (error) {
        console.error('[HomeScreen] Error auto-printing order:', error);
      } finally {
        isPrintingRef.current = false;
      }
      
      // Only print one order at a time, then wait for next check
      break;
    }

    // Check for queries that need printing from the print_queue table
    try {
      const supabase = getSupabase();
      
      // Get pending queries from print queue
      const { data: printQueue, error: queueError } = await supabase
        .from('print_queue')
        .select('*')
        .eq('item_type', 'query')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(10);

      if (queueError) {
        console.error('[HomeScreen] Error fetching print queue:', queueError);
      } else if (printQueue && printQueue.length > 0) {
        console.log('[HomeScreen] Found', printQueue.length, 'queries to print');

        for (const queueItem of printQueue) {
          // Double-check if already printed
          const alreadyPrinted = await isQueryAlreadyPrinted(queueItem.item_id);
          if (alreadyPrinted || isPrintingRef.current) {
            // If already printed but status is still pending, update it
            if (alreadyPrinted && queueItem.status === 'pending') {
              await supabase
                .from('print_queue')
                .update({ status: 'printed' })
                .eq('id', queueItem.id);
            }
            continue;
          }

          isPrintingRef.current = true;

          try {
            // Fetch the query and order details
            const { data: query, error: queryError } = await supabase
              .from('order_queries')
              .select('*, order:orders(*)')
              .eq('id', queueItem.item_id)
              .single();

            if (queryError || !query || !query.order) {
              console.error('[HomeScreen] Error fetching query:', queryError);
              
              // Mark as failed in print queue
              await supabase
                .from('print_queue')
                .update({
                  status: 'failed',
                  error_message: 'Query or order not found',
                })
                .eq('id', queueItem.id);
              
              isPrintingRef.current = false;
              continue;
            }

            console.log('[HomeScreen] Auto-printing query for order:', query.order.order_number);

            // Generate query receipt
            const receiptText = generateQueryReceiptText(
              query.order,
              query.query_text,
              printerConfig
            );
            const autoCut = printerConfig?.auto_cut_enabled ?? true;
            const textSize = printerConfig?.text_size || 'medium';
            const encoding = printerConfig?.encoding || 'CP850';

            await printReceipt(receiptText, autoCut, textSize, encoding);

            // Mark as printed in print queue
            await supabase
              .from('print_queue')
              .update({
                status: 'printed',
                printed_at: new Date().toISOString(),
              })
              .eq('id', queueItem.id);

            console.log('[HomeScreen] Query auto-printed successfully');

            // Small delay between prints
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error('[HomeScreen] Error auto-printing query:', error);

            // Mark as failed in print queue
            await supabase
              .from('print_queue')
              .update({
                status: 'failed',
                error_message: String(error),
              })
              .eq('id', queueItem.id);
          } finally {
            isPrintingRef.current = false;
          }

          // Only print one query at a time, then wait for next check
          break;
        }
      }
    } catch (error) {
      console.error('[HomeScreen] Error checking queries to print:', error);
    }

    // Clean up old printed items from print_queue (older than 7 days)
    try {
      const supabase = getSupabase();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      await supabase
        .from('print_queue')
        .delete()
        .in('status', ['printed', 'failed'])
        .lt('created_at', sevenDaysAgo.toISOString());

      console.log('[HomeScreen] Cleaned up old print queue items');
    } catch (error) {
      console.error('[HomeScreen] Error cleaning up print queue:', error);
    }
  }, [orders, printerConfig, isConnected, printReceipt, isOrderAlreadyPrinted, isQueryAlreadyPrinted, markOrderAsPrinted]);

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
      // Capture current ref values inside the effect to avoid stale references in cleanup
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

  // Set up auto-refresh interval (every 30 seconds)
  useEffect(() => {
    console.log('[HomeScreen] Setting up auto-refresh interval (30 seconds)');
    
    // Clear any existing interval
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
    }

    // Set up interval to refresh orders every 30 seconds
    autoRefreshIntervalRef.current = setInterval(() => {
      console.log('[HomeScreen] Auto-refresh triggered');
      refetch();
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      if (autoRefreshIntervalRef.current) {
        console.log('[HomeScreen] Clearing auto-refresh interval');
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
    };
  }, [refetch]);

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

    // Check if order has customer queries/messages
    const hasMessages = item.queries && item.queries.length > 0;
    const messageCount = item.queries?.length || 0;

    return (
      <TouchableOpacity
        style={[styles.orderCard, { borderLeftColor: getStatusColor(item.status) }]}
        onPress={() => router.push(`/order/${item.id}`)}
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
            {searchQuery ? 'No se encontraron pedidos' : 'No hay pedidos activos'}
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
