
import { 
  sendOrderStatusUpdate, 
  sendProductAddedNotification, 
  sendProductRemovedNotification,
  sendOrderDeletedNotification 
} from '@/utils/whatsappNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { usePrinter } from '@/hooks/usePrinter';
import * as Haptics from 'expo-haptics';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  TextInput,
  Modal,
} from 'react-native';
import { Order, OrderStatus, OrderItem } from '@/types';
import React, { useState, useEffect, useCallback } from 'react';
import { createInAppNotification, sendLocalNotification } from '@/utils/pushNotifications';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { getSupabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, router, useLocalSearchParams } from 'expo-router';

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

const PRINTER_CONFIG_KEY = '@printer_config';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  orderDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  currentStatusContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  currentStatusLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  currentStatusBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentStatusText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusTransitionsLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  productItemLast: {
    borderBottomWidth: 0,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  productDetails: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bulkPriceButton: {
    backgroundColor: colors.secondary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  actionButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  printButton: {
    backgroundColor: '#3B82F6',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  editButton: {
    backgroundColor: '#F59E0B',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.border,
  },
  modalButtonConfirm: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  priceInputLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  priceInputField: {
    width: 120,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
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

function getStatusIcon(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'clock';
    case 'preparing':
      return 'flame';
    case 'ready':
      return 'checkmark.circle';
    case 'delivered':
      return 'shippingbox';
    case 'cancelled':
      return 'xmark.circle';
    default:
      return 'circle';
  }
}

function getAvailableStatusTransitions(currentStatus: OrderStatus): OrderStatus[] {
  switch (currentStatus) {
    case 'pending':
      return ['preparing', 'cancelled'];
    case 'preparing':
      return ['ready', 'cancelled'];
    case 'ready':
      return ['delivered', 'cancelled'];
    case 'delivered':
      return [];
    case 'cancelled':
      return [];
    default:
      return [];
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
  
  // Extract unit from "Unidad: xxx" format
  const unitMatch = lowerNotes.match(/unidad:\s*(\w+)/);
  if (unitMatch) {
    return unitMatch[1];
  }
  
  // Fallback to old detection method
  if (lowerNotes.includes('kg') || lowerNotes.includes('kilo')) return 'kg';
  if (lowerNotes.includes('gr') || lowerNotes.includes('gramo')) return 'gr';
  if (lowerNotes.includes('lt') || lowerNotes.includes('litro')) return 'lt';
  if (lowerNotes.includes('ml')) return 'ml';
  if (lowerNotes.includes('un') || lowerNotes.includes('unidad')) return 'un';
  return '';
}

function formatProductDisplay(item: OrderItem): string {
  const unit = getUnitFromNotes(item.notes);
  
  // Determine the unit text
  let unitText = '';
  if (unit === 'kg' || unit === 'kilo' || unit === 'kilos') {
    unitText = item.quantity === 1 ? 'kilo' : 'kilos';
  } else if (unit === 'gr' || unit === 'gramo' || unit === 'gramos') {
    unitText = item.quantity === 1 ? 'gramo' : 'gramos';
  } else if (unit === 'lt' || unit === 'litro' || unit === 'litros') {
    unitText = item.quantity === 1 ? 'litro' : 'litros';
  } else if (unit === 'ml') {
    unitText = 'ml';
  } else if (unit === 'un' || unit === 'unidad' || unit === 'unidades') {
    unitText = item.quantity === 1 ? 'unidad' : 'unidades';
  } else if (unit) {
    // For any other unit (like malla, docena, etc.), use it directly
    // Check if it needs pluralization
    if (item.quantity === 1) {
      unitText = unit;
    } else {
      // Simple pluralization: add 's' if doesn't end with 's'
      unitText = unit.endsWith('s') ? unit : unit + 's';
    }
  } else {
    unitText = item.quantity === 1 ? 'unidad' : 'unidades';
  }
  
  return `${item.quantity} ${unitText} de ${item.product_name}`;
}

function getAdditionalNotes(notes: string | null | undefined): string {
  if (!notes) return '';
  
  // Remove the "Unidad: xxx" part from notes
  const cleanNotes = notes.replace(/unidad:\s*\w+/gi, '').trim();
  
  return cleanNotes;
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

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { user } = useAuth();
  const { printReceipt, isConnected } = usePrinter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig | null>(null);

  // Customer info editing
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Product editing
  const [editingProduct, setEditingProduct] = useState<OrderItem | null>(null);
  const [productName, setProductName] = useState('');
  const [productQuantity, setProductQuantity] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productNotes, setProductNotes] = useState('');

  // Bulk price modal
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [bulkPrices, setBulkPrices] = useState<{ [key: string]: string }>({});

  const loadOrder = useCallback(async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('id', orderId)
        .single();

      if (error) throw error;

      setOrder(data);
      setCustomerName(data.customer_name);
      setCustomerPhone(data.customer_phone || '');
      setCustomerAddress(data.customer_address || '');
    } catch (error) {
      console.error('[OrderDetail] Error loading order:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error',
        'No se pudo cargar el pedido. Por favor intenta nuevamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const loadPrinterConfig = useCallback(async () => {
    try {
      const configStr = await AsyncStorage.getItem(PRINTER_CONFIG_KEY);
      if (configStr) {
        setPrinterConfig(JSON.parse(configStr));
      }
    } catch (error) {
      console.error('[OrderDetail] Error loading printer config:', error);
    }
  }, []);

  useEffect(() => {
    loadOrder();
    loadPrinterConfig();
  }, [loadOrder, loadPrinterConfig]);

  const updateCustomerInfo = async () => {
    if (!order) return;

    if (!customerName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('⚠️ Atención', 'El nombre del cliente es obligatorio');
      return;
    }

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('orders')
        .update({
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: customerAddress,
        })
        .eq('id', order.id);

      if (error) throw error;

      setEditingCustomer(false);
      await loadOrder();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Éxito',
        'La información del cliente se actualizó correctamente',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[OrderDetail] Error updating customer:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error',
        'No se pudo actualizar la información del cliente. Por favor intenta nuevamente.',
        [{ text: 'OK' }]
      );
    }
  };

  const updateStatus = async (newStatus: OrderStatus) => {
    if (!order) return;

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);

      if (error) throw error;

      await sendOrderStatusUpdate(order.id, newStatus);
      await createInAppNotification(
        user?.id || '',
        'order_status_changed',
        `Pedido ${order.order_number} cambió a ${getStatusLabel(newStatus)}`,
        { orderId: order.id }
      );

      await loadOrder();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Estado Actualizado',
        `El pedido ahora está en estado: ${getStatusLabel(newStatus)}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[OrderDetail] Error updating status:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error',
        'No se pudo actualizar el estado del pedido. Por favor intenta nuevamente.',
        [{ text: 'OK' }]
      );
    }
  };

  const addProduct = async () => {
    if (!order || !productName || !productQuantity) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('⚠️ Atención', 'Por favor completa el nombre y la cantidad del producto');
      return;
    }

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_name: productName,
          quantity: parseFloat(productQuantity),
          unit_price: parseFloat(productPrice) || 0,
          notes: productNotes,
        })
        .select()
        .single();

      if (error) throw error;

      await sendProductAddedNotification(order.id, data.id);
      await loadOrder();

      setProductName('');
      setProductQuantity('');
      setProductPrice('');
      setProductNotes('');

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Producto Agregado',
        `${productName} se agregó correctamente al pedido`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[OrderDetail] Error adding product:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error',
        'No se pudo agregar el producto. Por favor intenta nuevamente.',
        [{ text: 'OK' }]
      );
    }
  };

  const updateProduct = async (itemId: string) => {
    if (!productName || !productQuantity) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('⚠️ Atención', 'Por favor completa el nombre y la cantidad del producto');
      return;
    }

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('order_items')
        .update({
          product_name: productName,
          quantity: parseFloat(productQuantity),
          unit_price: parseFloat(productPrice) || 0,
          notes: productNotes,
        })
        .eq('id', itemId);

      if (error) throw error;

      setEditingProduct(null);
      await loadOrder();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Producto Actualizado',
        'Los cambios se guardaron correctamente',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[OrderDetail] Error updating product:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error',
        'No se pudo actualizar el producto. Por favor intenta nuevamente.',
        [{ text: 'OK' }]
      );
    }
  };

  const deleteProduct = async (itemId: string) => {
    if (!order) return;

    const item = order.items?.find(i => i.id === itemId);
    if (!item) return;

    Alert.alert(
      '🗑️ Eliminar Producto',
      `¿Estás seguro de que deseas eliminar "${item.product_name}" del pedido?`,
      [
        { 
          text: 'Cancelar', 
          style: 'cancel',
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const supabase = getSupabase();
              const { error } = await supabase
                .from('order_items')
                .delete()
                .eq('id', itemId);

              if (error) throw error;

              await sendProductRemovedNotification(order.id, item);
              await loadOrder();
              
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(
                '✅ Producto Eliminado',
                `${item.product_name} se eliminó del pedido`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('[OrderDetail] Error deleting product:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert(
                '❌ Error',
                'No se pudo eliminar el producto. Por favor intenta nuevamente.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const startEditingProduct = (item: OrderItem) => {
    setEditingProduct(item);
    setProductName(item.product_name);
    setProductQuantity(item.quantity.toString());
    setProductPrice(item.unit_price.toString());
    setProductNotes(item.notes || '');
  };

  const openPriceModal = () => {
    // Initialize bulk prices with current prices
    const initialPrices: { [key: string]: string } = {};
    order?.items?.forEach(item => {
      initialPrices[item.id] = item.unit_price.toString();
    });
    setBulkPrices(initialPrices);
    setShowPriceModal(true);
  };

  const updateBulkPrice = (itemId: string, price: string) => {
    setBulkPrices(prev => ({
      ...prev,
      [itemId]: price,
    }));
  };

  const applyBulkPrices = async () => {
    if (!order) return;

    try {
      const supabase = getSupabase();
      
      // Update each product with its individual price
      for (const item of order.items || []) {
        const priceStr = bulkPrices[item.id];
        if (priceStr) {
          const price = parseFloat(priceStr);
          if (!isNaN(price)) {
            await supabase
              .from('order_items')
              .update({ unit_price: price })
              .eq('id', item.id);
          }
        }
      }

      setShowPriceModal(false);
      await loadOrder();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Precios Actualizados',
        'Los precios de los productos se actualizaron correctamente',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[OrderDetail] Error applying prices:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error',
        'No se pudieron actualizar los precios. Por favor intenta nuevamente.',
        [{ text: 'OK' }]
      );
    }
  };

  const handlePrint = async () => {
    if (!order) return;

    if (!isConnected) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        '⚠️ Impresora No Conectada',
        'Por favor conecta una impresora antes de imprimir',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const receiptText = generateReceiptText(order);
      const autoCut = printerConfig?.auto_cut_enabled ?? true;
      const textSize = printerConfig?.text_size || 'medium';
      const encoding = printerConfig?.encoding || 'CP850';

      await printReceipt(receiptText, autoCut, textSize, encoding);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Impresión Exitosa',
        'El pedido se imprimió correctamente',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[OrderDetail] Print error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error de Impresión',
        'No se pudo imprimir el pedido. Verifica la conexión con la impresora.',
        [{ text: 'OK' }]
      );
    }
  };

  const generateReceiptText = (order: Order): string => {
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
      // Use formatProductDisplay to get the webhook format
      receipt += `${formatProductDisplay(item)}\n`;
      
      // Add additional notes if they exist (excluding unit information)
      const additionalNotes = getAdditionalNotes(item.notes);
      if (additionalNotes) {
        receipt += `  ${additionalNotes}\n`;
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
  };

  const centerText = (text: string, width: number): string => {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  };

  const wrapText = (text: string, width: number): string => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + word).length <= width) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    return lines.join('\n');
  };

  const handleWhatsApp = async () => {
    if (!order?.customer_phone) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        '⚠️ Sin Número de Teléfono',
        'Este pedido no tiene un número de teléfono asociado',
        [{ text: 'OK' }]
      );
      return;
    }

    const phone = order.customer_phone.replace(/\D/g, '');
    const url = `https://wa.me/${phone}`;

    try {
      await Linking.openURL(url);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('[OrderDetail] Error opening WhatsApp:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error',
        'No se pudo abrir WhatsApp. Verifica que esté instalado en tu dispositivo.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDelete = () => {
    if (!order) return;

    Alert.alert(
      '🗑️ Eliminar Pedido',
      `¿Estás seguro de que deseas eliminar el pedido ${order.order_number}? Esta acción no se puede deshacer.`,
      [
        { 
          text: 'Cancelar', 
          style: 'cancel',
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              const supabase = getSupabase();
              
              await supabase.from('order_items').delete().eq('order_id', order.id);
              await supabase.from('orders').delete().eq('id', order.id);

              await sendOrderDeletedNotification(order.id);

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(
                '✅ Pedido Eliminado',
                `El pedido ${order.order_number} se eliminó correctamente`,
                [{ 
                  text: 'OK',
                  onPress: () => router.back()
                }]
              );
            } catch (error) {
              console.error('[OrderDetail] Error deleting order:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert(
                '❌ Error',
                'No se pudo eliminar el pedido. Por favor intenta nuevamente.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: colors.text }}>Pedido no encontrado</Text>
      </View>
    );
  }

  const total = order.items?.reduce((sum, item) => sum + item.unit_price, 0) || 0;
  const availableTransitions = getAvailableStatusTransitions(order.status);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Detalle del Pedido',
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
        }}
      />
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.orderNumber}>{order.order_number}</Text>
          <Text style={styles.orderDate}>📅 {formatDate(order.created_at)}</Text>
          
          {/* Current Status Display */}
          <View style={styles.currentStatusContainer}>
            <Text style={styles.currentStatusLabel}>ESTADO ACTUAL</Text>
            <View style={[
              styles.currentStatusBadge,
              { backgroundColor: getStatusColor(order.status) }
            ]}>
              <IconSymbol 
                name={getStatusIcon(order.status)} 
                size={20} 
                color="#fff" 
              />
              <Text style={styles.currentStatusText}>
                {getStatusLabel(order.status)}
              </Text>
            </View>
          </View>
          
          {/* Status Transitions */}
          {availableTransitions.length > 0 && (
            <>
              <Text style={styles.statusTransitionsLabel}>Cambiar estado a:</Text>
              <View style={styles.statusContainer}>
                {availableTransitions.map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusButton,
                      { borderColor: getStatusColor(status) },
                    ]}
                    onPress={() => updateStatus(status)}
                  >
                    <IconSymbol 
                      name={getStatusIcon(status)} 
                      size={16} 
                      color={getStatusColor(status)} 
                    />
                    <Text
                      style={[
                        styles.statusButtonText,
                        { color: getStatusColor(status) },
                      ]}
                    >
                      {getStatusLabel(status)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          {editingCustomer ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Nombre"
                value={customerName}
                onChangeText={setCustomerName}
              />
              <TextInput
                style={styles.input}
                placeholder="Teléfono"
                value={customerPhone}
                onChangeText={setCustomerPhone}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Dirección"
                value={customerAddress}
                onChangeText={setCustomerAddress}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={updateCustomerInfo}
              >
                <IconSymbol name="checkmark.circle" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Guardar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.productName}>{order.customer_name}</Text>
              {order.customer_phone && (
                <Text style={styles.productDetails}>📞 {order.customer_phone}</Text>
              )}
              {order.customer_address && (
                <Text style={styles.productDetails}>📍 {order.customer_address}</Text>
              )}
              <TouchableOpacity
                style={[styles.addButton, { marginTop: 12 }]}
                onPress={() => setEditingCustomer(true)}
              >
                <IconSymbol name="pencil" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Editar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Productos</Text>
          </View>

          {order.items?.map((item, index) => {
            const additionalNotes = getAdditionalNotes(item.notes);
            
            return (
              <View
                key={item.id}
                style={[
                  styles.productItem,
                  index === (order.items?.length || 0) - 1 && styles.productItemLast,
                ]}
              >
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{formatProductDisplay(item)}</Text>
                  {additionalNotes && (
                    <Text style={styles.productDetails}>{additionalNotes}</Text>
                  )}
                  {item.unit_price > 0 && (
                    <Text style={styles.productDetails}>
                      {formatCLP(item.unit_price)}
                    </Text>
                  )}
                </View>
                <View style={styles.productActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => startEditingProduct(item)}
                  >
                    <IconSymbol name="pencil" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => deleteProduct(item.id)}
                  >
                    <IconSymbol name="trash" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {editingProduct ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Nombre del producto"
                value={productName}
                onChangeText={setProductName}
              />
              <TextInput
                style={styles.input}
                placeholder="Cantidad"
                value={productQuantity}
                onChangeText={setProductQuantity}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Precio"
                value={productPrice}
                onChangeText={setProductPrice}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Notas"
                value={productNotes}
                onChangeText={setProductNotes}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => updateProduct(editingProduct.id)}
              >
                <IconSymbol name="checkmark.circle" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Actualizar Producto</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.border }]}
                onPress={() => setEditingProduct(null)}
              >
                <IconSymbol name="xmark.circle" size={20} color={colors.text} />
                <Text style={[styles.addButtonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Nombre del producto"
                value={productName}
                onChangeText={setProductName}
              />
              <TextInput
                style={styles.input}
                placeholder="Cantidad"
                value={productQuantity}
                onChangeText={setProductQuantity}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Precio"
                value={productPrice}
                onChangeText={setProductPrice}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Notas"
                value={productNotes}
                onChangeText={setProductNotes}
              />
              <TouchableOpacity style={styles.addButton} onPress={addProduct}>
                <IconSymbol name="plus.circle" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Agregar Producto</Text>
              </TouchableOpacity>
              
              {order.items && order.items.length > 0 && (
                <TouchableOpacity style={styles.bulkPriceButton} onPress={openPriceModal}>
                  <IconSymbol name="dollarsign.circle" size={20} color="#fff" />
                  <Text style={styles.addButtonText}>Agregar Precios</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{formatCLP(total)}</Text>
          </View>
        </View>

        {/* Action Buttons with Icons and Colors */}
        <TouchableOpacity 
          style={[styles.actionButton, styles.printButton]} 
          onPress={handlePrint}
        >
          <IconSymbol name="printer" size={22} color="#fff" />
          <Text style={styles.actionButtonText}>Imprimir Pedido</Text>
        </TouchableOpacity>

        {order.customer_phone && (
          <TouchableOpacity
            style={[styles.actionButton, styles.whatsappButton]}
            onPress={handleWhatsApp}
          >
            <IconSymbol name="message.fill" size={22} color="#fff" />
            <Text style={styles.actionButtonText}>Enviar WhatsApp</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <IconSymbol name="trash" size={22} color="#fff" />
          <Text style={styles.actionButtonText}>Eliminar Pedido</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showPriceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPriceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar Precios a Productos</Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>
              Ingresa el precio para cada producto:
            </Text>
            
            <ScrollView style={styles.modalScrollView}>
              {order?.items?.map((item) => (
                <View key={item.id} style={styles.priceInputRow}>
                  <Text style={styles.priceInputLabel} numberOfLines={2}>
                    {formatProductDisplay(item)}
                  </Text>
                  <TextInput
                    style={styles.priceInputField}
                    placeholder="Precio"
                    value={bulkPrices[item.id] || ''}
                    onChangeText={(text) => updateBulkPrice(item.id, text)}
                    keyboardType="numeric"
                  />
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowPriceModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={applyBulkPrices}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                  Aplicar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
