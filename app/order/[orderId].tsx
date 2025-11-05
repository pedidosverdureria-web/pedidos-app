
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { 
  sendOrderStatusUpdate, 
  sendProductAddedNotification, 
  sendProductRemovedNotification,
  sendOrderDeletedNotification,
  sendQueryResponse,
  sendQueryConfirmation
} from '@/utils/whatsappNotifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabase } from '@/lib/supabase';
import { usePrinter } from '@/hooks/usePrinter';
import { generateReceiptText, generateQueryReceiptText, PrinterConfig } from '@/utils/receiptGenerator';
import { IconSymbol } from '@/components/IconSymbol';
import * as Haptics from 'expo-haptics';
import { Order, OrderStatus, OrderItem, OrderQuery, Customer } from '@/types';
import React, { useState, useEffect, useCallback } from 'react';
import { createInAppNotification, sendLocalNotification } from '@/utils/pushNotifications';
import { colors } from '@/styles/commonStyles';
import { parseWhatsAppMessage, ParsedOrderItem } from '@/utils/whatsappParser';

const PRINTER_CONFIG_KEY = '@printer_config';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  currentStatusContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  currentStatusLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  currentStatusBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentStatusText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusTransitionsLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
  editButton: {
    backgroundColor: '#F59E0B',
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
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyHistoryIcon: {
    marginBottom: 12,
  },
  emptyHistoryText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
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
  customerSelectionContainer: {
    marginBottom: 16,
  },
  customerSelectionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  customerSelectionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  customerSelectionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  customerSelectionButtonInactive: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  customerSelectionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  customerSelectionButtonTextActive: {
    color: '#fff',
  },
  customerSelectionButtonTextInactive: {
    color: colors.text,
  },
  customerListContainer: {
    maxHeight: 200,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  customerListItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  customerListItemLast: {
    borderBottomWidth: 0,
  },
  customerListItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  customerListItemDetails: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyCustomerList: {
    padding: 20,
    alignItems: 'center',
  },
  emptyCustomerListText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  searchInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
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
});

function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return '#F59E0B';
    case 'preparing':
      return '#3B82F6';
    case 'ready':
      return '#10B981';
    case 'delivered':
      return '#6B7280';
    case 'cancelled':
      return '#EF4444';
    case 'pending_payment':
      return '#8B5CF6';
    case 'paid':
      return '#10B981';
    default:
      return '#6B7280';
  }
}

function getStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'preparing':
      return 'Preparando';
    case 'ready':
      return 'Listo';
    case 'delivered':
      return 'Entregado';
    case 'cancelled':
      return 'Cancelado';
    case 'pending_payment':
      return 'Pendiente de Pago';
    case 'paid':
      return 'Pagado';
    default:
      return status;
  }
}

function getStatusIcon(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'clock';
    case 'preparing':
      return 'flame';
    case 'ready':
      return 'checkmark.circle';
    case 'delivered':
      return 'shippingbox';
    case 'cancelled':
      return 'xmark.circle';
    case 'pending_payment':
      return 'creditcard';
    case 'paid':
      return 'checkmark.circle.fill';
    default:
      return 'circle';
  }
}

function getAvailableStatusTransitions(currentStatus: OrderStatus): OrderStatus[] {
  switch (currentStatus) {
    case 'pending':
      return ['preparing', 'cancelled'];
    case 'preparing':
      return ['ready', 'cancelled'];
    case 'ready':
      return ['delivered', 'pending_payment', 'cancelled'];
    case 'delivered':
      return [];
    case 'pending_payment':
      return [];
    case 'paid':
      return [];
    case 'cancelled':
      return [];
    default:
      return [];
  }
}

function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);
}

function getUnitFromNotes(notes: string | null | undefined): string {
  if (!notes) return '';
  const lowerNotes = notes.toLowerCase();
  
  // Extract unit from "Unidad: xxx" format
  const unitMatch = lowerNotes.match(/unidad:\s*(\w+)/);
  if (unitMatch) {
    return unitMatch[1];
  }
  
  // Fallback to old detection method
  if (lowerNotes.includes('kg') || lowerNotes.includes('kilo')) return 'kg';
  if (lowerNotes.includes('gr') || lowerNotes.includes('gramo')) return 'gr';
  if (lowerNotes.includes('lt') || lowerNotes.includes('litro')) return 'lt';
  if (lowerNotes.includes('ml')) return 'ml';
  if (lowerNotes.includes('un') || lowerNotes.includes('unidad')) return 'un';
  return '';
}

function formatProductDisplay(item: OrderItem): string {
  const unit = getUnitFromNotes(item.notes);
  
  // Handle unparseable items with "#" quantity
  if (item.quantity === '#') {
    return `# ${item.product_name} ⚠️`;
  }
  
  // Convert quantity to number for comparison
  const quantityNum = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;
  
  // Determine the unit text
  let unitText = '';
  if (unit === 'kg' || unit === 'kilo' || unit === 'kilos') {
    unitText = quantityNum === 1 ? 'kilo' : 'kilos';
  } else if (unit === 'gr' || unit === 'gramo' || unit === 'gramos') {
    unitText = quantityNum === 1 ? 'gramo' : 'gramos';
  } else if (unit === 'lt' || unit === 'litro' || unit === 'litros') {
    unitText = quantityNum === 1 ? 'litro' : 'litros';
  } else if (unit === 'ml') {
    unitText = 'ml';
  } else if (unit === 'un' || unit === 'unidad' || unit === 'unidades') {
    unitText = quantityNum === 1 ? 'unidad' : 'unidades';
  } else if (unit) {
    // For any other unit (like malla, docena, etc.), use it directly
    // Check if it needs pluralization
    if (quantityNum === 1) {
      unitText = unit;
    } else {
      // Simple pluralization: add 's' if doesn't end with 's'
      unitText = unit.endsWith('s') ? unit : unit + 's';
    }
  } else {
    unitText = quantityNum === 1 ? 'unidad' : 'unidades';
  }
  
  return `${item.quantity} ${unitText} de ${item.product_name}`;
}

