
import { 
  sendOrderStatusUpdate, 
  sendProductAddedNotification, 
  sendProductRemovedNotification,
  sendOrderDeletedNotification 
} from '@/utils/whatsappNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { usePrinter } from '@/hooks/usePrinter';
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
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
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
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  totalFinal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonSecondary: {
    backgroundColor: colors.secondary,
  },
  actionButtonDanger: {
    backgroundColor: colors.error,
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
    width: '80%',
    maxWidth: 400,
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
  if (lowerNotes.includes('kg') || lowerNotes.includes('kilo')) return 'kg';
  if (lowerNotes.includes('gr') || lowerNotes.includes('gramo')) return 'gr';
  if (lowerNotes.includes('lt') || lowerNotes.includes('litro')) return 'lt';
  if (lowerNotes.includes('ml')) return 'ml';
  if (lowerNotes.includes('un') || lowerNotes.includes('unidad')) return 'un';
  return '';
}

function formatProductDisplay(item: OrderItem): string {
  const unit = getUnitFromNotes(item.notes);
  const quantityStr = unit ? `${item.quantity}${unit}` : `${item.quantity}x`;
  return `${quantityStr} ${item.product_name}`;
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

  // Price modal
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [bulkPrice, setBulkPrice] = useState('');

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
      Alert.alert('Error', 'No se pudo cargar el pedido');
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
      Alert.alert('Éxito', 'Información del cliente actualizada');
    } catch (error) {
      console.error('[OrderDetail] Error updating customer:', error);
      Alert.alert('Error', 'No se pudo actualizar la información');
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
      Alert.alert('Éxito', 'Estado actualizado');
    } catch (error) {
      console.error('[OrderDetail] Error updating status:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  const addProduct = async () => {
    if (!order || !productName || !productQuantity) {
      Alert.alert('Error', 'Completa todos los campos requeridos');
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

      Alert.alert('Éxito', 'Producto agregado');
    } catch (error) {
      console.error('[OrderDetail] Error adding product:', error);
      Alert.alert('Error', 'No se pudo agregar el producto');
    }
  };

  const updateProduct = async (itemId: string) => {
    if (!productName || !productQuantity) {
      Alert.alert('Error', 'Completa todos los campos requeridos');
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
      Alert.alert('Éxito', 'Producto actualizado');
    } catch (error) {
      console.error('[OrderDetail] Error updating product:', error);
      Alert.alert('Error', 'No se pudo actualizar el producto');
    }
  };

  const deleteProduct = async (itemId: string) => {
    if (!order) return;

    const item = order.items?.find(i => i.id === itemId);
    if (!item) return;

    Alert.alert(
      'Eliminar Producto',
      `¿Eliminar ${item.product_name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const supabase = getSupabase();
              const { error } = await supabase
                .from('order_items')
                .delete()
                .eq('id', itemId);

              if (error) throw error;

              await sendProductRemovedNotification(order.id, item);
              await loadOrder();
              Alert.alert('Éxito', 'Producto eliminado');
            } catch (error) {
              console.error('[OrderDetail] Error deleting product:', error);
              Alert.alert('Error', 'No se pudo eliminar el producto');
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
    setBulkPrice('');
    setShowPriceModal(true);
  };

  const applyPriceToAll = async () => {
    if (!order || !bulkPrice) return;

    const price = parseFloat(bulkPrice);
    if (isNaN(price)) {
      Alert.alert('Error', 'Precio inválido');
      return;
    }

    try {
      const supabase = getSupabase();
      
      for (const item of order.items || []) {
        await supabase
          .from('order_items')
          .update({ unit_price: price })
          .eq('id', item.id);
      }

      setShowPriceModal(false);
      await loadOrder();
      Alert.alert('Éxito', 'Precio aplicado a todos los productos');
    } catch (error) {
      console.error('[OrderDetail] Error applying price:', error);
      Alert.alert('Error', 'No se pudo aplicar el precio');
    }
  };

  const handlePrint = async () => {
    if (!order) return;

    if (!isConnected) {
      Alert.alert('Error', 'No hay impresora conectada');
      return;
    }

    try {
      const receiptText = generateReceiptText(order);
      const autoCut = printerConfig?.auto_cut_enabled ?? true;
      const textSize = printerConfig?.text_size || 'medium';
      const encoding = printerConfig?.encoding || 'CP850';

      await printReceipt(receiptText, autoCut, textSize, encoding);
      Alert.alert('Éxito', 'Pedido impreso');
    } catch (error) {
      console.error('[OrderDetail] Print error:', error);
      Alert.alert('Error', 'No se pudo imprimir el pedido');
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
      Alert.alert('Error', 'No hay número de teléfono');
      return;
    }

    const phone = order.customer_phone.replace(/\D/g, '');
    const url = `https://wa.me/${phone}`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('[OrderDetail] Error opening WhatsApp:', error);
      Alert.alert('Error', 'No se pudo abrir WhatsApp');
    }
  };

  const handleDelete = () => {
    if (!order) return;

    Alert.alert(
      'Eliminar Pedido',
      '¿Estás seguro de eliminar este pedido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const supabase = getSupabase();
              
              await supabase.from('order_items').delete().eq('order_id', order.id);
              await supabase.from('orders').delete().eq('id', order.id);

              await sendOrderDeletedNotification(order.id);

              router.back();
              Alert.alert('Éxito', 'Pedido eliminado');
            } catch (error) {
              console.error('[OrderDetail] Error deleting order:', error);
              Alert.alert('Error', 'No se pudo eliminar el pedido');
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

  const total = order.items?.reduce((sum, item) => sum + item.unit_price * item.quantity, 0) || 0;
  const pending = total - order.amount_paid;

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
          
          <Text style={styles.sectionTitle}>Estado</Text>
          <View style={styles.statusContainer}>
            {getAvailableStatusTransitions(order.status).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusButton,
                  { borderColor: getStatusColor(status) },
                ]}
                onPress={() => updateStatus(status)}
              >
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
                <Text style={styles.addButtonText}>Editar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.sectionTitle}>Productos</Text>
            <TouchableOpacity onPress={openPriceModal}>
              <IconSymbol name="dollarsign.circle" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {order.items?.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.productItem,
                index === (order.items?.length || 0) - 1 && styles.productItemLast,
              ]}
            >
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{formatProductDisplay(item)}</Text>
                {item.notes && (
                  <Text style={styles.productDetails}>{item.notes}</Text>
                )}
                {item.unit_price > 0 && (
                  <Text style={styles.productDetails}>
                    {formatCLP(item.unit_price * item.quantity)}
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
          ))}

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
                placeholder="Precio unitario"
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
                <Text style={styles.addButtonText}>Actualizar Producto</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addButton, styles.actionButtonSecondary]}
                onPress={() => setEditingProduct(null)}
              >
                <Text style={styles.addButtonText}>Cancelar</Text>
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
                placeholder="Precio unitario"
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
                <Text style={styles.addButtonText}>Agregar Producto</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Totales</Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCLP(total)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Pagado:</Text>
            <Text style={styles.totalValue}>{formatCLP(order.amount_paid)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Pendiente:</Text>
            <Text style={[styles.totalValue, styles.totalFinal]}>
              {formatCLP(pending)}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={handlePrint}>
          <Text style={styles.actionButtonText}>Imprimir Pedido</Text>
        </TouchableOpacity>

        {order.customer_phone && (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={handleWhatsApp}
          >
            <Text style={styles.actionButtonText}>Enviar WhatsApp</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonDanger]}
          onPress={handleDelete}
        >
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
            <Text style={styles.modalTitle}>Aplicar Precio a Todos</Text>
            <TextInput
              style={styles.input}
              placeholder="Precio"
              value={bulkPrice}
              onChangeText={setBulkPrice}
              keyboardType="numeric"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowPriceModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={applyPriceToAll}
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
