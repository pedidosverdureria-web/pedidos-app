
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

// ===== CP850 ENCODING HELPER VARIABLES =====
// These variables ensure correct printing of Spanish characters
// Use these in your receipt text to guarantee proper encoding

// Common Spanish words with special characters
export const SPANISH_WORDS = {
  // Words with Ñ/ñ
  ANIO: 'Año',
  ANOS: 'Años',
  NINO: 'Niño',
  NINOS: 'Niños',
  NINA: 'Niña',
  NINAS: 'Niñas',
  SENOR: 'Señor',
  SENORA: 'Señora',
  MANANA: 'Mañana',
  ESPANA: 'España',
  ESPANOL: 'Español',
  COMPANERO: 'Compañero',
  COMPANERA: 'Compañera',
  MONTANA: 'Montaña',
  BANO: 'Baño',
  SUENO: 'Sueño',
  PEQUENO: 'Pequeño',
  TAMANO: 'Tamaño',
  DANO: 'Daño',
  OTONO: 'Otoño',
  
  // Words with accented vowels
  TELEFONO: 'Teléfono',
  DIRECCION: 'Dirección',
  INFORMACION: 'Información',
  ATENCION: 'Atención',
  GRACIAS: 'Gracias',
  PEDIDO: 'Pedido',
  NUMERO: 'Número',
  CODIGO: 'Código',
  ARTICULO: 'Artículo',
  PRECIO: 'Precio',
  CREDITO: 'Crédito',
  DEBITO: 'Débito',
  DEPOSITO: 'Depósito',
  RAPIDO: 'Rápido',
  FACIL: 'Fácil',
  UTIL: 'Útil',
  MOVIL: 'Móvil',
  MUSICA: 'Música',
  PAGINA: 'Página',
  VALIDO: 'Válido',
  UNICO: 'Único',
  PUBLICO: 'Público',
  BASICO: 'Básico',
  CLASICO: 'Clásico',
  ECONOMICO: 'Económico',
  ELECTRONICO: 'Electrónico',
  MECANICO: 'Mecánico',
  MEDICO: 'Médico',
  FARMACIA: 'Farmacia',
  SECRETARIA: 'Secretaría',
  CAFETERIA: 'Cafetería',
  PANADERIA: 'Panadería',
  CARNICERIA: 'Carnicería',
  PELUQUERIA: 'Peluquería',
  JOYERIA: 'Joyería',
  LIBRERIA: 'Librería',
  ZAPATERIA: 'Zapatería',
  FERRETERIA: 'Ferretería',
  
  // Common receipt words
  CLIENTE: 'Cliente',
  FECHA: 'Fecha',
  HORA: 'Hora',
  TOTAL: 'Total',
  SUBTOTAL: 'Subtotal',
  DESCUENTO: 'Descuento',
  IMPUESTO: 'Impuesto',
  CAMBIO: 'Cambio',
  EFECTIVO: 'Efectivo',
  TARJETA: 'Tarjeta',
  TRANSFERENCIA: 'Transferencia',
  COMPRA: 'Compra',
  VENTA: 'Venta',
  DEVOLUCION: 'Devolución',
  GARANTIA: 'Garantía',
  PRODUCTO: 'Producto',
  CANTIDAD: 'Cantidad',
  DESCRIPCION: 'Descripción',
  OBSERVACIONES: 'Observaciones',
  NOTAS: 'Notas',
  VENDEDOR: 'Vendedor',
  CAJERO: 'Cajero',
  SUCURSAL: 'Sucursal',
  DIRECCION_WORD: 'Dirección',
  TELEFONO_WORD: 'Teléfono',
  CORREO: 'Correo',
  SITIO_WEB: 'Sitio Web',
  HORARIO: 'Horario',
  ATENCION_WORD: 'Atención',
  
  // Status words
  PENDIENTE: 'Pendiente',
  PREPARANDO: 'Preparando',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
  PAGADO: 'Pagado',
  CREDITO_WORD: 'Crédito',
  
  // Units
  KILO: 'kilo',
  KILOS: 'kilos',
  GRAMO: 'gramo',
  GRAMOS: 'gramos',
  LITRO: 'litro',
  LITROS: 'litros',
  UNIDAD: 'unidad',
  UNIDADES: 'unidades',
  DOCENA: 'docena',
  DOCENAS: 'docenas',
  MALLA: 'malla',
  MALLAS: 'mallas',
  CAJON: 'cajón',
  CAJONES: 'cajones',
  BOLSA: 'bolsa',
  BOLSAS: 'bolsas',
  PAQUETE: 'paquete',
  PAQUETES: 'paquetes',
};

