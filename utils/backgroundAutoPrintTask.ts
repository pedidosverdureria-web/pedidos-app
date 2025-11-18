
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getSupabase } from '@/lib/supabase';

export const BACKGROUND_AUTO_PRINT_TASK = 'BACKGROUND-AUTO-PRINT-TASK';
const PRINTER_CONFIG_KEY = '@printer_config';
const PRINTED_ORDERS_KEY = '@printed_orders';

type TextSize = 'small' | 'medium' | 'large';
type PaperSize = '58mm' | '80mm';
type Encoding = 'CP850' | 'UTF-8' | 'ISO-8859-1' | 'Windows-1252';

interface PrinterConfig {
  auto_print_enabled?: boolean;
  auto_cut_enabled?: boolean;
  text_size?: TextSize;
  paper_size?: PaperSize;
  include_logo?: boolean;
  include_customer_info?: boolean;
  include_totals?: boolean;
  use_webhook_format?: boolean;
  encoding?: Encoding;
  print_special_chars?: boolean;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  status: string;
  created_at: string;
  amount_paid: number;
  items?: {
    product_name: string;
    quantity: number;
    unit_price: number;
    notes?: string;
  }[];
}

/**
 * Remove special characters (ñ, accents) from text
 * This is useful when the printer doesn't support these characters
 * FIXED: Now properly applied based on config
 */
function removeSpecialChars(text: string): string {
  const replacements: { [key: string]: string } = {
    'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
    'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
    'ñ': 'n', 'Ñ': 'N',
    'ü': 'u', 'Ü': 'U',
    'à': 'a', 'è': 'e', 'ì': 'i', 'ò': 'o', 'ù': 'u',
    'À': 'A', 'È': 'E', 'Ì': 'I', 'Ò': 'O', 'Ù': 'U',
    'â': 'a', 'ê': 'e', 'î': 'i', 'ô': 'o', 'û': 'u',
    'Â': 'A', 'Ê': 'E', 'Î': 'I', 'Ô': 'O', 'Û': 'U',
    'ã': 'a', 'õ': 'o',
    'Ã': 'A', 'Õ': 'O',
  };

  let result = text;
  for (const [special, replacement] of Object.entries(replacements)) {
    result = result.replace(new RegExp(special, 'g'), replacement);
  }
  return result;
}

/**
 * Process text based on printer configuration
 * FIXED: If print_special_chars is false, remove special characters
 */
function processText(text: string, config?: PrinterConfig): string {
  // FIXED: Check if print_special_chars is explicitly set to false
  // Default behavior is to print special characters (true)
  if (config && config.print_special_chars === false) {
    return removeSpecialChars(text);
  }
  return text;
}

/**
 * Helper function to extract unit from notes
 */
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

/**
 * Format product display in webhook format: "1 kilo de tomates"
 * This matches the format used in order detail screen and WhatsApp webhook
 * FIXED: Now applies processText to handle special characters
 */
function formatProductDisplay(
  item: { product_name: string; quantity: number; notes?: string },
  config?: PrinterConfig
): string {
  const unit = getUnitFromNotes(item.notes);
  
  // Determine the unit text
  let unitText = '';
  if (unit === 'kg' || unit === 'kilo' || unit === 'kilos') {
    unitText = item.quantity === 1 ? 'kilo' : 'kilos';
  } else if (unit === 'gr' || unit === 'gramo' || unit === 'gramos') {
    unitText = item.quantity === 1 ? 'gramo' : 'gramos';
  } else if (unit === 'lt' || unit === 'litro' || unit === 'litros') {
    unitText = item.quantity === 1 ? 'litro' : 'litros';
  } else if (unit === 'ml') {
    unitText = 'ml';
  } else if (unit === 'un' || unit === 'unidad' || unit === 'unidades') {
    unitText = item.quantity === 1 ? 'unidad' : 'unidades';
  } else if (unit) {
    // For any other unit (like malla, docena, etc.), use it directly
    // Check if it needs pluralization
    if (item.quantity === 1) {
      unitText = unit;
    } else {
      // Simple pluralization: add 's' if doesn't end with 's'
      unitText = unit.endsWith('s') ? unit : unit + 's';
    }
  } else {
    unitText = item.quantity === 1 ? 'unidad' : 'unidades';
  }
  
  // FIXED: Apply processText to product name
  const productName = processText(item.product_name, config);
  return `${item.quantity} ${unitText} de ${productName}`;
}

/**
 * Get additional notes excluding unit information
 * FIXED: Now applies processText to handle special characters
 */
function getAdditionalNotes(notes: string | null | undefined, config?: PrinterConfig): string {
  if (!notes) return '';
  
  // Remove the "Unidad: xxx" part from notes
  const cleanNotes = notes.replace(/unidad:\s*\w+/gi, '').trim();
  
  // FIXED: Apply processText to notes
  return processText(cleanNotes, config);
}

