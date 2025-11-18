
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { parseWhatsAppMessage, ParsedOrderItem } from '@/utils/whatsappParser';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/contexts/ThemeContext';
import { Customer, OrderPriority } from '@/types';
import { getPriorityColor, getPriorityLabel, getPriorityIcon } from '@/utils/orderHelpers';

// Format currency as Chilean Pesos
const formatCLP = (amount: number): string => {
  return `$${amount.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

interface OrderResultDialog {
  visible: boolean;
  success: boolean;
  title: string;
  message: string;
  orderNumber?: string;
  orderId?: string;
  itemCount?: number;
}

export default function NewOrderScreen() {
  const { user, isAuthenticated } = useAuth();
  const { colors, commonStyles } = useThemedStyles();
  
  // Customer input mode: 'manual' or 'select'
  const [customerInputMode, setCustomerInputMode] = useState<'manual' | 'select'>('manual');
  const [customerName, setCustomerName] = useState('');
  const [customerRut, setCustomerRut] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  
  // Customer list for selection
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showCustomerList, setShowCustomerList] = useState(false);
  
  const [orderText, setOrderText] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedOrderItem[]>([]);
  const [priority, setPriority] = useState<OrderPriority>('normal');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    customerName?: string;
    orderText?: string;
  }>({});
  const [resultDialog, setResultDialog] = useState<OrderResultDialog>({
    visible: false,
    success: false,
    title: '',
    message: '',
  });

  // Create dynamic styles based on theme using useMemo for optimization
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    content: {
      padding: 16,
      paddingBottom: 32,
    },
    warningTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    warningText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    loginButton: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: 12,
    },
    loginButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    authBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
      gap: 8,
      borderWidth: 1,
      borderColor: colors.success,
    },
    authBannerText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    infoBox: {
      flexDirection: 'row',
      backgroundColor: colors.card,
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
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    required: {
      color: colors.error,
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
    inputError: {
      borderColor: colors.error,
      borderWidth: 2,
    },
    errorText: {
      color: colors.error,
      fontSize: 12,
      marginTop: -8,
      marginBottom: 8,
    },
    textArea: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      marginBottom: 12,
      minHeight: 150,
      textAlignVertical: 'top',
    },
    examplesBox: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    examplesTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    examplesText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    parsedItemCard: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    parsedItemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    parsedItemNumber: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
      minWidth: 24,
    },
    parsedItemContent: {
      flex: 1,
    },
    parsedItemProduct: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    parsedItemDetails: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    warningBox: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      padding: 12,
      borderRadius: 8,
      marginTop: 8,
      gap: 8,
      borderWidth: 1,
      borderColor: colors.warning,
    },
    warningBoxText: {
      flex: 1,
      fontSize: 13,
      color: colors.text,
      lineHeight: 18,
    },
    submitButton: {
      backgroundColor: colors.success,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '600',
    },
    // Dialog styles
    dialogOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    dialogContainer: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 400,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    dialogIconContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },
    dialogTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    dialogMessage: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 8,
    },
    dialogOrderInfo: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      marginTop: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dialogOrderNumber: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primary,
      textAlign: 'center',
      marginBottom: 4,
    },
    dialogOrderItems: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    dialogButtonsContainer: {
      gap: 10,
    },
    dialogButton: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 10,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    dialogButtonPrimary: {
      backgroundColor: colors.primary,
    },
    dialogButtonSuccess: {
      backgroundColor: colors.success,
    },
    dialogButtonSecondary: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dialogButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    dialogButtonTextSecondary: {
      color: colors.text,
    },
    // Customer input mode toggle
    modeToggleContainer: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 4,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modeToggleButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modeToggleButtonActive: {
      backgroundColor: colors.primary,
    },
    modeToggleButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    modeToggleButtonTextActive: {
      color: '#FFFFFF',
    },
    // Customer selection button
    selectCustomerButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    selectCustomerButtonText: {
      fontSize: 16,
      color: colors.text,
    },
    selectCustomerButtonPlaceholder: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    selectedCustomerInfo: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.success,
    },
    selectedCustomerName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    selectedCustomerDetail: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    changeCustomerButton: {
      marginTop: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.primary,
      borderRadius: 6,
      alignItems: 'center',
    },
    changeCustomerButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    // Customer list modal
    customerListModal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    customerListContainer: {
      flex: 1,
      backgroundColor: colors.background,
      marginTop: 100,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    customerListHeader: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    customerListTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    customerListSearchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 8,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    customerListSearchInput: {
      flex: 1,
      height: 40,
      fontSize: 16,
      color: colors.text,
      marginLeft: 8,
    },
    customerListContent: {
      flex: 1,
    },
    customerListItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    customerListItemName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    customerListItemDetail: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    customerListItemStats: {
      flexDirection: 'row',
      marginTop: 8,
      gap: 16,
    },
    customerListItemStat: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    customerListEmpty: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    customerListEmptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 16,
    },
    customerListCloseButton: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.card,
    },
    customerListCloseButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
      textAlign: 'center',
    },
    // Priority selector styles
    prioritySelector: {
      flexDirection: 'row',
      gap: 12,
    },
    priorityOption: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: 12,
      gap: 8,
    },
    priorityOptionText: {
      fontSize: 14,
      fontWeight: '600',
    },
  }), [colors]);

  // Memoize header options to ensure they update with theme
  const headerOptions = useMemo(() => ({
    title: 'Nuevo Pedido Manual',
    headerBackTitle: 'Atrás',
    headerStyle: {
      backgroundColor: colors.primary,
    },
    headerTintColor: '#FFFFFF',
    headerShadowVisible: true,
  }), [colors.primary]);

  // Define loadCustomers with useCallback
  const loadCustomers = useCallback(async () => {
    try {
      setLoadingCustomers(true);
      const supabase = getSupabase();
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      console.log('[NewOrderScreen] Loaded customers:', data?.length);
      setCustomers(data || []);
    } catch (error) {
      console.error('[NewOrderScreen] Error loading customers:', error);
      Alert.alert('Error', 'No se pudieron cargar los clientes');
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  // FIXED: Added customers.length to dependencies
  useEffect(() => {
    if (customerInputMode === 'select' && customers.length === 0) {
      loadCustomers();
    }
  }, [customerInputMode, loadCustomers, customers.length]);

  const handleSelectCustomer = (customer: Customer) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCustomerId(customer.id);
    setCustomerName(customer.name);
    setCustomerRut(customer.rut || '');
    setCustomerPhone(customer.phone || '');
    setCustomerAddress(customer.address || '');
    setShowCustomerList(false);
    
    // Clear any customer name errors
    if (errors.customerName) {
      setErrors({ ...errors, customerName: undefined });
    }
  };

  const handleModeChange = (mode: 'manual' | 'select') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCustomerInputMode(mode);
    
    // Clear customer data when switching modes
    if (mode === 'manual') {
      setSelectedCustomerId(null);
      setCustomerName('');
      setCustomerRut('');
      setCustomerPhone('');
      setCustomerAddress('');
    }
  };

  // Parse order text when it changes
  useEffect(() => {
    if (orderText.trim()) {
      try {
        const items = parseWhatsAppMessage(orderText);
        setParsedItems(items);
        console.log('Parsed items:', items);
      } catch (error) {
        console.error('Error parsing order text:', error);
        setParsedItems([]);
      }
    } else {
      setParsedItems([]);
    }
  }, [orderText]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Validate customer name
    if (!customerName.trim()) {
      newErrors.customerName = 'El nombre del cliente es obligatorio';
    }

    // Validate order text
    if (!orderText.trim()) {
      newErrors.orderText = 'Debe ingresar los productos del pedido';
    } else if (parsedItems.length === 0) {
      newErrors.orderText = 'No se pudieron identificar productos en el texto ingresado';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setCustomerInputMode('manual');
    setCustomerName('');
    setCustomerRut('');
    setCustomerPhone('');
    setCustomerAddress('');
    setSelectedCustomerId(null);
    setOrderText('');
    setParsedItems([]);
    setPriority('normal');
    setErrors({});
  };

  const handleSubmit = async () => {
    console.log('=== Starting manual order creation ===');
    console.log('User:', user?.email, 'Role:', user?.role);
    
    // First, validate the form
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    // Check authentication
    if (!isAuthenticated || !user) {
      console.error('User not authenticated');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setResultDialog({
        visible: true,
        success: false,
        title: 'Sesión Expirada',
        message: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
      });
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setResultDialog({
        visible: true,
        success: false,
        title: 'Error de Configuración',
        message: 'Supabase no está inicializado. Por favor configura la conexión primero.',
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Creating order with', parsedItems.length, 'parsed items');

      // Prepare order data
      const orderData = {
        customer_name: customerName.trim(),
        customer_rut: customerRut.trim() || null,
        customer_phone: customerPhone.trim() || null,
        customer_address: customerAddress.trim() || null,
        customer_id: selectedCustomerId,
        status: 'pending' as const,
        priority: priority,
        source: 'manual' as const,
        is_read: true,
      };

      console.log('Order data prepared:', orderData);

      // Create order (order_number will be auto-generated by trigger)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', {
          code: orderError.code,
          message: orderError.message,
          details: orderError.details,
          hint: orderError.hint
        });
        
        // Provide specific error messages based on error code
        let errorMessage = 'No se pudo crear el pedido. Por favor intenta de nuevo.';
        let errorTitle = 'Error al Crear Pedido';
        
        if (orderError.code === '23503') {
          errorTitle = 'Error de Base de Datos';
          errorMessage = 'Error al crear el pedido. Por favor verifica la configuración de la base de datos.';
        } else if (orderError.code === '42501') {
          errorTitle = 'Error de Permisos';
          errorMessage = 'No tienes permisos para crear pedidos. Por favor contacta al administrador.';
        } else if (orderError.message) {
          errorMessage = orderError.message;
        }
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setResultDialog({
          visible: true,
          success: false,
          title: errorTitle,
          message: errorMessage,
        });
        return;
      }

      console.log('Order created successfully:', order.id, 'Order number:', order.order_number);

      // Create order items from parsed items
      const orderItems = parsedItems.map((item) => {
        const notes = item.unit ? `Unidad: ${item.unit}` : '';
        return {
          order_id: order.id,
          product_name: item.product,
          quantity: item.quantity === '#' ? '#' : item.quantity,
          unit_price: 0, // Price will be set later
          notes,
        };
      });

      console.log('Creating', orderItems.length, 'order items');

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Order items creation error:', itemsError);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setResultDialog({
          visible: true,
          success: false,
          title: 'Error al Crear Productos',
          message: 'El pedido fue creado pero hubo un error al agregar los productos. Por favor intenta agregarlos manualmente.',
        });
        return;
      }

      console.log('Order items created successfully');
      console.log('=== Order creation completed successfully ===');

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResultDialog({
        visible: true,
        success: true,
        title: 'Pedido Creado Exitosamente',
        message: 'El pedido se ha creado correctamente y está listo para ser procesado.',
        orderNumber: order.order_number,
        orderId: order.id,
        itemCount: parsedItems.length,
      });
    } catch (error: any) {
      console.error('=== Error creating order ===');
      console.error('Error type:', error.constructor?.name);
      console.error('Error message:', error.message);
      console.error('Error details:', error);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setResultDialog({
        visible: true,
        success: false,
        title: 'Error Inesperado',
        message: error.message || 'Ocurrió un error inesperado al crear el pedido. Por favor intenta de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setResultDialog({ ...resultDialog, visible: false });
  };

  const handleViewOrder = () => {
    if (resultDialog.orderId) {
      handleCloseDialog();
      router.replace(`/order/${resultDialog.orderId}`);
    }
  };

  const handleCreateAnother = () => {
    handleCloseDialog();
    resetForm();
  };

  const handleGoBack = () => {
    handleCloseDialog();
    router.back();
  };

  const handleLoginRedirect = () => {
    handleCloseDialog();
    router.replace('/login');
  };

  // Filter customers based on search query
  const filteredCustomers = customers.filter((customer) => {
    const query = customerSearchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      (customer.phone && customer.phone.toLowerCase().includes(query)) ||
      (customer.rut && customer.rut.toLowerCase().includes(query)) ||
      (customer.address && customer.address.toLowerCase().includes(query))
    );
  });

  // Show warning if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Stack.Screen options={headerOptions} />
        <IconSymbol ios_icon_name="exclamationmark.triangle.fill" android_material_icon_name="warning" size={64} color={colors.warning} />
        <Text style={styles.warningTitle}>Sesión Requerida</Text>
        <Text style={styles.warningText}>
          Debes iniciar sesión para crear pedidos manualmente.
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.replace('/login')}
        >
          <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen options={headerOptions} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Authentication Status Banner */}
        <View style={styles.authBanner}>
          <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check_circle" size={20} color={colors.success} />
          <Text style={styles.authBannerText}>
            Conectado como: {user.full_name} ({user.role})
          </Text>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <IconSymbol ios_icon_name="info.circle.fill" android_material_icon_name="info" size={20} color={colors.info} />
          <Text style={styles.infoBoxText}>
            📝 Ingresa el pedido como si fuera recibido por WhatsApp. El sistema parseará automáticamente los productos, cantidades y unidades.
          </Text>
        </View>

        {/* Customer Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <IconSymbol ios_icon_name="person.fill" android_material_icon_name="person" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Información del Cliente</Text>
          </View>

          {/* Mode Toggle */}
          <View style={styles.modeToggleContainer}>
            <TouchableOpacity
              style={[
                styles.modeToggleButton,
                customerInputMode === 'manual' && styles.modeToggleButtonActive,
              ]}
              onPress={() => handleModeChange('manual')}
            >
              <Text
                style={[
                  styles.modeToggleButtonText,
                  customerInputMode === 'manual' && styles.modeToggleButtonTextActive,
                ]}
              >
                Ingresar Manualmente
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeToggleButton,
                customerInputMode === 'select' && styles.modeToggleButtonActive,
              ]}
              onPress={() => handleModeChange('select')}
            >
              <Text
                style={[
                  styles.modeToggleButtonText,
                  customerInputMode === 'select' && styles.modeToggleButtonTextActive,
                ]}
              >
                Seleccionar de Lista
              </Text>
            </TouchableOpacity>
          </View>

          {customerInputMode === 'manual' ? (
            <>
              <Text style={styles.label}>
                Nombre <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.customerName && styles.inputError]}
                placeholder="Nombre del cliente"
                placeholderTextColor={colors.textSecondary}
                value={customerName}
                onChangeText={(text) => {
                  setCustomerName(text);
                  if (errors.customerName) {
                    setErrors({ ...errors, customerName: undefined });
                  }
                }}
              />
              {errors.customerName && (
                <Text style={styles.errorText}>{errors.customerName}</Text>
              )}

              <Text style={styles.label}>RUT (Opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="12.345.678-9"
                placeholderTextColor={colors.textSecondary}
                value={customerRut}
                onChangeText={setCustomerRut}
              />

              <Text style={styles.label}>Teléfono (Opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="+56912345678"
                placeholderTextColor={colors.textSecondary}
                value={customerPhone}
                onChangeText={setCustomerPhone}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Dirección (Opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Dirección del cliente"
                placeholderTextColor={colors.textSecondary}
                value={customerAddress}
                onChangeText={setCustomerAddress}
              />
            </>
          ) : (
            <>
              {selectedCustomerId ? (
                <View style={styles.selectedCustomerInfo}>
                  <Text style={styles.selectedCustomerName}>{customerName}</Text>
                  {customerRut && (
                    <Text style={styles.selectedCustomerDetail}>RUT: {customerRut}</Text>
                  )}
                  {customerPhone && (
                    <Text style={styles.selectedCustomerDetail}>📞 {customerPhone}</Text>
                  )}
                  {customerAddress && (
                    <Text style={styles.selectedCustomerDetail}>📍 {customerAddress}</Text>
                  )}
                  <TouchableOpacity
                    style={styles.changeCustomerButton}
                    onPress={() => setShowCustomerList(true)}
                  >
                    <Text style={styles.changeCustomerButtonText}>Cambiar Cliente</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.selectCustomerButton, errors.customerName && styles.inputError]}
                    onPress={() => setShowCustomerList(true)}
                  >
                    <Text style={styles.selectCustomerButtonPlaceholder}>
                      Seleccionar cliente...
                    </Text>
                    <IconSymbol
                      ios_icon_name="chevron.right"
                      android_material_icon_name="chevron_right"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                  {errors.customerName && (
                    <Text style={styles.errorText}>{errors.customerName}</Text>
                  )}
                </>
              )}
            </>
          )}
        </View>

        {/* Priority Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <IconSymbol ios_icon_name="flag.fill" android_material_icon_name="flag" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Prioridad del Pedido</Text>
          </View>

          <View style={styles.prioritySelector}>
            {(['high', 'normal', 'low'] as OrderPriority[]).map((p) => {
              const isSelected = priority === p;
              const priorityColor = getPriorityColor(p);
              const priorityIcon = getPriorityIcon(p);
              
              return (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.priorityOption,
                    { 
                      backgroundColor: isSelected ? priorityColor : colors.background,
                      borderColor: priorityColor,
                      borderWidth: 2,
                    }
                  ]}
                  onPress={() => setPriority(p)}
                >
                  <IconSymbol 
                    ios_icon_name={priorityIcon.ios}
                    android_material_icon_name={priorityIcon.android}
                    size={24} 
                    color={isSelected ? '#fff' : priorityColor} 
                  />
                  <Text style={[
                    styles.priorityOptionText,
                    { color: isSelected ? '#fff' : colors.text }
                  ]}>
                    {getPriorityLabel(p)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Order Text Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <IconSymbol ios_icon_name="text.bubble.fill" android_material_icon_name="chat_bubble" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Pedido (Formato WhatsApp)</Text>
          </View>

          <Text style={styles.label}>
            Texto del Pedido <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.textArea, errors.orderText && styles.inputError]}
            placeholder={'Ejemplo:\n3 kilos de tomates\n2 kilos de papas\n1 lechuga\n5 pepinos'}
            placeholderTextColor={colors.textSecondary}
            value={orderText}
            onChangeText={(text) => {
              setOrderText(text);
              if (errors.orderText) {
                setErrors({ ...errors, orderText: undefined });
              }
            }}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
          {errors.orderText && (
            <Text style={styles.errorText}>{errors.orderText}</Text>
          )}

          {/* Examples */}
          <View style={styles.examplesBox}>
            <Text style={styles.examplesTitle}>📋 Formatos válidos:</Text>
            <Text style={styles.examplesText}>
              • 3 kilos de tomates{'\n'}
              • 2 kg de papas{'\n'}
              • 1/2 kilo de cebollas{'\n'}
              • 1 1/2 kilo de manzanas{'\n'}
              • medio kilo de palta{'\n'}
              • 5 pepinos{'\n'}
              • 1 lechuga
            </Text>
          </View>
        </View>

        {/* Parsed Items Preview */}
        {parsedItems.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check_circle" size={24} color={colors.success} />
              <Text style={styles.cardTitle}>Productos Detectados ({parsedItems.length})</Text>
            </View>

            {parsedItems.map((item, index) => (
              <View key={index} style={styles.parsedItemCard}>
                <View style={styles.parsedItemHeader}>
                  <Text style={styles.parsedItemNumber}>{index + 1}.</Text>
                  <View style={styles.parsedItemContent}>
                    <Text style={styles.parsedItemProduct}>{item.product}</Text>
                    <Text style={styles.parsedItemDetails}>
                      {item.quantity === '#' ? '# (sin cantidad)' : `${item.quantity} ${item.unit}`}
                    </Text>
                  </View>
                  {item.quantity === '#' && (
                    <IconSymbol ios_icon_name="exclamationmark.triangle.fill" android_material_icon_name="warning" size={20} color={colors.warning} />
                  )}
                </View>
              </View>
            ))}

            {parsedItems.some(item => item.quantity === '#') && (
              <View style={styles.warningBox}>
                <IconSymbol ios_icon_name="exclamationmark.triangle.fill" android_material_icon_name="warning" size={16} color={colors.warning} />
                <Text style={styles.warningBoxText}>
                  Algunos productos tienen cantidad "#" porque no pudieron ser procesados. Podrás editarlos después de crear el pedido.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading || parsedItems.length === 0}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check_circle" size={24} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>
                Crear Pedido ({parsedItems.length} producto{parsedItems.length !== 1 ? 's' : ''})
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Result Dialog Modal */}
      <Modal
        visible={resultDialog.visible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseDialog}
      >
        <TouchableOpacity
          style={styles.dialogOverlay}
          activeOpacity={1}
          onPress={handleCloseDialog}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.dialogContainer}>
              {/* Icon */}
              <View style={styles.dialogIconContainer}>
                {resultDialog.success ? (
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check_circle"
                    size={64}
                    color={colors.success}
                  />
                ) : (
                  <IconSymbol
                    ios_icon_name="xmark.circle.fill"
                    android_material_icon_name="error"
                    size={64}
                    color={colors.error}
                  />
                )}
              </View>

              {/* Title */}
              <Text style={styles.dialogTitle}>{resultDialog.title}</Text>

              {/* Message */}
              <Text style={styles.dialogMessage}>{resultDialog.message}</Text>

              {/* Order Info (only for success) */}
              {resultDialog.success && resultDialog.orderNumber && (
                <View style={styles.dialogOrderInfo}>
                  <Text style={styles.dialogOrderNumber}>
                    Pedido #{resultDialog.orderNumber}
                  </Text>
                  <Text style={styles.dialogOrderItems}>
                    {resultDialog.itemCount} producto{resultDialog.itemCount !== 1 ? 's' : ''} agregado{resultDialog.itemCount !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}

              {/* Buttons */}
              <View style={styles.dialogButtonsContainer}>
                {resultDialog.success ? (
                  <>
                    {/* View Order Button */}
                    <TouchableOpacity
                      style={[styles.dialogButton, styles.dialogButtonPrimary]}
                      onPress={handleViewOrder}
                    >
                      <IconSymbol
                        ios_icon_name="eye.fill"
                        android_material_icon_name="visibility"
                        size={20}
                        color="#FFFFFF"
                      />
                      <Text style={styles.dialogButtonText}>Ver Pedido</Text>
                    </TouchableOpacity>

                    {/* Create Another Button */}
                    <TouchableOpacity
                      style={[styles.dialogButton, styles.dialogButtonSuccess]}
                      onPress={handleCreateAnother}
                    >
                      <IconSymbol
                        ios_icon_name="plus.circle.fill"
                        android_material_icon_name="add_circle"
                        size={20}
                        color="#FFFFFF"
                      />
                      <Text style={styles.dialogButtonText}>Crear Otro</Text>
                    </TouchableOpacity>

                    {/* Go Back Button */}
                    <TouchableOpacity
                      style={[styles.dialogButton, styles.dialogButtonSecondary]}
                      onPress={handleGoBack}
                    >
                      <Text style={styles.dialogButtonTextSecondary}>Volver</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    {/* Try Again / Close Button */}
                    <TouchableOpacity
                      style={[styles.dialogButton, styles.dialogButtonPrimary]}
                      onPress={handleCloseDialog}
                    >
                      <Text style={styles.dialogButtonText}>
                        {resultDialog.title === 'Sesión Expirada' ? 'Entendido' : 'Intentar de Nuevo'}
                      </Text>
                    </TouchableOpacity>

                    {/* Login Button (only for session expired) */}
                    {resultDialog.title === 'Sesión Expirada' && (
                      <TouchableOpacity
                        style={[styles.dialogButton, styles.dialogButtonSuccess]}
                        onPress={handleLoginRedirect}
                      >
                        <IconSymbol
                          ios_icon_name="arrow.right.circle.fill"
                          android_material_icon_name="login"
                          size={20}
                          color="#FFFFFF"
                        />
                        <Text style={styles.dialogButtonText}>Iniciar Sesión</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Customer List Modal */}
      <Modal
        visible={showCustomerList}
        animationType="slide"
        onRequestClose={() => setShowCustomerList(false)}
      >
        <View style={styles.customerListModal}>
          <View style={styles.customerListContainer}>
            <View style={styles.customerListHeader}>
              <Text style={styles.customerListTitle}>Seleccionar Cliente</Text>
              <View style={styles.customerListSearchContainer}>
                <IconSymbol
                  ios_icon_name="magnifyingglass"
                  android_material_icon_name="search"
                  size={20}
                  color={colors.textSecondary}
                />
                <TextInput
                  style={styles.customerListSearchInput}
                  placeholder="Buscar por nombre, teléfono, RUT..."
                  placeholderTextColor={colors.textSecondary}
                  value={customerSearchQuery}
                  onChangeText={setCustomerSearchQuery}
                />
              </View>
            </View>

            {loadingCustomers ? (
              <View style={styles.customerListEmpty}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.customerListEmptyText}>Cargando clientes...</Text>
              </View>
            ) : filteredCustomers.length === 0 ? (
              <View style={styles.customerListEmpty}>
                <IconSymbol
                  ios_icon_name="person.2"
                  android_material_icon_name="people"
                  size={64}
                  color={colors.textSecondary}
                />
                <Text style={styles.customerListEmptyText}>
                  {customerSearchQuery
                    ? 'No se encontraron clientes'
                    : 'No hay clientes registrados'}
                </Text>
              </View>
            ) : (
              <FlatList
                style={styles.customerListContent}
                data={filteredCustomers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.customerListItem}
                    onPress={() => handleSelectCustomer(item)}
                  >
                    <Text style={styles.customerListItemName}>{item.name}</Text>
                    {item.rut && (
                      <Text style={styles.customerListItemDetail}>RUT: {item.rut}</Text>
                    )}
                    {item.phone && (
                      <Text style={styles.customerListItemDetail}>📞 {item.phone}</Text>
                    )}
                    {item.address && (
                      <Text style={styles.customerListItemDetail}>📍 {item.address}</Text>
                    )}
                    <View style={styles.customerListItemStats}>
                      <Text style={styles.customerListItemStat}>
                        Deuda: {formatCLP(item.total_debt)}
                      </Text>
                      <Text style={styles.customerListItemStat}>
                        Pagado: {formatCLP(item.total_paid)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}

            <TouchableOpacity
              style={styles.customerListCloseButton}
              onPress={() => setShowCustomerList(false)}
            >
              <Text style={styles.customerListCloseButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
