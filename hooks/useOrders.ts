
import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import { Order, OrderStatus } from '@/types';

export const useOrders = (statusFilter?: OrderStatus) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
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
          items:order_items(*)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Transform data to match Order interface
      const transformedOrders = (data || []).map((order: any) => ({
        ...order,
        items: order.items || [],
      }));

      setOrders(transformedOrders);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const supabase = getSupabase();
    if (supabase) {
      const channel = supabase
        .channel('orders_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            console.log('Order change detected:', payload);
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
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [statusFilter]);

  return { orders, loading, error, refetch: fetchOrders };
};
