
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
} from 'react-native';
import { Stack, router } from 'expo-router';
import { getSupabase } from '@/lib/supabase';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { Customer, CustomerPayment, Order } from '@/types';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { usePrinter } from '@/hooks/usePrinter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrinterConfig } from '@/utils/receiptGenerator';
import { addToPrintQueue } from '@/utils/printQueue';

const PRINTER_CONFIG_KEY = '@printer_config';

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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  customerCardWithDebt: {
    borderLeftColor: '#EF4444',
  },
  customerCardPaid: {
    borderLeftColor: '#10B981',
  },
  customerCardBlocked: {
    borderLeftColor: '#6B7280',
    opacity: 0.7,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  customerNameBlocked: {
    color: colors.textSecondary,
  },
  debtBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  debtBadgeWithDebt: {
    backgroundColor: '#FEE2E2',
  },
  debtBadgePaid: {
    backgroundColor: '#D1FAE5',
  },
  debtBadgeBlocked: {
    backgroundColor: '#E5E7EB',
  },
  debtText: {
    fontSize: 12,
    fontWeight: '600',
  },
  debtTextWithDebt: {
    color: '#DC2626',
  },
  debtTextPaid: {
    color: '#059669',
  },
  debtTextBlocked: {
    color: '#6B7280',
  },
  customerInfo: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  blockedBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blockedBannerText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
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
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  statValueDebt: {
    color: '#EF4444',
  },
  statValuePaid: {
    color: '#10B981',
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
    maxHeight: '80%',
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
    marginBottom: 16,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  modalScrollView: {
    maxHeight: 300,
  },
  orderItem: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8B5CF6',
  },
  orderItemHeader: {
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
    color: '#8B5CF6',
  },
  orderDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  orderProductCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  orderPaymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  orderPaymentLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  orderPaymentValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderPaymentPaid: {
    color: '#10B981',
  },
  orderPaymentPending: {
    color: '#EF4444',
  },
  payButton: {
    backgroundColor: '#10B981',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  paymentItem: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
  },
  paymentDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  paymentNotes: {
    fontSize: 12,
    color: colors.text,
    marginTop: 4,
    fontStyle: 'italic',
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
  addPaymentButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  addPaymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  printButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  printButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  blockButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  unblockButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  blockButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyPayments: {
    padding: 16,
    alignItems: 'center',
  },
  emptyPaymentsText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  paymentTypeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  paymentTypeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  paymentTypeButtonActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}20`,
  },
  paymentTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  paymentTypeButtonTextActive: {
    color: colors.primary,
  },
  orderSelector: {
    marginBottom: 16,
  },
  orderSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  orderSelectorItem: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: colors.border,
  },
  orderSelectorItemActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}20`,
  },
  orderSelectorItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderSelectorItemNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  orderSelectorItemAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  orderSelectorItemPending: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
});

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

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function centerText(text: string, width: number): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text;
}

