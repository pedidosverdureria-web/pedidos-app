
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Switch,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import { CustomDialog, DialogButton } from '@/components/CustomDialog';
import { PrintQueueItem, Order, OrderQuery, Customer, OrderStatus } from '@/types';
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
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';

const PRINTER_CONFIG_KEY = '@printer_config';
const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds
const AUTO_PRINT_CHECK_INTERVAL = 5000; // 5 seconds

interface DialogState {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  buttons?: DialogButton[];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
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

function centerText(text: string, width: number): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text;
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
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

function generateDebtReceipt(customer: Customer, config?: PrinterConfig): string {
  const width = config?.paper_size === '58mm' ? 32 : 48;
  
  let receipt = '';
  
  if (config?.include_logo !== false) {
    receipt += centerText('DEUDA VALES PENDIENTES', width) + '\n';
    receipt += '='.repeat(width) + '\n\n';
  }
  
  receipt += `Cliente: ${customer.name}\n`;
  if (customer.phone) {
    receipt += `Telefono: ${customer.phone}\n`;
  }
  if (customer.address) {
    receipt += `Direccion: ${customer.address}\n`;
  }
  receipt += `Fecha: ${formatDateTime(new Date().toISOString())}\n`;
  receipt += '-'.repeat(width) + '\n\n';
  
  receipt += 'RESUMEN VALES PENDIENTES:\n\n';
  
  // Filter only pending_payment orders
  const pendingOrders = customer.orders?.filter(order => order.status === 'pending_payment') || [];
  
  if (pendingOrders.length > 0) {
    let totalDebt = 0;
    
    for (const order of pendingOrders) {
      const orderDebt = order.total_amount - order.paid_amount;
      totalDebt += orderDebt;
      
      receipt += `Pedido: ${order.order_number}\n`;
      receipt += `Fecha: ${formatDate(order.created_at)}\n`;
      
      const productCount = order.items?.length || 0;
      receipt += `Productos: ${productCount}\n`;
      
      receipt += `Monto Total: ${formatCLP(order.total_amount)}\n`;
      receipt += '\n';
    }
    
    receipt += '-'.repeat(width) + '\n';
    receipt += `TOTAL VALES: ${pendingOrders.length}\n`;
    receipt += `SUMA TOTAL DEUDA: ${formatCLP(totalDebt)}\n`;
  } else {
    receipt += 'No hay vales pendientes\n\n';
    receipt += '-'.repeat(width) + '\n';
    receipt += 'SUMA TOTAL DEUDA: $0\n';
  }
  
  receipt += '\n' + '='.repeat(width) + '\n';
  receipt += centerText('Documento para gestion de cobranza', width) + '\n\n\n';
  
  return receipt;
}

export default function PrinterQueueScreen() {
  const { user, signOut } = useAuth();
  const { isConnected, printReceipt } = usePrinter();
  const [queueItems, setQueueItems] = useState<PrintQueueItem[]>([]);
  const [incomingOrders, setIncomingOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig | null>(null);
  const [printing, setPrinting] = useState<string | null>(null);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(false);
  const [viewMode, setViewMode] = useState<'orders' | 'queue'>('orders');
  const [dialog, setDialog] = useState<DialogState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });
  
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoPrintIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPrintingRef = useRef(false);
  const keepAwakeTagRef = useRef<string>('printer-profile');
  const isKeepAwakeActiveRef = useRef<boolean>(false);

