
import React, { useState, useEffect, useCallback } from 'react';
import { IconSymbol } from '@/components/IconSymbol';
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
import { usePrinter } from '@/hooks/usePrinter';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Order, OrderStatus, OrderItem } from '@/types';
import { colors } from '@/styles/commonStyles';
import { 
  sendOrderStatusUpdate, 
  sendProductAddedNotification, 
  sendProductRemovedNotification,
  sendOrderDeletedNotification 
} from '@/utils/whatsappNotifications';
import { createInAppNotification, sendLocalNotification } from '@/utils/pushNotifications';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

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
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  itemCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  itemNotes: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  printButton: {
    backgroundColor: colors.warning,
  },
  addProductButton: {
    backgroundColor: colors.success,
  },
  applyPriceButton: {
    backgroundColor: colors.info,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  statusButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
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
  itemActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  itemActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemActionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginRight: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceModalScrollView: {
    maxHeight: 400,
  },
  priceModalItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priceModalItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  priceModalItemQuantity: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  priceModalInput: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return colors.warning;
    case 'preparing':
      return colors.info;
    case 'ready':
      return colors.success;
    case 'delivered':
      return colors.textSecondary;
    case 'cancelled':
      return colors.error;
    default:
      return colors.textSecondary;
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
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductQuantity, setNewProductQuantity] = useState('1');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductNotes, setNewProductNotes] = useState('');
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemQuantity, setEditItemQuantity] = useState('');
  const [editItemPrice, setEditItemPrice] = useState('');
  const [editItemNotes, setEditItemNotes] = useState('');
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [bulkPrices, setBulkPrices] = useState<{ [key: string]: string }>({});
  const [printerConfig, setPrinterConfig] = useState<any>(null);

  const { printReceipt, isConnected } = usePrinter();

  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;

      setOrder(data);
      setCustomerName(data.customer_name);
      setCustomerPhone(data.customer_phone || '');
      setCustomerAddress(data.customer_address || '');
    } catch (error) {
      console.error('Error loading order:', error);
      Alert.alert('Error', 'No se pudo cargar el pedido');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const loadPrinterConfig = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('printer_config')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading printer config:', error);
      }

      if (data) {
        setPrinterConfig(data);
      }
    } catch (error) {
      console.error('Error loading printer config:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    loadOrder();
    loadPrinterConfig();
  }, [loadOrder, loadPrinterConfig]);

  const updateCustomerInfo = async () => {
    if (!order) return;

    try {
      setSaving(true);
      const supabase = getSupabase();
      const { error } = await supabase
        .from('orders')
        .update({
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: customerAddress,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (error) throw error;

      setEditingCustomer(false);
      await loadOrder();
      Alert.alert('Éxito', 'Información del cliente actualizada');
    } catch (error) {
      console.error('Error updating customer info:', error);
      Alert.alert('Error', 'No se pudo actualizar la información');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (newStatus: OrderStatus) => {
    if (!order) return;

    try {
      setSaving(true);
      const supabase = getSupabase();
      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (error) throw error;

      await sendOrderStatusUpdate(order.id, newStatus);

      await createInAppNotification(
        null,
        'Estado de pedido actualizado',
        `Pedido #${order.order_number} cambió a ${getStatusLabel(newStatus)}`,
        'order',
        order.id
      );

      await sendLocalNotification(
        'Estado de pedido actualizado',
        `Pedido #${order.order_number} cambió a ${getStatusLabel(newStatus)}`,
        { orderId: order.id }
      );

      await loadOrder();
      Alert.alert('Éxito', 'Estado actualizado correctamente');
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado');
    } finally {
      setSaving(false);
    }
  };

  const addProduct = async () => {
    if (!order || !newProductName || !newProductPrice) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setSaving(true);
      const supabase = getSupabase();
      
      const quantity = parseInt(newProductQuantity) || 1;
      const unitPrice = parseFloat(newProductPrice) || 0;
      const totalPrice = quantity * unitPrice;

      const { data: newItem, error } = await supabase
        .from('order_items')
        .insert([
          {
            order_id: order.id,
            product_name: newProductName,
            quantity,
            unit_price: unitPrice,
            total_price: totalPrice,
            notes: newProductNotes || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const newTotal = (order.total_amount || 0) + totalPrice;
      await supabase
        .from('orders')
        .update({
          total_amount: newTotal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      await sendProductAddedNotification(order.id, newItem.id);

      await createInAppNotification(
        null,
        'Producto agregado',
        `Se agregó ${newProductName} al pedido #${order.order_number}`,
        'order',
        order.id
      );

      setShowAddProductModal(false);
      setNewProductName('');
      setNewProductQuantity('1');
      setNewProductPrice('');
      setNewProductNotes('');
      await loadOrder();
      Alert.alert('Éxito', 'Producto agregado correctamente');
    } catch (error) {
      console.error('Error adding product:', error);
      Alert.alert('Error', 'No se pudo agregar el producto');
    } finally {
      setSaving(false);
    }
  };

  const updateProduct = async (itemId: string) => {
    if (!order || !editItemName || !editItemPrice) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setSaving(true);
      const supabase = getSupabase();
      
      const quantity = parseInt(editItemQuantity) || 1;
      const unitPrice = parseFloat(editItemPrice) || 0;
      const totalPrice = quantity * unitPrice;

      const { error } = await supabase
        .from('order_items')
        .update({
          product_name: editItemName,
          quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
          notes: editItemNotes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (error) throw error;

      const { data: items } = await supabase
        .from('order_items')
        .select('total_price')
        .eq('order_id', order.id);

      const newTotal = items?.reduce((sum, item) => sum + (item.total_price || 0), 0) || 0;
      await supabase
        .from('orders')
        .update({
          total_amount: newTotal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      setEditingItem(null);
      await loadOrder();
      Alert.alert('Éxito', 'Producto actualizado correctamente');
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'No se pudo actualizar el producto');
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (itemId: string) => {
    if (!order) return;

    const item = order.items?.find((i) => i.id === itemId);
    if (!item) return;

    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar "${item.product_name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              const supabase = getSupabase();

              const { error } = await supabase
                .from('order_items')
                .delete()
                .eq('id', itemId);

              if (error) throw error;

              const newTotal = (order.total_amount || 0) - (item.total_price || 0);
              await supabase
                .from('orders')
                .update({
                  total_amount: newTotal,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', order.id);

              await sendProductRemovedNotification(order.id, item);

              await createInAppNotification(
                null,
                'Producto eliminado',
                `Se eliminó ${item.product_name} del pedido #${order.order_number}`,
                'order',
                order.id
              );

              await loadOrder();
              Alert.alert('Éxito', 'Producto eliminado correctamente');
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'No se pudo eliminar el producto');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const startEditingProduct = (item: OrderItem) => {
    setEditingItem(item);
    setEditItemName(item.product_name);
    setEditItemQuantity(item.quantity.toString());
    setEditItemPrice(item.unit_price.toString());
    setEditItemNotes(item.notes || '');
  };

  const openPriceModal = () => {
    if (!order || !order.items || order.items.length === 0) {
      Alert.alert('Error', 'No hay productos en este pedido');
      return;
    }

    const initialPrices: { [key: string]: string } = {};
    order.items.forEach((item) => {
      initialPrices[item.id] = item.unit_price.toString();
    });
    setBulkPrices(initialPrices);
    setShowPriceModal(true);
  };

  const applyPriceToAll = async () => {
    if (!order || !order.items || order.items.length === 0) {
      Alert.alert('Error', 'No hay productos en este pedido');
      return;
    }

    const hasEmptyPrice = Object.values(bulkPrices).some((price) => !price || price.trim() === '');
    if (hasEmptyPrice) {
      Alert.alert('Error', 'Por favor ingresa un precio para todos los productos');
      return;
    }

    try {
      setSaving(true);
      const supabase = getSupabase();

      for (const item of order.items) {
        const newUnitPrice = parseFloat(bulkPrices[item.id]) || 0;
        const newTotalPrice = item.quantity * newUnitPrice;

        const { error } = await supabase
          .from('order_items')
          .update({
            unit_price: newUnitPrice,
            total_price: newTotalPrice,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        if (error) throw error;
      }

      const { data: items } = await supabase
        .from('order_items')
        .select('total_price')
        .eq('order_id', order.id);

      const newTotal = items?.reduce((sum, item) => sum + (item.total_price || 0), 0) || 0;
      await supabase
        .from('orders')
        .update({
          total_amount: newTotal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      setShowPriceModal(false);
      await loadOrder();
      Alert.alert('Éxito', 'Precios aplicados a todos los productos');
    } catch (error) {
      console.error('Error applying prices:', error);
      Alert.alert('Error', 'No se pudieron aplicar los precios');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = async () => {
    if (!order) {
      Alert.alert('Error', 'No hay pedido para imprimir');
      return;
    }

    if (!isConnected) {
      Alert.alert(
        'Impresora no conectada',
        'No hay una impresora conectada. Por favor conecta una impresora en la configuración.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Ir a Configuración',
            onPress: () => router.push('/settings/printer'),
          },
        ]
      );
      return;
    }

    try {
      setPrinting(true);
      const receipt = generateReceiptText(order);
      const autoCut = printerConfig?.auto_cut_enabled ?? true;
      await printReceipt(receipt, autoCut);
      Alert.alert('Éxito', 'Pedido impreso correctamente');
    } catch (error) {
      console.error('Error printing:', error);
      Alert.alert('Error', 'No se pudo imprimir el pedido. Verifica que la impresora esté encendida y cerca del dispositivo.');
    } finally {
      setPrinting(false);
    }
  };

  const generateReceiptText = (order: Order): string => {
    const config = printerConfig || {};
    let receipt = '';

    receipt += `\n`;
    receipt += `=================================\n`;
    receipt += `        PEDIDO #${order.order_number}\n`;
    receipt += `=================================\n`;
    receipt += `\n`;

    if (config.include_customer_info !== false) {
      receipt += `Cliente: ${order.customer_name}\n`;
      if (order.customer_phone) {
        receipt += `Teléfono: ${order.customer_phone}\n`;
      }
      if (order.customer_address) {
        receipt += `Dirección: ${order.customer_address}\n`;
      }
      receipt += `\n`;
    }

    receipt += `---------------------------------\n`;
    receipt += `PRODUCTOS\n`;
    receipt += `---------------------------------\n`;
    receipt += `\n`;

    order.items?.forEach((item) => {
      receipt += `${item.product_name}\n`;
      receipt += `  ${item.quantity} x ${formatCLP(item.unit_price)} = ${formatCLP(item.total_price)}\n`;
      if (item.notes) {
        receipt += `  Nota: ${item.notes}\n`;
      }
      receipt += `\n`;
    });

    if (config.include_totals !== false) {
      receipt += `---------------------------------\n`;
      receipt += `TOTAL: ${formatCLP(order.total_amount)}\n`;
      receipt += `---------------------------------\n`;
      receipt += `\n`;
    }

    receipt += `Estado: ${getStatusLabel(order.status)}\n`;
    receipt += `Fecha: ${new Date(order.created_at).toLocaleString('es-ES')}\n`;
    receipt += `\n`;
    receipt += `=================================\n`;

    return receipt;
  };

  const handleWhatsApp = () => {
    if (!order?.customer_phone) {
      Alert.alert('Error', 'No hay número de teléfono registrado');
      return;
    }

    const message = `Hola ${order.customer_name}, tu pedido #${order.order_number} está ${getStatusLabel(order.status).toLowerCase()}.`;
    const url = `whatsapp://send?phone=${order.customer_phone}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'No se pudo abrir WhatsApp');
    });
  };

  const handleDelete = () => {
    if (!order) return;

    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar el pedido #${order.order_number}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              const supabase = getSupabase();

              await supabase.from('order_items').delete().eq('order_id', order.id);

              const { error } = await supabase.from('orders').delete().eq('id', order.id);

              if (error) throw error;

              await sendOrderDeletedNotification(order.id);

              await createInAppNotification(
                null,
                'Pedido eliminado',
                `El pedido #${order.order_number} ha sido eliminado`,
                'warning'
              );

              Alert.alert('Éxito', 'Pedido eliminado correctamente', [
                {
                  text: 'OK',
                  onPress: () => router.back(),
                },
              ]);
            } catch (error) {
              console.error('Error deleting order:', error);
              Alert.alert('Error', 'No se pudo eliminar el pedido');
            } finally {
              setSaving(false);
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

  const canEditProducts = order.status !== 'delivered' && order.status !== 'cancelled';
  const availableTransitions = getAvailableStatusTransitions(order.status);

  return (
    <>
      <Stack.Screen
        options={{
          title: `Pedido #${order.order_number}`,
          headerBackTitle: 'Atrás',
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              <TouchableOpacity onPress={handlePrint} disabled={printing}>
                {printing ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <IconSymbol
                    name="printer.fill"
                    size={24}
                    color={isConnected ? colors.primary : colors.textSecondary}
                  />
                )}
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado</Text>
          <View style={styles.card}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
              <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
            </View>

            {availableTransitions.length > 0 && (
              <View style={styles.statusButtonsContainer}>
                {availableTransitions.map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={styles.statusButton}
                    onPress={() => updateStatus(status)}
                    disabled={saving}
                  >
                    <IconSymbol
                      name="arrow.right.circle.fill"
                      size={16}
                      color={getStatusColor(status)}
                    />
                    <Text style={[styles.statusButtonText, { color: getStatusColor(status) }]}>
                      {getStatusLabel(status)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Información del Cliente</Text>
            <TouchableOpacity onPress={() => setEditingCustomer(!editingCustomer)}>
              <IconSymbol
                name={editingCustomer ? 'xmark.circle.fill' : 'pencil.circle.fill'}
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            {editingCustomer ? (
              <>
                <TextInput
                  style={styles.input}
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="Nombre del cliente"
                  placeholderTextColor={colors.textSecondary}
                />
                <TextInput
                  style={styles.input}
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  placeholder="Teléfono"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={styles.input}
                  value={customerAddress}
                  onChangeText={setCustomerAddress}
                  placeholder="Dirección"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.actionButton, saving && styles.buttonDisabled]}
                  onPress={updateCustomerInfo}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <IconSymbol name="checkmark.circle.fill" size={20} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Guardar</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.infoRow}>
                  <IconSymbol name="person.fill" size={20} color={colors.primary} />
                  <Text style={styles.infoLabel}>Nombre:</Text>
                  <Text style={styles.infoValue}>{order.customer_name}</Text>
                </View>
                {order.customer_phone && (
                  <View style={styles.infoRow}>
                    <IconSymbol name="phone.fill" size={20} color={colors.success} />
                    <Text style={styles.infoLabel}>Teléfono:</Text>
                    <Text style={styles.infoValue}>{order.customer_phone}</Text>
                  </View>
                )}
                {order.customer_address && (
                  <View style={styles.infoRow}>
                    <IconSymbol name="location.fill" size={20} color={colors.error} />
                    <Text style={styles.infoLabel}>Dirección:</Text>
                    <Text style={styles.infoValue}>{order.customer_address}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Productos</Text>
            {canEditProducts && (
              <TouchableOpacity onPress={() => setShowAddProductModal(true)}>
                <IconSymbol name="plus.circle.fill" size={28} color={colors.success} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.card}>
            {order.items && order.items.length > 0 ? (
              <>
                {order.items.map((item) => (
                  <View key={item.id}>
                    {editingItem?.id === item.id ? (
                      <View style={styles.itemCard}>
                        <TextInput
                          style={styles.input}
                          value={editItemName}
                          onChangeText={setEditItemName}
                          placeholder="Nombre del producto"
                          placeholderTextColor={colors.textSecondary}
                        />
                        <TextInput
                          style={styles.input}
                          value={editItemQuantity}
                          onChangeText={setEditItemQuantity}
                          placeholder="Cantidad"
                          placeholderTextColor={colors.textSecondary}
                          keyboardType="numeric"
                        />
                        <TextInput
                          style={styles.input}
                          value={editItemPrice}
                          onChangeText={setEditItemPrice}
                          placeholder="Precio unitario"
                          placeholderTextColor={colors.textSecondary}
                          keyboardType="numeric"
                        />
                        <TextInput
                          style={styles.input}
                          value={editItemNotes}
                          onChangeText={setEditItemNotes}
                          placeholder="Notas (opcional)"
                          placeholderTextColor={colors.textSecondary}
                          multiline
                        />
                        <View style={styles.itemActions}>
                          <TouchableOpacity
                            style={[styles.itemActionButton, { borderColor: colors.success }]}
                            onPress={() => updateProduct(item.id)}
                            disabled={saving}
                          >
                            <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
                            <Text style={[styles.itemActionButtonText, { color: colors.success }]}>
                              Guardar
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.itemActionButton, { borderColor: colors.error }]}
                            onPress={() => setEditingItem(null)}
                          >
                            <IconSymbol name="xmark.circle.fill" size={16} color={colors.error} />
                            <Text style={[styles.itemActionButtonText, { color: colors.error }]}>
                              Cancelar
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.itemCard}>
                        <View style={styles.itemHeader}>
                          <Text style={styles.itemName}>{item.product_name}</Text>
                          <Text style={styles.itemPrice}>{formatCLP(item.total_price)}</Text>
                        </View>
                        <View style={styles.itemDetails}>
                          <Text style={styles.itemQuantity}>
                            Cantidad: {item.quantity} x {formatCLP(item.unit_price)}
                          </Text>
                        </View>
                        {item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}
                        {canEditProducts && (
                          <View style={styles.itemActions}>
                            <TouchableOpacity
                              style={[styles.itemActionButton, { borderColor: colors.primary }]}
                              onPress={() => startEditingProduct(item)}
                            >
                              <IconSymbol name="pencil" size={16} color={colors.primary} />
                              <Text style={[styles.itemActionButtonText, { color: colors.primary }]}>
                                Editar
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.itemActionButton, { borderColor: colors.error }]}
                              onPress={() => deleteProduct(item.id)}
                            >
                              <IconSymbol name="trash" size={16} color={colors.error} />
                              <Text style={[styles.itemActionButtonText, { color: colors.error }]}>
                                Eliminar
                              </Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                ))}

                {canEditProducts && order.items.length > 0 && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.applyPriceButton, { marginTop: 12 }]}
                    onPress={openPriceModal}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <IconSymbol name="dollarsign.circle.fill" size={20} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Aplicar Precio a Todos</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: 16 }}>
                No hay productos en este pedido
              </Text>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>{formatCLP(order.total_amount)}</Text>
            </View>
          </View>
        </View>

        {order.customer_phone && (
          <TouchableOpacity
            style={[styles.actionButton, styles.whatsappButton]}
            onPress={handleWhatsApp}
          >
            <IconSymbol name="message.fill" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Enviar WhatsApp</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <IconSymbol name="trash.fill" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Eliminar Pedido</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showAddProductModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddProductModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar Producto</Text>
            <TextInput
              style={styles.input}
              value={newProductName}
              onChangeText={setNewProductName}
              placeholder="Nombre del producto"
              placeholderTextColor={colors.textSecondary}
            />
            <TextInput
              style={styles.input}
              value={newProductQuantity}
              onChangeText={setNewProductQuantity}
              placeholder="Cantidad"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              value={newProductPrice}
              onChangeText={setNewProductPrice}
              placeholder="Precio unitario"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              value={newProductNotes}
              onChangeText={setNewProductNotes}
              placeholder="Notas (opcional)"
              placeholderTextColor={colors.textSecondary}
              multiline
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowAddProductModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={addProduct}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Agregar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPriceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPriceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Aplicar Precio a Todos</Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 16, fontSize: 14 }}>
              Ingresa el precio unitario para cada producto:
            </Text>
            <ScrollView style={styles.priceModalScrollView}>
              {order?.items?.map((item) => (
                <View key={item.id} style={styles.priceModalItem}>
                  <Text style={styles.priceModalItemName}>{item.product_name}</Text>
                  <Text style={styles.priceModalItemQuantity}>
                    Cantidad: {item.quantity}
                  </Text>
                  <TextInput
                    style={styles.priceModalInput}
                    value={bulkPrices[item.id] || ''}
                    onChangeText={(text) => {
                      setBulkPrices((prev) => ({
                        ...prev,
                        [item.id]: text,
                      }));
                    }}
                    placeholder="Precio unitario"
                    placeholderTextColor={colors.textSecondary}
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
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={applyPriceToAll}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Aplicar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
