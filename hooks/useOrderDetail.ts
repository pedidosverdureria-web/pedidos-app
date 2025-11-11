
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { getSupabase } from '@/lib/supabase';
import { Order, OrderStatus } from '@/types';
import { 
  sendOrderStatusUpdate, 
  sendOrderDeletedNotification 
} from '@/utils/whatsappNotifications';
import { createInAppNotification } from '@/utils/pushNotifications';

export function useOrderDetail(orderId: string | undefined, userId: string | undefined) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [customerBlocked, setCustomerBlocked] = useState(false);
  const [customerExistsInMenu, setCustomerExistsInMenu] = useState(false);
  const [checkingCustomer, setCheckingCustomer] = useState(false);

  const checkIfCustomerExists = useCallback(async (phone: string) => {
    if (!phone || !phone.trim()) {
      setCustomerExistsInMenu(false);
      return;
    }

    try {
      setCheckingCustomer(true);
      const supabase = getSupabase();
      
      const { data, error } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', phone.trim())
        .maybeSingle();

      if (error) {
        console.error('[useOrderDetail] Error checking customer:', error);
        setCustomerExistsInMenu(false);
        return;
      }

      setCustomerExistsInMenu(!!data);
      console.log('[useOrderDetail] Customer exists in menu:', !!data);
    } catch (error) {
      console.error('[useOrderDetail] Error checking customer:', error);
      setCustomerExistsInMenu(false);
    } finally {
      setCheckingCustomer(false);
    }
  }, []);

  const loadOrder = useCallback(async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*), queries:order_queries(*), order_payments(*)')
        .eq('id', orderId)
        .single();

      if (error) throw error;

      setOrder(data);

      // Check if customer is blocked
      if (data.customer_phone) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('blocked')
          .eq('phone', data.customer_phone)
          .maybeSingle();
        
        setCustomerBlocked(customerData?.blocked || false);
        
        // Check if customer exists in menu
        await checkIfCustomerExists(data.customer_phone);
      } else {
        setCustomerExistsInMenu(false);
      }
    } catch (error) {
      console.error('[useOrderDetail] Error loading order:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error',
        'No se pudo cargar el pedido. Por favor intenta nuevamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  }, [orderId, checkIfCustomerExists]);

  const updateStatus = async (newStatus: OrderStatus, userRole?: string) => {
    if (!order) return;

    console.log('[useOrderDetail] ========== UPDATING STATUS ==========');
    console.log('[useOrderDetail] Order ID:', order.id);
    console.log('[useOrderDetail] Current status:', order.status);
    console.log('[useOrderDetail] New status:', newStatus);
    
    try {
      setUpdatingStatus(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const supabase = getSupabase();
      
      // If changing to pending_payment, create or link customer
      let customerId = order.customer_id;
      
      if (newStatus === 'pending_payment') {
        console.log('[useOrderDetail] Processing pending_payment status change');
        
        // Validate that we have customer information
        if (!order.customer_name || !order.customer_name.trim()) {
          console.error('[useOrderDetail] Cannot create customer: missing customer name');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert(
            '❌ Error',
            'No se puede cambiar a "Pendiente de Pago" sin un nombre de cliente. Por favor edita la información del cliente primero.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        if (!customerId) {
          console.log('[useOrderDetail] No customer_id, checking for existing customer');
          
          // Check if customer already exists by phone (if available)
          if (order.customer_phone && order.customer_phone.trim()) {
            console.log('[useOrderDetail] Searching for customer by phone:', order.customer_phone);
            const { data: existingCustomer, error: searchError } = await supabase
              .from('customers')
              .select('id')
              .eq('phone', order.customer_phone)
              .maybeSingle();
            
            if (searchError) {
              console.error('[useOrderDetail] Error searching for customer:', searchError);
            } else if (existingCustomer) {
              console.log('[useOrderDetail] Found existing customer by phone:', existingCustomer.id);
              customerId = existingCustomer.id;
            }
          }
          
          // If still no customer, search by name
          if (!customerId) {
            console.log('[useOrderDetail] Searching for customer by name:', order.customer_name);
            const { data: existingCustomer, error: searchError } = await supabase
              .from('customers')
              .select('id')
              .eq('name', order.customer_name)
              .maybeSingle();
            
            if (searchError) {
              console.error('[useOrderDetail] Error searching for customer by name:', searchError);
            } else if (existingCustomer) {
              console.log('[useOrderDetail] Found existing customer by name:', existingCustomer.id);
              customerId = existingCustomer.id;
            }
          }
          
          // If customer doesn't exist, create new one
          if (!customerId) {
            console.log('[useOrderDetail] Creating new customer with data:', {
              name: order.customer_name,
              phone: order.customer_phone || null,
              address: order.customer_address || null,
            });
            
            const { data: newCustomer, error: customerError } = await supabase
              .from('customers')
              .insert({
                name: order.customer_name,
                phone: order.customer_phone || null,
                address: order.customer_address || null,
                total_debt: 0,
                total_paid: 0,
                finalized: false,
              })
              .select()
              .single();
            
            if (customerError) {
              console.error('[useOrderDetail] Error creating customer:', customerError);
              throw new Error(`No se pudo crear el cliente: ${customerError.message}`);
            }
            
            if (!newCustomer) {
              console.error('[useOrderDetail] Customer creation returned no data');
              throw new Error('No se pudo crear el cliente: no se recibieron datos');
            }
            
            console.log('[useOrderDetail] Successfully created new customer:', newCustomer.id);
            customerId = newCustomer.id;
          }
        } else {
          console.log('[useOrderDetail] Using existing customer_id:', customerId);
        }
      }
      
      // Update order status and customer_id
      console.log('[useOrderDetail] Updating order with:', {
        status: newStatus,
        customer_id: customerId,
      });
      
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          customer_id: customerId,
        })
        .eq('id', order.id);

      if (updateError) {
        console.error('[useOrderDetail] Error updating order:', updateError);
        throw new Error(`No se pudo actualizar el pedido: ${updateError.message}`);
      }

      console.log('[useOrderDetail] Order updated successfully');

      // Send WhatsApp notification
      try {
        console.log('[useOrderDetail] Sending WhatsApp notification');
        await sendOrderStatusUpdate(order.id, newStatus);
        console.log('[useOrderDetail] WhatsApp notification sent');
      } catch (whatsappError) {
        console.error('[useOrderDetail] Error sending WhatsApp notification:', whatsappError);
      }

      // Create in-app notification
      try {
        console.log('[useOrderDetail] Creating in-app notification');
        await createInAppNotification(
          userId || '',
          'order_status_changed',
          `Pedido ${order.order_number} cambió a ${newStatus}`,
          { orderId: order.id }
        );
        console.log('[useOrderDetail] In-app notification created');
      } catch (notifError) {
        console.error('[useOrderDetail] Error creating notification:', notifError);
      }

      // Reload order to get updated data
      console.log('[useOrderDetail] Reloading order data');
      await loadOrder();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      console.log('[useOrderDetail] ========== STATUS UPDATE COMPLETE ==========');
      return true;
    } catch (error) {
      console.error('[useOrderDetail] ========== STATUS UPDATE FAILED ==========');
      console.error('[useOrderDetail] Error updating status:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error',
        `No se pudo actualizar el estado del pedido.\n\n${error instanceof Error ? error.message : 'Por favor intenta nuevamente.'}`,
        [{ text: 'OK' }]
      );
      return false;
    } finally {
      setUpdatingStatus(false);
    }
  };

  const deleteOrder = async () => {
    if (!order) return false;

    try {
      console.log('[useOrderDetail] ========== DELETING ORDER ==========');
      console.log('[useOrderDetail] Order ID:', order.id);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const supabase = getSupabase();
      
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', order.id);

      if (error) {
        console.error('[useOrderDetail] Error deleting order:', error);
        throw error;
      }

      console.log('[useOrderDetail] Order deleted successfully');

      // Send WhatsApp notification
      try {
        console.log('[useOrderDetail] Sending deletion notification...');
        await sendOrderDeletedNotification(order.id);
        console.log('[useOrderDetail] Deletion notification sent');
      } catch (notifError) {
        console.error('[useOrderDetail] Error sending notification:', notifError);
      }

      console.log('[useOrderDetail] ========== ORDER DELETION COMPLETE ==========');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch (error) {
      console.error('[useOrderDetail] ========== ORDER DELETION FAILED ==========');
      console.error('[useOrderDetail] Error deleting order:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error',
        'No se pudo eliminar el pedido. Por favor intenta nuevamente.',
        [{ text: 'OK' }]
      );
      return false;
    }
  };

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  return {
    order,
    loading,
    updatingStatus,
    customerBlocked,
    customerExistsInMenu,
    checkingCustomer,
    setCustomerBlocked,
    loadOrder,
    updateStatus,
    deleteOrder,
  };
}
