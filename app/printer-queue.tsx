
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import { PrintQueueItem, Order, OrderQuery, Customer } from '@/types';
import { getSupabase } from '@/lib/supabase';
import { usePrinter } from '@/hooks/usePrinter';
import { generateReceiptText, generateQueryReceiptText, PrinterConfig } from '@/utils/receiptGenerator';
import {
  getPendingPrintQueue,
  markAsPrinted,
  markAsFailed,
  deletePrintQueueItem,
  clearPrintedItems,
} from '@/utils/printQueue';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const PRINTER_CONFIG_KEY = '@printer_config';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);
}

function centerText(text: string, width: number): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text;
}

function generatePendingOrdersReceipt(customer: Customer): string {
  const width = 48;
  let receipt = '';
  
  receipt += centerText('PEDIDOS PENDIENTES', width) + '\n';
  receipt += '='.repeat(width) + '\n\n';
  
  receipt += `Cliente: ${customer.name}\n`;
  if (customer.phone) {
    receipt += `Telefono: ${customer.phone}\n`;
  }
  receipt += `Fecha: ${formatDate(new Date().toISOString())}\n`;
  receipt += '-'.repeat(width) + '\n\n';
  
  const pendingOrders = customer.orders?.filter(
    (order) => order.status !== 'delivered' && order.status !== 'cancelled'
  ) || [];
  
  if (pendingOrders.length === 0) {
    receipt += 'No hay pedidos pendientes\n\n';
  } else {
    receipt += `Total de pedidos: ${pendingOrders.length}\n\n`;
    
    for (const order of pendingOrders) {
      receipt += `Pedido: ${order.order_number}\n`;
      receipt += `Estado: ${order.status}\n`;
      receipt += `Total: ${formatCLP(order.total_amount)}\n`;
      receipt += `Pagado: ${formatCLP(order.paid_amount)}\n`;
      const pending = order.total_amount - order.paid_amount;
      if (pending > 0) {
        receipt += `Pendiente: ${formatCLP(pending)}\n`;
      }
      receipt += '\n';
    }
  }
  
  receipt += '-'.repeat(width) + '\n';
  receipt += `Deuda Total: ${formatCLP(customer.total_debt)}\n`;
  receipt += `Total Pagado: ${formatCLP(customer.total_paid)}\n`;
  receipt += '\n' + '='.repeat(width) + '\n';
  receipt += centerText('Gracias!', width) + '\n\n\n';
  
  return receipt;
}

function generatePaymentReceipt(customer: Customer, paymentAmount: number, paymentNotes: string): string {
  const width = 48;
  let receipt = '';
  
  receipt += centerText('COMPROBANTE DE PAGO', width) + '\n';
  receipt += '='.repeat(width) + '\n\n';
  
  receipt += `Cliente: ${customer.name}\n`;
  if (customer.phone) {
    receipt += `Telefono: ${customer.phone}\n`;
  }
  receipt += `Fecha: ${formatDate(new Date().toISOString())}\n`;
  receipt += '-'.repeat(width) + '\n\n';
  
  receipt += `Monto Pagado: ${formatCLP(paymentAmount)}\n`;
  if (paymentNotes) {
    receipt += `Notas: ${paymentNotes}\n`;
  }
  receipt += '\n';
  
  receipt += '-'.repeat(width) + '\n';
  receipt += `Deuda Anterior: ${formatCLP(customer.total_debt + paymentAmount)}\n`;
  receipt += `Pago Recibido: ${formatCLP(paymentAmount)}\n`;
  receipt += `Deuda Restante: ${formatCLP(customer.total_debt)}\n`;
  receipt += '\n' + '='.repeat(width) + '\n';
  receipt += centerText('Gracias por su pago!', width) + '\n\n\n';
  
  return receipt;
}

