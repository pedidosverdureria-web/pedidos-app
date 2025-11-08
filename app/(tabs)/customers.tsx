
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { getSupabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/IconSymbol';
import { Customer, Order } from '@/types';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';

const { width } = Dimensions.get('window');

function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function getStatusLabel(status: string): string {
  const labels: { [key: string]: string } = {
    pending: 'Pendiente',
    preparing: 'Preparando',
    ready: 'Listo',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
    pending_payment: 'Pago Pendiente',
    paid: 'Pagado',
  };
  return labels[status] || status;
}

function getStatusColor(status: string): string {
  const colors: { [key: string]: string } = {
    pending: '#F59E0B',
    preparing: '#3B82F6',
    ready: '#10B981',
    delivered: '#6B7280',
    cancelled: '#EF4444',
    pending_payment: '#8B5CF6',
    paid: '#059669',
  };
  return colors[status] || '#6B7280';
}

export default function CustomersScreen() {
  const { user } = useAuth();
  const { colors } = useThemedStyles();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedRut, setEditedRut] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 16,
      paddingTop: 60,
      backgroundColor: colors.primary,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: 16,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 8,
      paddingHorizontal: 12,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      height: 40,
      color: '#fff',
      fontSize: 16,
    },
    content: {
      flex: 1,
    },
    customerCard: {
      backgroundColor: colors.card,
      marginHorizontal: 16,
      marginVertical: 8,
      padding: 16,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    customerCardBlocked: {
      borderLeftColor: '#6B7280',
      opacity: 0.7,
    },
    customerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    customerNameContainer: {
      flex: 1,
      marginRight: 8,
    },
    customerName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    customerRut: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    blockedBadge: {
      backgroundColor: '#FEE2E2',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    blockedBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#DC2626',
    },
    customerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    customerInfoText: {
      fontSize: 14,
      color: colors.text,
      marginLeft: 8,
    },
    customerStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyText: {
      fontSize: 18,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
      maxHeight: '85%',
    },
    modalHeader: {
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    modalSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    modalInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    modalInfoText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginLeft: 8,
    },
    modalScrollView: {
      maxHeight: 400,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 20,
    },
    statCard: {
      width: '48%',
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      marginRight: '2%',
    },
    statCardFull: {
      width: '100%',
      marginRight: 0,
    },
    statCardValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    statCardLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
      marginTop: 8,
    },
    ordersList: {
      marginBottom: 20,
    },
    orderCard: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderLeftWidth: 3,
    },
    orderCardPending: {
      borderLeftColor: '#F59E0B',
    },
    orderCardPreparing: {
      borderLeftColor: '#3B82F6',
    },
    orderCardReady: {
      borderLeftColor: '#10B981',
    },
    orderCardDelivered: {
      borderLeftColor: '#6B7280',
    },
    orderCardCancelled: {
      borderLeftColor: '#EF4444',
    },
    orderCardPendingPayment: {
      borderLeftColor: '#8B5CF6',
    },
    orderCardPaid: {
      borderLeftColor: '#059669',
    },
    orderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    orderNumber: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    orderAmount: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.primary,
    },
    orderDate: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    orderStatus: {
      fontSize: 12,
      fontWeight: '600',
    },
    purchasesByPeriod: {
      marginBottom: 20,
    },
    periodCard: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
    },
    periodHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    periodLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    periodValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.primary,
    },
    periodDetails: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
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
    modalButtonPrimary: {
      backgroundColor: colors.primary,
    },
    modalButtonDanger: {
      backgroundColor: '#EF4444',
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    modalButtonTextPrimary: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
    emptySection: {
      padding: 16,
      alignItems: 'center',
    },
    emptySectionText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    editSection: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 16,
      marginBottom: 20,
    },
    editSectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
    },
    inputGroup: {
      marginBottom: 12,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 6,
    },
    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
    },
    editButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 12,
    },
    editButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    editButtonCancel: {
      backgroundColor: colors.border,
    },
    editButtonSave: {
      backgroundColor: colors.primary,
    },
    editButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    editButtonTextSave: {
      fontSize: 14,
      fontWeight: '600',
      color: '#fff',
    },
    editModeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    editModeButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#fff',
      marginLeft: 8,
    },
    deleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#EF4444',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    deleteButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#fff',
      marginLeft: 8,
    },
    deleteDialogContent: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 24,
      width: '90%',
      maxWidth: 400,
    },
    deleteDialogTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    deleteDialogMessage: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 20,
      textAlign: 'center',
      lineHeight: 24,
    },
    deleteDialogWarning: {
      fontSize: 14,
      color: '#DC2626',
      marginBottom: 20,
      textAlign: 'center',
      fontWeight: '600',
    },
    deleteDialogButtons: {
      gap: 12,
    },
    deleteDialogButton: {
      padding: 14,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 8,
    },
    deleteDialogButtonCustomerOnly: {
      backgroundColor: '#F59E0B',
    },
    deleteDialogButtonAll: {
      backgroundColor: '#EF4444',
    },
    deleteDialogButtonCancel: {
      backgroundColor: colors.border,
    },
    deleteDialogButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
    },
    deleteDialogButtonTextCancel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
  });

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          orders:orders!customer_id(
            id,
            order_number,
            total_amount,
            paid_amount,
            status,
            created_at,
            items:order_items(
              id,
              product_name,
              quantity,
              unit_price,
              notes
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('[CustomersScreen] Loaded customers:', data?.length);
      setCustomers(data || []);
    } catch (error) {
      console.error('[CustomersScreen] Error loading customers:', error);
      Alert.alert('❌ Error', 'No se pudieron cargar los clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCustomers();
    setRefreshing(false);
  }, [loadCustomers]);

  const openCustomerDetail = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setEditedName(customer.name);
    setEditedRut(customer.rut || '');
    setEditedPhone(customer.phone || '');
    setIsEditMode(false);
    setShowDetailModal(true);
  }, []);

  const handleSaveCustomerInfo = async () => {
    if (!selectedCustomer) return;

    if (!editedName.trim()) {
      Alert.alert('⚠️ Error', 'El nombre del cliente es obligatorio');
      return;
    }

    try {
      setIsSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const supabase = getSupabase();
      const { error } = await supabase
        .from('customers')
        .update({
          name: editedName.trim(),
          rut: editedRut.trim() || null,
          phone: editedPhone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedCustomer.id);

      if (error) throw error;

      console.log('[CustomersScreen] Customer info updated successfully');
      
      setCustomers(prev => 
        prev.map(c => 
          c.id === selectedCustomer.id 
            ? { ...c, name: editedName.trim(), rut: editedRut.trim() || undefined, phone: editedPhone.trim() || undefined }
            : c
        )
      );

      setSelectedCustomer(prev => 
        prev ? { ...prev, name: editedName.trim(), rut: editedRut.trim() || undefined, phone: editedPhone.trim() || undefined } : null
      );

      setIsEditMode(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ Éxito', 'Información del cliente actualizada correctamente');
    } catch (error) {
      console.error('[CustomersScreen] Error updating customer info:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('❌ Error', 'No se pudo actualizar la información del cliente');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (selectedCustomer) {
      setEditedName(selectedCustomer.name);
      setEditedRut(selectedCustomer.rut || '');
      setEditedPhone(selectedCustomer.phone || '');
    }
    setIsEditMode(false);
  };

  const handleOpenDeleteDialog = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowDeleteDialog(true);
  };

  const handleDeleteCustomerOnly = async () => {
    if (!selectedCustomer) return;

    const orderCount = selectedCustomer.orders?.length || 0;
    
    if (orderCount > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '⚠️ No se puede eliminar',
        `Este cliente tiene ${orderCount} ${orderCount === 1 ? 'pedido asociado' : 'pedidos asociados'}. Para eliminar solo el cliente, primero debe eliminar todos sus pedidos, o use la opción "Eliminar Cliente y Pedidos".`,
        [{ text: 'Entendido', style: 'default' }]
      );
      return;
    }

    try {
      setIsDeleting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      const supabase = getSupabase();
      
      console.log('[CustomersScreen] Deleting customer only:', selectedCustomer.id);
      
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', selectedCustomer.id);

      if (error) throw error;

      console.log('[CustomersScreen] Customer deleted successfully');
      
      setCustomers(prev => prev.filter(c => c.id !== selectedCustomer.id));
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ Éxito', 'Cliente eliminado correctamente');
      
      setShowDeleteDialog(false);
      setShowDetailModal(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error('[CustomersScreen] Error deleting customer:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('❌ Error', 'No se pudo eliminar el cliente. Verifique que no tenga pedidos asociados.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCustomerAndOrders = async () => {
    if (!selectedCustomer) return;

    const orderCount = selectedCustomer.orders?.length || 0;

    try {
      setIsDeleting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      const supabase = getSupabase();
      
      console.log('[CustomersScreen] Deleting customer and orders:', selectedCustomer.id);
      
      // First, delete all order items for each order
      if (orderCount > 0) {
        const orderIds = selectedCustomer.orders!.map(o => o.id);
        
        console.log('[CustomersScreen] Deleting order items for orders:', orderIds);
        const { error: itemsError } = await supabase
          .from('order_items')
          .delete()
          .in('order_id', orderIds);

        if (itemsError) throw itemsError;

        // Delete order queries
        console.log('[CustomersScreen] Deleting order queries for orders:', orderIds);
        const { error: queriesError } = await supabase
          .from('order_queries')
          .delete()
          .in('order_id', orderIds);

        if (queriesError) throw queriesError;

        // Delete orders
        console.log('[CustomersScreen] Deleting orders:', orderIds);
        const { error: ordersError } = await supabase
          .from('orders')
          .delete()
          .in('id', orderIds);

        if (ordersError) throw ordersError;
      }

      // Finally, delete the customer (payments will cascade automatically)
      console.log('[CustomersScreen] Deleting customer:', selectedCustomer.id);
      const { error: customerError } = await supabase
        .from('customers')
        .delete()
        .eq('id', selectedCustomer.id);

      if (customerError) throw customerError;

      console.log('[CustomersScreen] Customer and orders deleted successfully');
      
      setCustomers(prev => prev.filter(c => c.id !== selectedCustomer.id));
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Éxito',
        `Cliente y ${orderCount} ${orderCount === 1 ? 'pedido eliminado' : 'pedidos eliminados'} correctamente`
      );
      
      setShowDeleteDialog(false);
      setShowDetailModal(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error('[CustomersScreen] Error deleting customer and orders:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('❌ Error', 'No se pudo eliminar el cliente y sus pedidos');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatCardPress = (status: string) => {
    if (!selectedCustomer) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDetailModal(false);
    
    router.push({
      pathname: '/customer-orders/[customerId]',
      params: {
        customerId: selectedCustomer.id,
        status: status,
        customerName: selectedCustomer.name,
      },
    });
  };

  const calculateCustomerStats = (customer: Customer) => {
    const orders = customer.orders || [];
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing').length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered' || o.status === 'paid').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const thisMonthOrders = orders.filter(o => {
      const orderDate = new Date(o.created_at);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    });
    
    const thisMonthTotal = thisMonthOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const thisMonthCount = thisMonthOrders.length;
    
    const allTimeTotal = orders.reduce((sum, o) => sum + o.total_amount, 0);
    const averageOrderValue = totalOrders > 0 ? allTimeTotal / totalOrders : 0;
    
    const ordersByMonth: { [key: string]: { count: number; total: number } } = {};
    const ordersByYear: { [key: string]: { count: number; total: number } } = {};
    
    orders.forEach(order => {
      const orderDate = new Date(order.created_at);
      const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      const yearKey = String(orderDate.getFullYear());
      
      if (!ordersByMonth[monthKey]) {
        ordersByMonth[monthKey] = { count: 0, total: 0 };
      }
      ordersByMonth[monthKey].count++;
      ordersByMonth[monthKey].total += order.total_amount;
      
      if (!ordersByYear[yearKey]) {
        ordersByYear[yearKey] = { count: 0, total: 0 };
      }
      ordersByYear[yearKey].count++;
      ordersByYear[yearKey].total += order.total_amount;
    });
    
    return {
      totalOrders,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      thisMonthTotal,
      thisMonthCount,
      allTimeTotal,
      averageOrderValue,
      ordersByMonth,
      ordersByYear,
    };
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.rut && customer.rut.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (customer.phone && customer.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (customer.address && customer.address.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const renderCustomerCard = ({ item }: { item: Customer }) => {
    const stats = calculateCustomerStats(item);
    const isBlocked = item.blocked;

    return (
      <TouchableOpacity
        style={[styles.customerCard, isBlocked && styles.customerCardBlocked]}
        onPress={() => openCustomerDetail(item)}
      >
        <View style={styles.customerHeader}>
          <View style={styles.customerNameContainer}>
            <Text style={styles.customerName}>{item.name}</Text>
            {item.rut && (
              <Text style={styles.customerRut}>RUT: {item.rut}</Text>
            )}
          </View>
          {isBlocked && (
            <View style={styles.blockedBadge}>
              <Text style={styles.blockedBadgeText}>Bloqueado</Text>
            </View>
          )}
        </View>

        {item.phone && (
          <View style={styles.customerInfo}>
            <IconSymbol name="phone.fill" size={14} color={colors.textSecondary} />
            <Text style={styles.customerInfoText}>{item.phone}</Text>
          </View>
        )}
        
        {item.address && (
          <View style={styles.customerInfo}>
            <IconSymbol name="location.fill" size={14} color={colors.textSecondary} />
            <Text style={styles.customerInfoText}>{item.address}</Text>
          </View>
        )}

        <View style={styles.customerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalOrders}</Text>
            <Text style={styles.statLabel}>Total Pedidos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.pendingOrders}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCLP(stats.thisMonthTotal)}</Text>
            <Text style={styles.statLabel}>Este Mes</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Clientes</Text>
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={20} color="#fff" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar clientes..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {filteredCustomers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="person.2" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>
            {searchQuery
              ? 'No se encontraron clientes'
              : 'No hay clientes registrados'}
          </Text>
        </View>
      ) : (
        <FlatList
          style={styles.content}
          data={filteredCustomers}
          keyExtractor={(item) => item.id}
          renderItem={renderCustomerCard}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}

      <Modal
        visible={showDetailModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isEditMode && !showDeleteDialog) {
            setShowDetailModal(false);
          }
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {selectedCustomer && (() => {
              const stats = calculateCustomerStats(selectedCustomer);
              const recentOrders = (selectedCustomer.orders || [])
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 10);

              return (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{selectedCustomer.name}</Text>
                    {!isEditMode && (
                      <>
                        {selectedCustomer.rut && (
                          <View style={styles.modalInfoRow}>
                            <IconSymbol name="person.text.rectangle.fill" size={20} color={colors.textSecondary} />
                            <Text style={styles.modalInfoText}>RUT: {selectedCustomer.rut}</Text>
                          </View>
                        )}
                        {selectedCustomer.phone && (
                          <View style={styles.modalInfoRow}>
                            <IconSymbol name="phone.fill" size={16} color={colors.textSecondary} />
                            <Text style={[styles.modalInfoText, { fontSize: 16, fontWeight: 'normal' }]}>{selectedCustomer.phone}</Text>
                          </View>
                        )}
                        {selectedCustomer.address && (
                          <View style={styles.modalInfoRow}>
                            <IconSymbol name="location.fill" size={16} color={colors.textSecondary} />
                            <Text style={[styles.modalInfoText, { fontSize: 16, fontWeight: 'normal' }]}>{selectedCustomer.address}</Text>
                          </View>
                        )}
                        {selectedCustomer.blocked && (
                          <View style={styles.modalInfoRow}>
                            <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#DC2626" />
                            <Text style={[styles.modalInfoText, { fontSize: 16, fontWeight: 'normal', color: '#DC2626' }]}>Cliente bloqueado</Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>

                  {isEditMode ? (
                    <View style={styles.editSection}>
                      <Text style={styles.editSectionTitle}>Editar Información</Text>
                      
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Nombre *</Text>
                        <TextInput
                          style={styles.input}
                          value={editedName}
                          onChangeText={setEditedName}
                          placeholder="Nombre del cliente"
                          placeholderTextColor={colors.textSecondary}
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>RUT</Text>
                        <TextInput
                          style={styles.input}
                          value={editedRut}
                          onChangeText={setEditedRut}
                          placeholder="12.345.678-9"
                          placeholderTextColor={colors.textSecondary}
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Teléfono</Text>
                        <TextInput
                          style={styles.input}
                          value={editedPhone}
                          onChangeText={setEditedPhone}
                          placeholder="+56912345678"
                          placeholderTextColor={colors.textSecondary}
                          keyboardType="phone-pad"
                        />
                      </View>

                      <View style={styles.editButtons}>
                        <TouchableOpacity
                          style={[styles.editButton, styles.editButtonCancel]}
                          onPress={handleCancelEdit}
                          disabled={isSaving}
                        >
                          <Text style={styles.editButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.editButton, styles.editButtonSave]}
                          onPress={handleSaveCustomerInfo}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.editButtonTextSave}>Guardar</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.editModeButton}
                        onPress={() => setIsEditMode(true)}
                      >
                        <IconSymbol name="pencil" size={16} color="#fff" />
                        <Text style={styles.editModeButtonText}>Editar Información</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={handleOpenDeleteDialog}
                      >
                        <IconSymbol name="trash.fill" size={16} color="#fff" />
                        <Text style={styles.deleteButtonText}>Eliminar Cliente</Text>
                      </TouchableOpacity>

                      <ScrollView style={styles.modalScrollView}>
                        <Text style={styles.sectionTitle}>Estadísticas Generales</Text>
                        <View style={styles.statsGrid}>
                          <TouchableOpacity 
                            style={styles.statCard}
                            onPress={() => handleStatCardPress('all')}
                          >
                            <Text style={styles.statCardValue}>{stats.totalOrders}</Text>
                            <Text style={styles.statCardLabel}>Total Pedidos</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.statCard}
                            onPress={() => handleStatCardPress('pending')}
                          >
                            <Text style={styles.statCardValue}>{stats.pendingOrders}</Text>
                            <Text style={styles.statCardLabel}>Pendientes</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.statCard}
                            onPress={() => handleStatCardPress('delivered')}
                          >
                            <Text style={styles.statCardValue}>{stats.deliveredOrders}</Text>
                            <Text style={styles.statCardLabel}>Entregados</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.statCard}
                            onPress={() => handleStatCardPress('cancelled')}
                          >
                            <Text style={styles.statCardValue}>{stats.cancelledOrders}</Text>
                            <Text style={styles.statCardLabel}>Cancelados</Text>
                          </TouchableOpacity>
                          <View style={[styles.statCard, styles.statCardFull]}>
                            <Text style={styles.statCardValue}>{formatCLP(stats.allTimeTotal)}</Text>
                            <Text style={styles.statCardLabel}>Total Histórico</Text>
                          </View>
                          <View style={[styles.statCard, styles.statCardFull]}>
                            <Text style={styles.statCardValue}>{formatCLP(stats.averageOrderValue)}</Text>
                            <Text style={styles.statCardLabel}>Promedio por Pedido</Text>
                          </View>
                        </View>

                        <Text style={styles.sectionTitle}>Compras del Mes</Text>
                        <View style={styles.purchasesByPeriod}>
                          <View style={styles.periodCard}>
                            <View style={styles.periodHeader}>
                              <Text style={styles.periodLabel}>Mes Actual</Text>
                              <Text style={styles.periodValue}>{formatCLP(stats.thisMonthTotal)}</Text>
                            </View>
                            <Text style={styles.periodDetails}>
                              {stats.thisMonthCount} {stats.thisMonthCount === 1 ? 'pedido' : 'pedidos'}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.sectionTitle}>Compras por Mes</Text>
                        <View style={styles.purchasesByPeriod}>
                          {Object.entries(stats.ordersByMonth)
                            .sort(([a], [b]) => b.localeCompare(a))
                            .slice(0, 6)
                            .map(([month, data]) => {
                              const [year, monthNum] = month.split('-');
                              const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
                              return (
                                <View key={month} style={styles.periodCard}>
                                  <View style={styles.periodHeader}>
                                    <Text style={styles.periodLabel}>{monthName}</Text>
                                    <Text style={styles.periodValue}>{formatCLP(data.total)}</Text>
                                  </View>
                                  <Text style={styles.periodDetails}>
                                    {data.count} {data.count === 1 ? 'pedido' : 'pedidos'}
                                  </Text>
                                </View>
                              );
                            })}
                        </View>

                        <Text style={styles.sectionTitle}>Compras por Año</Text>
                        <View style={styles.purchasesByPeriod}>
                          {Object.entries(stats.ordersByYear)
                            .sort(([a], [b]) => b.localeCompare(a))
                            .map(([year, data]) => (
                              <View key={year} style={styles.periodCard}>
                                <View style={styles.periodHeader}>
                                  <Text style={styles.periodLabel}>{year}</Text>
                                  <Text style={styles.periodValue}>{formatCLP(data.total)}</Text>
                                </View>
                                <Text style={styles.periodDetails}>
                                  {data.count} {data.count === 1 ? 'pedido' : 'pedidos'}
                                </Text>
                              </View>
                            ))}
                        </View>

                        <Text style={styles.sectionTitle}>Pedidos Recientes</Text>
                        <View style={styles.ordersList}>
                          {recentOrders.length > 0 ? (
                            recentOrders.map((order: Order) => {
                              const statusStyle = `orderCard${order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', '')}`;
                              return (
                                <TouchableOpacity
                                  key={order.id}
                                  style={[styles.orderCard, styles[statusStyle as keyof typeof styles]]}
                                  onPress={() => {
                                    setShowDetailModal(false);
                                    router.push(`/order/${order.id}`);
                                  }}
                                >
                                  <View style={styles.orderHeader}>
                                    <Text style={styles.orderNumber}>{order.order_number}</Text>
                                    <Text style={styles.orderAmount}>{formatCLP(order.total_amount)}</Text>
                                  </View>
                                  <Text style={styles.orderDate}>📅 {formatDate(order.created_at)}</Text>
                                  <Text style={[styles.orderStatus, { color: getStatusColor(order.status) }]}>
                                    {getStatusLabel(order.status)}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })
                          ) : (
                            <View style={styles.emptySection}>
                              <Text style={styles.emptySectionText}>No hay pedidos registrados</Text>
                            </View>
                          )}
                        </View>
                      </ScrollView>
                    </>
                  )}

                  {!isEditMode && (
                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.modalButtonCancel]}
                        onPress={() => setShowDetailModal(false)}
                      >
                        <Text style={styles.modalButtonText}>Cerrar</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              );
            })()}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showDeleteDialog}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isDeleting) {
            setShowDeleteDialog(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteDialogContent}>
            <Text style={styles.deleteDialogTitle}>⚠️ Eliminar Cliente</Text>
            <Text style={styles.deleteDialogMessage}>
              ¿Qué desea eliminar?
            </Text>
            {selectedCustomer && selectedCustomer.orders && selectedCustomer.orders.length > 0 && (
              <Text style={styles.deleteDialogWarning}>
                Este cliente tiene {selectedCustomer.orders.length} {selectedCustomer.orders.length === 1 ? 'pedido' : 'pedidos'}
              </Text>
            )}
            
            <View style={styles.deleteDialogButtons}>
              <TouchableOpacity
                style={[styles.deleteDialogButton, styles.deleteDialogButtonCustomerOnly]}
                onPress={handleDeleteCustomerOnly}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.deleteDialogButtonText}>Solo Cliente</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteDialogButton, styles.deleteDialogButtonAll]}
                onPress={handleDeleteCustomerAndOrders}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.deleteDialogButtonText}>Cliente y Pedidos</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteDialogButton, styles.deleteDialogButtonCancel]}
                onPress={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
              >
                <Text style={styles.deleteDialogButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
