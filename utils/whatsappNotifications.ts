
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
 * Formats items list for messages (plain text without bullets or numbers)
 */
function formatItemsList(items: OrderItem[], showPrices: boolean = false): string {
  return items.map((item) => {
    const unit = item.notes?.includes('Unidad:') 
      ? item.notes.replace('Unidad:', '').trim() 
      : 'unidades';
    const priceText = showPrices && item.unit_price > 0 ? ` - ${formatCLP(item.unit_price)}` : '';
    return `${item.quantity} ${unit} de ${item.product_name}${priceText}`;
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
${addedProduct.quantity} ${unit} de ${addedProduct.product_name}

📦 *Lista completa de productos:*
${itemsList}

¡Gracias por tu preferencia! 😊`;
}

/**
 * Creates product removed message
 */
function createProductRemovedMessage(
  customerName: string,
  orderNumber: string,
  removedProduct: OrderItem,
  allItems: OrderItem[]
): string {
  // Don't show prices in product removed messages
  const itemsList = allItems.length > 0 ? formatItemsList(allItems, false) : 'No quedan productos en el pedido';
  const unit = removedProduct.notes?.includes('Unidad:')
    ? removedProduct.notes.replace('Unidad:', '').trim()
    : 'unidades';

  return `🗑️ *Producto Eliminado*

Hola ${customerName}, se ha eliminado un producto de tu pedido.

📋 *Número de pedido:* ${orderNumber}

❌ *Producto eliminado:*
${removedProduct.quantity} ${unit} de ${removedProduct.product_name}

📦 *Lista actualizada de productos:*
${itemsList}

¡Gracias por tu preferencia! 😊`;
}

/**
 * Creates order deleted message
 */
function createOrderDeletedMessage(
  customerName: string,
  orderNumber: string
): string {
  return `🗑️ *Pedido Cancelado*

Hola ${customerName}, tu pedido ha sido cancelado.

📋 *Número de pedido:* ${orderNumber}

❌ Este pedido ha sido eliminado del sistema.

Si tienes alguna pregunta o deseas realizar un nuevo pedido, no dudes en contactarnos.

¡Gracias por tu comprensión! 😊`;
}

/**
 * Creates query confirmation message (sent immediately when query is received from customer)
 */
function createQueryConfirmationMessage(
  customerName: string,
  orderNumber: string,
  queryText: string
): string {
  return `📋 *Consulta Recibida*

Hola ${customerName}, hemos recibido tu consulta sobre el pedido ${orderNumber}.

❓ *Tu consulta:*
${queryText}

⏰ Te responderemos a la brevedad.

¡Gracias por tu paciencia! 😊`;
}

/**
 * Creates outgoing query message (sent from business to customer)
 * This follows the same format as incoming queries but indicates it's from the business
 */
function createOutgoingQueryMessage(
  customerName: string,
  orderNumber: string,
  queryText: string
): string {
  return `💬 *Consulta sobre tu Pedido*

Hola ${customerName}, tenemos una consulta sobre tu pedido ${orderNumber}.

❓ *Nuestra consulta:*
${queryText}

Por favor responde cuando puedas. ¡Gracias! 😊`;
}

/**
 * Creates query response message
 */
function createQueryResponseMessage(
  customerName: string,
  orderNumber: string,
  queryText: string,
  responseText: string
): string {
  return `💬 *Respuesta a tu Consulta*

Hola ${customerName}, hemos recibido tu consulta sobre el pedido ${orderNumber}.

❓ *Tu consulta:*
${queryText}

✅ *Nuestra respuesta:*
${responseText}

Si tienes más preguntas, no dudes en escribirnos.

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
 * Gets WhatsApp configuration from database
 */
async function getWhatsAppConfig() {
  const supabase = getSupabase();
  const { data: config } = await supabase
    .from('whatsapp_config')
    .select('*')
    .eq('is_active', true)
    .single();

  return config;
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
    const config = await getWhatsAppConfig();

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
    const config = await getWhatsAppConfig();

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

/**
 * Sends product removed notification to customer
 */
export async function sendProductRemovedNotification(
  orderId: string,
  removedProduct: OrderItem
): Promise<void> {
  try {
    const supabase = getSupabase();

    // Get WhatsApp config
    const config = await getWhatsAppConfig();

    if (!config || !config.access_token || !config.phone_number_id) {
      console.log('WhatsApp not configured, skipping notification');
      return;
    }

    // Get order details with updated items list
    const { data: order } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('id', orderId)
      .single();

    if (!order || !order.customer_phone || order.source !== 'whatsapp') {
      console.log('Order not found or not from WhatsApp, skipping notification');
      return;
    }

    // Create and send product removed message
    const message = createProductRemovedMessage(
      order.customer_name,
      order.order_number,
      removedProduct,
      order.items
    );

    await sendWhatsAppMessage(
      config.phone_number_id,
      config.access_token,
      order.customer_phone,
      message
    );

    console.log('Sent product removed notification to:', order.customer_phone);
  } catch (error) {
    console.error('Error sending product removed notification:', error);
  }
}

/**
 * Sends order deleted notification to customer
 */
export async function sendOrderDeletedNotification(
  orderId: string
): Promise<void> {
  try {
    const supabase = getSupabase();

    // Get WhatsApp config
    const config = await getWhatsAppConfig();

    if (!config || !config.access_token || !config.phone_number_id) {
      console.log('WhatsApp not configured, skipping notification');
      return;
    }

    // Get order details before deletion
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (!order || !order.customer_phone || order.source !== 'whatsapp') {
      console.log('Order not found or not from WhatsApp, skipping notification');
      return;
    }

    // Create and send order deleted message
    const message = createOrderDeletedMessage(
      order.customer_name,
      order.order_number
    );

    await sendWhatsAppMessage(
      config.phone_number_id,
      config.access_token,
      order.customer_phone,
      message
    );

    console.log('Sent order deleted notification to:', order.customer_phone);
  } catch (error) {
    console.error('Error sending order deleted notification:', error);
  }
}

/**
 * Sends a response to a customer query via WhatsApp
 * This function sends the actual response from the admin to the customer
 */
export async function sendQueryResponse(
  orderId: string,
  customerName: string,
  orderNumber: string,
  queryText: string,
  responseText: string
): Promise<void> {
  try {
    const supabase = getSupabase();

    // Get WhatsApp config
    const config = await getWhatsAppConfig();

    if (!config || !config.access_token || !config.phone_number_id) {
      console.log('WhatsApp not configured, skipping notification');
      throw new Error('WhatsApp no está configurado');
    }

    // Get order details to get customer phone
    const { data: order } = await supabase
      .from('orders')
      .select('customer_phone')
      .eq('id', orderId)
      .single();

    if (!order || !order.customer_phone) {
      console.log('Order not found or no customer phone');
      throw new Error('No se encontró el número de teléfono del cliente');
    }

    // Create and send query response message
    const message = createQueryResponseMessage(
      customerName,
      orderNumber,
      queryText,
      responseText
    );

    await sendWhatsAppMessage(
      config.phone_number_id,
      config.access_token,
      order.customer_phone,
      message
    );

    console.log('Sent query response to:', order.customer_phone);
  } catch (error) {
    console.error('Error sending query response:', error);
    throw error;
  }
}

/**
 * Sends an outgoing query from the business to the customer
 * This is called when the business initiates a query about an order
 */
export async function sendQueryConfirmation(
  customerPhone: string,
  customerName: string,
  orderNumber: string,
  queryText: string
): Promise<void> {
  try {
    const supabase = getSupabase();

    // Get WhatsApp config
    const config = await getWhatsAppConfig();

    if (!config || !config.access_token || !config.phone_number_id) {
      console.log('WhatsApp not configured, skipping confirmation');
      throw new Error('WhatsApp no está configurado');
    }

    // Create and send outgoing query message
    const message = createOutgoingQueryMessage(
      customerName,
      orderNumber,
      queryText
    );

    await sendWhatsAppMessage(
      config.phone_number_id,
      config.access_token,
      customerPhone,
      message
    );

    console.log('Sent outgoing query to:', customerPhone);
  } catch (error) {
    console.error('Error sending outgoing query:', error);
    throw error;
  }
}
