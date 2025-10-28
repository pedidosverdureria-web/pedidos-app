
import { Order, OrderItem } from '@/types';

type TextSize = 'small' | 'medium' | 'large';
type PaperSize = '58mm' | '80mm';

export interface PrinterConfig {
  auto_print_enabled?: boolean;
  auto_cut_enabled?: boolean;
  text_size?: TextSize;
  paper_size?: PaperSize;
  include_logo?: boolean;
  include_customer_info?: boolean;
  include_totals?: boolean;
  use_webhook_format?: boolean;
  encoding?: 'CP850' | 'UTF-8' | 'ISO-8859-1' | 'Windows-1252';
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

function formatProductDisplay(item: OrderItem): string {
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
  
  return `${item.quantity} ${unitText} de ${item.product_name}`;
}

function getAdditionalNotes(notes: string | null | undefined): string {
  if (!notes) return '';
  
  const cleanNotes = notes.replace(/unidad:\s*\w+/gi, '').trim();
  
  return cleanNotes;
}

function centerText(text: string, width: number): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text;
}

/**
 * Generate receipt text for printing
 * This is the unified function used by both auto-printing and manual printing
 */
export function generateReceiptText(order: Order, config?: PrinterConfig): string {
  const width = config?.paper_size === '58mm' ? 32 : 48;
  
  let receipt = '';
  
  if (config?.include_logo !== false) {
    receipt += centerText('PEDIDO', width) + '\n';
    receipt += '='.repeat(width) + '\n\n';
  }
  
  receipt += `Pedido: ${order.order_number}\n`;
  receipt += `Estado: ${getStatusLabel(order.status)}\n`;
  receipt += `Fecha: ${formatDate(order.created_at)}\n`;
  receipt += '-'.repeat(width) + '\n\n';
  
  if (config?.include_customer_info !== false) {
    receipt += `Cliente: ${order.customer_name}\n`;
    if (order.customer_phone) {
      receipt += `Telefono: ${order.customer_phone}\n`;
    }
    if (order.customer_address) {
      receipt += `Direccion: ${order.customer_address}\n`;
    }
    receipt += '-'.repeat(width) + '\n\n';
  }
  
  receipt += 'PRODUCTOS:\n\n';
  for (const item of order.items || []) {
    receipt += `${formatProductDisplay(item)}\n`;
    
    const additionalNotes = getAdditionalNotes(item.notes);
    if (additionalNotes) {
      receipt += `  ${additionalNotes}\n`;
    }
    
    if (item.unit_price > 0) {
      receipt += `  ${formatCLP(item.unit_price)}\n`;
    }
    receipt += '\n';
  }
  
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
  
  receipt += '\n' + '='.repeat(width) + '\n';
  receipt += centerText('Gracias por su compra!', width) + '\n\n\n';
  
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
  
  let receipt = '';
  
  if (config?.include_logo !== false) {
    receipt += centerText('CONSULTA DE PEDIDO', width) + '\n';
    receipt += '='.repeat(width) + '\n\n';
  }
  
  receipt += `Pedido: ${order.order_number}\n`;
  receipt += `Cliente: ${order.customer_name}\n`;
  receipt += `Fecha: ${formatDate(new Date().toISOString())}\n`;
  receipt += '-'.repeat(width) + '\n\n';
  
  receipt += 'CONSULTA:\n\n';
  receipt += `${queryText}\n\n`;
  
  receipt += '-'.repeat(width) + '\n';
  receipt += 'ESTADO DEL PEDIDO:\n';
  receipt += `Estado: ${getStatusLabel(order.status)}\n\n`;
  
  receipt += 'PRODUCTOS:\n\n';
  for (const item of order.items || []) {
    receipt += `${formatProductDisplay(item)}\n`;
    
    const additionalNotes = getAdditionalNotes(item.notes);
    if (additionalNotes) {
      receipt += `  ${additionalNotes}\n`;
    }
    
    if (item.unit_price > 0) {
      receipt += `  ${formatCLP(item.unit_price)}\n`;
    }
    receipt += '\n';
  }
  
  receipt += '\n' + '='.repeat(width) + '\n';
  receipt += centerText('Gracias!', width) + '\n\n\n';
  
  return receipt;
}

/**
 * Generate a sample receipt for preview purposes
 */
export function generateSampleReceipt(config?: PrinterConfig): string {
  const sampleOrder: Order = {
    id: 'sample-id',
    order_number: 'PED-001',
    customer_name: 'Juan Pérez',
    customer_phone: '+56912345678',
    customer_address: 'Av. Principal 123, Santiago',
    status: 'pending',
    source: 'manual',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    amount_paid: 5000,
    items: [
      {
        id: 'item-1',
        order_id: 'sample-id',
        product_name: 'Tomates',
        quantity: 2,
        unit_price: 3000,
        notes: 'Unidad: kg',
        created_at: new Date().toISOString(),
      },
      {
        id: 'item-2',
        order_id: 'sample-id',
        product_name: 'Cebollas',
        quantity: 1,
        unit_price: 2000,
        notes: 'Unidad: malla',
        created_at: new Date().toISOString(),
      },
      {
        id: 'item-3',
        order_id: 'sample-id',
        product_name: 'Papas',
        quantity: 3,
        unit_price: 4500,
        notes: 'Unidad: kg\nPapas blancas',
        created_at: new Date().toISOString(),
      },
    ],
  };
  
  return generateReceiptText(sampleOrder, config);
}