// Common Spanish phrases for receipts
export const SPANISH_PHRASES = {
  GRACIAS_POR_SU_COMPRA: 'Gracias por su compra!',
  GRACIAS_POR_SU_PREFERENCIA: 'Gracias por su preferencia!',
  VUELVA_PRONTO: 'Vuelva pronto!',
  BUEN_DIA: 'Buen día!',
  BUENAS_TARDES: 'Buenas tardes!',
  BUENAS_NOCHES: 'Buenas noches!',
  HASTA_LUEGO: 'Hasta luego!',
  HASTA_PRONTO: 'Hasta pronto!',
  QUE_TENGA_BUEN_DIA: 'Que tenga un buen día!',
  CONSERVE_SU_TICKET: 'Conserve su ticket',
  VALIDO_PARA_CAMBIOS: 'Válido para cambios',
  NO_SE_ACEPTAN_DEVOLUCIONES: 'No se aceptan devoluciones',
  CONSULTAS_Y_RECLAMOS: 'Consultas y reclamos',
  ATENCION_AL_CLIENTE: 'Atención al cliente',
  HORARIO_DE_ATENCION: 'Horario de atención',
  ABIERTO_TODO_EL_ANO: 'Abierto todo el año',
  SERVICIO_A_DOMICILIO: 'Servicio a domicilio',
  DELIVERY_DISPONIBLE: 'Delivery disponible',
  ACEPTAMOS_TODAS_LAS_TARJETAS: 'Aceptamos todas las tarjetas',
  PAGO_EN_EFECTIVO: 'Pago en efectivo',
  TRANSFERENCIA_BANCARIA: 'Transferencia bancaria',
  PRODUCTOS_DE_CALIDAD: 'Productos de calidad',
  GARANTIA_DE_SATISFACCION: 'Garantía de satisfacción',
  PRECIOS_SUJETOS_A_CAMBIO: 'Precios sujetos a cambio',
  IVA_INCLUIDO: 'IVA incluido',
  DOCUMENTO_NO_VALIDO_COMO_FACTURA: 'Documento no válido como factura',
  TICKET_NO_FISCAL: 'Ticket no fiscal',
  COMPROBANTE_DE_COMPRA: 'Comprobante de compra',
  RECIBO_DE_PAGO: 'Recibo de pago',
  ORDEN_DE_PEDIDO: 'Orden de pedido',
  NOTA_DE_VENTA: 'Nota de venta',
  FACTURA_SIMPLIFICADA: 'Factura simplificada',
  BOLETA_ELECTRONICA: 'Boleta electrónica',
  COMPROBANTE_ELECTRONICO: 'Comprobante electrónico',
};

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
 * Uses CP850-safe Spanish words to ensure proper character encoding
 */
export function generateReceiptText(order: Order, config?: PrinterConfig): string {
  const width = config?.paper_size === '58mm' ? 32 : 48;
  
  let receipt = '';
  
  // Header with logo
  if (config?.include_logo !== false) {
    receipt += centerText(SPANISH_WORDS.PEDIDO.toUpperCase(), width) + '\n';
    receipt += '='.repeat(width) + '\n\n';
  }
  
  // Order information
  receipt += `${SPANISH_WORDS.PEDIDO}: ${order.order_number}\n`;
  receipt += `Estado: ${getStatusLabel(order.status)}\n`;
  receipt += `${SPANISH_WORDS.FECHA}: ${formatDate(order.created_at)}\n`;
  receipt += '-'.repeat(width) + '\n\n';
  
  // Customer information
  if (config?.include_customer_info !== false) {
    receipt += `${SPANISH_WORDS.CLIENTE}: ${order.customer_name}\n`;
    if (order.customer_phone) {
      receipt += `${SPANISH_WORDS.TELEFONO_WORD}: ${order.customer_phone}\n`;
    }
    if (order.customer_address) {
      receipt += `${SPANISH_WORDS.DIRECCION_WORD}: ${order.customer_address}\n`;
    }
    receipt += '-'.repeat(width) + '\n\n';
  }
  
  // Products section
  receipt += `${SPANISH_WORDS.PRODUCTO.toUpperCase()}S:\n\n`;
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
  
  // Totals section
  if (config?.include_totals !== false) {
    receipt += '-'.repeat(width) + '\n';
    const total = order.items?.reduce((sum, item) => sum + item.unit_price, 0) || 0;
    receipt += `${SPANISH_WORDS.TOTAL.toUpperCase()}: ${formatCLP(total)}\n`;
    
    if (order.amount_paid > 0) {
      receipt += `${SPANISH_WORDS.PAGADO}: ${formatCLP(order.amount_paid)}\n`;
      const pending = total - order.amount_paid;
      if (pending > 0) {
        receipt += `${SPANISH_WORDS.PENDIENTE}: ${formatCLP(pending)}\n`;
      }
    }
  }
  
  // Footer
  receipt += '\n' + '='.repeat(width) + '\n';
  receipt += centerText(SPANISH_PHRASES.GRACIAS_POR_SU_COMPRA, width) + '\n\n\n';
  
  return receipt;
}