/**
 * Generate receipt text for an order
 * Uses the same format as the order detail screen
 * FIXED: All text now processed through processText to handle special characters
 */
function generateReceiptText(order: Order, printerConfig: PrinterConfig): string {
  const width = printerConfig?.paper_size === '58mm' ? 32 : 48;
  
  let receipt = '';
  
  // Header
  if (printerConfig?.include_logo !== false) {
    const headerText = processText('NUEVO PEDIDO', printerConfig);
    receipt += centerText(headerText, width) + '\n';
    receipt += '='.repeat(width) + '\n\n';
  }
  
  // Order info
  const pedidoLabel = processText('Pedido', printerConfig);
  receipt += `${pedidoLabel}: ${order.order_number}\n`;
  
  const estadoLabel = processText('Estado', printerConfig);
  const statusText = processText(getStatusLabel(order.status), printerConfig);
  receipt += `${estadoLabel}: ${statusText}\n`;
  
  const fechaLabel = processText('Fecha', printerConfig);
  receipt += `${fechaLabel}: ${new Date(order.created_at).toLocaleString('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })}\n`;
  receipt += '-'.repeat(width) + '\n\n';
  
  // Customer info
  if (printerConfig?.include_customer_info !== false) {
    const clienteLabel = processText('Cliente', printerConfig);
    const customerName = processText(order.customer_name, printerConfig);
    receipt += `${clienteLabel}: ${customerName}\n`;
    
    if (order.customer_phone) {
      const telefonoLabel = processText('Telefono', printerConfig);
      receipt += `${telefonoLabel}: ${order.customer_phone}\n`;
    }
    if (order.customer_address) {
      const direccionLabel = processText('Direccion', printerConfig);
      const customerAddress = processText(order.customer_address, printerConfig);
      receipt += `${direccionLabel}: ${customerAddress}\n`;
    }
    receipt += '-'.repeat(width) + '\n\n';
  }
  
  // Items - using webhook format with special character handling
  const productosLabel = processText('PRODUCTOS', printerConfig);
  receipt += `${productosLabel}:\n\n`;
  for (const item of order.items || []) {
    // Use formatProductDisplay to get the webhook format with special char handling
    receipt += `${formatProductDisplay(item, printerConfig)}\n`;
    
    // Add additional notes if they exist (excluding unit information)
    const additionalNotes = getAdditionalNotes(item.notes, printerConfig);
    if (additionalNotes) {
      receipt += `  ${additionalNotes}\n`;
    }
    
    if (item.unit_price > 0) {
      receipt += `  ${formatCLP(item.unit_price)}\n`;
    }
    receipt += '\n';
  }
  
  // Totals
  if (printerConfig?.include_totals !== false) {
    receipt += '-'.repeat(width) + '\n';
    const total = order.items?.reduce((sum, item) => sum + item.unit_price, 0) || 0;
    
    const totalLabel = processText('TOTAL', printerConfig);
    receipt += `${totalLabel}: ${formatCLP(total)}\n`;
    
    if (order.amount_paid > 0) {
      const pagadoLabel = processText('Pagado', printerConfig);
      receipt += `${pagadoLabel}: ${formatCLP(order.amount_paid)}\n`;
      const pending = total - order.amount_paid;
      if (pending > 0) {
        const pendienteLabel = processText('Pendiente', printerConfig);
        receipt += `${pendienteLabel}: ${formatCLP(pending)}\n`;
      }
    }
  }
  
  receipt += '\n' + '='.repeat(width) + '\n';
  const footerText = processText('Gracias por su compra!', printerConfig);
  receipt += centerText(footerText, width) + '\n\n\n';
  
  return receipt;
}

function centerText(text: string, width: number): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text;
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'preparing':
      return 'Preparando';
    case 'ready':
      return 'Listo';
    case 'delivered':
      return 'Entregado';
    case 'pending_payment':
      return 'Pendiente de Pago';
    case 'cancelled':
      return 'Cancelado';
    default:
      return status;
  }
}

function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);
}

/**
 * Define the background auto-print task
 * This task runs periodically to check for new orders and print them
 */
