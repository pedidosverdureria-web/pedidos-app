
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

/**
 * Map of Spanish number words to their numeric values
 */
const NUMBER_WORDS: Record<string, number> = {
  'un': 1, 'uno': 1, 'una': 1,
  'dos': 2,
  'tres': 3,
  'cuatro': 4,
  'cinco': 5,
  'seis': 6,
  'siete': 7,
  'ocho': 8,
  'nueve': 9,
  'diez': 10,
  'once': 11,
  'doce': 12,
  'trece': 13,
  'catorce': 14,
  'quince': 15,
  'dieciséis': 16, 'dieciseis': 16,
  'diecisiete': 17,
  'dieciocho': 18,
  'diecinueve': 19,
  'veinte': 20,
  'veintiuno': 21,
  'veintidós': 22, 'veintidos': 22,
  'veintitrés': 23, 'veintitres': 23,
  'veinticuatro': 24,
  'veinticinco': 25,
  'treinta': 30,
  'cuarenta': 40,
  'cincuenta': 50,
};

/**
 * Known unit variations and their categories
 */
const UNIT_VARIATIONS: Record<string, string[]> = {
  'kilo': ['kilo', 'kilos', 'kg', 'kgs', 'k'],
  'gramo': ['gramo', 'gramos', 'gr', 'grs', 'g'],
  'unidad': ['unidad', 'unidades', 'u'],
  'malla': ['malla', 'mallas'],
  'saco': ['saco', 'sacos'],
  'cajón': ['cajón', 'cajon', 'cajones'],
  'bolsa': ['bolsa', 'bolsas'],
  'paquete': ['paquete', 'paquetes', 'pqte', 'pqtes'],
  'caja': ['caja', 'cajas'],
  'atado': ['atado', 'atados'],
  'racimo': ['racimo', 'racimos'],
  'cabeza': ['cabeza', 'cabezas'],
};

/**
 * Greeting patterns
 */
const GREETINGS = [
  'hola', 'buenos días', 'buenas tardes', 'buenas noches',
  'buen día', 'buena tarde', 'buena noche',
  'saludos', 'holi', 'holaaa', 'hey', 'ey',
  'qué tal', 'que tal', 'cómo estás', 'como estas',
  'cómo están', 'como estan', 'qué onda', 'que onda'
];

/**
 * Question patterns
 */
const QUESTION_PATTERNS = [
  'cómo hago', 'como hago', 'cómo puedo', 'como puedo',
  'quiero hacer', 'necesito hacer', 'me gustaría hacer',
  'cómo funciona', 'como funciona', 'cómo se hace', 'como se hace',
  'ayuda', 'información', 'informacion', 'info',
  'quiero pedir', 'necesito pedir', 'quisiera pedir',
  'hacer un pedido', 'realizar un pedido', 'enviar un pedido',
  'cómo pido', 'como pido', 'dónde pido', 'donde pido',
  'tienen', 'venden', 'hay', 'disponible',
  'precio', 'precios', 'cuánto', 'cuanto', 'cuesta',
  'horario', 'horarios', 'abren', 'cierran',
  'entregan', 'entrega', 'delivery', 'envío', 'envio'
];

/**
 * Converts a number word to its numeric value
 */
function convertNumberWord(word: string): number | null {
  const normalized = word.toLowerCase().trim();
  return NUMBER_WORDS[normalized] ?? null;
}

/**
 * Parses a quantity value from a string
 */
function parseQuantityValue(quantityStr: string): number {
  if (!quantityStr || !quantityStr.trim()) {
    return 0;
  }

  const trimmed = quantityStr.trim();

  // Try as fraction
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length === 2) {
      const numerator = parseFloat(parts[0].trim());
      const denominator = parseFloat(parts[1].trim());

      if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
        return numerator / denominator;
      }
    }
  }

  // Try as number
  const numValue = parseFloat(trimmed);
  if (!isNaN(numValue)) {
    return numValue;
  }

  // Try as text number
  const textValue = convertNumberWord(trimmed);
  if (textValue !== null) {
    return textValue;
  }

  console.warn(`Could not parse quantity: "${quantityStr}"`);
  return 0;
}

/**
 * Checks if a word is a known unit
 */
function isKnownUnit(word: string): boolean {
  if (!word) return false;

  const normalized = word.toLowerCase().trim();

  for (const variations of Object.values(UNIT_VARIATIONS)) {
    if (variations.includes(normalized)) {
      return true;
    }
  }

  return false;
}

/**
 * Normalizes a unit to its standard form
 */