function getAdditionalNotes(notes: string | null | undefined): string {
  if (!notes) return '';
  
  // Remove the "Unidad: xxx" part from notes
  const cleanNotes = notes.replace(/unidad:\s*\w+/gi, '').trim();
  
  return cleanNotes;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(dateString: string): string {
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

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { user } = useAuth();
  const { printReceipt, isConnected } = usePrinter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [customerBlocked, setCustomerBlocked] = useState(false);

  // Customer info editing
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [customerInputMode, setCustomerInputMode] = useState<'manual' | 'select'>('manual');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [availableCustomers, setAvailableCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Product editing
  const [editingProduct, setEditingProduct] = useState<OrderItem | null>(null);
  const [productName, setProductName] = useState('');
  const [productQuantity, setProductQuantity] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productNotes, setProductNotes] = useState('');

  // Bulk price modal
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [bulkPrices, setBulkPrices] = useState<{ [key: string]: string }>({});

  // WhatsApp-style product addition modal
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [whatsappInput, setWhatsappInput] = useState('');
  const [parsedProducts, setParsedProducts] = useState<ParsedOrderItem[]>([]);

  // Query response modal
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<OrderQuery | null>(null);
  const [responseText, setResponseText] = useState('');
  const [sendingResponse, setSendingResponse] = useState(false);

  // Send query to customer
  const [newQueryText, setNewQueryText] = useState('');
  const [sendingQuery, setSendingQuery] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*), queries:order_queries(*)')
        .eq('id', orderId)
        .single();

      if (error) throw error;

      setOrder(data);
      setCustomerName(data.customer_name);
      setCustomerPhone(data.customer_phone || '');
      setCustomerAddress(data.customer_address || '');

      // Check if customer is blocked
      if (data.customer_phone) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('blocked')
          .eq('phone', data.customer_phone)
          .maybeSingle();
        
        setCustomerBlocked(customerData?.blocked || false);
      }
    } catch (error) {
      console.error('[OrderDetail] Error loading order:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error',
        'No se pudo cargar el pedido. Por favor intenta nuevamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const loadPrinterConfig = useCallback(async () => {
    try {
      console.log('[OrderDetail] Loading printer config...');
      const configStr = await AsyncStorage.getItem(PRINTER_CONFIG_KEY);
      if (configStr) {
        const config = JSON.parse(configStr);
        setPrinterConfig(config);
        console.log('[OrderDetail] Printer config loaded:', {
          encoding: config.encoding,
          text_size: config.text_size,
          paper_size: config.paper_size,
          include_logo: config.include_logo,
          include_customer_info: config.include_customer_info,
          include_totals: config.include_totals,
        });
      } else {
        console.log('[OrderDetail] No printer config found');
      }
    } catch (error) {
      console.error('[OrderDetail] Error loading printer config:', error);
    }
  }, []);

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
      console.error('[OrderDetail] Error loading customers:', error);
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  useEffect(() => {
    loadOrder();
    loadPrinterConfig();
  }, [loadOrder, loadPrinterConfig]);

  useEffect(() => {
    if (editingCustomer && customerInputMode === 'select') {
      loadCustomers();
    }
  }, [editingCustomer, customerInputMode, loadCustomers]);

  // Parse WhatsApp input in real-time
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
      await loadOrder();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Éxito',
        'La información del cliente se actualizó correctamente',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[OrderDetail] Error updating customer:', error);
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

  const updateStatus = async (newStatus: OrderStatus) => {
    if (!order) return;

    console.log('[OrderDetail] ========== UPDATING STATUS ==========');
    console.log('[OrderDetail] Order ID:', order.id);
    console.log('[OrderDetail] Current status:', order.status);
    console.log('[OrderDetail] New status:', newStatus);
    console.log('[OrderDetail] Current customer_id:', order.customer_id);
    console.log('[OrderDetail] Customer name:', order.customer_name);
    console.log('[OrderDetail] Customer phone:', order.customer_phone);
    
    try {
      setUpdatingStatus(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const supabase = getSupabase();
      
      // If changing to pending_payment, create or link customer
      let customerId = order.customer_id;
      
      if (newStatus === 'pending_payment') {
        console.log('[OrderDetail] Processing pending_payment status change');
        
        // Validate that we have customer information
        if (!order.customer_name || !order.customer_name.trim()) {
          console.error('[OrderDetail] Cannot create customer: missing customer name');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert(
            '❌ Error',
            'No se puede cambiar a "Pendiente de Pago" sin un nombre de cliente. Por favor edita la información del cliente primero.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        if (!customerId) {
          console.log('[OrderDetail] No customer_id, checking for existing customer');
          
          // Check if customer already exists by phone (if available)
          if (order.customer_phone && order.customer_phone.trim()) {
            console.log('[OrderDetail] Searching for customer by phone:', order.customer_phone);
            const { data: existingCustomer, error: searchError } = await supabase
              .from('customers')
              .select('id')
              .eq('phone', order.customer_phone)
              .maybeSingle();
            
            if (searchError) {
              console.error('[OrderDetail] Error searching for customer:', searchError);
            } else if (existingCustomer) {
              console.log('[OrderDetail] Found existing customer by phone:', existingCustomer.id);
              customerId = existingCustomer.id;
            }
          }
          
          // If still no customer, search by name
          if (!customerId) {
            console.log('[OrderDetail] Searching for customer by name:', order.customer_name);
            const { data: existingCustomer, error: searchError } = await supabase
              .from('customers')
              .select('id')
              .eq('name', order.customer_name)
              .maybeSingle();
            
            if (searchError) {
              console.error('[OrderDetail] Error searching for customer by name:', searchError);
            } else if (existingCustomer) {
              console.log('[OrderDetail] Found existing customer by name:', existingCustomer.id);
              customerId = existingCustomer.id;
            }
          }
          
          // If customer doesn't exist, create new one
          if (!customerId) {
            console.log('[OrderDetail] Creating new customer with data:', {
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
              })
              .select()
              .single();
            
            if (customerError) {
              console.error('[OrderDetail] Error creating customer:', customerError);
              console.error('[OrderDetail] Error details:', JSON.stringify(customerError, null, 2));
              throw new Error(`No se pudo crear el cliente: ${customerError.message}`);
            }
            
            if (!newCustomer) {
              console.error('[OrderDetail] Customer creation returned no data');
              throw new Error('No se pudo crear el cliente: no se recibieron datos');
            }
            
            console.log('[OrderDetail] Successfully created new customer:', newCustomer.id);
            customerId = newCustomer.id;
          }
        } else {
          console.log('[OrderDetail] Using existing customer_id:', customerId);
        }
      }
      
      // Update order status and customer_id
      console.log('[OrderDetail] Updating order with:', {
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
        console.error('[OrderDetail] Error updating order:', updateError);
        console.error('[OrderDetail] Update error details:', JSON.stringify(updateError, null, 2));
        throw new Error(`No se pudo actualizar el pedido: ${updateError.message}`);
      }

      console.log('[OrderDetail] Order updated successfully');

      // Send WhatsApp notification
      try {
        console.log('[OrderDetail] Sending WhatsApp notification');
        await sendOrderStatusUpdate(order.id, newStatus);
        console.log('[OrderDetail] WhatsApp notification sent');
      } catch (whatsappError) {
        console.error('[OrderDetail] Error sending WhatsApp notification:', whatsappError);
        // Don't throw - notification failure shouldn't block status update
      }

      // Create in-app notification
      try {
        console.log('[OrderDetail] Creating in-app notification');
        await createInAppNotification(
          user?.id || '',
          'order_status_changed',
          `Pedido ${order.order_number} cambió a ${getStatusLabel(newStatus)}`,
          { orderId: order.id }
        );
        console.log('[OrderDetail] In-app notification created');
      } catch (notifError) {
        console.error('[OrderDetail] Error creating notification:', notifError);
        // Don't throw - notification failure shouldn't block status update
      }

      // Reload order to get updated data
      console.log('[OrderDetail] Reloading order data');
      await loadOrder();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      if (newStatus === 'pending_payment') {
        console.log('[OrderDetail] Status change complete - showing success message');
        Alert.alert(
          '✅ Estado Actualizado',
          `El pedido ahora está en estado: ${getStatusLabel(newStatus)}\n\nEl cliente ha sido ${customerId === order.customer_id ? 'vinculado' : 'creado'} y puede realizar pagos parciales desde el menú de Clientes.`,
          [{ 
            text: 'OK',
            onPress: () => {
              console.log('[OrderDetail] User acknowledged status change');
            }
          }]
        );
      } else {
        Alert.alert(
          '✅ Estado Actualizado',
          `El pedido ahora está en estado: ${getStatusLabel(newStatus)}`,
          [{ text: 'OK' }]
        );
      }
      
      console.log('[OrderDetail] ========== STATUS UPDATE COMPLETE ==========');
    } catch (error) {
      console.error('[OrderDetail] ========== STATUS UPDATE FAILED ==========');
      console.error('[OrderDetail] Error updating status:', error);
      console.error('[OrderDetail] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error',
        `No se pudo actualizar el estado del pedido.\n\n${error instanceof Error ? error.message : 'Por favor intenta nuevamente.'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openAddProductModal = () => {
    setWhatsappInput('');
    setParsedProducts([]);
    setShowAddProductModal(true);
  };

  const addProductsFromWhatsApp = async () => {
    if (!order || parsedProducts.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('⚠️ Atención', 'Por favor ingresa al menos un producto válido');
      return;
    }

    try {
      const supabase = getSupabase();
      
      // Add all parsed products to the order
      for (const parsedItem of parsedProducts) {
        const notes = `Unidad: ${parsedItem.unit}`;
        
        await supabase
          .from('order_items')
          .insert({
            order_id: order.id,
            product_name: parsedItem.product,
            quantity: parsedItem.quantity,
            unit_price: 0, // Default price is 0
            notes: notes,
          });
      }

      setShowAddProductModal(false);
      setWhatsappInput('');
      setParsedProducts([]);
      await loadOrder();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Productos Agregados',
        `Se agregaron ${parsedProducts.length} producto(s) al pedido`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[OrderDetail] Error adding products:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error',
        'No se pudieron agregar los productos. Por favor intenta nuevamente.',
        [{ text: 'OK' }]
      );
    }
  };

  const updateProduct = async (itemId: string) => {
    if (!productName || !productQuantity) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('⚠️ Atención', 'Por favor completa el nombre y la cantidad del producto');
      return;
    }

    try {
      const supabase = getSupabase();
      
      // Handle "#" quantity or numeric quantity
      let quantityValue: string | number;
      if (productQuantity.trim() === '#') {
        quantityValue = '#';
      } else {
        const parsed = parseFloat(productQuantity);
        if (isNaN(parsed) || parsed <= 0) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Alert.alert('⚠️ Atención', 'La cantidad debe ser un número válido mayor a 0 o "#"');
          return;
        }
        quantityValue = parsed;
      }
      
      const { error } = await supabase
        .from('order_items')
        .update({
          product_name: productName,
          quantity: quantityValue,
          unit_price: parseFloat(productPrice) || 0,
          notes: productNotes,
        })
        .eq('id', itemId);

      if (error) throw error;

      setEditingProduct(null);
      await loadOrder();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Producto Actualizado',
        'Los cambios se guardaron correctamente',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[OrderDetail] Error updating product:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error',
        'No se pudo actualizar el producto. Por favor intenta nuevamente.',
        [{ text: 'OK' }]
      );
    }
  };

  const deleteProduct = async (itemId: string) => {
    if (!order) return;

    const item = order.items?.find(i => i.id === itemId);
    if (!item) return;

    Alert.alert(
      '🗑️ Eliminar Producto',
      `¿Estás seguro de que deseas eliminar "${item.product_name}" del pedido?`,
      [
        { 
          text: 'Cancelar', 
          style: 'cancel',
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const supabase = getSupabase();
              const { error } = await supabase
                .from('order_items')
                .delete()
                .eq('id', itemId);

              if (error) throw error;

              await sendProductRemovedNotification(order.id, item);
              await loadOrder();
              
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(
                '✅ Producto Eliminado',
                `${item.product_name} se eliminó del pedido`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('[OrderDetail] Error deleting product:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert(
                '❌ Error',
                'No se pudo eliminar el producto. Por favor intenta nuevamente.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const startEditingProduct = (item: OrderItem) => {
    setEditingProduct(item);
    setProductName(item.product_name);
    setProductQuantity(item.quantity.toString());
    setProductPrice(item.unit_price.toString());
    setProductNotes(item.notes || '');
  };

  const openPriceModal = () => {
    // Initialize bulk prices with current prices
    const initialPrices: { [key: string]: string } = {};
    order?.items?.forEach(item => {
      initialPrices[item.id] = item.unit_price.toString();
    });
    setBulkPrices(initialPrices);
    setShowPriceModal(true);
  };

  const updateBulkPrice = (itemId: string, price: string) => {
    setBulkPrices(prev => ({
      ...prev,
      [itemId]: price,
    }));
  };

  const applyBulkPrices = async () => {
    if (!order) return;

    try {
      const supabase = getSupabase();
      
      // Update each product with its individual price
      for (const item of order.items || []) {
        const priceStr = bulkPrices[item.id];
        if (priceStr) {
          const price = parseFloat(priceStr);
          if (!isNaN(price)) {
            await supabase
              .from('order_items')
              .update({ unit_price: price })
              .eq('id', item.id);
          }
        }
      }

      setShowPriceModal(false);
      await loadOrder();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Precios Actualizados',
        'Los precios de los productos se actualizaron correctamente',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[OrderDetail] Error applying prices:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error',
        'No se pudieron actualizar los precios. Por favor intenta nuevamente.',
        [{ text: 'OK' }]
      );
    }
  };

  const handlePrint = async () => {
    if (!order) return;

    if (!isConnected) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        '⚠️ Impresora No Conectada',
        'Por favor conecta una impresora antes de imprimir',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      console.log('[OrderDetail] Printing with config:', printerConfig);
      
      // Use the centralized receipt generator with the full printer config
      const receiptText = generateReceiptText(order, printerConfig || undefined);
      const autoCut = printerConfig?.auto_cut_enabled ?? true;
      const textSize = printerConfig?.text_size || 'medium';
      const encoding = printerConfig?.encoding || 'CP850';

      console.log('[OrderDetail] Printing with settings:', {
        autoCut,
        textSize,
        encoding,
        paper_size: printerConfig?.paper_size,
        include_logo: printerConfig?.include_logo,
        include_customer_info: printerConfig?.include_customer_info,
        include_totals: printerConfig?.include_totals,
      });

      await printReceipt(receiptText, autoCut, textSize, encoding);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Impresión Exitosa',
        'El pedido se imprimió correctamente',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[OrderDetail] Print error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error de Impresión',
        'No se pudo imprimir el pedido. Verifica la conexión con la impresora.',
        [{ text: 'OK' }]
      );
    }
  };

  const handlePrintQuery = async (query: OrderQuery) => {
    if (!order) return;

    if (!isConnected) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        '⚠️ Impresora No Conectada',
        'Por favor conecta una impresora antes de imprimir',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      console.log('[OrderDetail] Printing query receipt');
      
      const receiptText = generateQueryReceiptText(order, query.query_text, printerConfig || undefined);
      const autoCut = printerConfig?.auto_cut_enabled ?? true;
      const textSize = printerConfig?.text_size || 'medium';
      const encoding = printerConfig?.encoding || 'CP850';

      await printReceipt(receiptText, autoCut, textSize, encoding);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Consulta Impresa',
        'La consulta se imprimió correctamente',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[OrderDetail] Print query error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error de Impresión',
        'No se pudo imprimir la consulta. Verifica la conexión con la impresora.',
        [{ text: 'OK' }]
      );
    }
  };

  const openResponseModal = (query: OrderQuery) => {
    setSelectedQuery(query);
    setResponseText('');
    setShowResponseModal(true);
  };

  const handleSendResponse = async () => {
    if (!order || !selectedQuery || !responseText.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('⚠️ Atención', 'Por favor ingresa una respuesta');
      return;
    }

    try {
      setSendingResponse(true);
      
      await sendQueryResponse(
        order.id,
        order.customer_name,
        order.order_number,
        selectedQuery.query_text,
        responseText
      );

      setShowResponseModal(false);
      setSelectedQuery(null);
      setResponseText('');
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Respuesta Enviada',
        'La respuesta se envió correctamente al cliente por WhatsApp',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[OrderDetail] Error sending response:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error',
        'No se pudo enviar la respuesta. Verifica la configuración de WhatsApp.',
        [{ text: 'OK' }]
      );
    } finally {
      setSendingResponse(false);
    }
  };

  const handleSendQuery = async () => {
    if (!order || !newQueryText.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('⚠️ Atención', 'Por favor ingresa una consulta');
      return;
    }

    if (!order.customer_phone) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('⚠️ Atención', 'Este pedido no tiene un número de teléfono asociado');
      return;
    }

    try {
      setSendingQuery(true);
      const supabase = getSupabase();

      // Save query to database with direction='outgoing'
      const { data: queryData, error: queryError } = await supabase
        .from('order_queries')
        .insert({
          order_id: order.id,
          customer_phone: order.customer_phone,
          query_text: newQueryText,
          direction: 'outgoing', // Mark as outgoing message from business
        })
        .select()
        .single();

      if (queryError) throw queryError;

      // Send query via WhatsApp
      await sendQueryConfirmation(
        order.customer_phone,
        order.customer_name,
        order.order_number,
        newQueryText
      );

      // Auto-print the query if auto-print is enabled
      if (printerConfig?.auto_print_enabled && isConnected) {
        console.log('[OrderDetail] Auto-printing query');
        try {
          const receiptText = generateQueryReceiptText(order, newQueryText, printerConfig);
          const autoCut = printerConfig?.auto_cut_enabled ?? true;
          const textSize = printerConfig?.text_size || 'medium';
          const encoding = printerConfig?.encoding || 'CP850';

          await printReceipt(receiptText, autoCut, textSize, encoding);
          console.log('[OrderDetail] Query auto-printed successfully');
        } catch (printError) {
          console.error('[OrderDetail] Error auto-printing query:', printError);
        }
      }

      setNewQueryText('');
      await loadOrder();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Consulta Enviada',
        'La consulta se envió correctamente al cliente por WhatsApp y se imprimió automáticamente',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[OrderDetail] Error sending query:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error',
        'No se pudo enviar la consulta. Verifica la configuración de WhatsApp.',
        [{ text: 'OK' }]
      );
    } finally {
      setSendingQuery(false);
    }
  };

  const handleWhatsApp = async () => {
    if (!order?.customer_phone) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        '⚠️ Sin Número de Teléfono',
        'Este pedido no tiene un número de teléfono asociado',
        [{ text: 'OK' }]
      );
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
      Alert.alert(
        '❌ Error',
        'No se pudo abrir WhatsApp. Verifica que esté instalado en tu dispositivo.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDelete = () => {
    if (!order) return;

    // Build a detailed message about what will happen
    let deleteMessage = `¿Estás seguro de que deseas eliminar el pedido ${order.order_number}?\n\nEsta acción no se puede deshacer.`;
    
    // If order has a customer and is in pending_payment status, inform about account updates
    if (order.customer_id && order.status === 'pending_payment') {
      deleteMessage += `\n\n⚠️ Este pedido está vinculado a un cliente y en estado "Pendiente de Pago". Al eliminarlo:\n\n- Se restará ${formatCLP(order.total_amount)} de la deuda del cliente\n- Se actualizarán automáticamente los totales de la cuenta`;
    }

    Alert.alert(
      '🗑️ Eliminar Pedido',
      deleteMessage,
      [
        { 
          text: 'Cancelar', 
          style: 'cancel',
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[OrderDetail] ========== DELETING ORDER ==========');
              console.log('[OrderDetail] Order ID:', order.id);
              console.log('[OrderDetail] Order Number:', order.order_number);
              console.log('[OrderDetail] Customer ID:', order.customer_id);
              console.log('[OrderDetail] Order Status:', order.status);
              console.log('[OrderDetail] Order Total:', order.total_amount);
              
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              const supabase = getSupabase();
              
              // Delete the order - CASCADE will handle related records
              // The database trigger will automatically update customer totals
              console.log('[OrderDetail] Deleting order (CASCADE will handle related records)...');
              const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', order.id);

              if (error) {
                console.error('[OrderDetail] Error deleting order:', error);
                throw error;
              }

              console.log('[OrderDetail] Order deleted successfully');
              console.log('[OrderDetail] Database trigger will update customer totals automatically');

              // Send WhatsApp notification
              try {
                console.log('[OrderDetail] Sending deletion notification...');
                await sendOrderDeletedNotification(order.id);
                console.log('[OrderDetail] Deletion notification sent');
              } catch (notifError) {
                console.error('[OrderDetail] Error sending notification:', notifError);
                // Don't throw - notification failure shouldn't block deletion
              }

              console.log('[OrderDetail] ========== ORDER DELETION COMPLETE ==========');

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              
              let successMessage = `El pedido ${order.order_number} se eliminó correctamente`;
              if (order.customer_id && order.status === 'pending_payment') {
                successMessage += `\n\nLos totales de la cuenta del cliente se actualizaron automáticamente`;
              }
              
              Alert.alert(
                '✅ Pedido Eliminado',
                successMessage,
                [{ 
                  text: 'OK',
                  onPress: () => router.back()
                }]
              );
            } catch (error) {
              console.error('[OrderDetail] ========== ORDER DELETION FAILED ==========');
              console.error('[OrderDetail] Error deleting order:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert(
                '❌ Error',
                'No se pudo eliminar el pedido. Por favor intenta nuevamente.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const handleBlockCustomer = () => {
    if (!order?.customer_phone) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        '⚠️ Sin Número de Teléfono',
        'Este pedido no tiene un número de teléfono asociado para bloquear',
        [{ text: 'OK' }]
      );
      return;
    }

    // First confirmation
    Alert.alert(
      '⚠️ Bloquear Cliente - Confirmación 1/2',
      `¿Estás seguro de que deseas bloquear a ${order.customer_name}?\n\nEl cliente no podrá enviar pedidos ni mensajes por WhatsApp mientras esté bloqueado.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        },
        {
          text: 'Continuar',
          style: 'destructive',
          onPress: () => {
            // Second confirmation
            Alert.alert(
              '🚫 Bloquear Cliente - Confirmación 2/2',
              `Esta es tu última oportunidad para cancelar.\n\n¿Realmente deseas bloquear a ${order.customer_name}?`,
              [
                {
                  text: 'Cancelar',
                  style: 'cancel',
                  onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                },
                {
                  text: 'Bloquear',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                      const supabase = getSupabase();

                      // Find or create customer
                      let customerId = order.customer_id;

                      if (!customerId) {
                        // Search for customer by phone
                        const { data: existingCustomer } = await supabase
                          .from('customers')
                          .select('id')
                          .eq('phone', order.customer_phone)
                          .maybeSingle();

                        if (existingCustomer) {
                          customerId = existingCustomer.id;
                        } else {
                          // Create customer if doesn't exist
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

                      // Block the customer
                      const { error } = await supabase
                        .from('customers')
                        .update({ blocked: true })
                        .eq('id', customerId);

                      if (error) throw error;

                      // Update order with customer_id if it wasn't set
                      if (!order.customer_id) {
                        await supabase
                          .from('orders')
                          .update({ customer_id: customerId })
                          .eq('id', order.id);
                      }

                      setCustomerBlocked(true);
                      await loadOrder();

                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      Alert.alert(
                        '✅ Cliente Bloqueado',
                        `${order.customer_name} ha sido bloqueado correctamente.\n\nNo podrá enviar pedidos ni mensajes por WhatsApp.`,
                        [{ text: 'OK' }]
                      );
                    } catch (error) {
                      console.error('[OrderDetail] Error blocking customer:', error);
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                      Alert.alert(
                        '❌ Error',
                        'No se pudo bloquear al cliente. Por favor intenta nuevamente.',
                        [{ text: 'OK' }]
                      );
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleUnblockCustomer = async () => {
    if (!order?.customer_phone) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        '⚠️ Sin Número de Teléfono',
        'Este pedido no tiene un número de teléfono asociado',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      '✅ Desbloquear Cliente',
      `¿Estás seguro de que deseas desbloquear a ${order.customer_name}?\n\nEl cliente podrá volver a enviar pedidos y mensajes por WhatsApp.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        },
        {
          text: 'Desbloquear',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const supabase = getSupabase();

              // Find customer by phone
              const { data: customer } = await supabase
                .from('customers')
                .select('id')
                .eq('phone', order.customer_phone)
                .maybeSingle();

              if (!customer) {
                Alert.alert('❌ Error', 'No se encontró el cliente');
                return;
              }

              // Unblock the customer
              const { error } = await supabase
                .from('customers')
                .update({ blocked: false })
                .eq('id', customer.id);

              if (error) throw error;

              setCustomerBlocked(false);
              await loadOrder();

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(
                '✅ Cliente Desbloqueado',
                `${order.customer_name} ha sido desbloqueado correctamente.\n\nPodrá volver a enviar pedidos y mensajes por WhatsApp.`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('[OrderDetail] Error unblocking customer:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert(
                '❌ Error',
                'No se pudo desbloquear al cliente. Por favor intenta nuevamente.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

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
  const availableTransitions = getAvailableStatusTransitions(order.status);
  
  // Sort queries by date (oldest first for timeline view)
  const sortedQueries = order.queries 
    ? [...order.queries].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : [];

  // Filter customers based on search query
  const filteredCustomers = availableCustomers.filter(customer => 
    customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    (customer.phone && customer.phone.includes(customerSearchQuery))
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Detalle del Pedido',
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
        }}
      />
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.orderNumber}>{order.order_number}</Text>
          <Text style={styles.orderDate}>📅 {formatDate(order.created_at)}</Text>
          
          {/* Current Status Display */}
          <View style={styles.currentStatusContainer}>
            <Text style={styles.currentStatusLabel}>ESTADO ACTUAL</Text>
            <View style={[
              styles.currentStatusBadge,
              { backgroundColor: getStatusColor(order.status) }
            ]}>
              <IconSymbol 
                name={getStatusIcon(order.status)} 
                size={20} 
                color="#fff" 
              />
              <Text style={styles.currentStatusText}>
                {getStatusLabel(order.status)}
              </Text>
            </View>
          </View>
          
          {/* Status Transitions */}
          {availableTransitions.length > 0 && (
            <>
              <Text style={styles.statusTransitionsLabel}>Cambiar estado a:</Text>
              <View style={styles.statusContainer}>
                {availableTransitions.map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusButton,
                      { borderColor: getStatusColor(status) },
                      updatingStatus && { opacity: 0.5 }
                    ]}
                    onPress={() => updateStatus(status)}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? (
                      <ActivityIndicator size="small" color={getStatusColor(status)} />
                    ) : (
                      <>
                        <IconSymbol 
                          name={getStatusIcon(status)} 
                          size={16} 
                          color={getStatusColor(status)} 
                        />
                        <Text
                          style={[
                            styles.statusButtonText,
                            { color: getStatusColor(status) },
                          ]}
                        >
                          {getStatusLabel(status)}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          {editingCustomer ? (
            <>
              {/* Only show customer selection for manual orders */}
              {order.source === 'manual' && (
                <View style={styles.customerSelectionContainer}>
                  <View style={styles.customerSelectionButtons}>
                    <TouchableOpacity
                      style={[
                        styles.customerSelectionButton,
                        customerInputMode === 'manual' 
                          ? styles.customerSelectionButtonActive 
                          : styles.customerSelectionButtonInactive
                      ]}
                      onPress={() => {
                        setCustomerInputMode('manual');
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={[
                        styles.customerSelectionButtonText,
                        customerInputMode === 'manual'
                          ? styles.customerSelectionButtonTextActive
                          : styles.customerSelectionButtonTextInactive
                      ]}>
                        Ingresar Manualmente
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.customerSelectionButton,
                        customerInputMode === 'select' 
                          ? styles.customerSelectionButtonActive 
                          : styles.customerSelectionButtonInactive
                      ]}
                      onPress={() => {
                        setCustomerInputMode('select');
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={[
                        styles.customerSelectionButtonText,
                        customerInputMode === 'select'
                          ? styles.customerSelectionButtonTextActive
                          : styles.customerSelectionButtonTextInactive
                      ]}>
                        Seleccionar Cliente
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {customerInputMode === 'select' && (
                    <>
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar cliente..."
                        placeholderTextColor={colors.textSecondary}
                        value={customerSearchQuery}
                        onChangeText={setCustomerSearchQuery}
                      />
                      
                      {loadingCustomers ? (
                        <View style={styles.emptyCustomerList}>
                          <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                      ) : filteredCustomers.length > 0 ? (
                        <FlatList
                          data={filteredCustomers}
                          keyExtractor={(item) => item.id}
                          style={styles.customerListContainer}
                          renderItem={({ item, index }) => (
                            <TouchableOpacity
                              style={[
                                styles.customerListItem,
                                index === filteredCustomers.length - 1 && styles.customerListItemLast
                              ]}
                              onPress={() => selectCustomer(item)}
                            >
                              <Text style={styles.customerListItemName}>{item.name}</Text>
                              {item.phone && (
                                <Text style={styles.customerListItemDetails}>📞 {item.phone}</Text>
                              )}
                              {item.address && (
                                <Text style={styles.customerListItemDetails}>📍 {item.address}</Text>
                              )}
                            </TouchableOpacity>
                          )}
                        />
                      ) : (
                        <View style={styles.emptyCustomerList}>
                          <Text style={styles.emptyCustomerListText}>
                            {customerSearchQuery 
                              ? 'No se encontraron clientes con ese criterio'
                              : 'No hay clientes registrados'}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              )}

              <TextInput
                style={styles.input}
                placeholder="Nombre"
                value={customerName}
                onChangeText={setCustomerName}
              />
              <TextInput
                style={styles.input}
                placeholder="Teléfono"
                value={customerPhone}
                onChangeText={setCustomerPhone}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Dirección"
                value={customerAddress}
                onChangeText={setCustomerAddress}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={updateCustomerInfo}
              >
                <IconSymbol name="checkmark.circle" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Guardar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.productName}>{order.customer_name}</Text>
              {order.customer_phone && (
                <Text style={styles.productDetails}>📞 {order.customer_phone}</Text>
              )}
              {order.customer_address && (
                <Text style={styles.productDetails}>📍 {order.customer_address}</Text>
              )}
              
              {/* Blocked customer banner */}
              {customerBlocked && (
                <View style={styles.blockedBanner}>
                  <IconSymbol name="exclamationmark.triangle.fill" size={20} color="#DC2626" />
                  <Text style={styles.blockedBannerText}>
                    Este cliente está bloqueado y no puede enviar pedidos
                  </Text>
                </View>
              )}
              
              <TouchableOpacity
                style={[styles.addButton, { marginTop: 12 }]}
                onPress={() => {
                  setEditingCustomer(true);
                  setCustomerInputMode('manual');
                }}
              >
                <IconSymbol name="pencil" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Editar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

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
                    onPress={() => startEditingProduct(item)}
                  >
                    <IconSymbol name="pencil" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => deleteProduct(item.id)}
                  >
                    <IconSymbol name="trash" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {editingProduct ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Nombre del producto"
                value={productName}
                onChangeText={setProductName}
              />
              <TextInput
                style={styles.input}
                placeholder="Cantidad"
                value={productQuantity}
                onChangeText={setProductQuantity}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Precio"
                value={productPrice}
                onChangeText={setProductPrice}
                onFocus={() => {
                  // Auto-clear if the value is "0"
                  if (productPrice === '0') {
                    setProductPrice('');
                  }
                }}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Notas"
                value={productNotes}
                onChangeText={setProductNotes}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => updateProduct(editingProduct.id)}
              >
                <IconSymbol name="checkmark.circle" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Actualizar Producto</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.border }]}
                onPress={() => setEditingProduct(null)}
              >
                <IconSymbol name="xmark.circle" size={20} color={colors.text} />
                <Text style={[styles.addButtonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.addButton} onPress={openAddProductModal}>
                <IconSymbol name="plus.circle" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Agregar Producto</Text>
              </TouchableOpacity>
              
              {order.items && order.items.length > 0 && (
                <TouchableOpacity style={styles.bulkPriceButton} onPress={openPriceModal}>
                  <IconSymbol name="dollarsign.circle" size={20} color="#fff" />
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
            value={newQueryText}
            onChangeText={setNewQueryText}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendQueryButton,
              (sendingQuery || !newQueryText.trim() || !order.customer_phone) && { opacity: 0.5 }
            ]}
            onPress={handleSendQuery}
            disabled={sendingQuery || !newQueryText.trim() || !order.customer_phone}
          >
            {sendingQuery ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <IconSymbol name="paperplane.fill" size={20} color="#fff" />
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

        {/* Message History Section - Enhanced Timeline View */}
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
                    {/* Timeline dot */}
                    <View style={[
                      styles.timelineDot,
                      isIncoming && styles.timelineDotIncoming,
                      isOutgoing && styles.timelineDotOutgoing,
                    ]} />
                    
                    {/* Timeline line (except for last item) */}
                    {!isLast && <View style={styles.timelineLine} />}
                    
                    {/* Message card */}
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
                              name={isIncoming ? 'arrow.down.circle.fill' : 'arrow.up.circle.fill'} 
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
                          onPress={() => handlePrintQuery(query)}
                        >
                          <IconSymbol name="printer" size={14} color="#fff" />
                          <Text style={styles.messageButtonText}>Imprimir</Text>
                        </TouchableOpacity>
                        
                        {isIncoming && (
                          <TouchableOpacity
                            style={[styles.messageButton, styles.messageButtonRespond]}
                            onPress={() => openResponseModal(query)}
                          >
                            <IconSymbol name="message.fill" size={14} color="#fff" />
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

        {/* Empty state for no messages */}
        {sortedQueries.length === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historial de Mensajes</Text>
            <View style={styles.emptyHistory}>
              <IconSymbol 
                name="message" 
                size={48} 
                color={colors.textSecondary} 
                style={styles.emptyHistoryIcon}
              />
              <Text style={styles.emptyHistoryText}>
                No hay mensajes en este pedido.{'\n'}
                Envía una consulta al cliente para comenzar.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{formatCLP(total)}</Text>
          </View>
        </View>

        {/* Action Buttons with Icons and Colors */}
        <TouchableOpacity 
          style={[styles.actionButton, styles.printButton]} 
          onPress={handlePrint}
        >
          <IconSymbol name="printer" size={22} color="#fff" />
          <Text style={styles.actionButtonText}>Imprimir Pedido</Text>
        </TouchableOpacity>

        {order.customer_phone && (
          <TouchableOpacity
            style={[styles.actionButton, styles.whatsappButton]}
            onPress={handleWhatsApp}
          >
            <IconSymbol name="message.fill" size={22} color="#fff" />
            <Text style={styles.actionButtonText}>Enviar WhatsApp</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <IconSymbol name="trash" size={22} color="#fff" />
          <Text style={styles.actionButtonText}>Eliminar Pedido</Text>
        </TouchableOpacity>

        {/* Block/Unblock Customer Button */}
        {order.customer_phone && (
          customerBlocked ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.unblockButton]}
              onPress={handleUnblockCustomer}
            >
              <IconSymbol name="checkmark.circle" size={22} color="#fff" />
              <Text style={styles.actionButtonText}>Desbloquear Cliente</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.blockButton]}
              onPress={handleBlockCustomer}
            >
              <IconSymbol name="xmark.circle" size={22} color="#fff" />
              <Text style={styles.actionButtonText}>Bloquear Cliente</Text>
            </TouchableOpacity>
          )
        )}
      </ScrollView>

      {/* WhatsApp-style Add Product Modal */}
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
                <Text style={styles.modalButtonText}>Cancelar</Text>
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

      {/* Bulk Price Modal */}
      <Modal
        visible={showPriceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPriceModal(false)}
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
                    value={bulkPrices[item.id] || ''}
                    onChangeText={(text) => updateBulkPrice(item.id, text)}
                    onFocus={() => {
                      // Auto-clear if the value is "0"
                      if (bulkPrices[item.id] === '0') {
                        updateBulkPrice(item.id, '');
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
                onPress={() => setShowPriceModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={applyBulkPrices}
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
        visible={showResponseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResponseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Responder Consulta</Text>
            
            {selectedQuery && (
              <View style={styles.queryTextDisplay}>
                <Text style={styles.queryTextLabel}>CONSULTA DEL CLIENTE:</Text>
                <Text style={styles.queryTextContent}>{selectedQuery.query_text}</Text>
              </View>
            )}
            
            <Text style={styles.modalSubtitle}>
              Escribe tu respuesta:
            </Text>
            
            <TextInput
              style={styles.responseInput}
              placeholder="Escribe tu respuesta aquí..."
              placeholderTextColor={colors.textSecondary}
              value={responseText}
              onChangeText={setResponseText}
              multiline
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowResponseModal(false);
                  setSelectedQuery(null);
                  setResponseText('');
                }}
                disabled={sendingResponse}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.modalButtonConfirm,
                  (sendingResponse || !responseText.trim()) && { opacity: 0.5 }
                ]}
                onPress={handleSendResponse}
                disabled={sendingResponse || !responseText.trim()}
              >
                {sendingResponse ? (
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
