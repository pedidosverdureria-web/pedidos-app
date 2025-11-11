
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { getSupabase } from '@/lib/supabase';
import { Customer, Order } from '@/types';

export function useOrderCustomer(order: Order | null, onUpdate: () => Promise<void>) {
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [customerInputMode, setCustomerInputMode] = useState<'manual' | 'select'>('manual');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [availableCustomers, setAvailableCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const loadCustomers = useCallback(async () => {
    try {
      setLoadingCustomers(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      setAvailableCustomers(data || []);
    } catch (error) {
      console.error('[useOrderCustomer] Error loading customers:', error);
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

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
      await onUpdate();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Éxito',
        'La información del cliente se actualizó correctamente',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[useOrderCustomer] Error updating customer:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error',
        'No se pudo actualizar la información del cliente. Por favor intenta nuevamente.',
        [{ text: 'OK' }]
      );
    }
  };

  const selectCustomer = (customer: Customer) => {
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone || '');
    setCustomerAddress(customer.address || '');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const addCustomerToMenu = async () => {
    if (!order) return;

    if (!order.customer_name || !order.customer_name.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        '⚠️ Atención',
        'No se puede agregar el cliente sin un nombre. Por favor edita la información del cliente primero.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!order.customer_phone || !order.customer_phone.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        '⚠️ Atención',
        'No se puede agregar el cliente sin un número de teléfono. Por favor edita la información del cliente primero.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const supabase = getSupabase();

      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: order.customer_name,
          phone: order.customer_phone,
          address: order.customer_address || null,
          total_debt: 0,
          total_paid: 0,
          blocked: false,
        })
        .select()
        .single();

      if (customerError) {
        console.error('[useOrderCustomer] Error creating customer:', customerError);
        throw new Error(`No se pudo crear el cliente: ${customerError.message}`);
      }

      if (!newCustomer) {
        throw new Error('No se pudo crear el cliente: no se recibieron datos');
      }

      // Update the order with the new customer_id
      const { error: updateError } = await supabase
        .from('orders')
        .update({ customer_id: newCustomer.id })
        .eq('id', order.id);

      if (updateError) {
        console.error('[useOrderCustomer] Error updating order with customer_id:', updateError);
      }

      await onUpdate();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Cliente Agregado',
        `${order.customer_name} se agregó correctamente al menú de Clientes.\n\nAhora puedes gestionar sus pedidos y pagos desde el menú de Clientes.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[useOrderCustomer] Error adding customer:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error',
        `No se pudo agregar el cliente.\n\n${error instanceof Error ? error.message : 'Por favor intenta nuevamente.'}`,
        [{ text: 'OK' }]
      );
    }
  };

  const blockCustomer = async () => {
    if (!order?.customer_phone) return false;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const supabase = getSupabase();

      let customerId = order.customer_id;

      if (!customerId) {
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', order.customer_phone)
          .maybeSingle();

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          const { data: newCustomer, error: createError } = await supabase
            .from('customers')
            .insert({
              name: order.customer_name,
              phone: order.customer_phone,
              address: order.customer_address || null,
              total_debt: 0,
              total_paid: 0,
              blocked: true,
            })
            .select()
            .single();

          if (createError) throw createError;
          customerId = newCustomer.id;
        }
      }

      const { error } = await supabase
        .from('customers')
        .update({ blocked: true })
        .eq('id', customerId);

      if (error) throw error;

      if (!order.customer_id) {
        await supabase
          .from('orders')
          .update({ customer_id: customerId })
          .eq('id', order.id);
      }

      await onUpdate();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch (error) {
      console.error('[useOrderCustomer] Error blocking customer:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error',
        'No se pudo bloquear al cliente. Por favor intenta nuevamente.',
        [{ text: 'OK' }]
      );
      return false;
    }
  };

  const unblockCustomer = async () => {
    if (!order?.customer_phone) return false;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const supabase = getSupabase();

      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', order.customer_phone)
        .maybeSingle();

      if (!customer) {
        Alert.alert('❌ Error', 'No se encontró el cliente');
        return false;
      }

      const { error } = await supabase
        .from('customers')
        .update({ blocked: false })
        .eq('id', customer.id);

      if (error) throw error;

      await onUpdate();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch (error) {
      console.error('[useOrderCustomer] Error unblocking customer:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error',
        'No se pudo desbloquear al cliente. Por favor intenta nuevamente.',
        [{ text: 'OK' }]
      );
      return false;
    }
  };

  return {
    editingCustomer,
    setEditingCustomer,
    customerInputMode,
    setCustomerInputMode,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    customerAddress,
    setCustomerAddress,
    customerSearchQuery,
    setCustomerSearchQuery,
    availableCustomers,
    loadingCustomers,
    loadCustomers,
    updateCustomerInfo,
    selectCustomer,
    addCustomerToMenu,
    blockCustomer,
    unblockCustomer,
  };
}