function normalizeUnit(unit: string, quantity: number = 1): string {
  if (!unit || !unit.trim()) {
    return quantity === 1 ? 'unidad' : 'unidades';
  }

  const normalized = unit.toLowerCase().trim();

  for (const [standardUnit, variations] of Object.entries(UNIT_VARIATIONS)) {
    if (variations.includes(normalized)) {
      if (quantity === 1) {
        return standardUnit;
      } else {
        if (standardUnit === 'cajón') return 'cajones';
        if (standardUnit.endsWith('z')) return standardUnit.slice(0, -1) + 'ces';
        return standardUnit + 's';
      }
    }
  }

  return quantity === 1 ? 'unidad' : 'unidades';
}

/**
 * Parses a single segment from the WhatsApp message
 */
function parseSegment(segment: string): any {
  const trimmed = segment.trim();

  if (!trimmed) {
    return null;
  }

  const cleaned = trimmed.replace(/^[-•*]\s*/, '').trim();

  if (!cleaned) {
    return null;
  }

  // Pattern 1: Cantidad + Unidad + "de" + Producto
  let match = cleaned.match(/^(\d+(?:\/\d+)?|\w+)\s+(\w+)\s+de\s+(.+)$/i);
  if (match) {
    const quantity = parseQuantityValue(match[1]);
    const unit = normalizeUnit(match[2], quantity);
    const product = match[3].trim();

    if (quantity > 0 && product) {
      return { quantity, unit, product };
    }
  }

  // Pattern 2: Cantidad + Unidad (sin espacio) + "de" + Producto
  match = cleaned.match(/^(\d+(?:\/\d+)?)([a-zA-Z]+)\s+de\s+(.+)$/i);
  if (match) {
    const quantity = parseQuantityValue(match[1]);
    const unit = normalizeUnit(match[2], quantity);
    const product = match[3].trim();

    if (quantity > 0 && product) {
      return { quantity, unit, product };
    }
  }

  // Pattern 3: Cantidad + Unidad (sin espacio) + Producto
  match = cleaned.match(/^(\d+(?:\/\d+)?)([a-zA-Z]+)\s+(.+)$/i);
  if (match) {
    const potentialUnit = match[2];
    if (isKnownUnit(potentialUnit)) {
      const quantity = parseQuantityValue(match[1]);
      const unit = normalizeUnit(potentialUnit, quantity);
      const product = match[3].trim();

      if (quantity > 0 && product) {
        return { quantity, unit, product };
      }
    }
  }

  // Pattern 4: Cantidad + Unidad + Producto (con espacio)
  match = cleaned.match(/^(\d+(?:\/\d+)?|\w+)\s+(\w+)\s+(.+)$/i);
  if (match) {
    const potentialUnit = match[2];
    if (isKnownUnit(potentialUnit)) {
      const quantity = parseQuantityValue(match[1]);
      const unit = normalizeUnit(potentialUnit, quantity);
      const product = match[3].trim();

      if (quantity > 0 && product) {
        return { quantity, unit, product };
      }
    }
  }

  // Pattern 5: Cantidad + Producto (sin unidad explícita)
  match = cleaned.match(/^(\d+(?:\/\d+)?|\w+)\s+(.+)$/i);
  if (match) {
    const quantity = parseQuantityValue(match[1]);
    const product = match[2].trim();

    if (quantity > 0 && product && !isKnownUnit(product.split(/\s+/)[0])) {
      const unit = normalizeUnit('', quantity);
      return { quantity, unit, product };
    }
  }

  // Pattern 6: Producto + Cantidad + Unidad
  match = cleaned.match(/^(.+?)\s+(\d+(?:\/\d+)?|\w+)\s*([a-zA-Z]*)$/i);
  if (match) {
    const product = match[1].trim();
    const quantityStr = match[2];
    const unitStr = match[3];

    const quantity = parseQuantityValue(quantityStr);

    if (quantity > 0 && product) {
      if (unitStr && isKnownUnit(unitStr)) {
        const unit = normalizeUnit(unitStr, quantity);
        return { quantity, unit, product };
      } else {
        const quantityMatch = quantityStr.match(/^(\d+(?:\/\d+)?)([a-zA-Z]+)$/);
        if (quantityMatch && isKnownUnit(quantityMatch[2])) {
          const qty = parseQuantityValue(quantityMatch[1]);
          const unit = normalizeUnit(quantityMatch[2], qty);
          return { quantity: qty, unit, product };
        } else {
          const unit = normalizeUnit('', quantity);
          return { quantity, unit, product };
        }
      }
    }
  }

  // Pattern 7: Fracción + "de" + Producto
  match = cleaned.match(/^(\d+\/\d+)\s+de\s+(.+)$/i);
  if (match) {
    const quantity = parseQuantityValue(match[1]);
    const product = match[2].trim();

    if (quantity > 0 && product) {
      const unit = normalizeUnit('', quantity);
      return { quantity, unit, product };
    }
  }

  console.warn(`Could not parse segment: "${cleaned}"`);
  return null;
}

