
import { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabase } from '@/lib/supabase';
import { Order, OrderStatus } from '@/types';
import { sendLocalNotification } from '@/utils/pushNotifications';
import { Platform } from 'react-native';

export const useOrders = (statusFilter?: OrderStatus, excludeCompleted: boolean = true) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousOrderIdsRef = useRef<Set<string>>(new Set());

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      if (!supabase) {
        setError('Supabase not initialized');
        return;
      }

      let query = supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*),
          queries:order_queries(*)
        `)
        .order('created_at', { ascending: false });

      // If excludeCompleted is true, filter out delivered, paid, and finalizado orders
      if (excludeCompleted) {
        query = query.not('status', 'in', '(delivered,paid,finalizado)');
      }

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Transform data to match Order interface
      const transformedOrders = (data || []).map((order: any) => ({
        ...order,
        items: order.items || [],
        queries: order.queries || [],
      }));

      setOrders(transformedOrders);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, excludeCompleted]);

  const checkForNewOrders = useCallback(async (newOrders: Order[]) => {
    // Get current order IDs
    const currentOrderIds = new Set(newOrders.map(order => order.id));
    
    // Find new orders that weren't in the previous set
    const newOrderIds = Array.from(currentOrderIds).filter(
      id => !previousOrderIdsRef.current.has(id)
    );

    // If there are new orders and we had previous orders (not initial load)
    if (newOrderIds.length > 0 && previousOrderIdsRef.current.size > 0) {
      const newOrdersList = newOrders.filter(order => newOrderIds.includes(order.id));
      
      // Send notification for each new order
      for (const order of newOrdersList) {
        console.log('New order detected:', order.order_number);
        
        // Send local notification
        if (Platform.OS !== 'web') {
          await sendLocalNotification(
            '🔔 Nuevo Pedido',
            `Pedido #${order.order_number} de ${order.customer_name}`,
            { orderId: order.id, orderNumber: order.order_number }
          );
        }
      }
    }

    // Update the previous order IDs
    previousOrderIdsRef.current = currentOrderIds;
  }, []);

  useEffect(() => {
    fetchOrders();

    const supabase = getSupabase();
    if (supabase) {
      console.log('Setting up realtime subscription for orders...');
      
      const channel = supabase
        .channel('orders_changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders' },
          (payload) => {
            console.log('New order inserted:', payload);
            fetchOrders();
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders' },
          (payload) => {
            console.log('Order updated:', payload);
            fetchOrders();
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'orders' },
          (payload) => {
            console.log('Order deleted:', payload);
            fetchOrders();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'order_items' },
          (payload) => {
            console.log('Order items change detected:', payload);
            fetchOrders();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'order_queries' },
          (payload) => {
            console.log('Order queries change detected:', payload);
            fetchOrders();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'order_payments' },
          (payload) => {
            console.log('Order payments change detected:', payload);
            fetchOrders();
          }
        )
        .subscribe((status) => {
          console.log('Realtime subscription status:', status);
        });

      return () => {
        console.log('Cleaning up realtime subscription...');
        supabase.removeChannel(channel);
      };
    }
  }, [fetchOrders]);

  // Check for new orders whenever orders change
  useEffect(() => {
    if (orders.length > 0) {
      checkForNewOrders(orders);
    }
  }, [orders, checkForNewOrders]);

  return { orders, loading, error, refetch: fetchOrders };
};