export default function PrinterQueueScreen() {
  const { user } = useAuth();
  const { isConnected, printReceipt } = usePrinter();
  const [queueItems, setQueueItems] = useState<PrintQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig | null>(null);
  const [printing, setPrinting] = useState<string | null>(null);

  // Redirect if not printer role
  useEffect(() => {
    if (user && user.role !== 'printer') {
      Alert.alert('Acceso Denegado', 'Esta pantalla es solo para el perfil Impresor');
      router.back();
    }
  }, [user]);

  const loadPrinterConfig = useCallback(async () => {
    try {
      const configJson = await AsyncStorage.getItem(PRINTER_CONFIG_KEY);
      if (configJson) {
        const config = JSON.parse(configJson);
        setPrinterConfig(config);
      }
    } catch (error) {
      console.error('[PrinterQueue] Error loading printer config:', error);
    }
  }, []);

  const loadQueue = useCallback(async () => {
    try {
      console.log('[PrinterQueue] Loading queue');
      const items = await getPendingPrintQueue();
      setQueueItems(items);
    } catch (error) {
      console.error('[PrinterQueue] Error loading queue:', error);
      Alert.alert('Error', 'No se pudo cargar la cola de impresión');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPrinterConfig();
    loadQueue();
  }, [loadQueue, loadPrinterConfig]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadQueue();
  };

  const handlePrintItem = async (item: PrintQueueItem) => {
    if (!isConnected) {
      Alert.alert('Error', 'No hay impresora conectada. Ve a Configuración > Impresora para conectar una.');
      return;
    }

    try {
      setPrinting(item.id);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const supabase = getSupabase();
      let receiptText = '';

      // Fetch the item data based on type
      if (item.item_type === 'order') {
        const { data: order, error } = await supabase
          .from('orders')
          .select('*, items:order_items(*)')
          .eq('id', item.item_id)
          .single();

        if (error || !order) {
          throw new Error('No se pudo cargar el pedido');
        }

        receiptText = generateReceiptText(order as Order, printerConfig || undefined);
      } else if (item.item_type === 'query') {
        const { data: query, error: queryError } = await supabase
          .from('order_queries')
          .select('*')
          .eq('id', item.item_id)
          .single();

        if (queryError || !query) {
          throw new Error('No se pudo cargar la consulta');
        }

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('*, items:order_items(*)')
          .eq('id', query.order_id)
          .single();

        if (orderError || !order) {
          throw new Error('No se pudo cargar el pedido de la consulta');
        }

        receiptText = generateQueryReceiptText(
          order as Order,
          query.query_text,
          printerConfig || undefined
        );
      } else if (item.item_type === 'customer_orders') {
        const customerId = item.metadata?.customer_id;
        if (!customerId) {
          throw new Error('No se encontró el ID del cliente');
        }

        const { data: customer, error } = await supabase
          .from('customers')
          .select('*, orders(*)')
          .eq('id', customerId)
          .single();

        if (error || !customer) {
          throw new Error('No se pudo cargar el cliente');
        }

        receiptText = generatePendingOrdersReceipt(customer as Customer);
      } else if (item.item_type === 'payment') {
        const { customer_id, amount, notes } = item.metadata || {};
        if (!customer_id) {
          throw new Error('No se encontró el ID del cliente');
        }

        const { data: customer, error } = await supabase
          .from('customers')
          .select('*')
          .eq('id', customer_id)
          .single();

        if (error || !customer) {
          throw new Error('No se pudo cargar el cliente');
        }

        receiptText = generatePaymentReceipt(customer as Customer, amount, notes || '');
      }

      // Print the receipt
      await printReceipt(
        receiptText,
        printerConfig?.auto_cut_enabled !== false,
        printerConfig?.text_size || 'medium'
      );

      // Mark as printed
      await markAsPrinted(item.id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Reload queue
      loadQueue();
    } catch (error: any) {
      console.error('[PrinterQueue] Error printing:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Mark as failed
      await markAsFailed(item.id, error.message || 'Error desconocido');
      
      Alert.alert('Error de Impresión', error.message || 'No se pudo imprimir el documento');
      loadQueue();
    } finally {
      setPrinting(null);
    }
  };

  const handleDeleteItem = (item: PrintQueueItem) => {
    Alert.alert(
      'Eliminar de la Cola',
      '¿Estás seguro que deseas eliminar este elemento de la cola de impresión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deletePrintQueueItem(item.id);
            loadQueue();
          },
        },
      ]
    );
  };

  const handleClearPrinted = () => {
    Alert.alert(
      'Limpiar Cola',
      '¿Deseas eliminar todos los elementos ya impresos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          onPress: async () => {
            await clearPrintedItems();
            loadQueue();
          },
        },
      ]
    );
  };

  const getItemTypeLabel = (type: string): string => {
    switch (type) {
      case 'order':
        return 'Pedido';
      case 'query':
        return 'Consulta';
      case 'payment':
        return 'Pago';
      case 'customer_orders':
        return 'Pedidos del Cliente';
      default:
        return type;
    }
  };

  const getItemTypeIcon = (type: string): string => {
    switch (type) {
      case 'order':
        return 'doc.text.fill';
      case 'query':
        return 'questionmark.circle.fill';
      case 'payment':
        return 'dollarsign.circle.fill';
      case 'customer_orders':
        return 'list.bullet.rectangle';
      default:
        return 'doc.fill';
    }
  };

  const renderQueueItem = ({ item }: { item: PrintQueueItem }) => {
    const isPrinting = printing === item.id;

    return (
      <View style={styles.queueItem}>
        <View style={styles.queueItemHeader}>
          <View style={styles.queueItemLeft}>
            <IconSymbol
              name={getItemTypeIcon(item.item_type)}
              size={24}
              color={colors.primary}
            />
            <View style={styles.queueItemInfo}>
              <Text style={styles.queueItemType}>{getItemTypeLabel(item.item_type)}</Text>
              <Text style={styles.queueItemDate}>{formatDate(item.created_at)}</Text>
            </View>
          </View>
          <View style={styles.queueItemActions}>
            <TouchableOpacity
              style={[styles.printButton, isPrinting && styles.printButtonDisabled]}
              onPress={() => handlePrintItem(item)}
              disabled={isPrinting || !isConnected}
            >
              {isPrinting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <IconSymbol name="printer.fill" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteItem(item)}
              disabled={isPrinting}
            >
              <IconSymbol name="trash.fill" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando cola de impresión...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Cola de Impresión',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/settings/printer')}
              style={{ marginRight: 16 }}
            >
              <IconSymbol name="gearshape.fill" size={24} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        {/* Connection Status */}
        <View style={[styles.statusBar, isConnected ? styles.statusConnected : styles.statusDisconnected]}>
          <IconSymbol
            name={isConnected ? 'checkmark.circle.fill' : 'exclamationmark.triangle.fill'}
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.statusText}>
            {isConnected ? 'Impresora Conectada' : 'Sin Impresora Conectada'}
          </Text>
          {!isConnected && (
            <TouchableOpacity
              style={styles.connectButton}
              onPress={() => router.push('/settings/printer')}
            >
              <Text style={styles.connectButtonText}>Conectar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Queue List */}
        {queueItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="tray.fill" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Cola Vacía</Text>
            <Text style={styles.emptyText}>
              No hay documentos pendientes de impresión
            </Text>
          </View>
        ) : (
          <FlatList
            data={queueItems}
            renderItem={renderQueueItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
          />
        )}

        {/* Clear Button */}
        {queueItems.length > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearPrinted}
            >
              <IconSymbol name="trash.fill" size={20} color={colors.error} />
              <Text style={styles.clearButtonText}>Limpiar Impresos</Text>
            </TouchableOpacity>
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
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  statusConnected: {
    backgroundColor: colors.success,
  },
  statusDisconnected: {
    backgroundColor: colors.warning,
  },
  statusText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  connectButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  queueItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  queueItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  queueItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  queueItemInfo: {
    flex: 1,
  },
  queueItemType: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  queueItemDate: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  queueItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  printButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  printButtonDisabled: {
    opacity: 0.6,
  },
  deleteButton: {
    backgroundColor: colors.error + '20',
    width: 44,
    height: 44,
    borderRadius: 22,
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
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error + '20',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
});
