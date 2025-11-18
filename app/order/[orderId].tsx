
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePrinter } from '@/hooks/usePrinter';
import { generateReceiptText, PrinterConfig } from '@/utils/receiptGenerator';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';
import { parseWhatsAppMessage, ParsedOrderItem } from '@/utils/whatsappParser';
import { addToPrintQueue } from '@/utils/printQueue';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useOrderDetail } from '@/hooks/useOrderDetail';
import { useOrderCustomer } from '@/hooks/useOrderCustomer';
import { useOrderProducts } from '@/hooks/useOrderProducts';
import { useOrderQueries } from '@/hooks/useOrderQueries';
import { OrderStatusSection } from '@/components/order/OrderStatusSection';
import { CustomDialog, DialogButton } from '@/components/CustomDialog';
import {
  getAvailableStatusTransitions,
  formatCLP,
  formatProductDisplay,
  getAdditionalNotes,
  formatDate,
  formatShortDate,
} from '@/utils/orderHelpers';

const PRINTER_CONFIG_KEY = '@printer_config';

interface DialogState {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  buttons?: DialogButton[];
}

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { user } = useAuth();
  const { printReceipt, isConnected } = usePrinter();
  const { colors } = useThemedStyles();

  const [printerConfig, setPrinterConfig] = useState<PrinterConfig | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [whatsappInput, setWhatsappInput] = useState('');
  const [parsedProducts, setParsedProducts] = useState<ParsedOrderItem[]>([]);
  const [dialog, setDialog] = useState<DialogState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  // WhatsApp Edit Modal State
  const [showWhatsAppEditModal, setShowWhatsAppEditModal] = useState(false);
  const [whatsappEditInput, setWhatsappEditInput] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [parsedEditProduct, setParsedEditProduct] = useState<ParsedOrderItem | null>(null);

  // Recurring Customer Dialog State
  const [showRecurringCustomerDialog, setShowRecurringCustomerDialog] = useState(false);

  // Use custom hooks
  const {
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
  } = useOrderDetail(orderId, user?.id);

  const customerHook = useOrderCustomer(order, loadOrder);
  const productsHook = useOrderProducts(order, loadOrder);
  const queriesHook = useOrderQueries(order, loadOrder, printReceipt, printerConfig, isConnected);

  const loadPrinterConfig = useCallback(async () => {
    try {
      console.log('[OrderDetail] Loading printer config...');
      const configStr = await AsyncStorage.getItem(PRINTER_CONFIG_KEY);
      if (configStr) {
        const config = JSON.parse(configStr);
        setPrinterConfig(config);
        console.log('[OrderDetail] Printer config loaded');
      } else {
        console.log('[OrderDetail] No printer config found');
      }
    } catch (error) {
      console.error('[OrderDetail] Error loading printer config:', error);
    }
  }, []);

  useEffect(() => {
    loadPrinterConfig();
  }, [loadPrinterConfig]);

  // FIXED: Load customers only when switching to select mode
  // Use separate state variables instead of the entire customerHook object
  useEffect(() => {
    if (customerHook.editingCustomer && customerHook.customerInputMode === 'select' && customerHook.availableCustomers.length === 0) {
      console.log('[OrderDetail] Loading customers for select mode...');
      customerHook.loadCustomers();
    }
  }, [customerHook.editingCustomer, customerHook.customerInputMode, customerHook.availableCustomers.length]);

  // FIXED: Set customer info from order only when order changes
  useEffect(() => {
    if (order) {
      customerHook.setCustomerName(order.customer_name);
      customerHook.setCustomerPhone(order.customer_phone || '');
      customerHook.setCustomerAddress(order.customer_address || '');
    }
  }, [order?.id, order?.customer_name, order?.customer_phone, order?.customer_address]);

  useEffect(() => {
    if (whatsappInput.trim()) {
      try {
        const parsed = parseWhatsAppMessage(whatsappInput);
        setParsedProducts(parsed);
      } catch (error) {
        console.error('[OrderDetail] Error parsing WhatsApp input:', error);
        setParsedProducts([]);
      }
    } else {
      setParsedProducts([]);
    }
  }, [whatsappInput]);

  // Parse WhatsApp edit input
  useEffect(() => {
    if (whatsappEditInput.trim()) {
      try {
        const parsed = parseWhatsAppMessage(whatsappEditInput);
        if (parsed.length > 0) {
          setParsedEditProduct(parsed[0]); // Take first parsed item
        } else {
          setParsedEditProduct(null);
        }
      } catch (error) {
        console.error('[OrderDetail] Error parsing WhatsApp edit input:', error);
        setParsedEditProduct(null);
      }
    } else {
      setParsedEditProduct(null);
    }
  }, [whatsappEditInput]);

  const handleAddCustomerToMenu = async () => {
    if (!order) return;

    // Show recurring customer dialog first
    setShowRecurringCustomerDialog(true);
  };

  const handleAddCustomerAsRecurring = async (asRecurring: boolean) => {
    setShowRecurringCustomerDialog(false);

    const result = await customerHook.addCustomerToMenu(asRecurring);
    
    if (result.needsConfirmation && result.existingCustomerId) {
      // Show confirmation dialog for linking to existing customer
      setDialog({
        visible: true,
        type: 'warning',
        title: 'Cliente Ya Existe',
        message: result.message,
        buttons: [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setDialog({ ...dialog, visible: false });
            },
          },
          {
            text: 'Vincular',
            style: 'primary',
            icon: 'link',
            onPress: async () => {
              setDialog({ ...dialog, visible: false });
              const linkResult = await customerHook.linkOrderToCustomer(result.existingCustomerId);
              
              setDialog({
                visible: true,
                type: linkResult.type || 'info',
                title: linkResult.success ? 'Pedido Vinculado' : 'Error',
                message: linkResult.message,
              });
            },
          },
        ],
      });
    } else {
      // Show result dialog
      setDialog({
        visible: true,
        type: result.type || (result.success ? 'success' : 'error'),
        title: result.success ? 'Cliente Agregado' : 'Error',
        message: result.message,
      });
    }
  };

  const handleUpdateCustomerInfo = async () => {
    const result = await customerHook.updateCustomerInfo();
    
    setDialog({
      visible: true,
      type: result.success ? 'success' : 'error',
      title: result.success ? 'Éxito' : 'Error',
      message: result.message,
    });
  };

  const handlePrint = async () => {
    if (!order) return;

    if (!isConnected) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setDialog({
        visible: true,
        type: 'warning',
        title: 'Impresora No Conectada',
        message: 'Por favor conecta una impresora antes de imprimir',
      });
      return;
    }

    try {
      console.log('[OrderDetail] Printing with config:', printerConfig);
      
      const receiptText = generateReceiptText(order, printerConfig || undefined, 'manual_print');
      const autoCut = printerConfig?.auto_cut_enabled ?? true;
      const textSize = printerConfig?.text_size || 'medium';
      const encoding = printerConfig?.encoding || 'CP850';

      // FIXED: Pass order ID to prevent duplicate printing
      await printReceipt(receiptText, autoCut, textSize, order.id);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDialog({
        visible: true,
        type: 'success',
        title: 'Impresión Exitosa',
        message: 'El pedido se imprimió correctamente',
      });
    } catch (error) {
      console.error('[OrderDetail] Print error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setDialog({
        visible: true,
        type: 'error',
        title: 'Error de Impresión',
        message: 'No se pudo imprimir el pedido. Verifica la conexión con la impresora.',
      });
    }
  };

  const handleSendToPrinter = async () => {
    if (!order) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const result = await addToPrintQueue('order', order.id);
      
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setDialog({
          visible: true,
          type: 'success',
          title: 'Enviado a Impresor',
          message: 'El pedido se agregó a la cola de impresión. El perfil Impresor lo imprimirá.',
        });
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error: any) {
      console.error('[OrderDetail] Error sending to printer:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setDialog({
        visible: true,
        type: 'error',
        title: 'Error',
        message: `No se pudo enviar a la cola de impresión: ${error.message}`,
      });
    }
  };

  const handleWhatsApp = async () => {
    if (!order?.customer_phone) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setDialog({
        visible: true,
        type: 'warning',
        title: 'Sin Número de Teléfono',
        message: 'Este pedido no tiene un número de teléfono asociado',
      });
      return;
    }

    const phone = order.customer_phone.replace(/\D/g, '');
    const url = `https://wa.me/${phone}`;

    try {
      await Linking.openURL(url);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('[OrderDetail] Error opening WhatsApp:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setDialog({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo abrir WhatsApp. Verifica que esté instalado en tu dispositivo.',
      });
    }
  };

  const handleDelete = () => {
    if (!order) return;

    let deleteMessage = `¿Estás seguro de que deseas eliminar el pedido ${order.order_number}?\n\nEsta acción no se puede deshacer.`;
    
    if (order.customer_id && order.status === 'pending_payment') {
      deleteMessage += `\n\n⚠️ Este pedido está vinculado a un cliente y en estado "Pendiente de Pago". Al eliminarlo:\n\n- Se restará ${formatCLP(order.total_amount)} de la deuda del cliente\n- Se actualizarán automáticamente los totales de la cuenta`;
    }

    setDialog({
      visible: true,
      type: 'warning',
      title: 'Eliminar Pedido',
      message: deleteMessage,
      buttons: [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setDialog({ ...dialog, visible: false });
          },
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          icon: 'trash.fill',
          onPress: async () => {
            setDialog({ ...dialog, visible: false });
            const success = await deleteOrder();
            if (success) {
              let successMessage = `El pedido ${order.order_number} se eliminó correctamente`;
              if (order.customer_id && order.status === 'pending_payment') {
                successMessage += `\n\nLos totales de la cuenta del cliente se actualizaron automáticamente`;
              }
              
              setDialog({
                visible: true,
                type: 'success',
                title: 'Pedido Eliminado',
                message: successMessage,
                buttons: [{
                  text: 'OK',
                  style: 'primary',
                  onPress: () => router.back(),
                }],
              });
            }
          },
        },
      ],
    });
  };

  const handleBlockCustomer = () => {
    if (!order?.customer_phone) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setDialog({
        visible: true,
        type: 'warning',
        title: 'Sin Número de Teléfono',
        message: 'Este pedido no tiene un número de teléfono asociado para bloquear',
      });
      return;
    }

    setDialog({
      visible: true,
      type: 'warning',
      title: 'Bloquear Cliente - Confirmación 1/2',
      message: `¿Estás seguro de que deseas bloquear a ${order.customer_name}?\n\nEl cliente no podrá enviar pedidos ni mensajes por WhatsApp mientras esté bloqueado.`,
      buttons: [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setDialog({ ...dialog, visible: false });
          },
        },
        {
          text: 'Continuar',
          style: 'destructive',
          onPress: () => {
            setDialog({
              visible: true,
              type: 'warning',
              title: 'Bloquear Cliente - Confirmación 2/2',
              message: `Esta es tu última oportunidad para cancelar.\n\n¿Realmente deseas bloquear a ${order.customer_name}?`,
              buttons: [
                {
                  text: 'Cancelar',
                  style: 'cancel',
                  onPress: () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDialog({ ...dialog, visible: false });
                  },
                },
                {
                  text: 'Bloquear',
                  style: 'destructive',
                  icon: 'xmark.circle.fill',
                  onPress: async () => {
                    setDialog({ ...dialog, visible: false });
                    const success = await customerHook.blockCustomer();
                    if (success) {
                      setCustomerBlocked(true);
                      setDialog({
                        visible: true,
                        type: 'success',
                        title: 'Cliente Bloqueado',
                        message: `${order.customer_name} ha sido bloqueado correctamente.\n\nNo podrá enviar pedidos ni mensajes por WhatsApp.`,
                      });
                    }
                  },
                },
              ],
            });
          },
        },
      ],
    });
  };

  const handleUnblockCustomer = async () => {
    if (!order?.customer_phone) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setDialog({
        visible: true,
        type: 'warning',
        title: 'Sin Número de Teléfono',
        message: 'Este pedido no tiene un número de teléfono asociado',
      });
      return;
    }

    setDialog({
      visible: true,
      type: 'info',
      title: 'Desbloquear Cliente',
      message: `¿Estás seguro de que deseas desbloquear a ${order.customer_name}?\n\nEl cliente podrá volver a enviar pedidos y mensajes por WhatsApp.`,
      buttons: [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setDialog({ ...dialog, visible: false });
          },
        },
        {
          text: 'Desbloquear',
          style: 'success',
          icon: 'checkmark.circle.fill',
          onPress: async () => {
            setDialog({ ...dialog, visible: false });
            const success = await customerHook.unblockCustomer();
            if (success) {
              setCustomerBlocked(false);
              setDialog({
                visible: true,
                type: 'success',
                title: 'Cliente Desbloqueado',
                message: `${order.customer_name} ha sido desbloqueado correctamente.\n\nPodrá volver a enviar pedidos y mensajes por WhatsApp.`,
              });
            }
          },
        },
      ],
    });
  };

  const handleStatusChange = async (newStatus: any) => {
    const success = await updateStatus(newStatus, user?.role);
    if (success) {
      if (newStatus === 'pending_payment') {
        setDialog({
          visible: true,
          type: 'success',
          title: 'Estado Actualizado',
          message: `El pedido ahora está en estado: Pendiente de Pago\n\nEl cliente ha sido creado automáticamente y aparecerá en "Vales Pendientes".`,
        });
      } else {
        setDialog({
          visible: true,
          type: 'success',
          title: 'Estado Actualizado',
          message: `El pedido ahora está en estado: ${newStatus}`,
        });
      }
    }
  };

  const openAddProductModal = () => {
    setWhatsappInput('');
    setParsedProducts([]);
    setShowAddProductModal(true);
  };

  const addProductsFromWhatsApp = async () => {
    const success = await productsHook.addProductsFromWhatsApp(parsedProducts);
    if (success) {
      setShowAddProductModal(false);
      setWhatsappInput('');
      setParsedProducts([]);
    }
  };

  const deleteProduct = (itemId: string) => {
    if (!order) return;

    const item = order.items?.find(i => i.id === itemId);
    if (!item) return;

    setDialog({
      visible: true,
      type: 'warning',
      title: 'Eliminar Producto',
      message: `¿Estás seguro de que deseas eliminar "${item.product_name}" del pedido?`,
      buttons: [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setDialog({ ...dialog, visible: false });
          },
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          icon: 'trash.fill',
          onPress: () => {
            setDialog({ ...dialog, visible: false });
            productsHook.deleteProduct(itemId);
          },
        },
      ],
    });
  };

  // Open WhatsApp Edit Modal
  const openWhatsAppEditModal = (item: any) => {
    setEditingItemId(item.id);
    
    // Format current product as WhatsApp message
    const unit = item.notes?.match(/unidad:\s*(\w+)/)?.[1] || '';
    const additionalNotes = getAdditionalNotes(item.notes);
    
    let formattedText = `${item.quantity} ${unit} de ${item.product_name}`;
    if (additionalNotes) {
      formattedText += `\n${additionalNotes}`;
    }
    
    setWhatsappEditInput(formattedText);
    setParsedEditProduct(null);
    setShowWhatsAppEditModal(true);
  };

  // Apply WhatsApp Edit
  const applyWhatsAppEdit = async () => {
    if (!parsedEditProduct || !editingItemId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setDialog({
        visible: true,
        type: 'warning',
        title: 'Error',
        message: 'No se pudo parsear el producto. Verifica el formato.',
      });
      return;
    }

    try {
      const { getSupabase } = await import('@/lib/supabase');
      const supabase = getSupabase();

      // Build notes with unit information
      let notes = `unidad: ${parsedEditProduct.unit}`;
      
      // Extract additional notes from the input (anything after the first line)
      const lines = whatsappEditInput.trim().split('\n');
      if (lines.length > 1) {
        const additionalNotes = lines.slice(1).join('\n').trim();
        if (additionalNotes) {
          notes += `\n${additionalNotes}`;
        }
      }

      const { error } = await supabase
        .from('order_items')
        .update({
          product_name: parsedEditProduct.product,
          quantity: parsedEditProduct.quantity,
          notes: notes,
        })
        .eq('id', editingItemId);

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowWhatsAppEditModal(false);
      setEditingItemId(null);
      setWhatsappEditInput('');
      setParsedEditProduct(null);
      
      // Reload order
      await loadOrder();

      setDialog({
        visible: true,
        type: 'success',
        title: 'Producto Actualizado',
        message: 'El producto se actualizó correctamente con formato WhatsApp',
      });
    } catch (error: any) {
      console.error('[OrderDetail] Error updating product:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setDialog({
        visible: true,
        type: 'error',
        title: 'Error',
        message: `No se pudo actualizar el producto: ${error.message}`,
      });
    }
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: colors.text }}>Pedido no encontrado</Text>
      </View>
    );
  }

  const total = order.items?.reduce((sum, item) => sum + item.unit_price, 0) || 0;
  const availableTransitions = getAvailableStatusTransitions(order.status, user?.role);
  
  const sortedQueries = order.queries 
    ? [...order.queries].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : [];

  const filteredCustomers = customerHook.availableCustomers.filter(customer => 
    customer.name.toLowerCase().includes(customerHook.customerSearchQuery.toLowerCase()) ||
    (customer.phone && customer.phone.includes(customerHook.customerSearchQuery))
  );

  const sortedPayments = order.order_payments
    ? [...order.order_payments].sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
    : [];

  const totalPaid = sortedPayments.reduce((sum, payment) => sum + parseFloat(payment.amount.toString()), 0);
  const isFullPayment = sortedPayments.length === 1 && totalPaid >= total;

  // FIXED: Show "+" button ONLY if customer doesn't exist AND has a name
  // Independent of phone number, source, or any other condition
  const showAddCustomerButton = !customerHook.editingCustomer && 
                                 order.customer_name && 
                                 order.customer_name.trim() && 
                                 !customerExistsInMenu;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.orderNumber}>{order.order_number}</Text>
          <Text style={styles.orderDate}>📅 {formatDate(order.created_at)}</Text>
          
          <OrderStatusSection
            currentStatus={order.status}
            availableTransitions={availableTransitions}
            updatingStatus={updatingStatus}
            isDeveloper={user?.role === 'desarrollador'}
            onStatusChange={handleStatusChange}
            colors={colors}
          />
        </View>

        {/* Customer Section */}
        <View style={styles.section}>
          <View style={styles.customerInfoRow}>
            <Text style={styles.sectionTitle}>Cliente</Text>
            {showAddCustomerButton && (
              <TouchableOpacity
                style={styles.addCustomerButton}
                onPress={handleAddCustomerToMenu}
                disabled={checkingCustomer}
              >
                {checkingCustomer ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <IconSymbol 
                    ios_icon_name="plus" 
                    android_material_icon_name="add"
                    size={20} 
                    color="#fff" 
                  />
                )}
              </TouchableOpacity>
            )}
          </View>
          {!customerHook.editingCustomer ? (
            <>
              <Text style={styles.productName}>{order.customer_name}</Text>
              {order.customer_phone && (
                <Text style={styles.productDetails}>📞 {order.customer_phone}</Text>
              )}
              {order.customer_address && (
                <Text style={styles.productDetails}>📍 {order.customer_address}</Text>
              )}
              
              {customerExistsInMenu && (
                <View style={styles.customerExistsBanner}>
                  <IconSymbol 
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={20} 
                    color="#10B981" 
                  />
                  <Text style={styles.customerExistsBannerText}>
                    Este cliente ya existe en el menú de Clientes
                  </Text>
                </View>
              )}
              
              {customerBlocked && (
                <View style={styles.blockedBanner}>
                  <IconSymbol 
                    ios_icon_name="exclamationmark.triangle.fill"
                    android_material_icon_name="warning"
                    size={20} 
                    color="#DC2626" 
                  />
                  <Text style={styles.blockedBannerText}>
                    Este cliente está bloqueado y no puede enviar pedidos
                  </Text>
                </View>
              )}
              
              <TouchableOpacity
                style={[styles.addButton, { marginTop: 12 }]}
                onPress={() => {
                  customerHook.setEditingCustomer(true);
                  customerHook.setCustomerInputMode('manual');
                }}
              >
                <IconSymbol 
                  ios_icon_name="pencil"
                  android_material_icon_name="edit"
                  size={20} 
                  color="#fff" 
                />
                <Text style={styles.addButtonText}>Editar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Customer Input Mode Toggle */}
              <View style={styles.inputModeToggle}>
                <TouchableOpacity
                  style={[
                    styles.inputModeButton,
                    customerHook.customerInputMode === 'manual' && styles.inputModeButtonActive
                  ]}
                  onPress={() => customerHook.setCustomerInputMode('manual')}
                >
                  <IconSymbol 
                    ios_icon_name="pencil"
                    android_material_icon_name="edit"
                    size={18} 
                    color={customerHook.customerInputMode === 'manual' ? '#fff' : colors.text} 
                  />
                  <Text style={[
                    styles.inputModeButtonText,
                    customerHook.customerInputMode === 'manual' && styles.inputModeButtonTextActive
                  ]}>
                    Manual
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.inputModeButton,
                    customerHook.customerInputMode === 'select' && styles.inputModeButtonActive
                  ]}
                  onPress={() => customerHook.setCustomerInputMode('select')}
                >
                  <IconSymbol 
                    ios_icon_name="person.2.fill"
                    android_material_icon_name="group"
                    size={18} 
                    color={customerHook.customerInputMode === 'select' ? '#fff' : colors.text} 
                  />
                  <Text style={[
                    styles.inputModeButtonText,
                    customerHook.customerInputMode === 'select' && styles.inputModeButtonTextActive
                  ]}>
                    Seleccionar
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Manual Input Mode */}
              {customerHook.customerInputMode === 'manual' ? (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Nombre"
                    placeholderTextColor={colors.textSecondary}
                    value={customerHook.customerName}
                    onChangeText={customerHook.setCustomerName}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Teléfono (opcional)"
                    placeholderTextColor={colors.textSecondary}
                    value={customerHook.customerPhone}
                    onChangeText={customerHook.setCustomerPhone}
                    keyboardType="phone-pad"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Dirección"
                    placeholderTextColor={colors.textSecondary}
                    value={customerHook.customerAddress}
                    onChangeText={customerHook.setCustomerAddress}
                  />
                </>
              ) : (
                <>
                  {/* Select Customer Mode */}
                  <TextInput
                    style={styles.input}
                    placeholder="Buscar cliente..."
                    placeholderTextColor={colors.textSecondary}
                    value={customerHook.customerSearchQuery}
                    onChangeText={customerHook.setCustomerSearchQuery}
                  />
                  
                  {customerHook.loadingCustomers ? (
                    <View style={styles.loadingCustomersContainer}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={styles.loadingCustomersText}>Cargando clientes...</Text>
                    </View>
                  ) : (
                    <ScrollView style={styles.customerListContainer} nestedScrollEnabled>
                      {filteredCustomers.length === 0 ? (
                        <View style={styles.noCustomersContainer}>
                          <IconSymbol 
                            ios_icon_name="person.crop.circle"
                            android_material_icon_name="account-circle"
                            size={48} 
                            color={colors.textSecondary} 
                          />
                          <Text style={styles.noCustomersText}>
                            {customerHook.customerSearchQuery 
                              ? 'No se encontraron clientes' 
                              : 'No hay clientes registrados'}
                          </Text>
                        </View>
                      ) : (
                        filteredCustomers.map((customer) => (
                          <TouchableOpacity
                            key={customer.id}
                            style={styles.customerListItem}
                            onPress={() => customerHook.selectCustomer(customer)}
                          >
                            <View style={styles.customerListItemContent}>
                              <Text style={styles.customerListItemName}>{customer.name}</Text>
                              {customer.phone && (
                                <Text style={styles.customerListItemPhone}>📞 {customer.phone}</Text>
                              )}
                              {customer.address && (
                                <Text style={styles.customerListItemAddress}>📍 {customer.address}</Text>
                              )}
                            </View>
                            <IconSymbol 
                              ios_icon_name="chevron.right"
                              android_material_icon_name="chevron-right"
                              size={20} 
                              color={colors.textSecondary} 
                            />
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  )}
                  
                  {/* Show selected customer info */}
                  {customerHook.customerName && (
                    <View style={styles.selectedCustomerInfo}>
                      <Text style={styles.selectedCustomerLabel}>Cliente seleccionado:</Text>
                      <Text style={styles.selectedCustomerName}>{customerHook.customerName}</Text>
                      {customerHook.customerPhone && (
                        <Text style={styles.selectedCustomerDetails}>📞 {customerHook.customerPhone}</Text>
                      )}
                      {customerHook.customerAddress && (
                        <Text style={styles.selectedCustomerDetails}>📍 {customerHook.customerAddress}</Text>
                      )}
                    </View>
                  )}
                </>
              )}

              <TouchableOpacity
                style={styles.addButton}
                onPress={handleUpdateCustomerInfo}
              >
                <IconSymbol 
                  ios_icon_name="checkmark.circle"
                  android_material_icon_name="check-circle"
                  size={20} 
                  color="#fff" 
                />
                <Text style={styles.addButtonText}>Guardar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.border, marginTop: 8 }]}
                onPress={() => {
                  customerHook.setEditingCustomer(false);
                  customerHook.setCustomerSearchQuery('');
                }}
              >
                <IconSymbol 
                  ios_icon_name="xmark.circle"
                  android_material_icon_name="cancel"
                  size={20} 
                  color={colors.text} 
                />
                <Text style={[styles.addButtonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Products Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Productos</Text>
          </View>

          {order.items?.map((item, index) => {
            const additionalNotes = getAdditionalNotes(item.notes);
            
            return (
              <View
                key={item.id}
                style={[
                  styles.productItem,
                  index === (order.items?.length || 0) - 1 && styles.productItemLast,
                ]}
              >
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{formatProductDisplay(item)}</Text>
                  {additionalNotes && (
                    <Text style={styles.productDetails}>{additionalNotes}</Text>
                  )}
                  {item.unit_price > 0 && (
                    <Text style={styles.productDetails}>
                      {formatCLP(item.unit_price)}
                    </Text>
                  )}
                </View>
                <View style={styles.productActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => openWhatsAppEditModal(item)}
                  >
                    <IconSymbol 
                      ios_icon_name="pencil"
                      android_material_icon_name="edit"
                      size={20} 
                      color={colors.primary} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => deleteProduct(item.id)}
                  >
                    <IconSymbol 
                      ios_icon_name="trash"
                      android_material_icon_name="delete"
                      size={20} 
                      color={colors.error} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {productsHook.editingProduct ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Nombre del producto"
                placeholderTextColor={colors.textSecondary}
                value={productsHook.productName}
                onChangeText={productsHook.setProductName}
              />
              <TextInput
                style={styles.input}
                placeholder="Cantidad"
                placeholderTextColor={colors.textSecondary}
                value={productsHook.productQuantity}
                onChangeText={productsHook.setProductQuantity}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Precio"
                placeholderTextColor={colors.textSecondary}
                value={productsHook.productPrice}
                onChangeText={productsHook.setProductPrice}
                onFocus={() => {
                  if (productsHook.productPrice === '0') {
                    productsHook.setProductPrice('');
                  }
                }}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Notas"
                placeholderTextColor={colors.textSecondary}
                value={productsHook.productNotes}
                onChangeText={productsHook.setProductNotes}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => productsHook.updateProduct(productsHook.editingProduct.id)}
              >
                <IconSymbol 
                  ios_icon_name="checkmark.circle"
                  android_material_icon_name="check-circle"
                  size={20} 
                  color="#fff" 
                />
                <Text style={styles.addButtonText}>Actualizar Producto</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.border }]}
                onPress={() => productsHook.setEditingProduct(null)}
              >
                <IconSymbol 
                  ios_icon_name="xmark.circle"
                  android_material_icon_name="cancel"
                  size={20} 
                  color={colors.text} 
                />
                <Text style={[styles.addButtonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.addButton} onPress={openAddProductModal}>
                <IconSymbol 
                  ios_icon_name="cart.fill"
                  android_material_icon_name="shopping-cart"
                  size={20} 
                  color="#fff" 
                />
                <Text style={styles.addButtonText}>Agregar Producto</Text>
              </TouchableOpacity>
              
              {order.items && order.items.length > 0 && (
                <TouchableOpacity style={styles.bulkPriceButton} onPress={productsHook.openPriceModal}>
                  <IconSymbol 
                    ios_icon_name="dollarsign.circle"
                    android_material_icon_name="monetization-on"
                    size={20} 
                    color="#fff" 
                  />
                  <Text style={styles.addButtonText}>Agregar Precios</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Send Query Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enviar Consulta al Cliente</Text>
          <Text style={styles.modalSubtitle}>
            Envía una consulta al cliente por WhatsApp. Se imprimirá automáticamente.
          </Text>
          <TextInput
            style={styles.sendQueryInput}
            placeholder="Escribe tu consulta aquí..."
            placeholderTextColor={colors.textSecondary}
            value={queriesHook.newQueryText}
            onChangeText={queriesHook.setNewQueryText}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendQueryButton,
              (queriesHook.sendingQuery || !queriesHook.newQueryText.trim() || !order.customer_phone) && { opacity: 0.5 }
            ]}
            onPress={queriesHook.handleSendQuery}
            disabled={queriesHook.sendingQuery || !queriesHook.newQueryText.trim() || !order.customer_phone}
          >
            {queriesHook.sendingQuery ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <IconSymbol 
                  ios_icon_name="paperplane.fill"
                  android_material_icon_name="send"
                  size={20} 
                  color="#fff" 
                />
                <Text style={styles.addButtonText}>Enviar Consulta</Text>
              </>
            )}
          </TouchableOpacity>
          {!order.customer_phone && (
            <Text style={styles.exampleText}>
              ⚠️ Este pedido no tiene un número de teléfono asociado
            </Text>
          )}
        </View>

        {/* Message History */}
        {sortedQueries.length > 0 && (
          <View style={styles.section}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Historial de Mensajes</Text>
              <Text style={styles.historyCount}>
                {sortedQueries.length} {sortedQueries.length === 1 ? 'mensaje' : 'mensajes'}
              </Text>
            </View>
            
            <View style={styles.historyTimeline}>
              {sortedQueries.map((query, index) => {
                const isIncoming = query.direction === 'incoming';
                const isOutgoing = query.direction === 'outgoing';
                const isLast = index === sortedQueries.length - 1;
                
                return (
                  <View 
                    key={query.id} 
                    style={[
                      styles.messageItem,
                      isIncoming && styles.messageItemIncoming,
                      isOutgoing && styles.messageItemOutgoing,
                    ]}
                  >
                    <View style={[
                      styles.timelineDot,
                      isIncoming && styles.timelineDotIncoming,
                      isOutgoing && styles.timelineDotOutgoing,
                    ]} />
                    
                    {!isLast && <View style={styles.timelineLine} />}
                    
                    <View style={[
                      styles.messageCard,
                      isIncoming && styles.messageCardIncoming,
                      isOutgoing && styles.messageCardOutgoing,
                    ]}>
                      <View style={styles.messageHeader}>
                        <View style={styles.messageDirection}>
                          <View style={[
                            styles.messageDirectionBadge,
                            isIncoming && styles.messageDirectionBadgeIncoming,
                            isOutgoing && styles.messageDirectionBadgeOutgoing,
                          ]}>
                            <IconSymbol 
                              ios_icon_name={isIncoming ? 'arrow.down' : 'arrow.up'}
                              android_material_icon_name={isIncoming ? 'arrow-downward' : 'arrow-upward'}
                              size={14} 
                              color={isIncoming ? '#1E40AF' : '#065F46'} 
                            />
                            <Text style={[
                              styles.messageDirectionText,
                              isIncoming && styles.messageDirectionTextIncoming,
                              isOutgoing && styles.messageDirectionTextOutgoing,
                            ]}>
                              {isIncoming ? 'Cliente' : 'Comercio'}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.messageDate}>
                          {formatShortDate(query.created_at)}
                        </Text>
                      </View>
                      
                      <Text style={styles.messageText}>{query.query_text}</Text>
                      
                      <View style={styles.messageActions}>
                        <TouchableOpacity
                          style={[styles.messageButton, styles.messageButtonPrint]}
                          onPress={() => queriesHook.handlePrintQuery(query)}
                        >
                          <IconSymbol 
                            ios_icon_name="printer"
                            android_material_icon_name="print"
                            size={14} 
                            color="#fff" 
                          />
                          <Text style={styles.messageButtonText}>Imprimir</Text>
                        </TouchableOpacity>
                        
                        {isIncoming && (
                          <TouchableOpacity
                            style={[styles.messageButton, styles.messageButtonRespond]}
                            onPress={() => queriesHook.openResponseModal(query)}
                          >
                            <IconSymbol 
                              ios_icon_name="message.fill"
                              android_material_icon_name="message"
                              size={14} 
                              color="#fff" 
                            />
                            <Text style={styles.messageButtonText}>Responder</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{formatCLP(total)}</Text>
          </View>

          {['abonado', 'pagado', 'finalizado'].includes(order.status) && sortedPayments.length > 0 && (
            <View style={styles.paymentInfoContainer}>
              <Text style={styles.paymentInfoTitle}>💳 Información de Pago</Text>
              
              <View style={styles.paymentTypeContainer}>
                <IconSymbol 
                  ios_icon_name={isFullPayment ? 'checkmark.circle.fill' : 'creditcard.fill'}
                  android_material_icon_name={isFullPayment ? 'check-circle' : 'credit-card'}
                  size={24} 
                  color="#10B981" 
                />
                <Text style={styles.paymentTypeText}>
                  {isFullPayment ? 'Pago Total' : `Pagos Parciales (${sortedPayments.length} abonos)`}
                </Text>
              </View>

              {sortedPayments.map((payment) => (
                <View key={payment.id} style={styles.paymentItem}>
                  <View style={styles.paymentItemHeader}>
                    <Text style={styles.paymentAmount}>
                      {formatCLP(parseFloat(payment.amount.toString()))}
                    </Text>
                    <Text style={styles.paymentDate}>
                      {formatDate(payment.payment_date)}
                    </Text>
                  </View>
                  {payment.notes && (
                    <Text style={styles.paymentNotes}>
                      📝 {payment.notes}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        {isConnected ? (
          <TouchableOpacity 
            style={[styles.actionButton, styles.printButton]} 
            onPress={handlePrint}
          >
            <IconSymbol 
              ios_icon_name="printer"
              android_material_icon_name="print"
              size={22} 
              color="#fff" 
            />
            <Text style={styles.actionButtonText}>Imprimir Pedido</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#8B5CF6' }]} 
            onPress={handleSendToPrinter}
          >
            <IconSymbol 
              ios_icon_name="paperplane.fill"
              android_material_icon_name="send"
              size={22} 
              color="#fff" 
            />
            <Text style={styles.actionButtonText}>Enviar a Impresor</Text>
          </TouchableOpacity>
        )}

        {order.customer_phone && (
          <TouchableOpacity
            style={[styles.actionButton, styles.whatsappButton]}
            onPress={handleWhatsApp}
          >
            <IconSymbol 
              ios_icon_name="message.fill"
              android_material_icon_name="message"
              size={22} 
              color="#fff" 
            />
            <Text style={styles.actionButtonText}>Enviar WhatsApp</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <IconSymbol 
            ios_icon_name="trash"
            android_material_icon_name="delete"
            size={22} 
            color="#fff" 
          />
          <Text style={styles.actionButtonText}>Eliminar Pedido</Text>
        </TouchableOpacity>

        {order.customer_phone && (
          customerBlocked ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.unblockButton]}
              onPress={handleUnblockCustomer}
            >
              <IconSymbol 
                ios_icon_name="checkmark.circle"
                android_material_icon_name="check-circle"
                size={22} 
                color="#fff" 
              />
              <Text style={styles.actionButtonText}>Desbloquear Cliente</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.blockButton]}
              onPress={handleBlockCustomer}
            >
              <IconSymbol 
                ios_icon_name="xmark.circle"
                android_material_icon_name="cancel"
                size={22} 
                color="#fff" 
              />
              <Text style={styles.actionButtonText}>Bloquear Cliente</Text>
            </TouchableOpacity>
          )
        )}
      </ScrollView>

      {/* Custom Dialog */}
      <CustomDialog
        visible={dialog.visible}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        buttons={dialog.buttons}
        onClose={() => setDialog({ ...dialog, visible: false })}
      />

      {/* Recurring Customer Dialog */}
      <Modal
        visible={showRecurringCustomerDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRecurringCustomerDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.recurringDialogHeader}>
              <IconSymbol 
                ios_icon_name="person.crop.circle.badge.plus"
                android_material_icon_name="person-add"
                size={48} 
                color={colors.primary} 
              />
              <Text style={styles.modalTitle}>Agregar Cliente</Text>
            </View>
            
            <Text style={styles.recurringDialogMessage}>
              ¿Deseas agregar a <Text style={styles.customerNameHighlight}>{order?.customer_name}</Text> como cliente recurrente con la posibilidad de trabajar con vales pendientes?
            </Text>

            <View style={styles.recurringDialogInfo}>
              <View style={styles.recurringDialogInfoItem}>
                <IconSymbol 
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={20} 
                  color="#10B981" 
                />
                <Text style={styles.recurringDialogInfoText}>
                  Podrás gestionar sus pedidos y pagos
                </Text>
              </View>
              <View style={styles.recurringDialogInfoItem}>
                <IconSymbol 
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={20} 
                  color="#10B981" 
                />
                <Text style={styles.recurringDialogInfoText}>
                  Aparecerá en el menú de Clientes
                </Text>
              </View>
              <View style={styles.recurringDialogInfoItem}>
                <IconSymbol 
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={20} 
                  color="#10B981" 
                />
                <Text style={styles.recurringDialogInfoText}>
                  Podrá tener vales pendientes de pago
                </Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowRecurringCustomerDialog(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  handleAddCustomerAsRecurring(true);
                }}
              >
                <IconSymbol 
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={20} 
                  color="#fff" 
                />
                <Text style={[styles.modalButtonText, { color: '#fff', marginLeft: 6 }]}>
                  Sí, Agregar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modals - Add Product Modal */}
      <Modal
        visible={showAddProductModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddProductModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar Producto</Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>
              Ingresa el producto como en WhatsApp:
            </Text>
            
            <View style={styles.whatsappInputContainer}>
              <TextInput
                style={styles.whatsappInput}
                placeholder="Ejemplo: 2 kilos de papas"
                placeholderTextColor={colors.textSecondary}
                value={whatsappInput}
                onChangeText={setWhatsappInput}
                multiline
                autoFocus
              />
              <Text style={styles.exampleText}>
                Ejemplos: &quot;2 kilos de papas&quot;, &quot;3 mallas de cebolla&quot;, &quot;1/2 kilo de tomates&quot;
              </Text>
            </View>

            {parsedProducts.length > 0 && (
              <View style={styles.parsedItemsContainer}>
                <Text style={styles.parsedItemsTitle}>
                  Productos detectados ({parsedProducts.length}):
                </Text>
                <ScrollView style={styles.modalScrollView}>
                  {parsedProducts.map((item, index) => (
                    <View key={index} style={styles.parsedItem}>
                      <Text style={styles.parsedItemText}>
                        {item.quantity} {item.unit} de {item.product}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowAddProductModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.modalButtonConfirm,
                  parsedProducts.length === 0 && { opacity: 0.5 }
                ]}
                onPress={addProductsFromWhatsApp}
                disabled={parsedProducts.length === 0}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                  Agregar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* WhatsApp Edit Product Modal */}
      <Modal
        visible={showWhatsAppEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowWhatsAppEditModal(false);
          setEditingItemId(null);
          setWhatsappEditInput('');
          setParsedEditProduct(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Producto con Formato WhatsApp</Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>
              Edita el producto usando formato WhatsApp:
            </Text>
            
            <View style={styles.whatsappInputContainer}>
              <TextInput
                style={styles.whatsappEditInput}
                placeholder="Ejemplo: 2 kilos de papas"
                placeholderTextColor={colors.textSecondary}
                value={whatsappEditInput}
                onChangeText={setWhatsappEditInput}
                multiline
                autoFocus
              />
              <Text style={styles.exampleText}>
                Formato: &quot;cantidad unidad de producto&quot;
              </Text>
              <Text style={styles.exampleText}>
                Ejemplos: &quot;2 kilos de papas&quot;, &quot;1/2 kilo de tomates&quot;, &quot;3 unidades de lechuga&quot;
              </Text>
            </View>

            {parsedEditProduct && (
              <View style={styles.parsedEditContainer}>
                <Text style={styles.parsedEditTitle}>Vista previa:</Text>
                <View style={styles.parsedEditItem}>
                  <IconSymbol 
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={20} 
                    color="#10B981" 
                  />
                  <Text style={styles.parsedEditText}>
                    {parsedEditProduct.quantity} {parsedEditProduct.unit} de {parsedEditProduct.product}
                  </Text>
                </View>
              </View>
            )}

            {!parsedEditProduct && whatsappEditInput.trim() && (
              <View style={styles.parsedEditContainer}>
                <View style={styles.parsedEditItem}>
                  <IconSymbol 
                    ios_icon_name="exclamationmark.triangle.fill"
                    android_material_icon_name="warning"
                    size={20} 
                    color="#F59E0B" 
                  />
                  <Text style={[styles.parsedEditText, { color: colors.textSecondary }]}>
                    No se pudo parsear. Verifica el formato.
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowWhatsAppEditModal(false);
                  setEditingItemId(null);
                  setWhatsappEditInput('');
                  setParsedEditProduct(null);
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.modalButtonConfirm,
                  !parsedEditProduct && { opacity: 0.5 }
                ]}
                onPress={applyWhatsAppEdit}
                disabled={!parsedEditProduct}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                  Actualizar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bulk Price Modal */}
      <Modal
        visible={productsHook.showPriceModal}
        transparent
        animationType="fade"
        onRequestClose={() => productsHook.setShowPriceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar Precios a Productos</Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 16 }}>
              Ingresa el precio para cada producto:
            </Text>
            
            <ScrollView style={styles.modalScrollView}>
              {order?.items?.map((item) => (
                <View key={item.id} style={styles.priceInputRow}>
                  <Text style={styles.priceInputLabel} numberOfLines={2}>
                    {formatProductDisplay(item)}
                  </Text>
                  <TextInput
                    style={styles.priceInputField}
                    placeholder="Precio"
                    placeholderTextColor={colors.textSecondary}
                    value={productsHook.bulkPrices[item.id] || ''}
                    onChangeText={(text) => productsHook.updateBulkPrice(item.id, text)}
                    onFocus={() => {
                      if (productsHook.bulkPrices[item.id] === '0') {
                        productsHook.updateBulkPrice(item.id, '');
                      }
                    }}
                    keyboardType="numeric"
                  />
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => productsHook.setShowPriceModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={productsHook.applyBulkPrices}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                  Aplicar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Query Response Modal */}
      <Modal
        visible={queriesHook.showResponseModal}
        transparent
        animationType="fade"
        onRequestClose={() => queriesHook.setShowResponseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Responder Consulta</Text>
            
            {queriesHook.selectedQuery && (
              <View style={styles.queryTextDisplay}>
                <Text style={styles.queryTextLabel}>CONSULTA DEL CLIENTE:</Text>
                <Text style={styles.queryTextContent}>{queriesHook.selectedQuery.query_text}</Text>
              </View>
            )}
            
            <Text style={styles.modalSubtitle}>
              Escribe tu respuesta:
            </Text>
            
            <TextInput
              style={styles.responseInput}
              placeholder="Escribe tu respuesta aquí..."
              placeholderTextColor={colors.textSecondary}
              value={queriesHook.responseText}
              onChangeText={queriesHook.setResponseText}
              multiline
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  queriesHook.setShowResponseModal(false);
                  queriesHook.setSelectedQuery(null);
                  queriesHook.setResponseText('');
                }}
                disabled={queriesHook.sendingResponse}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.modalButtonConfirm,
                  (queriesHook.sendingResponse || !queriesHook.responseText.trim()) && { opacity: 0.5 }
                ]}
                onPress={queriesHook.handleSendResponse}
                disabled={queriesHook.sendingResponse || !queriesHook.responseText.trim()}
              >
                {queriesHook.sendingResponse ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                    Enviar
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

function createStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
    },
    section: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    orderNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 8,
    },
    orderDate: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 12,
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
    productItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    productItemLast: {
      borderBottomWidth: 0,
    },
    productInfo: {
      flex: 1,
    },
    productName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    productDetails: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    productActions: {
      flexDirection: 'row',
      gap: 8,
    },
    iconButton: {
      padding: 8,
    },
    addButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
      marginTop: 8,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    addButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    bulkPriceButton: {
      backgroundColor: colors.secondary,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
      marginTop: 8,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    totalLabel: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    totalValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.primary,
    },
    paymentInfoContainer: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    paymentInfoTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
    },
    paymentTypeContainer: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    paymentTypeText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    paymentItem: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderLeftWidth: 3,
      borderLeftColor: '#10B981',
    },
    paymentItemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    paymentAmount: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#10B981',
    },
    paymentDate: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    paymentNotes: {
      fontSize: 13,
      color: colors.textSecondary,
      fontStyle: 'italic',
      marginTop: 4,
    },
    actionButton: {
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      marginBottom: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 10,
    },
    printButton: {
      backgroundColor: '#3B82F6',
    },
    whatsappButton: {
      backgroundColor: '#25D366',
    },
    deleteButton: {
      backgroundColor: '#EF4444',
    },
    blockButton: {
      backgroundColor: '#EF4444',
    },
    unblockButton: {
      backgroundColor: '#10B981',
    },
    actionButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
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
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
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
      flexDirection: 'row',
      justifyContent: 'center',
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
      color: colors.text,
    },
    modalScrollView: {
      maxHeight: 400,
    },
    priceInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 8,
    },
    priceInputLabel: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
    priceInputField: {
      width: 120,
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 8,
      fontSize: 14,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    whatsappInputContainer: {
      marginBottom: 16,
    },
    whatsappInput: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 120,
      textAlignVertical: 'top',
    },
    whatsappEditInput: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    exampleText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 8,
      fontStyle: 'italic',
    },
    parsedItemsContainer: {
      marginTop: 16,
      marginBottom: 8,
    },
    parsedItemsTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    parsedItem: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 10,
      marginBottom: 6,
    },
    parsedItemText: {
      fontSize: 14,
      color: colors.text,
    },
    parsedEditContainer: {
      marginTop: 16,
      marginBottom: 8,
    },
    parsedEditTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    parsedEditItem: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    parsedEditText: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
    historyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    historyTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    historyCount: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    historyTimeline: {
      position: 'relative',
    },
    messageItem: {
      marginBottom: 16,
      position: 'relative',
    },
    messageItemIncoming: {
      paddingLeft: 20,
    },
    messageItemOutgoing: {
      paddingLeft: 20,
    },
    timelineDot: {
      position: 'absolute',
      left: 0,
      top: 8,
      width: 12,
      height: 12,
      borderRadius: 6,
      borderWidth: 2,
    },
    timelineDotIncoming: {
      backgroundColor: '#DBEAFE',
      borderColor: '#3B82F6',
    },
    timelineDotOutgoing: {
      backgroundColor: '#D1FAE5',
      borderColor: '#10B981',
    },
    timelineLine: {
      position: 'absolute',
      left: 5,
      top: 20,
      width: 2,
      bottom: -16,
      backgroundColor: colors.border,
    },
    messageCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 12,
      borderLeftWidth: 3,
    },
    messageCardIncoming: {
      borderLeftColor: '#3B82F6',
    },
    messageCardOutgoing: {
      borderLeftColor: '#10B981',
    },
    messageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    messageDirection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    messageDirectionBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    messageDirectionBadgeIncoming: {
      backgroundColor: '#DBEAFE',
    },
    messageDirectionBadgeOutgoing: {
      backgroundColor: '#D1FAE5',
    },
    messageDirectionText: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    messageDirectionTextIncoming: {
      color: '#1E40AF',
    },
    messageDirectionTextOutgoing: {
      color: '#065F46',
    },
    messageDate: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    messageText: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 22,
      marginBottom: 10,
    },
    messageActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 4,
    },
    messageButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    messageButtonPrint: {
      backgroundColor: '#3B82F6',
    },
    messageButtonRespond: {
      backgroundColor: '#25D366',
    },
    messageButtonText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    responseInput: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 100,
      textAlignVertical: 'top',
      marginBottom: 16,
    },
    modalSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    queryTextDisplay: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    queryTextLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
      fontWeight: '600',
    },
    queryTextContent: {
      fontSize: 14,
      color: colors.text,
    },
    sendQueryInput: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 100,
      textAlignVertical: 'top',
      marginBottom: 12,
    },
    sendQueryButton: {
      backgroundColor: '#25D366',
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    customerInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    addCustomerButton: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      width: 36,
      height: 36,
      justifyContent: 'center',
      alignItems: 'center',
    },
    customerExistsBanner: {
      backgroundColor: '#D1FAE5',
      borderRadius: 8,
      padding: 12,
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    customerExistsBannerText: {
      fontSize: 14,
      color: '#065F46',
      fontWeight: '600',
      flex: 1,
    },
    blockedBanner: {
      backgroundColor: '#FEE2E2',
      borderRadius: 8,
      padding: 12,
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    blockedBannerText: {
      fontSize: 14,
      color: '#DC2626',
      fontWeight: '600',
      flex: 1,
    },
    inputModeToggle: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 4,
      marginBottom: 12,
      gap: 4,
    },
    inputModeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 6,
      backgroundColor: 'transparent',
    },
    inputModeButtonActive: {
      backgroundColor: colors.primary,
    },
    inputModeButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    inputModeButtonTextActive: {
      color: '#fff',
    },
    customerListContainer: {
      maxHeight: 300,
      backgroundColor: colors.background,
      borderRadius: 8,
      marginBottom: 12,
    },
    customerListItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    customerListItemContent: {
      flex: 1,
    },
    customerListItemName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    customerListItemPhone: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    customerListItemAddress: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    loadingCustomersContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      gap: 10,
    },
    loadingCustomersText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    noCustomersContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    noCustomersText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 12,
      textAlign: 'center',
    },
    selectedCustomerInfo: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    selectedCustomerLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 6,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    selectedCustomerName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    selectedCustomerDetails: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    recurringDialogHeader: {
      alignItems: 'center',
      marginBottom: 16,
    },
    recurringDialogMessage: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 24,
    },
    customerNameHighlight: {
      fontWeight: 'bold',
      color: colors.primary,
    },
    recurringDialogInfo: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 16,
      marginBottom: 20,
    },
    recurringDialogInfoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    recurringDialogInfoText: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
  });
}
