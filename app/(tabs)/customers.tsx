
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
  Modal,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { getSupabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/IconSymbol';
import { Customer, Order } from '@/types';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { usePrinter } from '@/hooks/usePrinter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrinterConfig } from '@/utils/receiptGenerator';
import { addToPrintQueue } from '@/utils/printQueue';
import { CustomDialog, DialogButton } from '@/components/CustomDialog';
import { getStatusColor, getStatusLabel } from '@/utils/orderHelpers';

const { width } = Dimensions.get('window');
const PRINTER_CONFIG_KEY = '@printer_config';

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

function formatDateRelative(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins}m`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
  });
}

function centerText(text: string, width: number): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text;
}

function generateDebtReceipt(customer: Customer, config?: PrinterConfig): string {
  const width = config?.paper_size === '58mm' ? 32 : 48;
  
  let receipt = '';
  
  receipt += centerText('DEUDA VALES PENDIENTES', width) + '\n';
  receipt += '='.repeat(width) + '\n\n';
  
  receipt += `Cliente: ${customer.name}\n`;
  if (customer.phone) {
    receipt += `Telefono: ${customer.phone}\n`;
  }
  if (customer.address) {
    receipt += `Direccion: ${customer.address}\n`;
  }
  receipt += `Fecha: ${formatDateTime(new Date().toISOString())}\n`;
  receipt += '-'.repeat(width) + '\n\n';
  
  receipt += 'RESUMEN VALES PENDIENTES:\n\n';
  
  const pendingOrders = customer.orders?.filter(order => order.status === 'pending_payment') || [];
  
  if (pendingOrders.length > 0) {
    let totalDebt = 0;
    
    for (const order of pendingOrders) {
      const orderDebt = order.total_amount - order.paid_amount;
      totalDebt += orderDebt;
      
      receipt += `Pedido: ${order.order_number}\n`;
      receipt += `Fecha: ${formatDate(order.created_at)}\n`;
      
      const productCount = order.items?.length || 0;
      receipt += `Productos: ${productCount}\n`;
      
      receipt += `Monto Total: ${formatCLP(order.total_amount)}\n`;
      receipt += '\n';
    }
    
    receipt += '-'.repeat(width) + '\n';
    receipt += `TOTAL VALES: ${pendingOrders.length}\n`;
    receipt += `SUMA TOTAL DEUDA: ${formatCLP(totalDebt)}\n`;
  } else {
    receipt += 'No hay vales pendientes\n\n';
    receipt += '-'.repeat(width) + '\n';
    receipt += 'SUMA TOTAL DEUDA: $0\n';
  }
  
  receipt += '\n' + '='.repeat(width) + '\n';
  receipt += centerText('Documento para gestion de cobranza', width) + '\n\n\n';
  
  return receipt;
}

interface DialogState {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  buttons?: DialogButton[];
}

export default function CustomersScreen() {
  const { user } = useAuth();
  const { colors } = useThemedStyles();
  const { print, isConnected } = usePrinter();
  const navigation = useNavigation();
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
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig | null>(null);
  const [dialog, setDialog] = useState<DialogState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  // Configure header
  useEffect(() => {
    navigation.setOptions({
      title: 'Clientes',
      headerShown: true,
      headerStyle: { backgroundColor: colors.primary },
      headerTintColor: '#fff',
    });
  }, [navigation, colors.primary]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      margin: 16,
      marginBottom: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.card,
      gap: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
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
      borderWidth: 1,
      borderColor: colors.border,
    },
    customerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    customerHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    statusDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    customerInfo: {
      flex: 1,
    },
    customerName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 2,
    },
    customerRut: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    blockedBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: '#FEE2E2',
    },
    blockedBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#DC2626',
    },
    customerDetails: {
      gap: 8,
      marginBottom: 12,
    },
    customerDetailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    customerDetailText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    customerStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
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
    // Modern order card styles matching home screen
    orderCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    orderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    orderHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    orderStatusDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    orderInfo: {
      flex: 1,
    },
    orderNumberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 2,
    },
    orderNumber: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    sourceIconContainer: {
      width: 22,
      height: 22,
      borderRadius: 11,
      justifyContent: 'center',
      alignItems: 'center',
    },
    orderCustomer: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    orderDetails: {
      gap: 8,
      marginBottom: 12,
    },
    orderDetailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    orderDetailText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    statusBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
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
    printDebtButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#8B5CF6',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    printDebtButtonText: {
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
    deleteDialogInfo: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 20,
      textAlign: 'center',
      lineHeight: 20,
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

  useEffect(() => {
    const loadPrinterConfig = async () => {
      try {
        const configStr = await AsyncStorage.getItem(PRINTER_CONFIG_KEY);
        if (configStr) {
          setPrinterConfig(JSON.parse(configStr));
        }
      } catch (error) {
        console.error('[CustomersScreen] Error loading printer config:', error);
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
            source,
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
      setDialog({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los clientes',
      });
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

  const handlePrintDebt = async () => {
    if (!selectedCustomer) return;

    const pendingOrders = selectedCustomer.orders?.filter(order => order.status === 'pending_payment') || [];
    
    if (pendingOrders.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setDialog({
        visible: true,
        type: 'warning',
        title: 'Sin Vales Pendientes',
        message: 'Este cliente no tiene vales pendientes de pago',
      });
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const receiptText = generateDebtReceipt(selectedCustomer, printerConfig || undefined);
      
      if (isConnected) {
        await print(receiptText);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setDialog({
          visible: true,
          type: 'success',
          title: 'Impreso',
          message: 'El recibo de deuda se imprimió correctamente',
        });
      } else {
        console.log('[CustomersScreen] No printer connected, adding debt receipt to print queue');
        
        const result = await addToPrintQueue('customer_debt', selectedCustomer.id, {
          customer_name: selectedCustomer.name,
          customer_phone: selectedCustomer.phone,
          receipt_text: receiptText,
          pending_orders_count: pendingOrders.length,
        });
        
        if (result.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setDialog({
            visible: true,
            type: 'success',
            title: 'Agregado a Cola de Impresión',
            message: 'El recibo de deuda se agregó a la cola de impresión. Se imprimirá automáticamente cuando conectes una impresora.',
          });
        } else {
          throw new Error(result.error || 'Error al agregar a la cola de impresión');
        }
      }
    } catch (error) {
      console.error('[CustomersScreen] Error printing debt receipt:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setDialog({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo imprimir el recibo de deuda',
      });
    }
  };

  const handleSaveCustomerInfo = async () => {
    if (!selectedCustomer) return;

    if (!editedName.trim()) {
      setDialog({
        visible: true,
        type: 'warning',
        title: 'Error',
        message: 'El nombre del cliente es obligatorio',
      });
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
      setDialog({
        visible: true,
        type: 'success',
        title: 'Éxito',
        message: 'Información del cliente actualizada correctamente',
      });
    } catch (error) {
      console.error('[CustomersScreen] Error updating customer info:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setDialog({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo actualizar la información del cliente',
      });
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
    
    try {
      setIsDeleting(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      const supabase = getSupabase();
      
      console.log('[CustomersScreen] Deleting customer only (disassociating from orders):', selectedCustomer.id);
      
      if (orderCount > 0) {
        const orderIds = selectedCustomer.orders!.map(o => o.id);
        
        console.log('[CustomersScreen] Disassociating customer from orders:', orderIds);
        const { error: updateError } = await supabase
          .from('orders')
          .update({ customer_id: null })
          .in('id', orderIds);

        if (updateError) throw updateError;
        
        console.log('[CustomersScreen] Successfully disassociated customer from', orderCount, 'orders');
      }
      
      console.log('[CustomersScreen] Deleting customer record:', selectedCustomer.id);
      const { error: deleteError } = await supabase
        .from('customers')
        .delete()
        .eq('id', selectedCustomer.id);

      if (deleteError) throw deleteError;

      console.log('[CustomersScreen] Customer deleted successfully');
      
      setCustomers(prev => prev.filter(c => c.id !== selectedCustomer.id));
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const message = orderCount > 0
        ? `Cliente eliminado correctamente. Los ${orderCount} ${orderCount === 1 ? 'pedido asociado se mantiene' : 'pedidos asociados se mantienen'} con los datos del cliente preservados.`
        : 'Cliente eliminado correctamente.';
      
      setDialog({
        visible: true,
        type: 'success',
        title: 'Éxito',
        message: message,
        buttons: [{
          text: 'OK',
          style: 'primary',
          onPress: () => {
            setShowDeleteDialog(false);
            setShowDetailModal(false);
            setSelectedCustomer(null);
          },
        }],
      });
    } catch (error) {
      console.error('[CustomersScreen] Error deleting customer:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setDialog({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo eliminar el cliente. Por favor, intente nuevamente.',
      });
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
      
      if (orderCount > 0) {
        const orderIds = selectedCustomer.orders!.map(o => o.id);
        
        console.log('[CustomersScreen] Deleting order items for orders:', orderIds);
        const { error: itemsError } = await supabase
          .from('order_items')
          .delete()
          .in('order_id', orderIds);

        if (itemsError) throw itemsError;

        console.log('[CustomersScreen] Deleting order queries for orders:', orderIds);
        const { error: queriesError } = await supabase
          .from('order_queries')
          .delete()
          .in('order_id', orderIds);

        if (queriesError) throw queriesError;

        console.log('[CustomersScreen] Deleting orders:', orderIds);
        const { error: ordersError } = await supabase
          .from('orders')
          .delete()
          .in('id', orderIds);

        if (ordersError) throw ordersError;
      }

      console.log('[CustomersScreen] Deleting customer:', selectedCustomer.id);
      const { error: customerError } = await supabase
        .from('customers')
        .delete()
        .eq('id', selectedCustomer.id);

      if (customerError) throw customerError;

      console.log('[CustomersScreen] Customer and orders deleted successfully');
      
      setCustomers(prev => prev.filter(c => c.id !== selectedCustomer.id));
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDialog({
        visible: true,
        type: 'success',
        title: 'Éxito',
        message: `Cliente y ${orderCount} ${orderCount === 1 ? 'pedido eliminado' : 'pedidos eliminados'} correctamente`,
        buttons: [{
          text: 'OK',
          style: 'primary',
          onPress: () => {
            setShowDeleteDialog(false);
            setShowDetailModal(false);
            setSelectedCustomer(null);
          },
        }],
      });
    } catch (error) {
      console.error('[CustomersScreen] Error deleting customer and orders:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setDialog({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo eliminar el cliente y sus pedidos',
      });
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
    const statusColor = isBlocked ? '#6B7280' : colors.primary;

    return (
      <TouchableOpacity
        style={styles.customerCard}
        onPress={() => openCustomerDetail(item)}
      >
        <View style={styles.customerHeader}>
          <View style={styles.customerHeaderLeft}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{item.name}</Text>
              {item.rut && (
                <Text style={styles.customerRut}>RUT: {item.rut}</Text>
              )}
            </View>
          </View>
          {isBlocked && (
            <View style={styles.blockedBadge}>
              <Text style={styles.blockedBadgeText}>Bloqueado</Text>
            </View>
          )}
        </View>

        <View style={styles.customerDetails}>
          {item.phone && (
            <View style={styles.customerDetailRow}>
              <IconSymbol ios_icon_name="phone.fill" android_material_icon_name="phone" size={14} color={colors.textSecondary} />
              <Text style={styles.customerDetailText}>{item.phone}</Text>
            </View>
          )}
          
          {item.address && (
            <View style={styles.customerDetailRow}>
              <IconSymbol ios_icon_name="location.fill" android_material_icon_name="location_on" size={14} color={colors.textSecondary} />
              <Text style={styles.customerDetailText}>{item.address}</Text>
            </View>
          )}
        </View>

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
      <View style={styles.searchContainer}>
        <IconSymbol ios_icon_name="magnifyingglass" android_material_icon_name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar clientes..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {filteredCustomers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol ios_icon_name="person.2" android_material_icon_name="people" size={64} color={colors.textSecondary} />
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

      <CustomDialog
        visible={dialog.visible}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        buttons={dialog.buttons}
        onClose={() => setDialog({ ...dialog, visible: false })}
      />

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
              
              const pendingPaymentOrders = selectedCustomer.orders?.filter(o => o.status === 'pending_payment') || [];
              const hasPendingPayments = pendingPaymentOrders.length > 0;

              return (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{selectedCustomer.name}</Text>
                    {!isEditMode && (
                      <>
                        {selectedCustomer.rut && (
                          <View style={styles.modalInfoRow}>
                            <IconSymbol ios_icon_name="person.text.rectangle.fill" android_material_icon_name="badge" size={20} color={colors.textSecondary} />
                            <Text style={styles.modalInfoText}>RUT: {selectedCustomer.rut}</Text>
                          </View>
                        )}
                        {selectedCustomer.phone && (
                          <View style={styles.modalInfoRow}>
                            <IconSymbol ios_icon_name="phone.fill" android_material_icon_name="phone" size={16} color={colors.textSecondary} />
                            <Text style={[styles.modalInfoText, { fontSize: 16, fontWeight: 'normal' }]}>{selectedCustomer.phone}</Text>
                          </View>
                        )}
                        {selectedCustomer.address && (
                          <View style={styles.modalInfoRow}>
                            <IconSymbol ios_icon_name="location.fill" android_material_icon_name="location_on" size={16} color={colors.textSecondary} />
                            <Text style={[styles.modalInfoText, { fontSize: 16, fontWeight: 'normal' }]}>{selectedCustomer.address}</Text>
                          </View>
                        )}
                        {selectedCustomer.blocked && (
                          <View style={styles.modalInfoRow}>
                            <IconSymbol ios_icon_name="exclamationmark.triangle.fill" android_material_icon_name="warning" size={16} color="#DC2626" />
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
                        <IconSymbol ios_icon_name="pencil" android_material_icon_name="edit" size={16} color="#fff" />
                        <Text style={styles.editModeButtonText}>Editar Información</Text>
                      </TouchableOpacity>

                      {hasPendingPayments && (
                        <TouchableOpacity
                          style={styles.printDebtButton}
                          onPress={handlePrintDebt}
                        >
                          <IconSymbol ios_icon_name="printer.fill" android_material_icon_name="print" size={16} color="#fff" />
                          <Text style={styles.printDebtButtonText}>Imprimir Deuda</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={handleOpenDeleteDialog}
                      >
                        <IconSymbol ios_icon_name="trash.fill" android_material_icon_name="delete" size={16} color="#fff" />
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
                              const statusColor = getStatusColor(order.status);
                              const itemCount = order.items?.length || 0;
                              const total = order.items?.reduce((sum, item) => sum + item.unit_price, 0) || 0;

                              return (
                                <TouchableOpacity
                                  key={order.id}
                                  style={styles.orderCard}
                                  onPress={() => {
                                    setShowDetailModal(false);
                                    router.push(`/order/${order.id}`);
                                  }}
                                >
                                  <View style={styles.orderHeader}>
                                    <View style={styles.orderHeaderLeft}>
                                      <View style={[styles.orderStatusDot, { backgroundColor: statusColor }]} />
                                      <View style={styles.orderInfo}>
                                        <View style={styles.orderNumberRow}>
                                          <Text style={styles.orderNumber}>{order.order_number}</Text>
                                          {/* Source icon - WhatsApp or Manual */}
                                          <View style={[
                                            styles.sourceIconContainer,
                                            { backgroundColor: order.source === 'whatsapp' ? '#25D366' : colors.textSecondary }
                                          ]}>
                                            <IconSymbol 
                                              ios_icon_name={order.source === 'whatsapp' ? 'message.fill' : 'pencil'}
                                              android_material_icon_name={order.source === 'whatsapp' ? 'message' : 'edit'}
                                              size={12} 
                                              color="#fff" 
                                            />
                                          </View>
                                        </View>
                                        <Text style={styles.orderCustomer}>{order.customer_name}</Text>
                                      </View>
                                    </View>
                                  </View>
                                  
                                  <View style={styles.orderDetails}>
                                    <View style={styles.orderDetailRow}>
                                      <IconSymbol ios_icon_name="clock.fill" android_material_icon_name="schedule" size={14} color={colors.textSecondary} />
                                      <Text style={styles.orderDetailText}>{formatDateRelative(order.created_at)}</Text>
                                    </View>
                                    <View style={styles.orderDetailRow}>
                                      <IconSymbol ios_icon_name="bag.fill" android_material_icon_name="shopping_bag" size={14} color={colors.textSecondary} />
                                      <Text style={styles.orderDetailText}>
                                        {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
                                      </Text>
                                    </View>
                                    {total > 0 && (
                                      <View style={styles.orderDetailRow}>
                                        <IconSymbol ios_icon_name="dollarsign.circle.fill" android_material_icon_name="attach_money" size={14} color={colors.textSecondary} />
                                        <Text style={styles.orderDetailText}>{formatCLP(total)}</Text>
                                      </View>
                                    )}
                                  </View>
                                  
                                  <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                                    <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
                                  </View>
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
              <>
                <Text style={styles.deleteDialogWarning}>
                  Este cliente tiene {selectedCustomer.orders.length} {selectedCustomer.orders.length === 1 ? 'pedido' : 'pedidos'}
                </Text>
                <Text style={styles.deleteDialogInfo}>
                  • Solo Cliente: Elimina el cliente pero mantiene los pedidos con todos sus datos{'\n'}
                  • Cliente y Pedidos: Elimina el cliente y todos sus pedidos
                </Text>
              </>
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
