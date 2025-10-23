
import { getSupabase } from '@/lib/supabase';

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  notes?: string;
}

// Format currency as Chilean Pesos
const formatCLP = (amount: number): string => {
  return `$${amount.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

/**
 * Formats items list for messages (without enumeration)
 */
function formatItemsList(items: OrderItem[], showPrices: boolean = false): string {
  return items.map((item) => {
    const unit = item.notes?.includes('Unidad:') 
      ? item.notes.replace('Unidad:', '').trim() 
      : 'unidades';
    const priceText = showPrices && item.unit_price > 0 ? ` - ${formatCLP(item.unit_price)}` : '';
    return `• ${item.quantity} ${unit} de ${item.product_name}${priceText}`;
  }).join('\n');
}

/**
 * Creates status update message
 */
function createStatusUpdateMessage(
  customerName: string,
  orderNumber: string,
  status: string,
  items: OrderItem[],
  totalAmount?: number
): string {
  // Show prices only from "ready" status onwards
  const showPrices = status === 'ready' || status === 'delivered';
  const itemsList = formatItemsList(items, showPrices);

  let statusEmoji = '📦';
  let statusText = '';
  let additionalInfo = '';

  switch (status) {
    case 'preparing':
      statusEmoji = '👨‍🍳';
      statusText = 'En Preparación';
      additionalInfo = '\n\n💰 Estamos preparando tu pedido y confirmando los precios.';
      break;
    case 'ready':
      statusEmoji = '✅';
      statusText = 'Listo para Entrega';
      additionalInfo = '\n\n🚚 Tu pedido está listo. ¡Puedes pasar a recogerlo!';
      if (totalAmount && totalAmount > 0) {
        additionalInfo += `\n\n💵 *Total a pagar:* ${formatCLP(totalAmount)}`;
      }
      break;
    case 'delivered':
      statusEmoji = '🎉';
      statusText = 'Entregado';
      additionalInfo = '\n\n¡Esperamos que disfrutes tus productos! Gracias por tu compra.';
      if (totalAmount && totalAmount > 0) {
        additionalInfo += `\n\n💵 *Total pagado:* ${formatCLP(totalAmount)}`;
      }
      break;
    case 'cancelled':
      statusEmoji = '❌';
      statusText = 'Cancelado';
      additionalInfo = '\n\nSi tienes alguna pregunta, no dudes en contactarnos.';
      break;
    default:
      statusEmoji = '📦';
      statusText = 'Pendiente';
  }

  return `${statusEmoji} *Actualización de Pedido*

Hola ${customerName}, tu pedido ha sido actualizado.

📋 *Número de pedido:* ${orderNumber}
🔄 *Nuevo estado:* ${statusText}

📦 *Productos:*
${itemsList}${additionalInfo}

¡Gracias por tu preferencia! 😊`;
}

/**
 * Creates product added message
 */
function createProductAddedMessage(
  customerName: string,
  orderNumber: string,
  addedProduct: OrderItem,
  allItems: OrderItem[]
): string {
  // Don't show prices in product added messages
  const itemsList = formatItemsList(allItems, false);
  const unit = addedProduct.notes?.includes('Unidad:')
    ? addedProduct.notes.replace('Unidad:', '').trim()
    : 'unidades';

  return `➕ *Producto Agregado*

Hola ${customerName}, se ha agregado un producto a tu pedido.

📋 *Número de pedido:* ${orderNumber}

✨ *Producto agregado:*
• ${addedProduct.quantity} ${unit} de ${addedProduct.product_name}

📦 *Lista completa de productos:*
${itemsList}

¡Gracias por tu preferencia! 😊`;
}

/**
 * Sends WhatsApp message via API
 */
async function sendWhatsAppMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  message: string
): Promise<void> {
  const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      text: { body: message },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to send WhatsApp message:', error);
    throw new Error(`Failed to send message: ${error}`);
  }
}

/**
 * Sends order status update notification to customer
 */
export async function sendOrderStatusUpdate(
  orderId: string,
  newStatus: string
): Promise<void> {
  try {
    const supabase = getSupabase();

    // Get WhatsApp config
    const { data: config } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (!config || !config.access_token || !config.phone_number_id) {
      console.log('WhatsApp not configured, skipping notification');
      return;
    }

    // Get order details
    const { data: order } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('id', orderId)
      .single();

    if (!order || !order.customer_phone || order.source !== 'whatsapp') {
      console.log('Order not found or not from WhatsApp, skipping notification');
      return;
    }

    // Create and send status update message
    const message = createStatusUpdateMessage(
      order.customer_name,
      order.order_number,
      newStatus,
      order.items,
      order.total_amount
    );

    await sendWhatsAppMessage(
      config.phone_number_id,
      config.access_token,
      order.customer_phone,
      message
    );

    console.log('Sent status update notification to:', order.customer_phone);
  } catch (error) {
    console.error('Error sending order status update:', error);
  }
}

/**
 * Sends product added notification to customer
 */
export async function sendProductAddedNotification(
  orderId: string,
  addedProductId: string
): Promise<void> {
  try {
    const supabase = getSupabase();

    // Get WhatsApp config
    const { data: config } = await supabase
      .from('whatsapp_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (!config || !config.access_token || !config.phone_number_id) {
      console.log('WhatsApp not configured, skipping notification');
      return;
    }

    // Get order details
    const { data: order } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('id', orderId)
      .single();

    if (!order || !order.customer_phone || order.source !== 'whatsapp') {
      console.log('Order not found or not from WhatsApp, skipping notification');
      return;
    }

    // Get the added product
    const addedProduct = order.items.find((item: any) => item.id === addedProductId);
    if (!addedProduct) {
      console.log('Added product not found');
      return;
    }

    // Create and send product added message
    const message = createProductAddedMessage(
      order.customer_name,
      order.order_number,
      addedProduct,
      order.items
    );

    await sendWhatsAppMessage(
      config.phone_number_id,
      config.access_token,
      order.customer_phone,
      message
    );

    console.log('Sent product added notification to:', order.customer_phone);
  } catch (error) {
    console.error('Error sending product added notification:', error);
  }
}