/**
 * Generate receipt text for order queries
 * Uses CP850-safe Spanish words to ensure proper character encoding
 */
export function generateQueryReceiptText(
  order: Order,
  queryText: string,
  config?: PrinterConfig
): string {
  const width = config?.paper_size === '58mm' ? 32 : 48;
  
  let receipt = '';
  
  // Header
  if (config?.include_logo !== false) {
    receipt += centerText(`CONSULTA DE ${SPANISH_WORDS.PEDIDO.toUpperCase()}`, width) + '\n';
    receipt += '='.repeat(width) + '\n\n';
  }
  
  // Order and customer info
  receipt += `${SPANISH_WORDS.PEDIDO}: ${order.order_number}\n`;
  receipt += `${SPANISH_WORDS.CLIENTE}: ${order.customer_name}\n`;
  receipt += `${SPANISH_WORDS.FECHA}: ${formatDate(new Date().toISOString())}\n`;
  receipt += '-'.repeat(width) + '\n\n';
  
  // Query text
  receipt += 'CONSULTA:\n\n';
  receipt += `${queryText}\n\n`;
  
  // Order status
  receipt += '-'.repeat(width) + '\n';
  receipt += `ESTADO DEL ${SPANISH_WORDS.PEDIDO.toUpperCase()}:\n`;
  receipt += `Estado: ${getStatusLabel(order.status)}\n\n`;
  
  // Products
  receipt += `${SPANISH_WORDS.PRODUCTO.toUpperCase()}S:\n\n`;
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
  
  // Footer
  receipt += '\n' + '='.repeat(width) + '\n';
  receipt += centerText(SPANISH_PHRASES.GRACIAS_POR_SU_COMPRA, width) + '\n\n\n';
  
  return receipt;
}

/**
 * Generate a sample receipt for preview purposes
 * Uses Spanish characters to test CP850 encoding
 */
export function generateSampleReceipt(config?: PrinterConfig): string {
  const sampleOrder: Order = {
    id: 'sample-id',
    order_number: 'PED-001',
    customer_name: `Juan ${SPANISH_WORDS.SENOR} Pérez`,
    customer_phone: '+56912345678',
    customer_address: `Av. Principal 123, Santiago, ${SPANISH_WORDS.ESPANA}`,
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
        notes: `Unidad: kg\nTomates ${SPANISH_WORDS.ESPANOL}es`,
        created_at: new Date().toISOString(),
      },
      {
        id: 'item-2',
        order_id: 'sample-id',
        product_name: 'Cebollas',
        quantity: 1,
        unit_price: 2000,
        notes: `Unidad: malla\nTamaño ${SPANISH_WORDS.PEQUENO}`,
        created_at: new Date().toISOString(),
      },
      {
        id: 'item-3',
        order_id: 'sample-id',
        product_name: 'Papas',
        quantity: 3,
        unit_price: 4500,
        notes: `Unidad: kg\nPapas blancas del ${SPANISH_WORDS.ANIO}`,
        created_at: new Date().toISOString(),
      },
      {
        id: 'item-4',
        order_id: 'sample-id',
        product_name: `Jalapeños`,
        quantity: 0.5,
        unit_price: 1500,
        notes: `Unidad: kg\nPicantes para ${SPANISH_WORDS.MANANA}`,
        created_at: new Date().toISOString(),
      },
    ],
  };
  
  return generateReceiptText(sampleOrder, config);
}
