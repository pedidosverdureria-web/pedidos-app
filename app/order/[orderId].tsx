
import React, { useState, useEffect, useCallback } from 'react';
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
import { sendOrderStatusUpdate, sendProductAddedNotification } from '@/utils/whatsappNotifications';

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

// Get available status transitions based on current status
const getAvailableStatusTransitions = (currentStatus: OrderStatus): OrderStatus[] => {
  switch (currentStatus) {
    case 'pending':
      return ['preparing', 'cancelled'];
    case 'preparing':
      return ['ready', 'cancelled'];
    case 'ready':
      return ['delivered', 'cancelled'];
    case 'delivered':
    case 'cancelled':
      return []; // Final states - no transitions allowed
    default:
      return [];
  }
};

// Format currency as Chilean Pesos
const formatCLP = (amount: number): string => {
  return `$${amount.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const [bulkPriceMode, setBulkPriceMode] = useState(false);
  const { printReceipt, isConnected } = usePrinter();

  // Customer edit state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Product edit state
  const [productName, setProductName] = useState('');
  const [productQuantity, setProductQuantity] = useState('1');
  const [productPrice, setProductPrice] = useState('');
  const [productNotes, setProductNotes] = useState('');

  // Bulk price state
  const [bulkPrices, setBulkPrices] = useState<{ [key: string]: string }>({});

  const fetchOrder = useCallback(async () => {
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

      // Initialize bulk prices
      const prices: { [key: string]: string } = {};
      transformedOrder.items?.forEach((item: OrderItem) => {
        prices[item.id] = item.unit_price > 0 ? item.unit_price.toString() : '';
      });
      setBulkPrices(prices);
    } catch (error) {
      console.error('Error fetching order:', error);
      Alert.alert('Error', 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const markAsRead = useCallback(async () => {
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
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    markAsRead();
  }, [orderId]);

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
      
      // Send WhatsApp notification to customer
      await sendOrderStatusUpdate(orderId as string, newStatus);
      
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

      // Note: The price entered is the FINAL price, not unit price
      // We store it as unit_price but it represents the total price for this item
      const { data, error } = await supabase
        .from('order_items')
        .insert({
          order_id: orderId,
          product_name: productName,
          quantity: quantity,
          unit_price: price, // This is the final price, not multiplied by quantity
          notes: productNotes || null,
        })
        .select()
        .single();

      if (error) throw error;

      setAddingProduct(false);
      setProductName('');
      setProductQuantity('1');
      setProductPrice('');
      setProductNotes('');
      
      await fetchOrder();
      
      // Send WhatsApp notification to customer about the added product
      await sendProductAddedNotification(orderId as string, data.id);
      
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

      // Note: The price entered is the FINAL price, not unit price
      const { error } = await supabase
        .from('order_items')
        .update({
          product_name: productName,
          quantity: quantity,
          unit_price: price, // This is the final price, not multiplied by quantity
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

  const updateBulkPrice = async (itemId: string, price: string) => {
    const priceValue = parseFloat(price) || 0;

    if (priceValue <= 0) {
      Alert.alert('Error', 'El precio debe ser mayor a 0');
      return;
    }

    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const { error } = await supabase
        .from('order_items')
        .update({
          unit_price: priceValue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (error) throw error;

      await fetchOrder();
    } catch (error) {
      console.error('Error updating price:', error);
      Alert.alert('Error', 'No se pudo actualizar el precio');
    }
  };

  const saveBulkPrices = async () => {
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      let hasError = false;
      for (const [itemId, price] of Object.entries(bulkPrices)) {
        const priceValue = parseFloat(price) || 0;
        if (priceValue > 0) {
          const { error } = await supabase
            .from('order_items')
            .update({
              unit_price: priceValue,
              updated_at: new Date().toISOString(),
            })
            .eq('id', itemId);

          if (error) {
            console.error('Error updating price for item:', itemId, error);
            hasError = true;
          }
        }
      }

      await fetchOrder();
      setBulkPriceMode(false);

      if (hasError) {
        Alert.alert('Advertencia', 'Algunos precios no se pudieron actualizar');
      } else {
        Alert.alert('Éxito', 'Todos los precios han sido actualizados');
      }
    } catch (error) {
      console.error('Error saving bulk prices:', error);
      Alert.alert('Error', 'No se pudieron guardar los precios');
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

    if (!isConnected) {
      Alert.alert(
        'Impresora no conectada',
        'Por favor conecta una impresora en la configuración antes de imprimir.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ir a Configuración', onPress: () => router.push('/settings/printer') }
        ]
      );
      return;
    }

    const receipt = `
================================
       PEDIDO #${order.order_number}
================================
Cliente: ${order.customer_name}
Teléfono: ${order.customer_phone || 'N/A'}
${order.customer_address ? `Dirección: ${order.customer_address}\n` : ''}
================================
PRODUCTOS:
${order.items?.map((item) => 
  `${item.quantity}x ${item.product_name}\n   ${formatCLP(item.unit_price)}${item.notes ? `\n   Nota: ${item.notes}` : ''}`
).join('\n')}
================================
Total: ${formatCLP(order.total_amount)}
Pagado: ${formatCLP(order.paid_amount)}
Pendiente: ${formatCLP(order.total_amount - order.paid_amount)}
================================
Estado: ${getStatusLabel(order.status).toUpperCase()}
================================
    `.trim();

    printReceipt(receipt);
  };

  const handleWhatsApp = () => {
    if (!order || !order.customer_phone) {
      Alert.alert('Error', 'No hay número de teléfono disponible');
      return;
    }

    const message = `Hola ${order.customer_name}, tu pedido #${order.order_number} está ${getStatusLabel(order.status)}. Total: ${formatCLP(order.total_amount)}`;
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
  const availableStatusTransitions = getAvailableStatusTransitions(order.status);
  const canAddProducts = order.status === 'preparing';

  return (
    <>
      <Stack.Screen
        options={{
          title: `Pedido #${order.order_number}`,
          headerBackTitle: 'Pedidos',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Status Badge at Top */}
        <View style={styles.topStatusContainer}>
          <View style={[styles.statusBadgeLarge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusTextLarge}>{getStatusLabel(order.status).toUpperCase()}</Text>
          </View>
        </View>

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
                  <Text style={styles.infoValue}>#{order.order_number}</Text>
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
            </View>
          )}
        </View>

        {/* Products Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleWithIcon}>
              <Text style={styles.cardTitle}>Productos</Text>
              <IconSymbol name="dollarsign.circle.fill" size={20} color={colors.warning} />
            </View>
            <View style={styles.headerActions}>
              {order.items && order.items.length > 0 && (
                <TouchableOpacity 
                  onPress={() => setBulkPriceMode(!bulkPriceMode)}
                  style={styles.headerActionButton}
                >
                  <IconSymbol 
                    name={bulkPriceMode ? "xmark.circle.fill" : "dollarsign.circle.fill"} 
                    size={24} 
                    color={bulkPriceMode ? colors.error : colors.warning} 
                  />
                </TouchableOpacity>
              )}
              {canAddProducts && (
                <TouchableOpacity 
                  onPress={() => setAddingProduct(true)}
                  style={styles.addProductButton}
                >
                  <IconSymbol name="plus.circle.fill" size={28} color={colors.success} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {!canAddProducts && order.status !== 'delivered' && order.status !== 'cancelled' && (
            <View style={styles.infoBox}>
              <IconSymbol name="info.circle.fill" size={20} color={colors.info} />
              <Text style={styles.infoBoxText}>
                Los productos solo se pueden agregar cuando el pedido está en estado &quot;Preparando&quot;
              </Text>
            </View>
          )}

          {bulkPriceMode && (
            <View style={styles.bulkPriceHeader}>
              <Text style={styles.bulkPriceTitle}>💰 Modo de Precios Rápidos</Text>
              <Text style={styles.bulkPriceSubtitle}>
                Ingresa los precios finales para cada producto
              </Text>
              <TouchableOpacity style={styles.saveBulkButton} onPress={saveBulkPrices}>
                <IconSymbol name="checkmark.circle.fill" size={20} color="#FFFFFF" />
                <Text style={styles.saveBulkButtonText}>Guardar Todos los Precios</Text>
              </TouchableOpacity>
            </View>
          )}

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
                        <Text style={styles.label}>Precio Final (CLP)</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="0"
                          placeholderTextColor={colors.textSecondary}
                          value={productPrice}
                          onChangeText={setProductPrice}
                          keyboardType="number-pad"
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
                ) : bulkPriceMode ? (
                  <View>
                    <View style={styles.itemHeader}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.product_name}</Text>
                        <Text style={styles.itemQuantityText}>Unidad: {item.quantity}</Text>
                        {item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}
                      </View>
                    </View>
                    <View style={styles.bulkPriceInput}>
                      <Text style={styles.bulkPriceLabel}>Precio Final (CLP):</Text>
                      <TextInput
                        style={styles.bulkPriceField}
                        placeholder="0"
                        placeholderTextColor={colors.textSecondary}
                        value={bulkPrices[item.id] || ''}
                        onChangeText={(value) => setBulkPrices({ ...bulkPrices, [item.id]: value })}
                        keyboardType="number-pad"
                      />
                      <TouchableOpacity
                        style={styles.quickSaveButton}
                        onPress={() => updateBulkPrice(item.id, bulkPrices[item.id] || '')}
                      >
                        <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View>
                    <View style={styles.itemHeader}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.product_name}</Text>
                        <Text style={styles.itemUnit}>Unidad: {item.quantity}</Text>
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
                        Precio: {formatCLP(item.unit_price)}
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
            <Text style={styles.paymentValue}>{formatCLP(order.total_amount)}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Pagado</Text>
            <Text style={[styles.paymentValue, { color: colors.success }]}>
              {formatCLP(order.paid_amount)}
            </Text>
          </View>
          <View style={[styles.paymentRow, styles.paymentRowTotal]}>
            <Text style={styles.paymentLabelTotal}>Pendiente</Text>
            <Text style={[styles.paymentValueTotal, { color: pendingAmount > 0 ? colors.error : colors.success }]}>
              {formatCLP(pendingAmount)}
            </Text>
          </View>
        </View>

        {/* Status Change Card - Only show if there are available transitions */}
        {availableStatusTransitions.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cambiar Estado</Text>
            <View style={styles.statusGrid}>
              {availableStatusTransitions.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusButton,
                    { backgroundColor: getStatusColor(status) },
                  ]}
                  onPress={() => updateStatus(status)}
                >
                  <Text style={styles.statusButtonTextActive}>
                    {getStatusLabel(status)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Show message if order is in final state */}
        {availableStatusTransitions.length === 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Estado del Pedido</Text>
            <View style={styles.finalStateContainer}>
              <IconSymbol 
                name={order.status === 'delivered' ? "checkmark.circle.fill" : "xmark.circle.fill"} 
                size={48} 
                color={getStatusColor(order.status)} 
              />
              <Text style={styles.finalStateText}>
                Este pedido está {getStatusLabel(order.status).toLowerCase()}
              </Text>
              <Text style={styles.finalStateSubtext}>
                No se pueden realizar más cambios de estado
              </Text>
            </View>
          </View>
        )}

        {/* Actions Card */}
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionButton} onPress={handlePrint}>
            <IconSymbol name="printer.fill" size={28} color={colors.primary} />
            <Text style={styles.actionButtonText}>Imprimir</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleWhatsApp}>
            <IconSymbol name="message.fill" size={28} color={colors.success} />
            <Text style={styles.actionButtonText}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <IconSymbol name="trash.fill" size={28} color={colors.error} />
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
              <View style={styles.infoBox}>
                <IconSymbol name="info.circle.fill" size={20} color={colors.info} />
                <Text style={styles.infoBoxText}>
                  El precio que ingreses será el precio final del producto, no se multiplicará por la cantidad.
                </Text>
              </View>

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
                  <Text style={styles.label}>Precio Final (CLP) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    value={productPrice}
                    onChangeText={setProductPrice}
                    keyboardType="number-pad"
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
                <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
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
  topStatusContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadgeLarge: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  statusTextLarge: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
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
  cardTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  headerActionButton: {
    padding: 4,
  },
  addProductButton: {
    padding: 2,
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
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.info,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  bulkPriceHeader: {
    backgroundColor: colors.warning,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  bulkPriceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bulkPriceSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  saveBulkButton: {
    backgroundColor: colors.success,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBulkButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  itemUnit: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  itemQuantityText: {
    fontSize: 14,
    color: colors.textSecondary,
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
  bulkPriceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bulkPriceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  bulkPriceField: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    color: colors.text,
  },
  quickSaveButton: {
    padding: 4,
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
    gap: 12,
  },
  statusButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusButtonTextActive: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  finalStateContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  finalStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  finalStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