TaskManager.defineTask(BACKGROUND_AUTO_PRINT_TASK, async () => {
  console.log('[BackgroundAutoPrint] Task triggered at', new Date().toISOString());
  
  try {
    // Load printer configuration
    const configStr = await AsyncStorage.getItem(PRINTER_CONFIG_KEY);
    if (!configStr) {
      console.log('[BackgroundAutoPrint] No printer config found');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
    
    const printerConfig: PrinterConfig = JSON.parse(configStr);
    
    // Check if auto-print is enabled
    if (!printerConfig.auto_print_enabled) {
      console.log('[BackgroundAutoPrint] Auto-print is disabled');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
    
    // Get printed orders set
    const printedOrdersStr = await AsyncStorage.getItem(PRINTED_ORDERS_KEY);
    const printedOrders: string[] = printedOrdersStr ? JSON.parse(printedOrdersStr) : [];
    console.log('[BackgroundAutoPrint] Currently printed orders:', printedOrders.length);
    
    // Query for new pending orders that haven't been printed yet
    const supabase = getSupabase();
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('[BackgroundAutoPrint] Error fetching orders:', error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
    
    if (!orders || orders.length === 0) {
      console.log('[BackgroundAutoPrint] No pending orders found');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
    
    console.log(`[BackgroundAutoPrint] Found ${orders.length} pending orders`);
    
    // Filter out already printed orders
    const newOrders = orders.filter(order => !printedOrders.includes(order.id));
    
    if (newOrders.length === 0) {
      console.log('[BackgroundAutoPrint] No new orders to print (all already printed)');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
    
    console.log(`[BackgroundAutoPrint] Found ${newOrders.length} new orders to print`);
    console.log('[BackgroundAutoPrint] New order IDs:', newOrders.map(o => o.order_number).join(', '));
    
    // Store the orders that need printing for the foreground app to handle
    // This is because Bluetooth operations in background are restricted on mobile platforms
    const ordersToPrint = newOrders.map(order => order.id);
    await AsyncStorage.setItem('@orders_to_print', JSON.stringify(ordersToPrint));
    
    console.log('[BackgroundAutoPrint] Queued orders for foreground printing');
    console.log('[BackgroundAutoPrint] Task completed successfully at', new Date().toISOString());
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('[BackgroundAutoPrint] Task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Register the background auto-print task
 * This should be called when auto-print is enabled
 */
export async function registerBackgroundAutoPrintTask() {
  if (Platform.OS === 'web') {
    console.log('[BackgroundAutoPrint] Not supported on web');
    return;
  }

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_AUTO_PRINT_TASK);
    
    if (!isRegistered) {
      console.log('[BackgroundAutoPrint] Registering background task...');
      
      await BackgroundFetch.registerTaskAsync(BACKGROUND_AUTO_PRINT_TASK, {
        minimumInterval: 60, // Check every 60 seconds (minimum allowed)
        stopOnTerminate: false, // Continue running after app is closed
        startOnBoot: true, // Start when device boots
      });
      
      console.log('[BackgroundAutoPrint] Background task registered successfully');
      console.log('[BackgroundAutoPrint] Task will run every 60 seconds, even with screen off');
    } else {
      console.log('[BackgroundAutoPrint] Background task already registered');
    }
    
    // Check background fetch status
    const status = await BackgroundFetch.getStatusAsync();
    console.log('[BackgroundAutoPrint] Background fetch status:', getStatusText(status));
    
    if (status === BackgroundFetch.BackgroundFetchStatus.Denied || 
        status === BackgroundFetch.BackgroundFetchStatus.Restricted) {
      console.warn('[BackgroundAutoPrint] Background fetch is denied or restricted!');
      console.warn('[BackgroundAutoPrint] Auto-print may not work with screen off');
    }
  } catch (error) {
    console.error('[BackgroundAutoPrint] Error registering background task:', error);
    throw error;
  }
}

/**
 * Unregister the background auto-print task
 * This should be called when auto-print is disabled
 */
export async function unregisterBackgroundAutoPrintTask() {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_AUTO_PRINT_TASK);
    
    if (isRegistered) {
      console.log('[BackgroundAutoPrint] Unregistering background task...');
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_AUTO_PRINT_TASK);
      console.log('[BackgroundAutoPrint] Background task unregistered successfully');
    }
  } catch (error) {
    console.error('[BackgroundAutoPrint] Error unregistering background task:', error);
  }
}

/**
 * Check the status of the background task
 */
export async function getBackgroundTaskStatus() {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    const status = await BackgroundFetch.getStatusAsync();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_AUTO_PRINT_TASK);
    
    return {
      status,
      isRegistered,
      statusText: getStatusText(status),
    };
  } catch (error) {
    console.error('[BackgroundAutoPrint] Error getting task status:', error);
    return null;
  }
}

function getStatusText(status: BackgroundFetch.BackgroundFetchStatus): string {
  switch (status) {
    case BackgroundFetch.BackgroundFetchStatus.Available:
      return 'Disponible';
    case BackgroundFetch.BackgroundFetchStatus.Denied:
      return 'Denegado';
    case BackgroundFetch.BackgroundFetchStatus.Restricted:
      return 'Restringido';
    default:
      return 'Desconocido';
  }
}