  const showDialog = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, buttons?: DialogButton[]) => {
    setDialog({ visible: true, type, title, message, buttons });
  };

  const closeDialog = () => {
    setDialog({ ...dialog, visible: false });
  };

  // Redirect if not printer role
  useEffect(() => {
    if (user && user.role !== 'printer') {
      showDialog('error', 'Acceso Denegado', 'Esta pantalla es solo para el perfil Impresor', [
        {
          text: 'OK',
          onPress: () => {
            closeDialog();
            router.back();
          },
          style: 'primary',
        },
      ]);
    }
  }, [user]);

  const loadPrinterConfig = useCallback(async () => {
    try {
      const configJson = await AsyncStorage.getItem(PRINTER_CONFIG_KEY);
      if (configJson) {
        const config = JSON.parse(configJson);
        setPrinterConfig(config);
        setAutoPrintEnabled(config.auto_print_enabled ?? false);
        console.log('[PrinterQueue] Printer config loaded:', config);
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
    }
  }, []);

  const loadIncomingOrders = useCallback(async () => {
    try {
      console.log('[PrinterQueue] Loading incoming orders');
      const supabase = getSupabase();
      
      // Get all pending and preparing orders
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*), queries:order_queries(*)')
        .in('status', ['pending', 'preparing'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[PrinterQueue] Error loading orders:', error);
        return;
      }

      setIncomingOrders(orders || []);
      console.log('[PrinterQueue] Loaded', orders?.length || 0, 'incoming orders');
    } catch (error) {
      console.error('[PrinterQueue] Error loading incoming orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    await Promise.all([loadQueue(), loadIncomingOrders()]);
  }, [loadQueue, loadIncomingOrders]);

  useEffect(() => {
    loadPrinterConfig();
    loadData();
  }, [loadPrinterConfig, loadData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    console.log('[PrinterQueue] Setting up auto-refresh (30 seconds)');
    
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
    }

    autoRefreshIntervalRef.current = setInterval(() => {
      console.log('[PrinterQueue] Auto-refresh triggered');
      loadData();
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      if (autoRefreshIntervalRef.current) {
        console.log('[PrinterQueue] Clearing auto-refresh interval');
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
    };
  }, [loadData]);

  // Check if order already printed
  const isOrderAlreadyPrinted = useCallback(async (orderId: string): Promise<boolean> => {
    try {
      const supabase = getSupabase();
      
      const { data, error } = await supabase
        .from('print_queue')
        .select('id, status')
        .eq('item_type', 'order')
        .eq('item_id', orderId)
        .in('status', ['printed', 'failed'])
        .limit(1);

      if (error) {
        console.error('[PrinterQueue] Error checking if order is printed:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('[PrinterQueue] Error checking if order is printed:', error);
      return false;
    }
  }, []);

  // Mark order as printed
  const markOrderAsPrinted = useCallback(async (orderId: string): Promise<void> => {
    try {
      const supabase = getSupabase();
      
      const { data: existing } = await supabase
        .from('print_queue')
        .select('id')
        .eq('item_type', 'order')
        .eq('item_id', orderId)
        .limit(1);

      if (existing && existing.length > 0) {
        await supabase
          .from('print_queue')
          .update({
            status: 'printed',
            printed_at: new Date().toISOString(),
          })
          .eq('id', existing[0].id);
      } else {
        await supabase
          .from('print_queue')
          .insert({
            item_type: 'order',
            item_id: orderId,
            status: 'printed',
            printed_at: new Date().toISOString(),
          });
      }

      console.log('[PrinterQueue] Order marked as printed:', orderId);
    } catch (error) {
      console.error('[PrinterQueue] Error marking order as printed:', error);
    }
  }, []);

  // handlePrintItem function - defined before being used in checkAndPrintNewOrders
  const handlePrintItem = useCallback(async (item: PrintQueueItem) => {
    if (!isConnected) {
      showDialog('error', 'Error', 'No hay impresora conectada. Ve a Configuración > Impresora para conectar una.');
      return;
    }

    try {
      setPrinting(item.id);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const supabase = getSupabase();
      let receiptText = '';

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
      } else if (item.item_type === 'customer_debt') {
        // Handle customer debt receipt
        const customerId = item.item_id;
        
        // Check if receipt text is already in metadata
        if (item.metadata?.receipt_text) {
          receiptText = item.metadata.receipt_text;
        } else {
          // Fetch customer data and generate receipt
          const { data: customer, error } = await supabase
            .from('customers')
            .select('*, orders(*, items:order_items(*))')
            .eq('id', customerId)
            .single();

          if (error || !customer) {
            throw new Error('No se pudo cargar el cliente');
          }

          receiptText = generateDebtReceipt(customer as Customer, printerConfig || undefined);
        }
      }

      const autoCut = printerConfig?.auto_cut_enabled ?? true;
      const textSize = printerConfig?.text_size || 'medium';
      
      await printReceipt(receiptText, autoCut, textSize);
      await markAsPrinted(item.id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      loadData();
    } catch (error: any) {
      console.error('[PrinterQueue] Error printing:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      await markAsFailed(item.id, error.message || 'Error desconocido');
      showDialog('error', 'Error de Impresión', error.message || 'No se pudo imprimir el documento');
      loadData();
    } finally {
      setPrinting(null);
    }
  }, [isConnected, printerConfig, printReceipt, loadData]);

  // Auto-print function - now includes handlePrintItem in dependencies
  const checkAndPrintNewOrders = useCallback(async () => {
    if (!autoPrintEnabled || !isConnected || isPrintingRef.current) {
      return;
    }

    console.log('[PrinterQueue] Checking for orders to auto-print...');

    // Check pending orders
    const pendingOrders = incomingOrders.filter(o => o.status === 'pending');
    
    for (const order of pendingOrders) {
      const alreadyPrinted = await isOrderAlreadyPrinted(order.id);
      if (alreadyPrinted || isPrintingRef.current) {
        continue;
      }

      isPrintingRef.current = true;
      
      try {
        console.log('[PrinterQueue] Auto-printing order:', order.order_number);
        
        // Use auto_print context for auto-printed orders
        const receiptText = generateReceiptText(order, printerConfig || undefined, 'auto_print');
        const autoCut = printerConfig?.auto_cut_enabled ?? true;
        const textSize = printerConfig?.text_size || 'medium';
        
        await printReceipt(receiptText, autoCut, textSize);
        await markOrderAsPrinted(order.id);
        
        console.log('[PrinterQueue] Order auto-printed successfully');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Reload data
        loadData();
      } catch (error) {
        console.error('[PrinterQueue] Error auto-printing order:', error);
      } finally {
        isPrintingRef.current = false;
      }
      
      break; // Only print one at a time
    }

    // Check print queue
    const pendingQueue = queueItems.filter(item => item.status === 'pending');
    
    for (const queueItem of pendingQueue) {
      if (isPrintingRef.current) break;
      
      isPrintingRef.current = true;
      
      try {
        await handlePrintItem(queueItem);
      } catch (error) {
        console.error('[PrinterQueue] Error auto-printing queue item:', error);
      } finally {
        isPrintingRef.current = false;
      }
      
      break; // Only print one at a time
    }
  }, [autoPrintEnabled, isConnected, incomingOrders, queueItems, printerConfig, printReceipt, isOrderAlreadyPrinted, markOrderAsPrinted, loadData, handlePrintItem]);

  // Auto-print interval
  useEffect(() => {
    if (autoPrintIntervalRef.current) {
      clearInterval(autoPrintIntervalRef.current);
      autoPrintIntervalRef.current = null;
    }

    if (autoPrintEnabled && isConnected) {
      console.log('[PrinterQueue] Setting up auto-print interval');
      
      checkAndPrintNewOrders();
      
      autoPrintIntervalRef.current = setInterval(() => {
        console.log('[PrinterQueue] Auto-print interval triggered');
        checkAndPrintNewOrders();
      }, AUTO_PRINT_CHECK_INTERVAL);
    }

    return () => {
      if (autoPrintIntervalRef.current) {
        console.log('[PrinterQueue] Clearing auto-print interval');
        clearInterval(autoPrintIntervalRef.current);
        autoPrintIntervalRef.current = null;
      }
    };
  }, [autoPrintEnabled, isConnected, checkAndPrintNewOrders]);

  // Keep awake management
  useEffect(() => {
    const shouldKeepAwake = autoPrintEnabled && isConnected;
    const keepAwakeTag = keepAwakeTagRef.current;
    
    const manageKeepAwake = async () => {
      if (shouldKeepAwake) {
        if (!isKeepAwakeActiveRef.current) {
          try {
            console.log('[PrinterQueue] Activating keep awake');
            await activateKeepAwake(keepAwakeTag);
            isKeepAwakeActiveRef.current = true;
          } catch (error) {
            console.error('[PrinterQueue] Error activating keep awake:', error);
          }
        }
      } else {
        if (isKeepAwakeActiveRef.current) {
          try {
            console.log('[PrinterQueue] Deactivating keep awake');
            await deactivateKeepAwake(keepAwakeTag);
            isKeepAwakeActiveRef.current = false;
          } catch (error) {
            console.error('[PrinterQueue] Error deactivating keep awake:', error);
          }
        }
      }
    };

    manageKeepAwake();

    return () => {
      if (isKeepAwakeActiveRef.current) {
        console.log('[PrinterQueue] Cleanup: Deactivating keep awake');
        deactivateKeepAwake(keepAwakeTag).catch((error) => {
          console.error('[PrinterQueue] Error deactivating keep awake in cleanup:', error);
        });
        isKeepAwakeActiveRef.current = false;
      }
    };
  }, [autoPrintEnabled, isConnected]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleToggleAutoPrint = async (value: boolean) => {
    try {
      setAutoPrintEnabled(value);
      
      const config = {
        ...printerConfig,
        auto_print_enabled: value,
      };
      
      await AsyncStorage.setItem(PRINTER_CONFIG_KEY, JSON.stringify(config));
      setPrinterConfig(config);
      
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      console.log('[PrinterQueue] Auto-print', value ? 'enabled' : 'disabled');
    } catch (error) {
      console.error('[PrinterQueue] Error toggling auto-print:', error);
    }
  };

  const handleLogout = () => {
    showDialog('warning', 'Cerrar Sesión', '¿Estás seguro que deseas cerrar sesión?', [
      {
        text: 'Cancelar',
        style: 'cancel',
        onPress: closeDialog,
      },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await signOut();
            closeDialog();
            router.replace('/login');
          } catch (error) {
            console.error('[PrinterQueue] Error signing out:', error);
            showDialog('error', 'Error', 'No se pudo cerrar sesión');
          }
        },
      },
    ]);
  };

  const handlePrintOrder = async (order: Order) => {
    if (!isConnected) {
      showDialog('error', 'Error', 'No hay impresora conectada. Ve a Configuración > Impresora para conectar una.');
      return;
    }

    try {
      setPrinting(order.id);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Use manual_print context for manually printed orders from printer queue
      const receiptText = generateReceiptText(order, printerConfig || undefined, 'manual_print');
      const autoCut = printerConfig?.auto_cut_enabled ?? true;
      const textSize = printerConfig?.text_size || 'medium';
      
      await printReceipt(receiptText, autoCut, textSize);
      await markOrderAsPrinted(order.id);
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showDialog('success', 'Éxito', 'Pedido impreso correctamente');
      
      loadData();
    } catch (error: any) {
      console.error('[PrinterQueue] Error printing order:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showDialog('error', 'Error de Impresión', error.message || 'No se pudo imprimir el pedido');
    } finally {
      setPrinting(null);
    }
  };

  const handleDeleteItem = (item: PrintQueueItem) => {
    showDialog('warning', 'Eliminar de la Cola', '¿Estás seguro que deseas eliminar este elemento de la cola de impresión?', [
      {
        text: 'Cancelar',
        style: 'cancel',
        onPress: closeDialog,
      },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deletePrintQueueItem(item.id);
          closeDialog();
          loadData();
        },
      },
    ]);
  };

  const handleClearPrinted = () => {
    showDialog('info', 'Limpiar Cola', '¿Deseas eliminar todos los elementos ya impresos?', [
      {
        text: 'Cancelar',
        style: 'cancel',
        onPress: closeDialog,
      },
      {
        text: 'Limpiar',
        style: 'primary',
        onPress: async () => {
          await clearPrintedItems();
          closeDialog();
          loadData();
        },
      },
    ]);
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
      case 'customer_debt':
        return 'Deuda del Cliente';
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
      case 'customer_debt':
        return 'exclamationmark.triangle.fill';
      default:
        return 'doc.fill';
    }
  };

  const renderOrderCard = ({ item }: { item: Order }) => {
    const isPrinting = printing === item.id;
    const total = item.items?.reduce((sum, orderItem) => sum + orderItem.unit_price, 0) || 0;
    const itemCount = item.items?.length || 0;

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <View style={styles.orderInfo}>
              <Text style={styles.orderNumber}>{item.order_number}</Text>
              <Text style={styles.orderCustomer}>{item.customer_name}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.printButton, isPrinting && styles.printButtonDisabled]}
            onPress={() => handlePrintOrder(item)}
            disabled={isPrinting || !isConnected}
          >
            {isPrinting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <IconSymbol name="printer.fill" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
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
      </View>
    );
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
              style={[styles.printButtonSmall, isPrinting && styles.printButtonDisabled]}
              onPress={() => handlePrintItem(item)}
              disabled={isPrinting || !isConnected}
            >
              {isPrinting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <IconSymbol name="printer.fill" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteItem(item)}
              disabled={isPrinting}
            >
              <IconSymbol name="trash.fill" size={18} color={colors.error} />
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
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  const pendingOrders = incomingOrders.filter(o => o.status === 'pending');
  const preparingOrders = incomingOrders.filter(o => o.status === 'preparing');

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Perfil Impresor',
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
        {/* Status Bar */}
        <View style={[styles.statusBar, isConnected ? styles.statusConnected : styles.statusDisconnected]}>
          <View style={styles.statusLeft}>
            <IconSymbol
              name={isConnected ? 'checkmark.circle.fill' : 'exclamationmark.triangle.fill'}
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.statusText}>
              {isConnected ? 'Impresora Conectada' : 'Sin Impresora'}
            </Text>
          </View>
          {!isConnected && (
            <TouchableOpacity
              style={styles.connectButton}
              onPress={() => router.push('/settings/printer')}
            >
              <Text style={styles.connectButtonText}>Conectar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Auto-Print Toggle */}
        <View style={styles.autoPrintBar}>
          <View style={styles.autoPrintLeft}>
            <IconSymbol
              name={autoPrintEnabled ? 'bolt.fill' : 'bolt.slash.fill'}
              size={20}
              color={autoPrintEnabled ? colors.success : colors.textSecondary}
            />
            <Text style={styles.autoPrintText}>Auto-impresión</Text>
          </View>
          <Switch
            value={autoPrintEnabled}
            onValueChange={handleToggleAutoPrint}
            trackColor={{ false: colors.border, true: colors.success }}
            disabled={!isConnected}
          />
        </View>

        {/* View Mode Toggle */}
        <View style={styles.viewModeBar}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'orders' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('orders')}
          >
            <Text style={[styles.viewModeText, viewMode === 'orders' && styles.viewModeTextActive]}>
              Pedidos ({pendingOrders.length + preparingOrders.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'queue' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('queue')}
          >
            <Text style={[styles.viewModeText, viewMode === 'queue' && styles.viewModeTextActive]}>
              Cola ({queueItems.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {viewMode === 'orders' ? (
          incomingOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol name="tray.fill" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>Sin Pedidos</Text>
              <Text style={styles.emptyText}>
                No hay pedidos pendientes o en preparación
              </Text>
            </View>
          ) : (
            <FlatList
              data={incomingOrders}
              renderItem={renderOrderCard}
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
          )
        ) : (
          queueItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol name="tray.fill" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>Cola Vacía</Text>
              <Text style={styles.emptyText}>
                No hay documentos pendientes de impresión
              </Text>
            </View>
          ) : (
            <>
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
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={handleClearPrinted}
                >
                  <IconSymbol name="trash.fill" size={20} color={colors.error} />
                  <Text style={styles.clearButtonText}>Limpiar Impresos</Text>
                </TouchableOpacity>
              </View>
            </>
          )
        )}

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color="#FFFFFF" />
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Custom Dialog */}
      <CustomDialog
        visible={dialog.visible}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        buttons={dialog.buttons}
        onClose={closeDialog}
      />
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
    justifyContent: 'space-between',
    padding: 16,
  },
  statusConnected: {
    backgroundColor: colors.success,
  },
  statusDisconnected: {
    backgroundColor: colors.warning,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
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
  autoPrintBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  autoPrintLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  autoPrintText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  viewModeBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: colors.primary,
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  viewModeTextActive: {
    color: '#FFFFFF',
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
  printButtonSmall: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: colors.error + '20',
    width: 40,
    height: 40,
    borderRadius: 20,
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
  logoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
