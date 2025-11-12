
import { Order, OrderItem, AdvancedReceiptConfig } from '@/types';

type TextSize = 'small' | 'medium' | 'large';
type PaperSize = '58mm' | '80mm';
type ReceiptContext = 'auto_print' | 'manual_print' | 'query' | 'customer_account';

export interface PrinterConfig {
  auto_print_enabled?: boolean;
  auto_cut_enabled?: boolean;
  text_size?: TextSize;
  paper_size?: PaperSize;
  include_logo?: boolean;
  include_customer_info?: boolean;
  include_totals?: boolean;
  use_webhook_format?: boolean;
  encoding?: 'UTF-8' | 'CP850' | 'ISO-8859-1';
  print_special_chars?: boolean;
  advanced_config?: AdvancedReceiptConfig;
}

/**
 * Remove special characters (ñ, accents) from text
 * This is useful when the printer doesn't support these characters
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
 * If print_special_chars is false, remove special characters
 */
function processText(text: string, config?: PrinterConfig): string {
  if (config?.print_special_chars === false) {
    return removeSpecialChars(text);
  }
  return text;
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

function formatDate(dateString: string, format: 'short' | 'long' | 'time' = 'long'): string {
  const date = new Date(dateString);
  
  if (format === 'short') {
    return date.toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } else if (format === 'time') {
    return date.toLocaleString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } else {
    return date.toLocaleString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

function getUnitFromNotes(notes: string | null | undefined): string {
  if (!notes) return '';
  const lowerNotes = notes.toLowerCase();
  
  const unitMatch = lowerNotes.match(/unidad:\s*(\w+)/);
  if (unitMatch) {
    return unitMatch[1];
  }
  
  if (lowerNotes.includes('kg') || lowerNotes.includes('kilo')) return 'kg';
  if (lowerNotes.includes('gr') || lowerNotes.includes('gramo')) return 'gr';
  if (lowerNotes.includes('lt') || lowerNotes.includes('litro')) return 'lt';
  if (lowerNotes.includes('ml')) return 'ml';
  if (lowerNotes.includes('un') || lowerNotes.includes('unidad')) return 'un';
  return '';
}

function formatProductDisplay(item: OrderItem, config?: PrinterConfig): string {
  const unit = getUnitFromNotes(item.notes);
  
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
    if (item.quantity === 1) {
      unitText = unit;
    } else {
      unitText = unit.endsWith('s') ? unit : unit + 's';
    }
  } else {
    unitText = item.quantity === 1 ? 'unidad' : 'unidades';
  }
  
  const productName = processText(item.product_name, config);
  return `${item.quantity} ${unitText} de ${productName}`;
}

function getAdditionalNotes(notes: string | null | undefined, config?: PrinterConfig): string {
  if (!notes) return '';
  
  const cleanNotes = notes.replace(/unidad:\s*\w+/gi, '').trim();
  
  return processText(cleanNotes, config);
}

function alignText(text: string, width: number, alignment: 'left' | 'center' | 'right'): string {
  if (alignment === 'center') {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  } else if (alignment === 'right') {
    const padding = Math.max(0, width - text.length);
    return ' '.repeat(padding) + text;
  } else {
    return text;
  }
}

function centerText(text: string, width: number): string {
  return alignText(text, width, 'center');
}

function addSpacing(lines: number): string {
  return '\n'.repeat(lines);
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function formatProductLine(
  productText: string,
  price: string,
  width: number,
  priceAlignment: 'left' | 'right',
  productMaxWidth: number
): string {
  const maxProductWidth = Math.floor(width * (productMaxWidth / 100));
  
  if (priceAlignment === 'right') {
    const availableProductWidth = width - price.length - 1;
    const actualProductWidth = Math.min(maxProductWidth, availableProductWidth);
    const truncatedProduct = truncateText(productText, actualProductWidth);
    const padding = width - truncatedProduct.length - price.length;
    return truncatedProduct + ' '.repeat(Math.max(1, padding)) + price;
  } else {
    const truncatedProduct = truncateText(productText, maxProductWidth);
    return truncatedProduct + ' ' + price;
  }
}

/**
 * Get the appropriate header text based on the receipt context
 */
function getReceiptHeader(context: ReceiptContext, config?: PrinterConfig): string {
  let header = '';
  switch (context) {
    case 'auto_print':
      header = 'NUEVO PEDIDO';
      break;
    case 'manual_print':
      header = 'PEDIDO CLIENTE';
      break;
    case 'query':
      header = 'CONSULTA DE CLIENTE';
      break;
    case 'customer_account':
      header = 'CUENTA DE CLIENTES';
      break;
    default:
      header = 'PEDIDO';
  }
  return processText(header, config);
}

/**
 * Generate receipt text with advanced configuration
 */
export function generateAdvancedReceiptText(
  order: Order,
  config?: PrinterConfig,
  context: ReceiptContext = 'manual_print'
): string {
  const advConfig = config?.advanced_config;
  if (!advConfig) {
    return generateReceiptText(order, config, context);
  }

  const width = config?.paper_size === '58mm' ? 32 : 48;
  let receipt = '';

  // Header spacing
  receipt += addSpacing(advConfig.header_spacing);

  // Logo at top
  if (advConfig.show_logo && advConfig.logo_position === 'top') {
    receipt += centerText('[LOGO]', width) + '\n\n';
  }

  // Header text - use context-specific header
  const headerText = getReceiptHeader(context, config);
  receipt += centerText(headerText, width) + '\n';
  
  // Additional header lines from config
  if (advConfig.header_text && advConfig.header_text.trim()) {
    const headerLines = advConfig.header_text.split('\n');
    for (const line of headerLines) {
      const processedLine = processText(line, config);
      receipt += alignText(processedLine, width, advConfig.header_alignment) + '\n';
    }
  }

  // Logo in header
  if (advConfig.show_logo && advConfig.logo_position === 'header') {
    receipt += centerText('[LOGO]', width) + '\n';
  }

  // Separator after header
  if (advConfig.show_separator_lines) {
    receipt += advConfig.separator_char.repeat(width) + '\n';
  }
  receipt += '\n';

  // Order information
  if (advConfig.show_order_number) {
    receipt += `Pedido: ${order.order_number}\n`;
  }
  if (advConfig.show_status) {
    const statusLabel = processText(getStatusLabel(order.status), config);
    receipt += `Estado: ${statusLabel}\n`;
  }
  receipt += `Fecha: ${formatDate(order.created_at, advConfig.date_format)}\n`;

  // Separator
  if (advConfig.show_separator_lines) {
    receipt += advConfig.separator_char.repeat(width) + '\n';
  }
  receipt += '\n';

  // Customer information
  if (config?.include_customer_info !== false) {
    const customerName = processText(order.customer_name, config);
    receipt += `Cliente: ${customerName}\n`;
    if (order.customer_phone) {
      receipt += `Telefono: ${order.customer_phone}\n`;
    }
    if (order.customer_address) {
      const customerAddress = processText(order.customer_address, config);
      receipt += `Direccion: ${customerAddress}\n`;
    }
    if (advConfig.show_separator_lines) {
      receipt += advConfig.separator_char.repeat(width) + '\n';
    }
    receipt += '\n';
  }

  // Products section
  receipt += 'PRODUCTOS:\n\n';
  for (const item of order.items || []) {
    const productDisplay = formatProductDisplay(item, config);
    
    // Format product line with price alignment
    if (advConfig.show_prices && item.unit_price > 0) {
      const priceText = formatCLP(item.unit_price);
      receipt += formatProductLine(
        productDisplay,
        priceText,
        width,
        advConfig.product_price_alignment,
        advConfig.product_name_max_width
      ) + '\n';
    } else {
      const maxProductWidth = Math.floor(width * (advConfig.product_name_max_width / 100));
      receipt += truncateText(productDisplay, maxProductWidth) + '\n';
    }
    
    // Show product notes if enabled
    if (advConfig.show_product_notes) {
      const additionalNotes = getAdditionalNotes(item.notes, config);
      if (additionalNotes) {
        receipt += `  ${additionalNotes}\n`;
      }
    }
    
    receipt += addSpacing(advConfig.item_spacing);
  }

  // Custom fields
  if (advConfig.custom_fields && advConfig.custom_fields.length > 0) {
    if (advConfig.show_separator_lines) {
      receipt += advConfig.separator_char.repeat(width) + '\n';
    }
    for (const field of advConfig.custom_fields) {
      const label = processText(field.label, config);
      const value = processText(field.value, config);
      receipt += `${label}: ${value}\n`;
    }
    receipt += '\n';
  }

  // Totals section
  if (config?.include_totals !== false && advConfig.show_item_totals) {
    if (advConfig.show_separator_lines) {
      receipt += advConfig.separator_char.repeat(width) + '\n';
    }
    const total = order.items?.reduce((sum, item) => sum + item.unit_price, 0) || 0;
    receipt += `TOTAL: ${formatCLP(total)}\n`;
    
    if (order.amount_paid > 0) {
      receipt += `Pagado: ${formatCLP(order.amount_paid)}\n`;
      const pending = total - order.amount_paid;
      if (pending > 0) {
        receipt += `Pendiente: ${formatCLP(pending)}\n`;
      }
    }
  }

  // Footer spacing
  receipt += addSpacing(advConfig.footer_spacing);

  // Footer separator
  if (advConfig.show_separator_lines) {
    receipt += advConfig.separator_char.repeat(width) + '\n';
  }

  // Footer text
  const footerLines = advConfig.footer_text.split('\n');
  for (const line of footerLines) {
    const processedLine = processText(line, config);
    receipt += alignText(processedLine, width, advConfig.footer_alignment) + '\n';
  }

  receipt += '\n\n';

  return receipt;
}

/**
 * Generate receipt text for printing
 * This is the unified function used by both auto-printing and manual printing
 */
export function generateReceiptText(
  order: Order,
  config?: PrinterConfig,
  context: ReceiptContext = 'manual_print'
): string {
  // Use advanced config if available
  if (config?.advanced_config) {
    return generateAdvancedReceiptText(order, config, context);
  }

  const width = config?.paper_size === '58mm' ? 32 : 48;
  
  let receipt = '';
  
  // Header with logo - use context-specific header
  if (config?.include_logo !== false) {
    const headerText = getReceiptHeader(context, config);
    receipt += centerText(headerText, width) + '\n';
    receipt += '='.repeat(width) + '\n\n';
  }
  
  // Order information
  receipt += `Pedido: ${order.order_number}\n`;
  const statusLabel = processText(getStatusLabel(order.status), config);
  receipt += `Estado: ${statusLabel}\n`;
  receipt += `Fecha: ${formatDate(order.created_at)}\n`;
  receipt += '-'.repeat(width) + '\n\n';
  
  // Customer information
  if (config?.include_customer_info !== false) {
    const customerName = processText(order.customer_name, config);
    receipt += `Cliente: ${customerName}\n`;
    if (order.customer_phone) {
      receipt += `Telefono: ${order.customer_phone}\n`;
    }
    if (order.customer_address) {
      const customerAddress = processText(order.customer_address, config);
      receipt += `Direccion: ${customerAddress}\n`;
    }
    receipt += '-'.repeat(width) + '\n\n';
  }
  
  // Products section
  receipt += 'PRODUCTOS:\n\n';
  for (const item of order.items || []) {
    receipt += `${formatProductDisplay(item, config)}\n`;
    
    const additionalNotes = getAdditionalNotes(item.notes, config);
    if (additionalNotes) {
      receipt += `  ${additionalNotes}\n`;
    }
    
    if (item.unit_price > 0) {
      receipt += `  ${formatCLP(item.unit_price)}\n`;
    }
    receipt += '\n';
  }
  
  // Totals section
  if (config?.include_totals !== false) {
    receipt += '-'.repeat(width) + '\n';
    const total = order.items?.reduce((sum, item) => sum + item.unit_price, 0) || 0;
    receipt += `TOTAL: ${formatCLP(total)}\n`;
    
    if (order.amount_paid > 0) {
      receipt += `Pagado: ${formatCLP(order.amount_paid)}\n`;
      const pending = total - order.amount_paid;
      if (pending > 0) {
        receipt += `Pendiente: ${formatCLP(pending)}\n`;
      }
    }
  }
  
  // Footer
  receipt += '\n' + '='.repeat(width) + '\n';
  const footerText = processText('Gracias por su compra!', config);
  receipt += centerText(footerText, width) + '\n\n\n';
  
  return receipt;
}

/**
 * Generate receipt text for order queries
 */
export function generateQueryReceiptText(
  order: Order,
  queryText: string,
  config?: PrinterConfig
): string {
  const width = config?.paper_size === '58mm' ? 32 : 48;
  const advConfig = config?.advanced_config;
  
  let receipt = '';
  
  // Header - always use "CONSULTA DE CLIENTE" for queries
  if (config?.include_logo !== false) {
    const headerText = processText('CONSULTA DE CLIENTE', config);
    receipt += centerText(headerText, width) + '\n';
    receipt += '='.repeat(width) + '\n\n';
  }
  
  // Order and customer info
  receipt += `Pedido: ${order.order_number}\n`;
  const customerName = processText(order.customer_name, config);
  receipt += `Cliente: ${customerName}\n`;
  receipt += `Fecha: ${formatDate(new Date().toISOString())}\n`;
  receipt += '-'.repeat(width) + '\n\n';
  
  // Query text
  receipt += 'CONSULTA:\n\n';
  const processedQuery = processText(queryText, config);
  receipt += `${processedQuery}\n\n`;
  
  // Order status
  receipt += '-'.repeat(width) + '\n';
  receipt += 'ESTADO DEL PEDIDO:\n';
  const statusLabel = processText(getStatusLabel(order.status), config);
  receipt += `Estado: ${statusLabel}\n\n`;
  
  // Products
  receipt += 'PRODUCTOS:\n\n';
  for (const item of order.items || []) {
    const productDisplay = formatProductDisplay(item, config);
    
    // Use advanced config if available
    if (advConfig) {
      if (advConfig.show_prices && item.unit_price > 0) {
        const priceText = formatCLP(item.unit_price);
        receipt += formatProductLine(
          productDisplay,
          priceText,
          width,
          advConfig.product_price_alignment,
          advConfig.product_name_max_width
        ) + '\n';
      } else {
        const maxProductWidth = Math.floor(width * (advConfig.product_name_max_width / 100));
        receipt += truncateText(productDisplay, maxProductWidth) + '\n';
      }
      
      if (advConfig.show_product_notes) {
        const additionalNotes = getAdditionalNotes(item.notes, config);
        if (additionalNotes) {
          receipt += `  ${additionalNotes}\n`;
        }
      }
    } else {
      receipt += `${productDisplay}\n`;
      const additionalNotes = getAdditionalNotes(item.notes, config);
      if (additionalNotes) {
        receipt += `  ${additionalNotes}\n`;
      }
      if (item.unit_price > 0) {
        receipt += `  ${formatCLP(item.unit_price)}\n`;
      }
    }
    
    receipt += '\n';
  }
  
  // Footer
  receipt += '\n' + '='.repeat(width) + '\n';
  const footerText = processText('Gracias por su compra!', config);
  receipt += centerText(footerText, width) + '\n\n\n';
  
  return receipt;
}

/**
 * Generate receipt text for customer account (pending vouchers)
 */
export function generateCustomerAccountReceipt(
  customerName: string,
  customerPhone: string | undefined,
  customerAddress: string | undefined,
  orders: Order[],
  totalDebt: number,
  totalPaid: number,
  config?: PrinterConfig
): string {
  const width = config?.paper_size === '58mm' ? 32 : 48;
  
  let receipt = '';
  
  // Header - always use "CUENTA DE CLIENTES" for customer accounts
  if (config?.include_logo !== false) {
    const headerText = processText('CUENTA DE CLIENTES', config);
    receipt += centerText(headerText, width) + '\n';
    receipt += '='.repeat(width) + '\n\n';
  }
  
  const processedCustomerName = processText(customerName, config);
  receipt += `Cliente: ${processedCustomerName}\n`;
  if (customerPhone) {
    receipt += `Telefono: ${customerPhone}\n`;
  }
  if (customerAddress) {
    const processedAddress = processText(customerAddress, config);
    receipt += `Direccion: ${processedAddress}\n`;
  }
  receipt += `Fecha: ${formatDate(new Date().toISOString())}\n`;
  receipt += '-'.repeat(width) + '\n\n';
  
  receipt += 'PEDIDOS PENDIENTES:\n\n';
  
  if (orders && orders.length > 0) {
    for (const order of orders) {
      receipt += `Pedido: ${order.order_number}\n`;
      receipt += `Fecha: ${formatDate(order.created_at, 'short')}\n`;
      
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
  
  receipt += `DEUDA TOTAL: ${formatCLP(totalDebt)}\n`;
  receipt += `PAGADO: ${formatCLP(totalPaid)}\n`;
  receipt += `PENDIENTE: ${formatCLP(totalDebt - totalPaid)}\n`;
  
  receipt += '\n' + '='.repeat(width) + '\n';
  const footerText = processText('Gracias por su preferencia!', config);
  receipt += centerText(footerText, width) + '\n\n\n';
  
  return receipt;
}

/**
 * Generate a sample receipt for preview purposes
 */
export function generateSampleReceipt(config?: PrinterConfig): string {
  const sampleOrder: Order = {
    id: 'sample-id',
    order_number: 'PED-001',
    customer_name: 'Juan Perez',
    customer_phone: '+56912345678',
    customer_address: 'Av. Principal 123, Santiago',
    status: 'pending',
    source: 'manual',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    amount_paid: 5000,
    total_amount: 9500,
    paid_amount: 5000,
    is_read: true,
    items: [
      {
        id: 'item-1',
        order_id: 'sample-id',
        product_name: 'Tomates',
        quantity: 2,
        unit_price: 3000,
        total_price: 3000,
        notes: 'Unidad: kg\nTomates frescos',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'item-2',
        order_id: 'sample-id',
        product_name: 'Cebollas',
        quantity: 1,
        unit_price: 2000,
        total_price: 2000,
        notes: 'Unidad: malla\nTamano mediano',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'item-3',
        order_id: 'sample-id',
        product_name: 'Papas',
        quantity: 3,
        unit_price: 4500,
        total_price: 4500,
        notes: 'Unidad: kg\nPapas blancas',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  };
  
  return generateReceiptText(sampleOrder, config, 'manual_print');
}