/**
 * Splits a line into multiple segments
 */
function splitLineIntoSegments(line: string): string[] {
  const trimmed = line.trim();

  if (!trimmed) {
    return [];
  }

  // Split by commas
  if (trimmed.includes(',')) {
    return trimmed.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }

  // Try to detect multiple items
  const segments: string[] = [];
  let currentSegment = '';
  const words = trimmed.split(/\s+/);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    const isQuantityStart = /^\d+(?:\/\d+)?[a-zA-Z]*$/.test(word) || convertNumberWord(word) !== null;

    if (isQuantityStart && currentSegment.trim().length > 0) {
      segments.push(currentSegment.trim());
      currentSegment = word;
    } else {
      currentSegment += (currentSegment ? ' ' : '') + word;
    }
  }

  if (currentSegment.trim().length > 0) {
    segments.push(currentSegment.trim());
  }

  if (segments.length === 1) {
    return [trimmed];
  }

  const validSegments = segments.filter(seg => {
    const parsed = parseSegment(seg);
    return parsed !== null;
  });

  if (validSegments.length === 0) {
    return [trimmed];
  }

  return segments;
}

/**
 * Parses a WhatsApp message into a list of order items
 */
function parseWhatsAppMessage(message: string): any[] {
  if (!message || !message.trim()) {
    console.warn('Empty message provided');
    return [];
  }

  const lines = message.split('\n');
  const orderItems: any[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      continue;
    }

    const segments = splitLineIntoSegments(line);

    for (const segment of segments) {
      try {
        const parsedItem = parseSegment(segment);

        if (parsedItem) {
          orderItems.push(parsedItem);
          console.log(`✓ Parsed: "${segment}" →`, parsedItem);
        } else {
          console.warn(`✗ Could not parse: "${segment}"`);
        }
      } catch (error) {
        console.error(`✗ Error parsing segment "${segment}":`, error);
      }
    }
  }

  console.log(`Parsed ${orderItems.length} items from ${lines.length} lines`);
  return orderItems;
}

/**
 * Checks if message is a greeting
 */
