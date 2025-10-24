
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { usePrinter } from '@/hooks/usePrinter';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STATUS_FILTERS: { label: string; value: OrderStatus | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Pendiente', value: 'pending' },
  { label: 'Preparando', value: 'preparing' },
  { label: 'Listo', value: 'ready' },
  { label: 'Entregado', value: 'delivered' },
  { label: 'Cancelado', value: 'cancelled' },
];

const PRINTER_CONFIG_KEY = '@printer_config';
const POLLING_INTERVAL = 20000; // 20 seconds

type TextSize = 'small' | 'medium' | 'large';
type PaperSize = '58mm' | '80mm';

interface PrinterConfig {
  auto_print_enabled?: boolean;
  auto_cut_enabled?: boolean;
  text_size?: TextSize;
  paper_size?: PaperSize;
  include_logo?: boolean;
  include_customer_info?: boolean;
  include_totals?: boolean;
  use_webhook_format?: boolean;
}

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

// Extract unit from notes
const getUnitFromNotes = (notes?: string): string => {
  if (!notes) return 'unidades';
  
  const unitMatch = notes.match(/Unidad:\s*(.+)/i);
  if (unitMatch && unitMatch[1]) {
    return unitMatch[1].trim();
  }
  
  return 'unidades';
};

export default function HomeScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { orders, loading, refetch } = useOrders(
    statusFilter === 'all' ? undefined : statusFilter
  );
  const { printReceipt, isConnected } = usePrinter();
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>({
    auto_print_enabled: false,
    auto_cut_enabled: true,
    text_size: 'medium',
    paper_size: '80mm',
    use_webhook_format: true,
  });
  const previousOrderIdsRef = useRef<Set<string>>(new Set());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load printer config to check if auto-print is enabled
  const loadPrinterConfig = useCallback(async () => {
    try {
      const savedConfig = await AsyncStorage.getItem(PRINTER_CONFIG_KEY);
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        setPrinterConfig({
          auto_print_enabled: config.auto_print_enabled ?? false,
          auto_cut_enabled: config.auto_cut_enabled ?? true,
          text_size: config.text_size ?? 'medium',
          paper_size: config.paper_size ?? '80mm',
          include_logo: config.include_logo ?? true,
          include_customer_info: config.include_customer_info ?? true,
          include_totals: config.include_totals ?? true,
          use_webhook_format: config.use_webhook_format ?? true,
        });
        console.log('[HomeScreen] Loaded printer config:', config);
      }
    } catch (error) {
      console.error('[HomeScreen] Error loading printer config:', error);
    }
  }, []);

  // Generate receipt text for printing
  const generateReceiptText = useCallback((order: Order): string => {
    const paperSize = printerConfig.paper_size || '80mm';
    const useWebhookFormat = printerConfig.use_webhook_format ?? true;
    const maxWidth = paperSize === '58mm' ? 32 : 48;
    
    const centerText = (text: string) => {
      const padding = Math.max(0, Math.floor((maxWidth - text.length) / 2));
      return ' '.repeat(padding) + text;
    };

    const wrapText = (text: string, width: number): string => {
      if (text.length <= width) return text;
      
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      
      for (const word of words) {
        if ((currentLine + ' ' + word).trim().length <= width) {
          currentLine = (currentLine + ' ' + word).trim();
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      }
      
      if (currentLine) lines.push(currentLine);
      
      return lines.join('\n');
    };

    let receipt = '\n';
    receipt += centerText('PEDIDO') + '\n';
    receipt += centerText(`#${order.order_number}`) + '\n';
    receipt += '='.repeat(maxWidth) + '\n\n';

    if (printerConfig.include_customer_info !== false) {
      receipt += `Cliente: ${order.customer_name}\n`;
      if (order.customer_phone) {
        receipt += `Tel: ${order.customer_phone}\n`;
      }
      if (order.customer_address) {
        receipt += `Dir: ${order.customer_address}\n`;
      }
      receipt += '\n';
    }

    receipt += '-'.repeat(maxWidth) + '\n';
    receipt += 'PRODUCTOS\n';
    receipt += '-'.repeat(maxWidth) + '\n';

    if (order.items && order.items.length > 0) {
      order.items.forEach((item) => {
        if (useWebhookFormat) {
          // Use WhatsApp format: "2 kilos de papas $3000"
          const unit = getUnitFromNotes(item.notes);
          const productLine = `${item.quantity} ${unit} de ${item.product_name}`;
          const priceLine = formatCLP(item.total_price);
          const fullLine = `${productLine} ${priceLine}`;
          receipt += wrapText(fullLine, maxWidth) + '\n';
        } else {
          // Use traditional format
          receipt += wrapText(item.product_name, maxWidth) + '\n';
          receipt += `  ${item.quantity} x ${formatCLP(item.unit_price)} = ${formatCLP(item.total_price)}\n`;
          if (item.notes) {
            receipt += `  Nota: ${wrapText(item.notes, maxWidth - 8)}\n`;
          }
        }
        receipt += '\n';
      });
    }

    if (printerConfig.include_totals !== false) {
      receipt += '-'.repeat(maxWidth) + '\n';
      receipt += `TOTAL: ${formatCLP(order.total_amount)}\n`;
      receipt += '='.repeat(maxWidth) + '\n\n';
    }

    const date = new Date(order.created_at).toLocaleString('es-ES');
    receipt += centerText(date) + '\n';

    return receipt;
  }, [printerConfig]);

  // Auto-print new orders
  const autoPrintOrder = useCallback(async (order: Order) => {
    if (!printerConfig.auto_print_enabled || !isConnected) {
      console.log('[HomeScreen] Auto-print skipped:', { 
        autoPrintEnabled: printerConfig.auto_print_enabled, 
        isConnected 
      });
      return;
    }

    try {
      console.log('[HomeScreen] Auto-printing order:', order.order_number);
      const receiptText = generateReceiptText(order);
      const textSize = printerConfig.text_size || 'medium';
      await printReceipt(receiptText, printerConfig.auto_cut_enabled ?? true, textSize);
      console.log('[HomeScreen] Order printed successfully:', order.order_number);
    } catch (error) {
      console.error('[HomeScreen] Error auto-printing order:', error);
    }
  }, [printerConfig, isConnected, generateReceiptText, printReceipt]);

  // Check for new orders and auto-print them
  const checkForNewOrders = useCallback((currentOrders: Order[]) => {
    const currentOrderIds = new Set(currentOrders.map(order => order.id));
    
    // Find new orders that weren't in the previous set
    const newOrderIds = Array.from(currentOrderIds).filter(
      id => !previousOrderIdsRef.current.has(id)
    );

    // If there are new orders and we had previous orders (not initial load)
    if (newOrderIds.length > 0 && previousOrderIdsRef.current.size > 0) {
      const newOrders = currentOrders.filter(order => newOrderIds.includes(order.id));
      
      console.log(`[HomeScreen] Found ${newOrders.length} new order(s)`);
      
      // Auto-print each new order
      newOrders.forEach(order => {
        autoPrintOrder(order);
      });
    }

    // Update the previous order IDs
    previousOrderIdsRef.current = currentOrderIds;
  }, [autoPrintOrder]);

  // Set up polling for new orders
  useEffect(() => {
    // Initial check
    if (orders.length > 0) {
      checkForNewOrders(orders);
    }

    // Set up polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(() => {
      console.log('[HomeScreen] Polling for new orders...');
      refetch();
    }, POLLING_INTERVAL);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [orders, checkForNewOrders, refetch]);

  // Load printer config on mount
  useEffect(() => {
    loadPrinterConfig();
  }, [loadPrinterConfig]);

  // Define all hooks before any conditional returns
  const renderOrderCard = useCallback(({ item }: { item: Order }) => (
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
  ), []);

  const renderFilterList = useCallback(() => (
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
  ), [statusFilter]);

  const renderHeaderRight = useCallback(() => (
    <TouchableOpacity
      onPress={() => router.push('/order/new')}
      style={styles.headerButton}
    >
      <IconSymbol name="plus.circle.fill" color={colors.primary} size={28} />
    </TouchableOpacity>
  ), []);

  const renderHeaderLeft = useCallback(() => (
    <TouchableOpacity
      onPress={() => router.push('/settings')}
      style={styles.headerButton}
    >
      <IconSymbol name="gear" color={colors.primary} size={24} />
    </TouchableOpacity>
  ), []);

  useEffect(() => {
    console.log('[HomeScreen] Auth state -', { isAuthenticated, authLoading });
    
    // Only redirect if auth is not loading and user is not authenticated
    if (!authLoading && !isAuthenticated) {
      console.log('[HomeScreen] User not authenticated, redirecting to login');
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
        {/* Search and Filter Section - Outside FlatList */}
        <View style={styles.headerContent}>
          <View style={styles.searchContainer}>
            <IconSymbol name="magnifyingglass" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar pedidos..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>

          {renderFilterList()}

          {/* Auto-print indicator */}
          {printerConfig.auto_print_enabled && isConnected && (
            <View style={styles.autoPrintBanner}>
              <IconSymbol name="printer.fill" size={16} color={colors.success} />
              <Text style={styles.autoPrintText}>
                Impresión automática activada (Tamaño: {printerConfig.text_size})
              </Text>
            </View>
          )}
        </View>

        {/* Orders List */}
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id}
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
    backgroundColor: colors.background,
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
  autoPrintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.success,
  },
  autoPrintText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
    marginLeft: 8,
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
