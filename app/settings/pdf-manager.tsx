
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { CustomDialog, DialogButton } from '@/components/CustomDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getSupabase } from '@/lib/supabase';
import { Order, Customer, OrderStatus } from '@/types';
import { formatCLP, formatDate, getStatusLabel } from '@/utils/orderHelpers';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DialogState {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  buttons?: DialogButton[];
}

interface FilterOptions {
  startDate?: Date;
  endDate?: Date;
  status?: OrderStatus | 'all';
  customerId?: string;
  customerName?: string;
}

const STATUS_OPTIONS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos los Estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'preparing', label: 'Preparando' },
  { value: 'ready', label: 'Listo' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'pending_payment', label: 'Pendiente de Pago' },
  { value: 'abonado', label: 'Abonado' },
  { value: 'pagado', label: 'Pagado' },
  { value: 'finalizado', label: 'Finalizado' },
];

// Helper function to get default dates (current month)
const getDefaultDates = () => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of current month
  return { startOfMonth, endOfMonth };
};

export default function PDFManagerScreen() {
  const { user } = useAuth();
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  
  const [dialog, setDialog] = useState<DialogState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  // Initialize with current month as default
  const defaultDates = getDefaultDates();
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    startDate: defaultDates.startOfMonth,
    endDate: defaultDates.endOfMonth,
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    section: {
      marginHorizontal: 16,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
      marginLeft: 4,
    },
    card: {
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    cardDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    filterLabel: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    filterValue: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
    },
    dateButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dateButtonText: {
      fontSize: 14,
      color: colors.text,
    },
    button: {
      backgroundColor: colors.primary,
      padding: 14,
      borderRadius: 8,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButton: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryButtonText: {
      color: colors.text,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    modalItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalItemText: {
      fontSize: 16,
      color: colors.text,
    },
    modalItemSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    datePickerModal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    datePickerContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      width: '90%',
      maxWidth: 400,
    },
    datePickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    datePickerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    datePickerButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 16,
    },
    datePickerButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
    },
    datePickerButtonCancel: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    datePickerButtonConfirm: {
      backgroundColor: colors.primary,
    },
    datePickerButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    datePickerButtonTextCancel: {
      color: colors.text,
    },
    datePickerButtonTextConfirm: {
      color: '#FFFFFF',
    },
    defaultDateInfo: {
      backgroundColor: colors.background,
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    defaultDateInfoText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const showDialog = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    buttons?: DialogButton[]
  ) => {
    setDialog({ visible: true, type, title, message, buttons });
  };

  const closeDialog = () => {
    setDialog({ ...dialog, visible: false });
  };

  const loadCustomers = async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('[PDFManager] Error loading customers:', error);
    }
  };

  const fetchOrders = async (): Promise<Order[]> => {
    try {
      const supabase = getSupabase();
      let query = supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*),
          queries:order_queries(*),
          order_payments(*)
        `)
        .order('created_at', { ascending: false });

      // Use default dates if not set
      const effectiveStartDate = filters.startDate || defaultDates.startOfMonth;
      const effectiveEndDate = filters.endDate || defaultDates.endOfMonth;

      // Apply date filters
      const startDateStr = effectiveStartDate.toISOString().split('T')[0];
      query = query.gte('created_at', startDateStr);
      
      const endDateStr = effectiveEndDate.toISOString().split('T')[0] + 'T23:59:59.999Z';
      query = query.lte('created_at', endDateStr);

      // Apply other filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      console.log('[PDFManager] Fetched orders with date range:', {
        start: startDateStr,
        end: endDateStr,
        count: data?.length || 0
      });
      
      return data || [];
    } catch (error) {
      console.error('[PDFManager] Error fetching orders:', error);
      throw error;
    }
  };

  const generateOrdersPDF = async () => {
    try {
      setLoading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      console.log('[PDFManager] Starting PDF generation...');
      const orders = await fetchOrders();

      if (orders.length === 0) {
        showDialog('warning', 'Sin Resultados', 'No se encontraron pedidos con los filtros seleccionados.');
        setLoading(false);
        return;
      }

      console.log('[PDFManager] Generating HTML for', orders.length, 'orders');
      const html = generateOrdersHTML(orders);
      
      // Validate HTML length
      if (!html || html.length < 100) {
        throw new Error('HTML generado es inválido o muy corto');
      }
      
      console.log('[PDFManager] HTML generated, length:', html.length);
      console.log('[PDFManager] Calling Print.printToFileAsync...');
      
      const result = await Print.printToFileAsync({ 
        html,
        base64: false 
      });
      
      console.log('[PDFManager] Print result:', result);
      
      if (!result || !result.uri) {
        throw new Error('Print.printToFileAsync no devolvió un URI válido');
      }
      
      console.log('[PDFManager] PDF generated successfully at:', result.uri);
      await shareAsync(result.uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showDialog('success', 'PDF Generado', `Se generó el PDF con ${orders.length} pedido(s).`);
    } catch (error: any) {
      console.error('[PDFManager] Error generating PDF:', error);
      console.error('[PDFManager] Error stack:', error?.stack);
      console.error('[PDFManager] Error message:', error?.message);
      
      const errorMessage = error?.message || 'Error desconocido';
      showDialog('error', 'Error', `No se pudo generar el PDF:\n\n${errorMessage}\n\nRevisa los logs de la consola para más detalles.`);
    } finally {
      setLoading(false);
    }
  };

  const generateDetailedPDF = async () => {
    try {
      setLoading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      console.log('[PDFManager] Starting detailed PDF generation...');
      const orders = await fetchOrders();

      if (orders.length === 0) {
        showDialog('warning', 'Sin Resultados', 'No se encontraron pedidos con los filtros seleccionados.');
        setLoading(false);
        return;
      }

      console.log('[PDFManager] Generating detailed HTML for', orders.length, 'orders');
      const html = generateDetailedHTML(orders);
      
      // Validate HTML length
      if (!html || html.length < 100) {
        throw new Error('HTML generado es inválido o muy corto');
      }
      
      console.log('[PDFManager] Detailed HTML generated, length:', html.length);
      console.log('[PDFManager] Calling Print.printToFileAsync...');
      
      const result = await Print.printToFileAsync({ 
        html,
        base64: false 
      });
      
      console.log('[PDFManager] Print result:', result);
      
      if (!result || !result.uri) {
        throw new Error('Print.printToFileAsync no devolvió un URI válido');
      }
      
      console.log('[PDFManager] Detailed PDF generated successfully at:', result.uri);
      await shareAsync(result.uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showDialog('success', 'PDF Generado', `Se generó el PDF detallado con ${orders.length} pedido(s).`);
    } catch (error: any) {
      console.error('[PDFManager] Error generating detailed PDF:', error);
      console.error('[PDFManager] Error stack:', error?.stack);
      console.error('[PDFManager] Error message:', error?.message);
      
      const errorMessage = error?.message || 'Error desconocido';
      showDialog('error', 'Error', `No se pudo generar el PDF:\n\n${errorMessage}\n\nRevisa los logs de la consola para más detalles.`);
    } finally {
      setLoading(false);
    }
  };

  const generateSummaryPDF = async () => {
    try {
      setLoading(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      console.log('[PDFManager] Starting summary PDF generation...');
      const orders = await fetchOrders();

      if (orders.length === 0) {
        showDialog('warning', 'Sin Resultados', 'No se encontraron pedidos con los filtros seleccionados.');
        setLoading(false);
        return;
      }

      console.log('[PDFManager] Generating summary HTML for', orders.length, 'orders');
      const html = generateSummaryHTML(orders);
      
      // Validate HTML length
      if (!html || html.length < 100) {
        throw new Error('HTML generado es inválido o muy corto');
      }
      
      console.log('[PDFManager] Summary HTML generated, length:', html.length);
      console.log('[PDFManager] Calling Print.printToFileAsync...');
      
      const result = await Print.printToFileAsync({ 
        html,
        base64: false 
      });
      
      console.log('[PDFManager] Print result:', result);
      
      if (!result || !result.uri) {
        throw new Error('Print.printToFileAsync no devolvió un URI válido');
      }
      
      console.log('[PDFManager] Summary PDF generated successfully at:', result.uri);
      await shareAsync(result.uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showDialog('success', 'PDF Generado', `Se generó el resumen con ${orders.length} pedido(s).`);
    } catch (error: any) {
      console.error('[PDFManager] Error generating summary PDF:', error);
      console.error('[PDFManager] Error stack:', error?.stack);
      console.error('[PDFManager] Error message:', error?.message);
      
      const errorMessage = error?.message || 'Error desconocido';
      showDialog('error', 'Error', `No se pudo generar el PDF:\n\n${errorMessage}\n\nRevisa los logs de la consola para más detalles.`);
    } finally {
      setLoading(false);
    }
  };

  const escapeHtml = (text: string | null | undefined): string => {
    if (!text) return '';
    const str = String(text);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, ' ')
      .replace(/\r/g, '');
  };

  const safeFormatCLP = (amount: number | null | undefined): string => {
    try {
      return formatCLP(Number(amount || 0));
    } catch (error) {
      console.error('[PDFManager] Error formatting CLP:', error);
      return '$0';
    }
  };

  const safeFormatDate = (dateString: string | null | undefined): string => {
    try {
      if (!dateString) return 'Sin fecha';
      return formatDate(dateString);
    } catch (error) {
      console.error('[PDFManager] Error formatting date:', error);
      return 'Sin fecha';
    }
  };

  const safeGetStatusLabel = (status: string | null | undefined): string => {
    try {
      if (!status) return 'Sin estado';
      return getStatusLabel(status as OrderStatus);
    } catch (error) {
      console.error('[PDFManager] Error getting status label:', error);
      return 'Sin estado';
    }
  };

  const generateOrdersHTML = (orders: Order[]): string => {
    try {
      const filterInfo = getFilterInfo();
      
      const ordersHTML = orders.map(order => {
        const orderNumber = escapeHtml(order.order_number || 'Sin número');
        const status = order.status || 'pending';
        const statusLabel = safeGetStatusLabel(status);
        const customerName = escapeHtml(order.customer_name || 'Sin nombre');
        const customerPhone = order.customer_phone ? escapeHtml(order.customer_phone) : null;
        const customerAddress = order.customer_address ? escapeHtml(order.customer_address) : null;
        const createdAt = safeFormatDate(order.created_at);
        const source = order.source === 'whatsapp' ? 'WhatsApp' : 'Manual';
        const totalAmount = safeFormatCLP(order.total_amount);
        
        return `
          <div class="order">
            <div class="order-header">
              <span class="order-number">#${orderNumber}</span>
              <span class="status status-${status}">${statusLabel}</span>
            </div>
            <div class="order-info">
              <p><span class="label">Cliente:</span> ${customerName}</p>
              ${customerPhone ? `<p><span class="label">Telefono:</span> ${customerPhone}</p>` : ''}
              ${customerAddress ? `<p><span class="label">Direccion:</span> ${customerAddress}</p>` : ''}
              <p><span class="label">Fecha:</span> ${createdAt}</p>
              <p><span class="label">Origen:</span> ${source}</p>
            </div>
            <div class="total">Total: ${totalAmount}</div>
          </div>
        `;
      }).join('');
      
      const totalAmount = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
      
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: Arial, Helvetica, sans-serif;
                padding: 20px;
                color: #333;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #6B9F3E;
                padding-bottom: 20px;
              }
              h1 {
                color: #6B9F3E;
                margin: 10px 0;
                font-size: 24px;
              }
              .subtitle {
                color: #666;
                font-size: 14px;
              }
              .filter-info {
                background-color: #f5f5f5;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
              }
              .filter-info p {
                margin: 5px 0;
                font-size: 12px;
                color: #666;
              }
              .order {
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 15px;
                page-break-inside: avoid;
              }
              .order-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
                border-bottom: 1px solid #eee;
                padding-bottom: 10px;
              }
              .order-number {
                font-weight: bold;
                font-size: 16px;
                color: #6B9F3E;
              }
              .status {
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
              }
              .status-pending { background-color: #FEF3C7; color: #92400E; }
              .status-preparing { background-color: #DBEAFE; color: #1E40AF; }
              .status-ready { background-color: #D1FAE5; color: #065F46; }
              .status-delivered { background-color: #E5E7EB; color: #374151; }
              .status-cancelled { background-color: #FEE2E2; color: #991B1B; }
              .status-pending_payment { background-color: #FEF3C7; color: #92400E; }
              .status-abonado { background-color: #DBEAFE; color: #1E40AF; }
              .status-pagado { background-color: #D1FAE5; color: #065F46; }
              .status-finalizado { background-color: #E5E7EB; color: #374151; }
              .order-info {
                margin: 10px 0;
              }
              .order-info p {
                margin: 5px 0;
                font-size: 13px;
              }
              .label {
                font-weight: 600;
                color: #666;
              }
              .total {
                text-align: right;
                font-size: 16px;
                font-weight: bold;
                color: #6B9F3E;
                margin-top: 10px;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                color: #999;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Respaldo de Pedidos</h1>
              <p class="subtitle">Generado el ${safeFormatDate(new Date().toISOString())}</p>
            </div>
            
            <div class="filter-info">
              ${filterInfo}
            </div>

            ${ordersHTML}

            <div class="footer">
              <p>Total de pedidos: ${orders.length}</p>
              <p>Monto total: ${safeFormatCLP(totalAmount)}</p>
              <p>Order Manager - Aplicacion de uso privado</p>
            </div>
          </body>
        </html>
      `;
    } catch (error) {
      console.error('[PDFManager] Error generating orders HTML:', error);
      throw new Error(`Error al generar HTML: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const generateDetailedHTML = (orders: Order[]): string => {
    try {
      const filterInfo = getFilterInfo();
      
      const ordersHTML = orders.map(order => {
        const orderNumber = escapeHtml(order.order_number || 'Sin número');
        const status = order.status || 'pending';
        const statusLabel = safeGetStatusLabel(status);
        const customerName = escapeHtml(order.customer_name || 'Sin nombre');
        const customerPhone = order.customer_phone ? escapeHtml(order.customer_phone) : null;
        const customerAddress = order.customer_address ? escapeHtml(order.customer_address) : null;
        const createdAt = safeFormatDate(order.created_at);
        const source = order.source === 'whatsapp' ? 'WhatsApp' : 'Manual';
        const notes = order.notes ? escapeHtml(order.notes) : null;
        const totalAmount = safeFormatCLP(order.total_amount);
        const paidAmount = safeFormatCLP(order.paid_amount);
        const pendingAmount = safeFormatCLP(Number(order.total_amount || 0) - Number(order.paid_amount || 0));
        
        const itemsHTML = order.items && order.items.length > 0 ? `
          <div class="items-section">
            <div class="items-title">Productos:</div>
            ${order.items.map(item => {
              const productName = escapeHtml(item.product_name || 'Sin nombre');
              const quantity = item.quantity || 0;
              const unitPrice = safeFormatCLP(item.unit_price);
              const itemNotes = item.notes ? escapeHtml(item.notes) : null;
              
              return `
                <div class="item">
                  <div class="item-name">${productName}</div>
                  <div class="item-details">
                    Cantidad: ${quantity} | Precio: ${unitPrice}
                    ${itemNotes ? ` | ${itemNotes}` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : '';
        
        return `
          <div class="order">
            <div class="order-header">
              <span class="order-number">#${orderNumber}</span>
              <span class="status status-${status}">${statusLabel}</span>
            </div>
            
            <div class="order-info">
              <p><span class="label">Cliente:</span> ${customerName}</p>
              ${customerPhone ? `<p><span class="label">Telefono:</span> ${customerPhone}</p>` : ''}
              ${customerAddress ? `<p><span class="label">Direccion:</span> ${customerAddress}</p>` : ''}
              <p><span class="label">Fecha:</span> ${createdAt}</p>
              <p><span class="label">Origen:</span> ${source}</p>
              ${notes ? `<p><span class="label">Notas:</span> ${notes}</p>` : ''}
            </div>

            ${itemsHTML}

            <div class="totals">
              <p><span class="label">Total:</span> <span class="total-amount">${totalAmount}</span></p>
              <p><span class="label">Pagado:</span> ${paidAmount}</p>
              <p><span class="label">Pendiente:</span> ${pendingAmount}</p>
            </div>
          </div>
        `;
      }).join('');
      
      const totalAmount = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
      const totalPaid = orders.reduce((sum, o) => sum + Number(o.paid_amount || 0), 0);
      const totalPending = totalAmount - totalPaid;
      
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: Arial, Helvetica, sans-serif;
                padding: 20px;
                color: #333;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #6B9F3E;
                padding-bottom: 20px;
              }
              h1 {
                color: #6B9F3E;
                margin: 10px 0;
                font-size: 24px;
              }
              .subtitle {
                color: #666;
                font-size: 14px;
              }
              .filter-info {
                background-color: #f5f5f5;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
              }
              .filter-info p {
                margin: 5px 0;
                font-size: 12px;
                color: #666;
              }
              .order {
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 20px;
                page-break-inside: avoid;
              }
              .order-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                border-bottom: 2px solid #6B9F3E;
                padding-bottom: 10px;
              }
              .order-number {
                font-weight: bold;
                font-size: 18px;
                color: #6B9F3E;
              }
              .status {
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
              }
              .status-pending { background-color: #FEF3C7; color: #92400E; }
              .status-preparing { background-color: #DBEAFE; color: #1E40AF; }
              .status-ready { background-color: #D1FAE5; color: #065F46; }
              .status-delivered { background-color: #E5E7EB; color: #374151; }
              .status-cancelled { background-color: #FEE2E2; color: #991B1B; }
              .status-pending_payment { background-color: #FEF3C7; color: #92400E; }
              .status-abonado { background-color: #DBEAFE; color: #1E40AF; }
              .status-pagado { background-color: #D1FAE5; color: #065F46; }
              .status-finalizado { background-color: #E5E7EB; color: #374151; }
              .order-info {
                margin: 15px 0;
              }
              .order-info p {
                margin: 5px 0;
                font-size: 13px;
              }
              .label {
                font-weight: 600;
                color: #666;
              }
              .items-section {
                margin: 15px 0;
              }
              .items-title {
                font-weight: 600;
                font-size: 14px;
                margin-bottom: 10px;
                color: #333;
              }
              .item {
                background-color: #f9f9f9;
                padding: 10px;
                border-radius: 6px;
                margin-bottom: 8px;
              }
              .item-name {
                font-weight: 600;
                color: #333;
              }
              .item-details {
                font-size: 12px;
                color: #666;
                margin-top: 4px;
              }
              .totals {
                background-color: #f5f5f5;
                padding: 15px;
                border-radius: 8px;
                margin-top: 15px;
              }
              .totals p {
                margin: 5px 0;
                font-size: 14px;
              }
              .total-amount {
                font-size: 18px;
                font-weight: bold;
                color: #6B9F3E;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                color: #999;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Detalle de Pedidos</h1>
              <p class="subtitle">Generado el ${safeFormatDate(new Date().toISOString())}</p>
            </div>
            
            <div class="filter-info">
              ${filterInfo}
            </div>

            ${ordersHTML}

            <div class="footer">
              <p>Total de pedidos: ${orders.length}</p>
              <p>Monto total: ${safeFormatCLP(totalAmount)}</p>
              <p>Monto pagado: ${safeFormatCLP(totalPaid)}</p>
              <p>Monto pendiente: ${safeFormatCLP(totalPending)}</p>
              <p>Order Manager - Aplicacion de uso privado</p>
            </div>
          </body>
        </html>
      `;
    } catch (error) {
      console.error('[PDFManager] Error generating detailed HTML:', error);
      throw new Error(`Error al generar HTML detallado: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const generateSummaryHTML = (orders: Order[]): string => {
    try {
      const filterInfo = getFilterInfo();
      
      // Calculate statistics
      const totalOrders = orders.length;
      const totalAmount = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
      const totalPaid = orders.reduce((sum, o) => sum + Number(o.paid_amount || 0), 0);
      const totalPending = totalAmount - totalPaid;
      
      // Group by status
      const byStatus: Record<string, number> = {};
      orders.forEach(order => {
        const status = order.status || 'pending';
        byStatus[status] = (byStatus[status] || 0) + 1;
      });
      
      const statusRowsHTML = Object.entries(byStatus).map(([status, count]) => `
        <tr>
          <td>${safeGetStatusLabel(status)}</td>
          <td>${count}</td>
        </tr>
      `).join('');
      
      // Group by customer
      const byCustomer: Record<string, { count: number; total: number }> = {};
      orders.forEach(order => {
        const customerName = order.customer_name || 'Sin nombre';
        if (!byCustomer[customerName]) {
          byCustomer[customerName] = { count: 0, total: 0 };
        }
        byCustomer[customerName].count++;
        byCustomer[customerName].total += Number(order.total_amount || 0);
      });
      
      const topCustomers = Object.entries(byCustomer)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 10);
      
      const customerRowsHTML = topCustomers.map(([name, data]) => `
        <tr>
          <td>${escapeHtml(name)}</td>
          <td>${data.count}</td>
          <td>${safeFormatCLP(data.total)}</td>
        </tr>
      `).join('');
      
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: Arial, Helvetica, sans-serif;
                padding: 20px;
                color: #333;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #6B9F3E;
                padding-bottom: 20px;
              }
              h1 {
                color: #6B9F3E;
                margin: 10px 0;
                font-size: 24px;
              }
              .subtitle {
                color: #666;
                font-size: 14px;
              }
              .filter-info {
                background-color: #f5f5f5;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
              }
              .filter-info p {
                margin: 5px 0;
                font-size: 12px;
                color: #666;
              }
              .stats-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-bottom: 30px;
              }
              .stat-card {
                background-color: #f9f9f9;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #6B9F3E;
              }
              .stat-label {
                font-size: 12px;
                color: #666;
                text-transform: uppercase;
                margin-bottom: 8px;
              }
              .stat-value {
                font-size: 24px;
                font-weight: bold;
                color: #333;
              }
              .section {
                margin-bottom: 30px;
              }
              .section-title {
                font-size: 18px;
                font-weight: 600;
                color: #6B9F3E;
                margin-bottom: 15px;
                border-bottom: 1px solid #ddd;
                padding-bottom: 8px;
              }
              .table {
                width: 100%;
                border-collapse: collapse;
              }
              .table th {
                background-color: #f5f5f5;
                padding: 10px;
                text-align: left;
                font-size: 12px;
                font-weight: 600;
                color: #666;
                border-bottom: 2px solid #ddd;
              }
              .table td {
                padding: 10px;
                border-bottom: 1px solid #eee;
                font-size: 13px;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                color: #999;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Resumen de Pedidos</h1>
              <p class="subtitle">Generado el ${safeFormatDate(new Date().toISOString())}</p>
            </div>
            
            <div class="filter-info">
              ${filterInfo}
            </div>

            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Total Pedidos</div>
                <div class="stat-value">${totalOrders}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Monto Total</div>
                <div class="stat-value">${safeFormatCLP(totalAmount)}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Monto Pagado</div>
                <div class="stat-value">${safeFormatCLP(totalPaid)}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Monto Pendiente</div>
                <div class="stat-value">${safeFormatCLP(totalPending)}</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Pedidos por Estado</div>
              <table class="table">
                <thead>
                  <tr>
                    <th>Estado</th>
                    <th>Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  ${statusRowsHTML}
                </tbody>
              </table>
            </div>

            <div class="section">
              <div class="section-title">Top 10 Clientes</div>
              <table class="table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Pedidos</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${customerRowsHTML}
                </tbody>
              </table>
            </div>

            <div class="footer">
              <p>Order Manager - Aplicacion de uso privado</p>
            </div>
          </body>
        </html>
      `;
    } catch (error) {
      console.error('[PDFManager] Error generating summary HTML:', error);
      throw new Error(`Error al generar HTML de resumen: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const getFilterInfo = (): string => {
    const parts: string[] = [];
    
    if (filters.customerName) {
      parts.push(`<p><strong>Cliente:</strong> ${escapeHtml(filters.customerName)}</p>`);
    }
    if (filters.status && filters.status !== 'all') {
      parts.push(`<p><strong>Estado:</strong> ${safeGetStatusLabel(filters.status)}</p>`);
    }
    
    // Use effective dates (default if not set)
    const effectiveStartDate = filters.startDate || defaultDates.startOfMonth;
    const effectiveEndDate = filters.endDate || defaultDates.endOfMonth;
    
    parts.push(`<p><strong>Desde:</strong> ${effectiveStartDate.toLocaleDateString('es-ES')}</p>`);
    parts.push(`<p><strong>Hasta:</strong> ${effectiveEndDate.toLocaleDateString('es-ES')}</p>`);
    
    return parts.join('');
  };

  const clearFilters = () => {
    const defaultDates = getDefaultDates();
    setFilters({ 
      status: 'all',
      startDate: defaultDates.startOfMonth,
      endDate: defaultDates.endOfMonth,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const selectCustomer = (customer: Customer) => {
    setFilters({
      ...filters,
      customerId: customer.id,
      customerName: customer.name,
    });
    setShowCustomerModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const selectStatus = (status: OrderStatus | 'all') => {
    setFilters({
      ...filters,
      status,
    });
    setShowStatusModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    console.log('[PDFManager] Start date change event:', event.type, selectedDate);
    
    if (event.type === 'dismissed') {
      setShowStartDatePicker(false);
      return;
    }
    
    if (selectedDate) {
      setFilters({ ...filters, startDate: selectedDate });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // On Android, close immediately after selection
      if (Platform.OS === 'android') {
        setShowStartDatePicker(false);
      }
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    console.log('[PDFManager] End date change event:', event.type, selectedDate);
    
    if (event.type === 'dismissed') {
      setShowEndDatePicker(false);
      return;
    }
    
    if (selectedDate) {
      setFilters({ ...filters, endDate: selectedDate });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // On Android, close immediately after selection
      if (Platform.OS === 'android') {
        setShowEndDatePicker(false);
      }
    }
  };

  const confirmStartDate = () => {
    setShowStartDatePicker(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const confirmEndDate = () => {
    setShowEndDatePicker(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const cancelStartDate = () => {
    setShowStartDatePicker(false);
  };

  const cancelEndDate = () => {
    setShowEndDatePicker(false);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Gestor PDF Pedidos',
          headerBackTitle: 'Atrás',
        }}
      />
      <ScrollView style={styles.container}>
        {/* Filters Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filtros</Text>
          
          <View style={styles.defaultDateInfo}>
            <Text style={styles.defaultDateInfoText}>
              📅 Por defecto se usa el mes en curso ({defaultDates.startOfMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })})
            </Text>
          </View>
          
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.filterRow}
              onPress={() => setShowCustomerModal(true)}
            >
              <Text style={styles.filterLabel}>Cliente</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.filterValue}>
                  {filters.customerName || 'Todos'}
                </Text>
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="chevron_right"
                  size={20}
                  color={colors.primary}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterRow}
              onPress={() => setShowStatusModal(true)}
            >
              <Text style={styles.filterLabel}>Estado</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.filterValue}>
                  {filters.status === 'all' ? 'Todos' : getStatusLabel(filters.status!)}
                </Text>
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="chevron_right"
                  size={20}
                  color={colors.primary}
                />
              </View>
            </TouchableOpacity>

            <View style={{ marginTop: 12 }}>
              <Text style={[styles.filterLabel, { marginBottom: 8 }]}>Fecha Inicio</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  console.log('[PDFManager] Opening start date picker');
                  setShowStartDatePicker(true);
                }}
              >
                <Text style={styles.dateButtonText}>
                  {filters.startDate 
                    ? filters.startDate.toLocaleDateString('es-ES')
                    : defaultDates.startOfMonth.toLocaleDateString('es-ES')}
                </Text>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="calendar_today"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            <View>
              <Text style={[styles.filterLabel, { marginBottom: 8 }]}>Fecha Fin</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  console.log('[PDFManager] Opening end date picker');
                  setShowEndDatePicker(true);
                }}
              >
                <Text style={styles.dateButtonText}>
                  {filters.endDate 
                    ? filters.endDate.toLocaleDateString('es-ES')
                    : defaultDates.endOfMonth.toLocaleDateString('es-ES')}
                </Text>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="calendar_today"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, { marginTop: 12 }]}
              onPress={clearFilters}
            >
              <IconSymbol
                ios_icon_name="xmark.circle"
                android_material_icon_name="close"
                size={20}
                color={colors.text}
              />
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Limpiar Filtros
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PDF Options Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Opciones de PDF</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Resumen de Pedidos</Text>
            <Text style={styles.cardDescription}>
              Lista básica de pedidos con información general (cliente, estado, total).
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={generateOrdersPDF}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <IconSymbol
                    ios_icon_name="doc.text"
                    android_material_icon_name="description"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.buttonText}>Generar PDF</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Detalle Completo</Text>
            <Text style={styles.cardDescription}>
              Incluye todos los productos, cantidades, precios y notas de cada pedido.
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={generateDetailedPDF}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <IconSymbol
                    ios_icon_name="doc.text.fill"
                    android_material_icon_name="article"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.buttonText}>Generar PDF Detallado</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Resumen Estadístico</Text>
            <Text style={styles.cardDescription}>
              Estadísticas generales, pedidos por estado y top clientes.
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={generateSummaryPDF}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <IconSymbol
                    ios_icon_name="chart.bar.doc.horizontal"
                    android_material_icon_name="bar_chart"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.buttonText}>Generar Resumen</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Start Date Picker Modal - iOS uses Modal, Android uses native picker */}
      {Platform.OS === 'ios' && showStartDatePicker && (
        <Modal
          visible={showStartDatePicker}
          transparent
          animationType="fade"
          onRequestClose={cancelStartDate}
        >
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>Fecha Inicio</Text>
              </View>
              <DateTimePicker
                value={filters.startDate || defaultDates.startOfMonth}
                mode="date"
                display="spinner"
                onChange={handleStartDateChange}
                maximumDate={new Date()}
                textColor={colors.text}
              />
              <View style={styles.datePickerButtons}>
                <TouchableOpacity
                  style={[styles.datePickerButton, styles.datePickerButtonCancel]}
                  onPress={cancelStartDate}
                >
                  <Text style={[styles.datePickerButtonText, styles.datePickerButtonTextCancel]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.datePickerButton, styles.datePickerButtonConfirm]}
                  onPress={confirmStartDate}
                >
                  <Text style={[styles.datePickerButtonText, styles.datePickerButtonTextConfirm]}>
                    Confirmar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Android Start Date Picker */}
      {Platform.OS === 'android' && showStartDatePicker && (
        <DateTimePicker
          value={filters.startDate || defaultDates.startOfMonth}
          mode="date"
          display="default"
          onChange={handleStartDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* End Date Picker Modal - iOS uses Modal, Android uses native picker */}
      {Platform.OS === 'ios' && showEndDatePicker && (
        <Modal
          visible={showEndDatePicker}
          transparent
          animationType="fade"
          onRequestClose={cancelEndDate}
        >
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>Fecha Fin</Text>
              </View>
              <DateTimePicker
                value={filters.endDate || defaultDates.endOfMonth}
                mode="date"
                display="spinner"
                onChange={handleEndDateChange}
                maximumDate={new Date()}
                minimumDate={filters.startDate || defaultDates.startOfMonth}
                textColor={colors.text}
              />
              <View style={styles.datePickerButtons}>
                <TouchableOpacity
                  style={[styles.datePickerButton, styles.datePickerButtonCancel]}
                  onPress={cancelEndDate}
                >
                  <Text style={[styles.datePickerButtonText, styles.datePickerButtonTextCancel]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.datePickerButton, styles.datePickerButtonConfirm]}
                  onPress={confirmEndDate}
                >
                  <Text style={[styles.datePickerButtonText, styles.datePickerButtonTextConfirm]}>
                    Confirmar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Android End Date Picker */}
      {Platform.OS === 'android' && showEndDatePicker && (
        <DateTimePicker
          value={filters.endDate || defaultDates.endOfMonth}
          mode="date"
          display="default"
          onChange={handleEndDateChange}
          maximumDate={new Date()}
          minimumDate={filters.startDate || defaultDates.startOfMonth}
        />
      )}

      {/* Customer Selection Modal */}
      <Modal
        visible={showCustomerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCustomerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Cliente</Text>
              <TouchableOpacity onPress={() => setShowCustomerModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
            <FlatList
              data={[{ id: 'all', name: 'Todos los clientes' } as Customer, ...customers]}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    if (item.id === 'all') {
                      setFilters({ ...filters, customerId: undefined, customerName: undefined });
                      setShowCustomerModal(false);
                    } else {
                      selectCustomer(item);
                    }
                  }}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  {item.phone && (
                    <Text style={styles.modalItemSubtext}>{item.phone}</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Status Selection Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Estado</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
            <FlatList
              data={STATUS_OPTIONS}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => selectStatus(item.value)}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <CustomDialog
        visible={dialog.visible}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        buttons={dialog.buttons}
        onClose={closeDialog}
      />
    </>
  );
}