function isGreeting(message: string): boolean {
  const normalized = message.toLowerCase().trim();
  
  // Check if message contains question marks
  if (normalized.includes('?') || normalized.includes('¿')) {
    return true;
  }
  
  // Check for greeting patterns
  for (const greeting of GREETINGS) {
    if (normalized.includes(greeting)) {
      return true;
    }
  }
  
  // Check for question patterns
  for (const pattern of QUESTION_PATTERNS) {
    if (normalized.includes(pattern)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Format currency as Chilean Pesos
 */
function formatCLP(amount: number): string {
  return `$${amount.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Formats items list for messages (without enumeration)
 */
function formatItemsList(items: any[], showPrices: boolean = false): string {
  return items.map((item) => {
    const priceText = showPrices && item.unit_price > 0 ? ` - ${formatCLP(item.unit_price)}` : '';
    return `• ${item.quantity} ${item.unit} de ${item.product}${priceText}`;
  }).join('\n');
}

/**
 * Creates confirmation message
 */
function createConfirmationMessage(customerName: string, orderNumber: string, items: any[]): string {
  const itemsList = formatItemsList(items, false);
  
  return `✅ *¡Pedido Recibido!*

Hola ${customerName}, hemos recibido tu pedido correctamente.

📋 *Número de pedido:* ${orderNumber}

📦 *Productos solicitados:*
${itemsList}

💰 Los precios se asignarán y te confirmaremos el total cuando tu pedido esté en preparación.

Te mantendremos informado sobre el estado de tu pedido. ⏰

¡Gracias por tu preferencia! 😊`;
}

/**
 * Creates help message
 */
function createHelpMessage(customerName: string): string {
  return `❌ *No pudimos identificar productos*

Hola ${customerName}! No pude identificar productos en tu mensaje.

📝 *Formato sugerido:*
• 3 kilos de tomates
• 2 kilos de palta
• 1 kg de papas
• 5 pepinos
• 1 cilantro

También puedes escribir:
• tomates 3 kilos
• 3k de tomates
• tres kilos de tomates
• 3kilos de papas
• papas 3k
• 1/4 de ají
• 1/2 kilo de papas
• 2 saco de papa, un cajón de tomate
• 2 kilos de tomates 1 kilo de papa
• 3kilos tomates 2kilos paltas 3 pepinos

¡Gracias por tu comprensión! 😊`;
}

/**
 * Creates welcome message
 */
function createWelcomeMessage(customerName: string): string {
  return `👋 *¡Hola ${customerName}!*

Gracias por contactarnos. Para hacer un pedido, simplemente envía la lista de productos que necesitas.

📝 *Ejemplos de cómo hacer tu pedido:*

*Formato vertical:*
• 3 kilos de tomates
• 2 kilos de paltas
• 5 pepinos
• 1 cilantro

*Formato horizontal:*
• 3 kilos de tomates, 2 kilos de paltas, 5 pepinos

*Otros formatos válidos:*
• 3k de tomates
• tomates 3 kilos
• 1/4 de ají
• 2 saco de papa
• 3kilos tomates 2kilos paltas

💡 *Tip:* Puedes escribir los productos como prefieras, nosotros entenderemos tu pedido.

¿En qué podemos ayudarte hoy? 😊`;
}

/**
 * Creates status update message
 */
function createStatusUpdateMessage(customerName: string, orderNumber: string, status: string, items: any[]): string {
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
      break;
    case 'delivered':
      statusEmoji = '🎉';
      statusText = 'Entregado';
      additionalInfo = '\n\n¡Esperamos que disfrutes tus productos! Gracias por tu compra.';
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
function createProductAddedMessage(customerName: string, orderNumber: string, addedProduct: any, allItems: any[]): string {
  // Don't show prices in product added messages
  const itemsList = formatItemsList(allItems, false);

  return `➕ *Producto Agregado*

Hola ${customerName}, se ha agregado un producto a tu pedido.

📋 *Número de pedido:* ${orderNumber}

✨ *Producto agregado:*
• ${addedProduct.quantity} ${addedProduct.unit} de ${addedProduct.product}

📦 *Lista completa de productos:*
${itemsList}

¡Gracias por tu preferencia! 😊`;
}

/**
 * Sends WhatsApp message
 */
async function sendWhatsAppMessage(phoneNumberId: string, accessToken: string, to: string, message: string) {
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

  return response.json();
}

/**
 * Extracts customer name from WhatsApp contact
 */
function extractCustomerName(contact: any, phone: string): string {
  if (contact?.profile?.name) {
    return contact.profile.name;
  }
  
  if (contact?.wa_id) {
    return contact.wa_id;
  }
  
  return phone;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // GET request - webhook verification
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      console.log('Webhook verification request:', { mode, token });

      const { data: config } = await supabase
        .from('whatsapp_config')
        .select('verify_token')
        .single();

      if (mode === 'subscribe' && token === config?.verify_token) {
        console.log('Webhook verified successfully');
        return new Response(challenge, {
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      }

      return new Response('Forbidden', { status: 403, headers: corsHeaders });
    }

    // POST request - incoming message
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('Received webhook:', JSON.stringify(body, null, 2));

      const { data: config } = await supabase
        .from('whatsapp_config')
        .select('*')
        .eq('is_active', true)
        .single();

      if (!config) {
        console.log('WhatsApp integration not configured or inactive');
        return new Response(JSON.stringify({ success: false, error: 'Not configured' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const entry = body.entry?.[0];
      if (!entry) {
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const changes = entry.changes?.[0];
      const messages = changes?.value?.messages;
      const contacts = changes?.value?.contacts;

      if (!messages || messages.length === 0) {
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        
        if (message.type !== 'text') continue;

        const messageText = message.text.body;
        const customerPhone = message.from;
        const messageId = message.id;
        
        // Extract customer name from contact info
        const contact = contacts?.find((c: any) => c.wa_id === customerPhone);
        let customerName = extractCustomerName(contact, customerPhone);

        console.log('Processing message from:', customerName, '(', customerPhone, ')');
        console.log('Message text:', messageText);

        // Check for Manual #customer name# special order format
        // Pattern: Manual #customer name# followed by order details
        // The regex captures everything between # symbols as the customer name
        const manualPattern = /^Manual\s+#([^#]+)#\s*(.+)$/is;
        const manualMatch = messageText.match(manualPattern);
        
        if (manualMatch) {
          console.log('Detected Manual #name# special order format');
          
          // Extract custom customer name and order text
          const customCustomerName = manualMatch[1].trim();
          const orderText = manualMatch[2].trim();
          
          console.log('Custom customer name:', customCustomerName);
          console.log('Order text:', orderText);
          
          // Parse the order items
          const parsedItems = parseWhatsAppMessage(orderText);
          
          if (parsedItems.length === 0) {
            console.log('No items could be parsed from Manual order');
            
            if (config.access_token && config.phone_number_id) {
              try {
                const helpMsg = createHelpMessage(customCustomerName);
                await sendWhatsAppMessage(
                  config.phone_number_id,
                  config.access_token,
                  customerPhone,
                  helpMsg
                );
                console.log('Sent help message to:', customerPhone);
              } catch (error) {
                console.error('Error sending help message:', error);
              }
            }
            
            continue;
          }
          
          // Create manual order with custom customer name
          const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
              customer_name: customCustomerName,
              customer_phone: customerPhone,
              status: 'pending',
              source: 'manual',
              whatsapp_message_id: messageId,
            })
            .select()
            .single();

          if (orderError) {
            console.error('Error creating Manual order:', orderError);
            continue;
          }

          console.log('Created Manual order:', order.id, 'with number:', order.order_number);

          // Create order items
          const orderItems = parsedItems.map((item) => ({
            order_id: order.id,
            product_name: `${item.product}`,
            quantity: item.quantity,
            unit_price: 0,
            notes: `Unidad: ${item.unit}`,
          }));

          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

          if (itemsError) {
            console.error('Error creating order items for Manual order:', itemsError);
          }

          // Send confirmation message with custom name
          if (config.access_token && config.phone_number_id) {
            try {
              const confirmationMsg = createConfirmationMessage(
                customCustomerName,
                order.order_number,
                parsedItems
              );
              await sendWhatsAppMessage(
                config.phone_number_id,
                config.access_token,
                customerPhone,
                confirmationMsg
              );
              console.log('Sent Manual confirmation message to:', customerPhone);
            } catch (error) {
              console.error('Error sending Manual confirmation message:', error);
            }
          }
          
          continue;
        }

        // Check if message is a greeting or question
        if (isGreeting(messageText)) {
          console.log('Detected greeting/question, sending welcome message');
          
          if (config.access_token && config.phone_number_id) {
            try {
              const welcomeMsg = createWelcomeMessage(customerName);
              await sendWhatsAppMessage(
                config.phone_number_id,
                config.access_token,
                customerPhone,
                welcomeMsg
              );
              console.log('Sent welcome message to:', customerPhone);
            } catch (error) {
              console.error('Error sending welcome message:', error);
            }
          }
          
          continue;
        }

        // Parse the message
        const parsedItems = parseWhatsAppMessage(messageText);

        // If no items could be parsed, send help message
        if (parsedItems.length === 0) {
          console.log('No items could be parsed, sending help message');
          
          if (config.access_token && config.phone_number_id) {
            try {
              const helpMsg = createHelpMessage(customerName);
              await sendWhatsAppMessage(
                config.phone_number_id,
                config.access_token,
                customerPhone,
                helpMsg
              );
              console.log('Sent help message to:', customerPhone);
            } catch (error) {
              console.error('Error sending help message:', error);
            }
          }
          
          continue;
        }

        // Create order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_name: customerName,
            customer_phone: customerPhone,
            status: 'pending',
            source: 'whatsapp',
            whatsapp_message_id: messageId,
          })
          .select()
          .single();

        if (orderError) {
          console.error('Error creating order:', orderError);
          continue;
        }

        console.log('Created order:', order.id, 'with number:', order.order_number);

        // Create order items
        const orderItems = parsedItems.map((item) => ({
          order_id: order.id,
          product_name: `${item.product}`,
          quantity: item.quantity,
          unit_price: 0,
          notes: `Unidad: ${item.unit}`,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          console.error('Error creating order items:', itemsError);
        }

        // Send confirmation message
        if (config.access_token && config.phone_number_id) {
          try {
            const confirmationMsg = createConfirmationMessage(
              customerName,
              order.order_number,
              parsedItems
            );
            await sendWhatsAppMessage(
              config.phone_number_id,
              config.access_token,
              customerPhone,
              confirmationMsg
            );
            console.log('Sent confirmation message to:', customerPhone);
          } catch (error) {
            console.error('Error sending confirmation message:', error);
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
