
import React, { useState, useEffect } from 'react';
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
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { getSupabase } from '@/lib/supabase';
import { Order, OrderStatus, OrderItem } from '@/types';
import { usePrinter } from '@/hooks/usePrinter';

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];

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

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const { printReceipt } = usePrinter();

  // Customer edit state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Product edit state
  const [productName, setProductName] = useState('');
  const [productQuantity, setProductQuantity] = useState('1');
  const [productPrice, setProductPrice] = useState('0');
  const [productNotes, setProductNotes] = useState('');

  useEffect(() => {
    fetchOrder();
    markAsRead();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      
      const transformedOrder = {
        ...data,
        items: data.items || [],
      };
      
      setOrder(transformedOrder);
      setCustomerName(transformedOrder.customer_name);
      setCustomerPhone(transformedOrder.customer_phone || '');
      setCustomerAddress(transformedOrder.customer_address || '');
    } catch (error) {
      console.error('Error fetching order:', error);
      Alert.alert('Error', 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      await supabase
        .from('orders')
        .update({ is_read: true })
        .eq('id', orderId);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const updateCustomerInfo = async () => {
    if (!customerName.trim()) {
      Alert.alert('Error', 'El nombre del cliente es requerido');
      return;
    }

    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { error } = await supabase
        .from('orders')
        .update({
          customer_name: customerName,
          customer_phone: customerPhone || null,
          customer_address: customerAddress || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      setOrder((prev) => prev ? {
        ...prev,
        customer_name: customerName,
        customer_phone: customerPhone || undefined,
        customer_address: customerAddress || undefined,
      } : null);

      setEditingCustomer(false);
      Alert.alert('Éxito', 'Información del cliente actualizada');
    } catch (error) {
      console.error('Error updating customer:', error);
      Alert.alert('Error', 'No se pudo actualizar la información');
    }
  };

  const updateStatus = async (newStatus: OrderStatus) => {
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      setOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      Alert.alert('Éxito', 'Estado del pedido actualizado');
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  const addProduct = async () => {
    if (!productName.trim()) {
      Alert.alert('Error', 'El nombre del producto es requerido');
      return;
    }

    const quantity = parseInt(productQuantity) || 1;
    const price = parseFloat(productPrice) || 0;

    if (price <= 0) {
      Alert.alert('Error', 'El precio debe ser mayor a 0');
      return;
    }

    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { data, error } = await supabase
        .from('order_items')
        .insert({
          order_id: orderId,
          product_name: productName,
          quantity: quantity,
          unit_price: price,
          notes: productNotes || null,
        })
        .select()
        .single();

      if (error) throw error;

      setAddingProduct(false);
      setProductName('');
      setProductQuantity('1');
      setProductPrice('0');
      setProductNotes('');
      
      await fetchOrder();
      Alert.alert('Éxito', 'Producto agregado');
    } catch (error) {
      console.error('Error adding product:', error);
      Alert.alert('Error', 'No se pudo agregar el producto');
    }
  };

  const updateProduct = async (itemId: string) => {
    if (!productName.trim()) {
      Alert.alert('Error', 'El nombre del producto es requerido');
      return;
    }

    const quantity = parseInt(productQuantity) || 1;
    const price = parseFloat(productPrice) || 0;

    if (price <= 0) {
      Alert.alert('Error', 'El precio debe ser mayor a 0');
      return;
    }

    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { error } = await supabase
        .from('order_items')
        .update({
          product_name: productName,
          quantity: quantity,
          unit_price: price,
          notes: productNotes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (error) throw error;

      setEditingProduct(null);
      await fetchOrder();
      Alert.alert('Éxito', 'Producto actualizado');
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'No se pudo actualizar el producto');
    }
  };

  const deleteProduct = async (itemId: string) => {
    Alert.alert(
      'Eliminar Producto',
      '¿Estás seguro de que quieres eliminar este producto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const supabase = getSupabase();
              if (!supabase) return;

              const { error } = await supabase
                .from('order_items')
                .delete()
                .eq('id', itemId);

              if (error) throw error;

              await fetchOrder();
              Alert.alert('Éxito', 'Producto eliminado');
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'No se pudo eliminar el producto');
            }
          },
        },
      ]
    );
  };

  const startEditingProduct = (item: OrderItem) => {
    setEditingProduct(item.id);
    setProductName(item.product_name);
    setProductQuantity(item.quantity.toString());
    setProductPrice(item.unit_price.toString());
    setProductNotes(item.notes || '');
  };

  const handlePrint = () => {
    if (!order) return;

    const receipt = `
PEDIDO #${order.order_number}
${'-'.repeat(32)}
Cliente: ${order.customer_name}
Teléfono: ${order.customer_phone || 'N/A'}
${order.customer_address ? `Dirección: ${order.customer_address}` : ''}
${'-'.repeat(32)}
Productos:
${order.items?.map((item) => `${item.quantity}x ${item.product_name} - $${item.unit_price.toFixed(2)}\n${item.notes ? `  Nota: ${item.notes}` : ''}`).join('\n')}
${'-'.repeat(32)}
Total: $${order.total_amount.toFixed(2)}
Pagado: $${order.paid_amount.toFixed(2)}
Pendiente: $${(order.total_amount - order.paid_amount).toFixed(2)}
${'-'.repeat(32)}
Estado: ${getStatusLabel(order.status).toUpperCase()}
    `.trim();

    printReceipt(receipt);
  };

  const handleWhatsApp = () => {
    if (!order || !order.customer_phone) {
      Alert.alert('Error', 'No hay número de teléfono disponible');
      return;
    }

    const message = `Hola ${order.customer_name}, tu pedido #${order.order_number} está ${getStatusLabel(order.status)}. Total: $${order.total_amount.toFixed(2)}`;
    const url = `whatsapp://send?phone=${order.customer_phone}&text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Error', 'WhatsApp no está instalado');
        }
      })
      .catch((err) => console.error('Error opening WhatsApp:', err));
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Pedido',
      '¿Estás seguro de que quieres eliminar este pedido? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const supabase = getSupabase();
              if (!supabase) return;

              const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', orderId);

              if (error) throw error;

              Alert.alert('Éxito', 'Pedido eliminado', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error) {
              console.error('Error deleting order:', error);
              Alert.alert('Error', 'No se pudo eliminar el pedido');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Pedido no encontrado</Text>
      </View>
    );
  }

  const pendingAmount = order.total_amount - order.paid_amount;

  return (
    <>
      <Stack.Screen
        options={{
          title: `Pedido #${order.order_number}`,
          headerBackTitle: 'Pedidos',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Customer Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Información del Cliente</Text>
            <TouchableOpacity onPress={() => setEditingCustomer(!editingCustomer)}>
              <IconSymbol 
                name={editingCustomer ? "xmark.circle.fill" : "pencil.circle.fill"} 
                size={24} 
                color={colors.primary} 
              />
            </TouchableOpacity>
          </View>

          {editingCustomer ? (
            <View>
              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre del cliente"
                placeholderTextColor={colors.textSecondary}
                value={customerName}
                onChangeText={setCustomerName}
              />

              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={styles.input}
                placeholder="Número de teléfono"
                placeholderTextColor={colors.textSecondary}
                value={customerPhone}
                onChangeText={setCustomerPhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Dirección</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Dirección de entrega"
                placeholderTextColor={colors.textSecondary}
                value={customerAddress}
                onChangeText={setCustomerAddress}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity style={styles.saveButton} onPress={updateCustomerInfo}>
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.infoRow}>
                <IconSymbol name="person.fill" size={20} color={colors.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Cliente</Text>
                  <Text style={styles.infoValue}>{order.customer_name}</Text>
                </View>
              </View>

              {order.customer_phone && (
                <View style={styles.infoRow}>
                  <IconSymbol name="phone.fill" size={20} color={colors.textSecondary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Teléfono</Text>
                    <Text style={styles.infoValue}>{order.customer_phone}</Text>
                  </View>
                </View>
              )}

              {order.customer_address && (
                <View style={styles.infoRow}>
                  <IconSymbol name="location.fill" size={20} color={colors.textSecondary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Dirección</Text>
                    <Text style={styles.infoValue}>{order.customer_address}</Text>
                  </View>
                </View>
              )}

              <View style={styles.infoRow}>
                <IconSymbol name="number" size={20} color={colors.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Número de Pedido</Text>
                  <Text style={styles.infoValue}>{order.order_number}</Text>
                </View>
              </View>

              {order.source === 'whatsapp' && (
                <View style={styles.infoRow}>
                  <IconSymbol name="message.fill" size={20} color={colors.success} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Origen</Text>
                    <Text style={styles.infoValue}>WhatsApp</Text>
                  </View>
                </View>
              )}

              <View style={styles.infoRow}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                  <Text style={styles.statusText}>{getStatusLabel(order.status).toUpperCase()}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Products Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Productos</Text>
            <TouchableOpacity onPress={() => setAddingProduct(true)}>
              <IconSymbol name="plus.circle.fill" size={24} color={colors.success} />
            </TouchableOpacity>
          </View>

          {order.items && order.items.length > 0 ? (
            order.items.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                {editingProduct === item.id ? (
                  <View>
                    <Text style={styles.label}>Nombre del Producto</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Nombre del producto"
                      placeholderTextColor={colors.textSecondary}
                      value={productName}
                      onChangeText={setProductName}
                    />

                    <View style={styles.row}>
                      <View style={styles.halfInput}>
                        <Text style={styles.label}>Cantidad</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="1"
                          placeholderTextColor={colors.textSecondary}
                          value={productQuantity}
                          onChangeText={setProductQuantity}
                          keyboardType="number-pad"
                        />
                      </View>

                      <View style={styles.halfInput}>
                        <Text style={styles.label}>Precio</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="0.00"
                          placeholderTextColor={colors.textSecondary}
                          value={productPrice}
                          onChangeText={setProductPrice}
                          keyboardType="decimal-pad"
                        />
                      </View>
                    </View>

                    <Text style={styles.label}>Notas</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Instrucciones especiales"
                      placeholderTextColor={colors.textSecondary}
                      value={productNotes}
                      onChangeText={setProductNotes}
                    />

                    <View style={styles.editActions}>
                      <TouchableOpacity
                        style={[styles.editActionButton, styles.cancelButton]}
                        onPress={() => setEditingProduct(null)}
                      >
                        <Text style={styles.editActionButtonText}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.editActionButton, styles.saveActionButton]}
                        onPress={() => updateProduct(item.id)}
                      >
                        <Text style={styles.editActionButtonText}>Guardar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View>
                    <View style={styles.itemHeader}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.product_name}</Text>
                        {item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}
                      </View>
                      <View style={styles.itemActions}>
                        <TouchableOpacity
                          style={styles.itemActionButton}
                          onPress={() => startEditingProduct(item)}
                        >
                          <IconSymbol name="pencil" size={18} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.itemActionButton}
                          onPress={() => deleteProduct(item.id)}
                        >
                          <IconSymbol name="trash.fill" size={18} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.itemFooter}>
                      <Text style={styles.itemQuantity}>Cantidad: {item.quantity}</Text>
                      <Text style={styles.itemPrice}>
                        ${item.unit_price.toFixed(2)} × {item.quantity} = ${item.total_price.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Sin productos</Text>
          )}
        </View>

        {/* Payment Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumen de Pago</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Total</Text>
            <Text style={styles.paymentValue}>${order.total_amount.toFixed(2)}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Pagado</Text>
            <Text style={[styles.paymentValue, { color: colors.success }]}>
              ${order.paid_amount.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.paymentRow, styles.paymentRowTotal]}>
            <Text style={styles.paymentLabelTotal}>Pendiente</Text>
            <Text style={[styles.paymentValueTotal, { color: pendingAmount > 0 ? colors.error : colors.success }]}>
              ${pendingAmount.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Status Change Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cambiar Estado</Text>
          <View style={styles.statusGrid}>
            {STATUS_OPTIONS.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusButton,
                  { borderColor: getStatusColor(status) },
                  order.status === status && {
                    backgroundColor: getStatusColor(status),
                  },
                ]}
                onPress={() => updateStatus(status)}
              >
                <Text
                  style={[
                    styles.statusButtonText,
                    order.status === status && styles.statusButtonTextActive,
                  ]}
                >
                  {getStatusLabel(status)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Actions Card */}
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionButton} onPress={handlePrint}>
            <IconSymbol name="printer.fill" size={24} color={colors.primary} />
            <Text style={styles.actionButtonText}>Imprimir</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleWhatsApp}>
            <IconSymbol name="message.fill" size={24} color={colors.success} />
            <Text style={styles.actionButtonText}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <IconSymbol name="trash.fill" size={24} color={colors.error} />
            <Text style={styles.actionButtonText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Product Modal */}
      <Modal
        visible={addingProduct}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddingProduct(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Producto</Text>
              <TouchableOpacity onPress={() => setAddingProduct(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Nombre del Producto *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre del producto"
                placeholderTextColor={colors.textSecondary}
                value={productName}
                onChangeText={setProductName}
              />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Cantidad</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1"
                    placeholderTextColor={colors.textSecondary}
                    value={productQuantity}
                    onChangeText={setProductQuantity}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={styles.halfInput}>
                  <Text style={styles.label}>Precio *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary}
                    value={productPrice}
                    onChangeText={setProductPrice}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <Text style={styles.label}>Notas</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Instrucciones especiales (opcional)"
                placeholderTextColor={colors.textSecondary}
                value={productNotes}
                onChangeText={setProductNotes}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity style={styles.modalButton} onPress={addProduct}>
                <Text style={styles.modalButtonText}>Agregar Producto</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  itemCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  itemNotes: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  itemActionButton: {
    padding: 4,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemQuantity: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  editActionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.textSecondary,
  },
  saveActionButton: {
    backgroundColor: colors.success,
  },
  editActionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  paymentRowTotal: {
    borderTopWidth: 2,
    borderTopColor: colors.border,
    marginTop: 8,
    paddingTop: 12,
  },
  paymentLabel: {
    fontSize: 16,
    color: colors.text,
  },
  paymentValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  paymentLabelTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  paymentValueTotal: {
    fontSize: 18,
    fontWeight: '700',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
  },
  actionsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButton: {
    alignItems: 'center',
    padding: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: colors.text,
    marginTop: 8,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalBody: {
    padding: 20,
  },
  modalButton: {
    backgroundColor: colors.success,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
