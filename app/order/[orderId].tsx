
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
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { getSupabase } from '@/lib/supabase';
import { Order, OrderStatus } from '@/types';
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

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { printReceipt } = usePrinter();

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
      
      // Transform data to match Order interface
      const transformedOrder = {
        ...data,
        items: data.items || [],
      };
      
      setOrder(transformedOrder);
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
${order.items?.map((item) => `${item.quantity}x ${item.product_name} - $${item.unit_price.toFixed(2)}`).join('\n')}
${'-'.repeat(32)}
Total: $${order.total_amount.toFixed(2)}
Pagado: $${order.paid_amount.toFixed(2)}
Pendiente: $${(order.total_amount - order.paid_amount).toFixed(2)}
${'-'.repeat(32)}
Estado: ${order.status.toUpperCase()}
    `.trim();

    printReceipt(receipt);
  };

  const handleWhatsApp = () => {
    if (!order || !order.customer_phone) {
      Alert.alert('Error', 'No hay número de teléfono disponible');
      return;
    }

    const message = `Hola ${order.customer_name}, tu pedido #${order.order_number} está ${order.status}. Total: $${order.total_amount.toFixed(2)}`;
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
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Información del Pedido</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
              <Text style={styles.statusText}>{order.status.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <IconSymbol name="number" size={20} color={colors.textSecondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Número de Pedido</Text>
              <Text style={styles.infoValue}>{order.order_number}</Text>
            </View>
          </View>

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

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Productos</Text>
          {order.items && order.items.length > 0 ? (
            order.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.product_name}</Text>
                  {item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}
                </View>
                <View style={styles.itemRight}>
                  <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                  <Text style={styles.itemPrice}>${item.total_price.toFixed(2)}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Sin productos</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pago</Text>
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
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
    marginBottom: 16,
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
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  itemRight: {
    alignItems: 'flex-end',
  },
  itemQuantity: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
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
});