function generatePendingOrdersReceipt(customer: Customer, config?: PrinterConfig): string {
  const width = config?.paper_size === '58mm' ? 32 : 48;
  
  let receipt = '';
  
  if (config?.include_logo !== false) {
    receipt += centerText('ESTADO DE CUENTA', width) + '\n';
    receipt += '='.repeat(width) + '\n\n';
  }
  
  receipt += `Cliente: ${customer.name}\n`;
  if (customer.phone) {
    receipt += `Telefono: ${customer.phone}\n`;
  }
  if (customer.address) {
    receipt += `Direccion: ${customer.address}\n`;
  }
  receipt += `Fecha: ${formatDateTime(new Date().toISOString())}\n`;
  receipt += '-'.repeat(width) + '\n\n';
  
  receipt += 'PEDIDOS PENDIENTES:\n\n';
  
  if (customer.orders && customer.orders.length > 0) {
    for (const order of customer.orders) {
      receipt += `Pedido: ${order.order_number}\n`;
      receipt += `Fecha: ${formatDate(order.created_at)}\n`;
      
      const productCount = order.items?.length || 0;
      receipt += `Productos: ${productCount}\n`;
      
      receipt += `Total: ${formatCLP(order.total_amount)}\n`;
      receipt += `Pagado: ${formatCLP(order.paid_amount)}\n`;
      receipt += `Pendiente: ${formatCLP(order.total_amount - order.paid_amount)}\n`;
      receipt += '\n';
    }
  } else {
    receipt += 'No hay pedidos pendientes\n\n';
  }
  
  receipt += '-'.repeat(width) + '\n';
  
  receipt += `DEUDA TOTAL: ${formatCLP(customer.total_debt)}\n`;
  receipt += `PAGADO: ${formatCLP(customer.total_paid)}\n`;
  receipt += `PENDIENTE: ${formatCLP(customer.total_debt - customer.total_paid)}\n`;
  
  receipt += '\n' + '='.repeat(width) + '\n';
  receipt += centerText('Gracias por su preferencia!', width) + '\n\n\n';
  
  return receipt;
}

function generatePaymentReceipt(
  customer: Customer,
  paymentAmount: number,
  paymentNotes: string,
  orderNumber?: string,
  config?: PrinterConfig
): string {
  const width = config?.paper_size === '58mm' ? 32 : 48;
  
  let receipt = '';
  
  if (config?.include_logo !== false) {
    receipt += centerText('RECIBO DE PAGO', width) + '\n';
    receipt += '='.repeat(width) + '\n\n';
  }
  
  receipt += `Cliente: ${customer.name}\n`;
  if (customer.phone) {
    receipt += `Telefono: ${customer.phone}\n`;
  }
  receipt += `Fecha: ${formatDateTime(new Date().toISOString())}\n`;
  receipt += '-'.repeat(width) + '\n\n';
  
  receipt += 'PAGO RECIBIDO:\n\n';
  receipt += `Monto: ${formatCLP(paymentAmount)}\n`;
  
  if (orderNumber) {
    receipt += `Pedido: ${orderNumber}\n`;
  }
  
  if (paymentNotes.trim()) {
    receipt += `Notas: ${paymentNotes}\n`;
  }
  
  receipt += '\n' + '-'.repeat(width) + '\n';
  
  const previousDebt = customer.total_debt - customer.total_paid;
  const newDebt = previousDebt - paymentAmount;
  
  receipt += `Deuda anterior: ${formatCLP(previousDebt)}\n`;
  receipt += `Pago recibido: ${formatCLP(paymentAmount)}\n`;
  receipt += `Deuda restante: ${formatCLP(newDebt)}\n`;
  
  receipt += '\n' + '='.repeat(width) + '\n';
  receipt += centerText('Gracias por su pago!', width) + '\n\n\n';
  
  return receipt;
}

export default function PendingPaymentsScreen() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'account' | 'order'>('account');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig | null>(null);

  const { print, isConnected } = usePrinter();

  useEffect(() => {
    const loadPrinterConfig = async () => {
      try {
        const configStr = await AsyncStorage.getItem(PRINTER_CONFIG_KEY);
        if (configStr) {
          setPrinterConfig(JSON.parse(configStr));
        }
      } catch (error) {
        console.error('[PendingPaymentsScreen] Error loading printer config:', error);
      }
    };
    loadPrinterConfig();
  }, []);

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
          ),
          payments:customer_payments(
            id,
            amount,
            payment_date,
            notes,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const customersWithFilteredOrders = data
        .map(customer => ({
          ...customer,
          orders: customer.orders?.filter((order: Order) => order.status === 'pending_payment') || [],
        }))
        .filter(customer => customer.orders.length > 0);

      setCustomers(customersWithFilteredOrders);
    } catch (error) {
      console.error('[PendingPaymentsScreen] Error loading customers:', error);
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
    setShowDetailModal(true);
  }, []);

  const openPaymentModal = useCallback((type: 'account' | 'order' = 'account', orderId?: string) => {
    setPaymentType(type);
    setSelectedOrderId(orderId || null);
    setPaymentAmount('');
    setPaymentNotes('');
    setShowPaymentModal(true);
  }, []);

  const handleBlockCustomer = async () => {
    if (!selectedCustomer) return;

    Alert.alert(
      '⚠️ Bloquear Cliente',
      `¿Estás seguro de que deseas bloquear a ${selectedCustomer.name}?\n\nEl cliente no podrá enviar pedidos ni mensajes por WhatsApp mientras esté bloqueado.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: async () => {
            try {
              const supabase = getSupabase();
              const { error } = await supabase
                .from('customers')
                .update({ blocked: true })
                .eq('id', selectedCustomer.id);

              if (error) throw error;

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('✅ Cliente Bloqueado', `${selectedCustomer.name} ha sido bloqueado correctamente`);
              
              setShowDetailModal(false);
              setSelectedCustomer(null);
              await loadCustomers();
            } catch (error) {
              console.error('[PendingPaymentsScreen] Error blocking customer:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('❌ Error', 'No se pudo bloquear al cliente');
            }
          },
        },
      ]
    );
  };

  const handleUnblockCustomer = async () => {
    if (!selectedCustomer) return;

    Alert.alert(
      '✅ Desbloquear Cliente',
      `¿Estás seguro de que deseas desbloquear a ${selectedCustomer.name}?\n\nEl cliente podrá volver a enviar pedidos y mensajes por WhatsApp.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Desbloquear',
          onPress: async () => {
            try {
              const supabase = getSupabase();
              const { error } = await supabase
                .from('customers')
                .update({ blocked: false })
                .eq('id', selectedCustomer.id);

              if (error) throw error;

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('✅ Cliente Desbloqueado', `${selectedCustomer.name} ha sido desbloqueado correctamente`);
              
              setShowDetailModal(false);
              setSelectedCustomer(null);
              await loadCustomers();
            } catch (error) {
              console.error('[PendingPaymentsScreen] Error unblocking customer:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('❌ Error', 'No se pudo desbloquear al cliente');
            }
          },
        },
      ]
    );
  };

  const handlePrintPendingOrders = async () => {
    if (!selectedCustomer) return;

    if (!isConnected) {
      Alert.alert(
        '⚠️ Impresora no conectada',
        'Por favor conecta una impresora en Configuración > Impresora'
      );
      return;
    }

    try {
      const receiptText = generatePendingOrdersReceipt(selectedCustomer, printerConfig || undefined);
      await print(receiptText);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✅ Impreso', 'El estado de cuenta se imprimió correctamente');
    } catch (error) {
      console.error('[PendingPaymentsScreen] Error printing pending orders:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('❌ Error', 'No se pudo imprimir el estado de cuenta');
    }
  };

  const handleSendPendingOrdersToPrinter = async () => {
    if (!selectedCustomer) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const result = await addToPrintQueue('customer_orders', selectedCustomer.id, {
        customer_id: selectedCustomer.id,
      });
      
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          '✅ Enviado a Impresor',
          'El estado de cuenta se agregó a la cola de impresión. El perfil Impresor lo imprimirá.',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error: any) {
      console.error('[PendingPaymentsScreen] Error sending to printer:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error',
        `No se pudo enviar a la cola de impresión: ${error.message}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleAddPayment = async () => {
    if (!selectedCustomer || !paymentAmount.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('⚠️ Atención', 'Por favor ingresa el monto del pago');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('⚠️ Atención', 'El monto debe ser un número válido mayor a 0');
      return;
    }

    if (paymentType === 'order' && selectedOrderId) {
      const selectedOrder = selectedCustomer.orders?.find(o => o.id === selectedOrderId);
      if (!selectedOrder) {
        Alert.alert('❌ Error', 'No se encontró el pedido seleccionado');
        return;
      }
      
      const orderPending = selectedOrder.total_amount - selectedOrder.paid_amount;
      if (amount > orderPending) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          '⚠️ Atención',
          `El monto ingresado (${formatCLP(amount)}) es mayor al pendiente del pedido (${formatCLP(orderPending)})`
        );
        return;
      }
    } else {
      const remainingDebt = selectedCustomer.total_debt - selectedCustomer.total_paid;
      if (amount > remainingDebt) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          '⚠️ Atención',
          `El monto ingresado (${formatCLP(amount)}) es mayor a la deuda pendiente (${formatCLP(remainingDebt)})`
        );
        return;
      }
    }

    try {
      setSubmittingPayment(true);
      const supabase = getSupabase();

      if (paymentType === 'order' && selectedOrderId) {
        const paymentData: any = {
          order_id: selectedOrderId,
          customer_id: selectedCustomer.id,
          amount: amount,
          notes: paymentNotes.trim() || null,
        };

        if (user?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id)) {
          paymentData.created_by = user.id;
        }

        const { error } = await supabase
          .from('order_payments')
          .insert(paymentData);

        if (error) throw error;

        const selectedOrder = selectedCustomer.orders?.find(o => o.id === selectedOrderId);
        const orderNumber = selectedOrder?.order_number;

        if (isConnected) {
          try {
            const receiptText = generatePaymentReceipt(
              selectedCustomer,
              amount,
              paymentNotes,
              orderNumber,
              printerConfig || undefined
            );
            await print(receiptText);
            console.log('[PendingPaymentsScreen] Payment receipt printed successfully');
          } catch (printError) {
            console.error('[PendingPaymentsScreen] Error printing payment receipt:', printError);
          }
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          '✅ Pago Registrado',
          `Se registró el pago de ${formatCLP(amount)} para el pedido ${orderNumber}${isConnected ? ' y se imprimió el recibo' : ''}`,
          [{ text: 'OK' }]
        );
      } else {
        const paymentData: any = {
          customer_id: selectedCustomer.id,
          amount: amount,
          notes: paymentNotes.trim() || null,
        };

        if (user?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id)) {
          paymentData.created_by = user.id;
        }

        const { error } = await supabase
          .from('customer_payments')
          .insert(paymentData);

        if (error) throw error;

        if (isConnected) {
          try {
            const receiptText = generatePaymentReceipt(
              selectedCustomer,
              amount,
              paymentNotes,
              undefined,
              printerConfig || undefined
            );
            await print(receiptText);
            console.log('[PendingPaymentsScreen] Payment receipt printed successfully');
          } catch (printError) {
            console.error('[PendingPaymentsScreen] Error printing payment receipt:', printError);
          }
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          '✅ Pago Registrado',
          `Se registró el abono de ${formatCLP(amount)} a la cuenta${isConnected ? ' y se imprimió el recibo' : ''}`,
          [{ text: 'OK' }]
        );
      }

      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentNotes('');
      setSelectedOrderId(null);
      
      await loadCustomers();
      
      const { data: updatedCustomer } = await supabase
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
          ),
          payments:customer_payments(
            id,
            amount,
            payment_date,
            notes,
            created_at
          )
        `)
        .eq('id', selectedCustomer.id)
        .single();

      if (updatedCustomer) {
        const customerWithFilteredOrders = {
          ...updatedCustomer,
          orders: updatedCustomer.orders?.filter((order: Order) => order.status === 'pending_payment') || [],
        };
        
        if (customerWithFilteredOrders.orders.length === 0) {
          setShowDetailModal(false);
          setSelectedCustomer(null);
        } else {
          setSelectedCustomer(customerWithFilteredOrders);
        }
      } else {
        setShowDetailModal(false);
        setSelectedCustomer(null);
      }
    } catch (error) {
      console.error('[PendingPaymentsScreen] Error adding payment:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('❌ Error', 'No se pudo registrar el pago. Por favor intenta nuevamente.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.phone && customer.phone.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const renderCustomerCard = ({ item }: { item: Customer }) => {
    const remainingDebt = item.total_debt - item.total_paid;
    const hasDebt = remainingDebt > 0;
    const pendingOrdersCount = item.orders?.length || 0;
    const isBlocked = item.blocked;

    return (
      <TouchableOpacity
        style={[
          styles.customerCard,
          isBlocked 
            ? styles.customerCardBlocked 
            : hasDebt 
              ? styles.customerCardWithDebt 
              : styles.customerCardPaid,
        ]}
        onPress={() => openCustomerDetail(item)}
      >
        <View style={styles.customerHeader}>
          <Text style={[styles.customerName, isBlocked && styles.customerNameBlocked]}>
            {item.name}
          </Text>
          <View
            style={[
              styles.debtBadge,
              isBlocked 
                ? styles.debtBadgeBlocked 
                : hasDebt 
                  ? styles.debtBadgeWithDebt 
                  : styles.debtBadgePaid,
            ]}
          >
            <Text
              style={[
                styles.debtText,
                isBlocked 
                  ? styles.debtTextBlocked 
                  : hasDebt 
                    ? styles.debtTextWithDebt 
                    : styles.debtTextPaid,
              ]}
            >
              {isBlocked ? 'Bloqueado' : hasDebt ? 'Con Deuda' : 'Al Día'}
            </Text>
          </View>
        </View>

        {isBlocked && (
          <View style={styles.blockedBanner}>
            <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#DC2626" />
            <Text style={styles.blockedBannerText}>
              Este cliente está bloqueado y no puede enviar pedidos
            </Text>
          </View>
        )}

        {item.phone && (
          <Text style={styles.customerInfo}>📞 {item.phone}</Text>
        )}
        {item.address && (
          <Text style={styles.customerInfo}>📍 {item.address}</Text>
        )}
        <Text style={styles.customerInfo}>
          📦 {pendingOrdersCount} {pendingOrdersCount === 1 ? 'pedido pendiente' : 'pedidos pendientes'}
        </Text>

        <View style={styles.customerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Deuda Total</Text>
            <Text style={[styles.statValue, styles.statValueDebt]}>
              {formatCLP(item.total_debt)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Pagado</Text>
            <Text style={[styles.statValue, styles.statValuePaid]}>
              {formatCLP(item.total_paid)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Pendiente</Text>
            <Text style={[styles.statValue, hasDebt ? styles.statValueDebt : styles.statValuePaid]}>
              {formatCLP(remainingDebt)}
            </Text>
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
        <Text style={styles.headerTitle}>Vales Pendientes</Text>
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
          <IconSymbol name="doc.text" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>
            {searchQuery
              ? 'No se encontraron clientes'
              : 'No hay clientes con pedidos pendientes de pago'}
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
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedCustomer && (
              <>
                <Text style={styles.modalTitle}>{selectedCustomer.name}</Text>
                <Text style={styles.modalSubtitle}>
                  Deuda pendiente: {formatCLP(selectedCustomer.total_debt - selectedCustomer.total_paid)}
                  {selectedCustomer.blocked && '\n🚫 Cliente bloqueado'}
                </Text>

                <ScrollView style={styles.modalScrollView}>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>
                      Pedidos Pendientes ({selectedCustomer.orders?.length || 0})
                    </Text>
                    {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                      selectedCustomer.orders.map((order: Order) => {
                        const productCount = order.items?.length || 0;
                        const orderPending = order.total_amount - order.paid_amount;
                        
                        return (
                          <View key={order.id} style={styles.orderItem}>
                            <TouchableOpacity
                              onPress={() => {
                                setShowDetailModal(false);
                                router.push(`/order/${order.id}`);
                              }}
                            >
                              <View style={styles.orderItemHeader}>
                                <Text style={styles.orderNumber}>{order.order_number}</Text>
                                <Text style={styles.orderAmount}>
                                  {formatCLP(order.total_amount)}
                                </Text>
                              </View>
                              <Text style={styles.orderDate}>
                                📅 {formatDate(order.created_at)}
                              </Text>
                              <Text style={styles.orderProductCount}>
                                📦 {productCount} {productCount === 1 ? 'producto' : 'productos'}
                              </Text>
                              
                              <View style={styles.orderPaymentInfo}>
                                <View>
                                  <Text style={styles.orderPaymentLabel}>Pagado:</Text>
                                  <Text style={[styles.orderPaymentValue, styles.orderPaymentPaid]}>
                                    {formatCLP(order.paid_amount)}
                                  </Text>
                                </View>
                                <View>
                                  <Text style={styles.orderPaymentLabel}>Pendiente:</Text>
                                  <Text style={[styles.orderPaymentValue, styles.orderPaymentPending]}>
                                    {formatCLP(orderPending)}
                                  </Text>
                                </View>
                              </View>
                            </TouchableOpacity>
                            
                            {orderPending > 0 && (
                              <TouchableOpacity
                                style={styles.payButton}
                                onPress={() => {
                                  setShowDetailModal(false);
                                  openPaymentModal('order', order.id);
                                }}
                              >
                                <Text style={styles.payButtonText}>Pagar Pedido</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      })
                    ) : (
                      <View style={styles.emptyPayments}>
                        <Text style={styles.emptyPaymentsText}>
                          No hay pedidos pendientes
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>
                      Historial de Pagos ({selectedCustomer.payments?.length || 0})
                    </Text>
                    {selectedCustomer.payments && selectedCustomer.payments.length > 0 ? (
                      selectedCustomer.payments
                        .sort((a: CustomerPayment, b: CustomerPayment) => 
                          new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
                        )
                        .map((payment: CustomerPayment) => (
                          <View key={payment.id} style={styles.paymentItem}>
                            <View style={styles.paymentHeader}>
                              <Text style={styles.paymentAmount}>
                                {formatCLP(payment.amount)}
                              </Text>
                              <Text style={styles.paymentDate}>
                                📅 {formatDate(payment.payment_date)}
                              </Text>
                            </View>
                            {payment.notes && (
                              <Text style={styles.paymentNotes}>{payment.notes}</Text>
                            )}
                          </View>
                        ))
                    ) : (
                      <View style={styles.emptyPayments}>
                        <Text style={styles.emptyPaymentsText}>
                          No hay pagos registrados
                        </Text>
                      </View>
                    )}
                  </View>
                </ScrollView>

                {selectedCustomer.orders && selectedCustomer.orders.length > 0 && (
                  isConnected ? (
                    <TouchableOpacity
                      style={styles.printButton}
                      onPress={handlePrintPendingOrders}
                    >
                      <IconSymbol name="printer" size={20} color="#fff" />
                      <Text style={styles.printButtonText}>Imprimir Estado de Cuenta</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.printButton, { backgroundColor: '#8B5CF6' }]}
                      onPress={handleSendPendingOrdersToPrinter}
                    >
                      <IconSymbol name="paperplane.fill" size={20} color="#fff" />
                      <Text style={styles.printButtonText}>Enviar a Impresor</Text>
                    </TouchableOpacity>
                  )
                )}

                {selectedCustomer.total_debt - selectedCustomer.total_paid > 0 && !selectedCustomer.blocked && (
                  <TouchableOpacity
                    style={styles.addPaymentButton}
                    onPress={() => {
                      setShowDetailModal(false);
                      openPaymentModal('account');
                    }}
                  >
                    <IconSymbol name="plus.circle" size={20} color="#fff" />
                    <Text style={styles.addPaymentButtonText}>Abonar a la Cuenta</Text>
                  </TouchableOpacity>
                )}

                {selectedCustomer.blocked ? (
                  <TouchableOpacity
                    style={styles.unblockButton}
                    onPress={handleUnblockCustomer}
                  >
                    <IconSymbol name="checkmark.circle" size={20} color="#fff" />
                    <Text style={styles.blockButtonText}>Desbloquear Cliente</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.blockButton}
                    onPress={handleBlockCustomer}
                  >
                    <IconSymbol name="xmark.circle" size={20} color="#fff" />
                    <Text style={styles.blockButtonText}>Bloquear Cliente</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => setShowDetailModal(false)}
                  >
                    <Text style={styles.modalButtonText}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPaymentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Registrar Pago</Text>
            {selectedCustomer && (
              <Text style={styles.modalSubtitle}>
                Cliente: {selectedCustomer.name}
                {'\n'}
                Deuda pendiente: {formatCLP(selectedCustomer.total_debt - selectedCustomer.total_paid)}
              </Text>
            )}

            <View style={styles.paymentTypeSelector}>
              <TouchableOpacity
                style={[
                  styles.paymentTypeButton,
                  paymentType === 'account' && styles.paymentTypeButtonActive,
                ]}
                onPress={() => {
                  setPaymentType('account');
                  setSelectedOrderId(null);
                }}
              >
                <Text
                  style={[
                    styles.paymentTypeButtonText,
                    paymentType === 'account' && styles.paymentTypeButtonTextActive,
                  ]}
                >
                  Abono a Cuenta
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.paymentTypeButton,
                  paymentType === 'order' && styles.paymentTypeButtonActive,
                ]}
                onPress={() => setPaymentType('order')}
              >
                <Text
                  style={[
                    styles.paymentTypeButtonText,
                    paymentType === 'order' && styles.paymentTypeButtonTextActive,
                  ]}
                >
                  Pagar Pedido
                </Text>
              </TouchableOpacity>
            </View>

            {paymentType === 'order' && selectedCustomer && (
              <View style={styles.orderSelector}>
                <Text style={styles.orderSelectorLabel}>Selecciona un pedido:</Text>
                <ScrollView style={{ maxHeight: 200 }}>
                  {selectedCustomer.orders?.map((order: Order) => {
                    const orderPending = order.total_amount - order.paid_amount;
                    return (
                      <TouchableOpacity
                        key={order.id}
                        style={[
                          styles.orderSelectorItem,
                          selectedOrderId === order.id && styles.orderSelectorItemActive,
                        ]}
                        onPress={() => setSelectedOrderId(order.id)}
                      >
                        <View style={styles.orderSelectorItemHeader}>
                          <Text style={styles.orderSelectorItemNumber}>{order.order_number}</Text>
                          <Text style={styles.orderSelectorItemAmount}>
                            {formatCLP(order.total_amount)}
                          </Text>
                        </View>
                        <Text style={styles.orderSelectorItemPending}>
                          Pendiente: {formatCLP(orderPending)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder="Monto del pago"
              placeholderTextColor={colors.textSecondary}
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              keyboardType="numeric"
            />

            <TextInput
              style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
              placeholder="Notas (opcional)"
              placeholderTextColor={colors.textSecondary}
              value={paymentNotes}
              onChangeText={setPaymentNotes}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowPaymentModal(false);
                  setShowDetailModal(true);
                }}
                disabled={submittingPayment}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonConfirm,
                  (submittingPayment || !paymentAmount.trim() || (paymentType === 'order' && !selectedOrderId)) && { opacity: 0.5 },
                ]}
                onPress={handleAddPayment}
                disabled={submittingPayment || !paymentAmount.trim() || (paymentType === 'order' && !selectedOrderId)}
              >
                {submittingPayment ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                    Registrar
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
