
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Number words mapping (Spanish)
const NUMBER_WORDS: Record<string, number> = {
  'un': 1, 'una': 1, 'uno': 1,
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
  'dieciseis': 16, 'dieciséis': 16,
  'diecisiete': 17,
  'dieciocho': 18,
  'diecinueve': 19,
  'veinte': 20,
};

// Fraction words mapping (Spanish)
const FRACTION_WORDS: Record<string, number> = {
  'medio': 0.5, 'media': 0.5,
  'cuarto': 0.25,
  'tercio': 0.33,
};

// Unit variations mapping
const UNIT_VARIATIONS: Record<string, string[]> = {};

// Greeting patterns
const GREETING_PATTERNS = [
  /^(hola|buenos días|buenas tardes|buenas noches|saludos)/i,
  /^(hi|hello|hey)/i,
];

// Closing patterns
const CLOSING_PATTERNS = [
  /(gracias|muchas gracias|saludos|hasta luego|chao|adiós)$/i,
  /(thanks|thank you|bye|goodbye)$/i,
];

// Filler patterns to remove
const FILLER_PATTERNS = [
  /por favor/gi,
  /porfavor/gi,
  /porfa/gi,
  /please/gi,
];

// Question patterns
const QUESTION_PATTERNS = [
  /\?$/,
  /^(cuánto|cuanto|cuando|dónde|donde|qué|que|cómo|como|por qué|porque)/i,
  /^(how much|when|where|what|how|why)/i,
];

/**
 * Extract the product list from a message, removing greetings and closings
 */
function extractProductList(message: string): string {
  let cleanedMessage = message;

  // Remove greetings from the start
  for (const pattern of GREETING_PATTERNS) {
    cleanedMessage = cleanedMessage.replace(pattern, '').trim();
  }

  // Remove closings from the end
  for (const pattern of CLOSING_PATTERNS) {
    cleanedMessage = cleanedMessage.replace(pattern, '').trim();
  }

  // Remove filler words
  for (const pattern of FILLER_PATTERNS) {
    cleanedMessage = cleanedMessage.replace(pattern, '').trim();
  }

  return cleanedMessage;
}

/**
 * Load known units from database
 */
async function loadKnownUnits(supabase: any) {
  try {
    const { data, error } = await supabase
      .from('known_units')
      .select('unit_name, variations');

    if (error) {
      console.error('Error loading known units:', error);
      return;
    }

    // Clear existing variations
    for (const key in UNIT_VARIATIONS) {
      delete UNIT_VARIATIONS[key];
    }

    // Load variations from database
    for (const unit of data || []) {
      UNIT_VARIATIONS[unit.unit_name.toLowerCase()] = unit.variations.map((v: string) => v.toLowerCase());
    }

    console.log('Loaded known units:', Object.keys(UNIT_VARIATIONS).length);
  } catch (error) {
    console.error('Error loading known units:', error);
  }
}

/**
 * Normalize phone number to international format
 */
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If it starts with 56 (Chile country code), keep it
  if (cleaned.startsWith('56')) {
    return '+' + cleaned;
  }
  
  // If it starts with 9 (Chilean mobile), add country code
  if (cleaned.startsWith('9') && cleaned.length === 9) {
    return '+56' + cleaned;
  }
  
  // Otherwise, assume it already has country code
  return '+' + cleaned;
}

/**
 * Check if phone number is in authorized list
 */
async function loadAuthorizedPhones(supabase: any): Promise<Set<string>> {
  try {
    const { data, error } = await supabase
      .from('authorized_phones')
      .select('phone_number');

    if (error) {
      console.error('Error loading authorized phones:', error);
      return new Set();
    }

    const authorizedSet = new Set<string>();
    for (const record of data || []) {
      const normalized = normalizePhoneNumber(record.phone_number);
      authorizedSet.add(normalized);
    }

    console.log('Loaded authorized phones:', authorizedSet.size);
    return authorizedSet;
  } catch (error) {
    console.error('Error loading authorized phones:', error);
    return new Set();
  }
}

/**
 * Add a new unit variation to the database
 */
async function addNewUnit(supabase: any, unitName: string, variation: string) {
  try {
    // Check if unit already exists
    const { data: existing } = await supabase
      .from('known_units')
      .select('id, variations')
      .eq('unit_name', unitName)
      .single();

    if (existing) {
      // Add variation if it doesn't exist
      if (!existing.variations.includes(variation)) {
        const updatedVariations = [...existing.variations, variation];
        await supabase
          .from('known_units')
          .update({ variations: updatedVariations, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        console.log(`Added variation "${variation}" to unit "${unitName}"`);
      }
    } else {
      // Create new unit
      await supabase
        .from('known_units')
        .insert({
          unit_name: unitName,
          variations: [variation],
          is_custom: true,
        });
      console.log(`Created new unit "${unitName}" with variation "${variation}"`);
    }
  } catch (error) {
    console.error('Error adding new unit:', error);
  }
}

/**
 * Convert number word to numeric value
 */
function convertNumberWord(word: string): number | null {
  const lowerWord = word.toLowerCase();
  return NUMBER_WORDS[lowerWord] || null;
}

/**
 * Convert fraction word to numeric value
 */
function convertFractionWord(word: string): number | null {
  const lowerWord = word.toLowerCase();
  return FRACTION_WORDS[lowerWord] || null;
}

/**
 * Parse quantity value (handles numbers, fractions, and words)
 */
function parseQuantityValue(quantityStr: string): string {
  const lowerQuantity = quantityStr.toLowerCase().trim();

  // Check for fraction words
  const fractionValue = convertFractionWord(lowerQuantity);
  if (fractionValue !== null) {
    return fractionValue.toString();
  }

  // Check for number words
  const numberValue = convertNumberWord(lowerQuantity);
  if (numberValue !== null) {
    return numberValue.toString();
  }

  // Check for numeric fractions (e.g., "1/2")
  if (lowerQuantity.includes('/')) {
    const parts = lowerQuantity.split('/');
    if (parts.length === 2) {
      const numerator = parseFloat(parts[0]);
      const denominator = parseFloat(parts[1]);
      if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
        return (numerator / denominator).toString();
      }
    }
  }

  // Check for decimal numbers
  const numericValue = parseFloat(lowerQuantity);
  if (!isNaN(numericValue)) {
    return numericValue.toString();
  }

  // If we can't parse it, return '#' to indicate unknown quantity
  return '#';
}

/**
 * Check if a word is a known unit
 */
function isKnownUnit(word: string): boolean {
  const lowerWord = word.toLowerCase();
  
  // Check if it's a base unit name
  if (UNIT_VARIATIONS[lowerWord]) {
    return true;
  }
  
  // Check if it's a variation of any unit
  for (const variations of Object.values(UNIT_VARIATIONS)) {
    if (variations.includes(lowerWord)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Normalize unit to its base form
 */
function normalizeUnit(unit: string, quantity: number): string {
  const lowerUnit = unit.toLowerCase();
  
  // Find the base unit name
  for (const [baseName, variations] of Object.entries(UNIT_VARIATIONS)) {
    if (baseName === lowerUnit || variations.includes(lowerUnit)) {
      // Return singular or plural form based on quantity
      if (quantity === 1) {
        return baseName;
      } else {
        // Simple pluralization (works for most Spanish units)
        if (baseName.endsWith('s') || baseName.endsWith('z')) {
          return baseName;
        }
        return baseName + 's';
      }
    }
  }
  
  return unit;
}

/**
 * Clean a segment by removing extra whitespace and punctuation
 */
function cleanSegment(segment: string): string {
  return segment
    .replace(/[,;]/g, '') // Remove commas and semicolons
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Parse a single segment (product line)
 */
function parseSegment(segment: string): { product: string; quantity: string; unit: string } | null {
  const cleaned = cleanSegment(segment);
  if (!cleaned) return null;

  const words = cleaned.split(/\s+/);
  
  // Try to find quantity and unit
  let quantity = '#';
  let unit = '';
  let productWords: string[] = [];
  let foundQuantity = false;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    // Check if this word is a quantity
    if (!foundQuantity) {
      const parsedQuantity = parseQuantityValue(word);
      if (parsedQuantity !== '#') {
        quantity = parsedQuantity;
        foundQuantity = true;
        
        // Check if next word is a unit
        if (i + 1 < words.length && isKnownUnit(words[i + 1])) {
          unit = normalizeUnit(words[i + 1], parseFloat(quantity));
          i++; // Skip the unit word
        }
        continue;
      }
    }
    
    // Check if this word is a unit (without explicit quantity)
    if (!foundQuantity && isKnownUnit(word)) {
      quantity = '1';
      unit = normalizeUnit(word, 1);
      foundQuantity = true;
      continue;
    }
    
    // Otherwise, it's part of the product name
    productWords.push(word);
  }

  // If we didn't find a quantity, the whole thing is the product name
  if (!foundQuantity) {
    productWords = words;
  }

  const product = productWords.join(' ').trim();
  
  if (!product) return null;

  return {
    product,
    quantity,
    unit: unit || '',
  };
}

/**
 * Split a line into segments (handles various separators)
 */
function splitLineIntoSegments(line: string): string[] {
  // Split by common separators: newlines, commas, semicolons, "y", "and"
  const segments = line.split(/[\n,;]|(?:\s+y\s+)|(?:\s+and\s+)/i);
  return segments.filter(s => s.trim().length > 0);
}

/**
 * Check if message is in horizontal format (multiple items on one line)
 */
function isHorizontalFormat(message: string): boolean {
  const lines = message.split('\n').filter(l => l.trim().length > 0);
  if (lines.length > 1) return false;
  
  // Check for separators that indicate horizontal format
  return /[,;]|(?:\s+y\s+)|(?:\s+and\s+)/i.test(message);
}

/**
 * Parse WhatsApp message into order items
 */
function parseWhatsAppMessage(message: string): any[] {
  const items: any[] = [];
  
  // Extract product list (remove greetings and closings)
  const productList = extractProductList(message);
  
  if (!productList) {
    console.log('No product list found after cleaning');
    return items;
  }

  // Determine format (horizontal or vertical)
  const isHorizontal = isHorizontalFormat(productList);
  console.log('Message format:', isHorizontal ? 'horizontal' : 'vertical');

  if (isHorizontal) {
    // Parse horizontal format (single line with separators)
    const segments = splitLineIntoSegments(productList);
    for (const segment of segments) {
      const parsed = parseSegment(segment);
      if (parsed) {
        items.push(parsed);
      }
    }
  } else {
    // Parse vertical format (one item per line)
    const lines = productList.split('\n').filter(l => l.trim().length > 0);
    for (const line of lines) {
      const parsed = parseSegment(line);
      if (parsed) {
        items.push(parsed);
      }
    }
  }

  console.log('Parsed items:', items.length);
  return items;
}

/**
 * Check if message is a greeting
 */
function isGreeting(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();
  return GREETING_PATTERNS.some(pattern => pattern.test(lowerMessage));
}

/**
 * Check if message contains "new order" keywords
 */
function isNewOrderKeyword(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return /\b(nuevo pedido|new order|pedido nuevo)\b/i.test(lowerMessage);
}

/**
 * Remove "new order" keywords from message
 */
function removeNewOrderKeywords(message: string): string {
  return message.replace(/\b(nuevo pedido|new order|pedido nuevo)\b/gi, '').trim();
}

/**
 * Format currency (Chilean Peso)
 */
function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);
}

/**
 * Format items list for WhatsApp message
 */
function formatItemsList(items: any[], showPrices: boolean = false): string {
  return items.map((item, index) => {
    const quantity = item.quantity === '#' ? '' : `${item.quantity} `;
    const unit = item.unit ? `${item.unit} ` : '';
    const productName = item.product || item.product_name || 'Producto';
    const price = showPrices && item.unit_price > 0 ? ` - ${formatCLP(item.unit_price)}` : '';
    return `${index + 1}. ${quantity}${unit}${productName}${price}`;
  }).join('\n');
}

/**
 * Create confirmation message for new order
 */
function createConfirmationMessage(customerName: string, orderNumber: string, items: any[]): string {
  return `✅ *¡Pedido Recibido!*\n\n` +
    `Hola ${customerName}, hemos recibido tu pedido correctamente.\n\n` +
    `📋 *Número de pedido:* ${orderNumber}\n\n` +
    `📦 *Productos solicitados:*\n${formatItemsList(items)}\n\n` +
    `💰 Los precios se asignarán y te confirmaremos el total cuando tu pedido esté en preparación.\n\n` +
    `Te mantendremos informado sobre el estado de tu pedido. ⏰\n\n` +
    `¡Gracias por tu preferencia! 😊`;
}

/**
 * Create blocked customer message
 */
function createBlockedCustomerMessage(customerName: string): string {
  return `Hola ${customerName},\n\n` +
    `❌ Lo sentimos, pero tu cuenta ha sido bloqueada temporalmente.\n\n` +
    `Por favor, contacta con nosotros para más información.\n\n` +
    `Gracias.`;
}

/**
 * Create help message
 */
function createHelpMessage(customerName: string): string {
  return `❌ *No pudimos identificar productos*\n\n` +
    `Hola ${customerName}! No pude identificar productos en tu mensaje.\n\n` +
    `📝 *Formato sugerido:*\n` +
    `• 3 kilos de tomates\n` +
    `• 2 kilos de palta\n` +
    `• 1 kg de papas\n` +
    `• 5 pepinos\n` +
    `• 1 cilantro\n\n` +
    `También puedes escribir:\n` +
    `• tomates 3 kilos\n` +
    `• 3k de tomates\n` +
    `• tres kilos de tomates\n` +
    `• 3kilos de papas\n` +
    `• papas 3k\n` +
    `• 1/4 de ají\n` +
    `• 1/2 kilo de papas\n` +
    `• 2 saco de papa, un cajón de tomate\n` +
    `• 2 kilos de tomates 1 kilo de papa\n` +
    `• 3kilos tomates 2kilos paltas 3 pepinos\n\n` +
    `¡Gracias por tu comprensión! 😊`;
}

/**
 * Create welcome message for new customers
 */
function createWelcomeMessage(customerName: string): string {
  return `👋 *¡Hola ${customerName}!*\n\n` +
    `Gracias por contactarnos. Para hacer un pedido, simplemente envía la lista de productos que necesitas.\n\n` +
    `📝 *Ejemplos de cómo hacer tu pedido:*\n\n` +
    `*Formato vertical:*\n` +
    `• 3 kilos de tomates\n` +
    `• 2 kilos de paltas\n` +
    `• 5 pepinos\n` +
    `• 1 cilantro\n\n` +
    `*Formato horizontal:*\n` +
    `• 3 kilos de tomates, 2 kilos de paltas, 5 pepinos\n\n` +
    `*Otros formatos válidos:*\n` +
    `• 3k de tomates\n` +
    `• tomates 3 kilos\n` +
    `• 1/4 de ají\n` +
    `• 2 saco de papa\n` +
    `• 3kilos tomates 2kilos paltas\n\n` +
    `💡 *Tip:* Puedes escribir los productos como prefieras, nosotros entenderemos tu pedido.\n\n` +
    `¿En qué podemos ayudarte hoy? 😊`;
}

/**
 * Create status update message
 */
function createStatusUpdateMessage(customerName: string, orderNumber: string, status: string, items: any[]): string {
  let statusEmoji = '📦';
  let statusText = 'actualizado';
  let additionalInfo = '';
  
  switch (status) {
    case 'preparing':
      statusEmoji = '👨‍🍳';
      statusText = 'en preparación';
      additionalInfo = '\n\nEstamos asignando los precios y preparando tu pedido.';
      break;
    case 'ready':
      statusEmoji = '✅';
      statusText = 'listo para recoger';
      additionalInfo = '\n\nTu pedido está listo. ¡Puedes pasar a recogerlo!';
      break;
    case 'delivered':
      statusEmoji = '🎉';
      statusText = 'entregado';
      additionalInfo = '\n\n¡Esperamos que disfrutes tus productos! Gracias por tu compra.';
      break;
    case 'cancelled':
      statusEmoji = '❌';
      statusText = 'cancelado';
      additionalInfo = '\n\nSi tienes alguna pregunta, no dudes en contactarnos.';
      break;
  }
  
  return `${statusEmoji} *Actualización de Pedido*\n\n` +
    `Hola ${customerName}, tu pedido ha sido actualizado.\n\n` +
    `📋 *Número de pedido:* ${orderNumber}\n` +
    `🔄 *Nuevo estado:* ${statusText}\n\n` +
    `📦 *Productos:*\n${formatItemsList(items)}${additionalInfo}\n\n` +
    `¡Gracias por tu preferencia! 😊`;
}

/**
 * Create product added message
 */
function createProductAddedMessage(customerName: string, orderNumber: string, addedProduct: any, allItems: any[]): string {
  const quantity = addedProduct.quantity === '#' ? '' : `${addedProduct.quantity} `;
  const unit = addedProduct.unit ? `${addedProduct.unit} ` : '';
  const productName = addedProduct.product || addedProduct.product_name || 'Producto';
  
  return `➕ *Producto Agregado*\n\n` +
    `Hola ${customerName}, se ha agregado un producto a tu pedido.\n\n` +
    `📋 *Número de pedido:* ${orderNumber}\n\n` +
    `✨ *Producto agregado:*\n` +
    `${quantity}${unit}${productName}\n\n` +
    `📦 *Lista completa de productos:*\n${formatItemsList(allItems)}\n\n` +
    `¡Gracias por tu preferencia! 😊`;
}

/**
 * Get status label in Spanish
 */
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'pending': 'Pendiente',
    'preparing': 'Preparando',
    'ready': 'Listo',
    'delivered': 'Entregado',
    'cancelled': 'Cancelado',
  };
  return labels[status] || status;
}

/**
 * Send WhatsApp message
 */
async function sendWhatsAppMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  message: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('WhatsApp API error:', error);
      return false;
    }

    console.log('WhatsApp message sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}

/**
 * Get customer name from database by phone number
 */
async function getCustomerNameFromDatabase(supabase: any, phone: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('name')
      .eq('phone', phone)
      .single();

    if (error || !data) {
      return null;
    }

    return data.name;
  } catch (error) {
    console.error('Error getting customer name from database:', error);
    return null;
  }
}

/**
 * Extract customer name from contact or phone
 * Prioritizes database name over WhatsApp contact name
 */
async function extractCustomerName(supabase: any, contact: any, phone: string): Promise<string> {
  // First, try to get name from database
  const dbName = await getCustomerNameFromDatabase(supabase, phone);
  if (dbName) {
    console.log('Using customer name from database:', dbName);
    return dbName;
  }
  
  // Fallback to WhatsApp contact name
  if (contact?.profile?.name) {
    console.log('Using customer name from WhatsApp contact:', contact.profile.name);
    return contact.profile.name;
  }
  
  // Use last 4 digits of phone as fallback
  const fallbackName = `Cliente ${phone.slice(-4)}`;
  console.log('Using fallback customer name:', fallbackName);
  return fallbackName;
}

/**
 * Add query to print queue
 */
async function addQueryToPrintQueue(supabase: any, queryId: string) {
  try {
    await supabase.from('print_queue').insert({
      item_type: 'query',
      item_id: queryId,
      status: 'pending',
    });
    console.log('Query added to print queue');
  } catch (error) {
    console.error('Error adding query to print queue:', error);
  }
}

/**
 * Check if customer is blocked
 */
async function isCustomerBlocked(supabase: any, phone: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('blocked')
      .eq('phone', phone)
      .single();

    if (error || !data) {
      return false;
    }

    return data.blocked === true;
  } catch (error) {
    console.error('Error checking if customer is blocked:', error);
    return false;
  }
}

serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Load known units at startup
  await loadKnownUnits(supabase);

  // Handle GET request (webhook verification)
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    // Get verify token from config
    const { data: config } = await supabase
      .from('whatsapp_config')
      .select('verify_token')
      .single();

    if (mode === 'subscribe' && token === config?.verify_token) {
      console.log('Webhook verified successfully');
      return new Response(challenge, { status: 200 });
    }

    return new Response('Forbidden', { status: 403 });
  }

  // Handle POST request (incoming messages)
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      console.log('Received webhook:', JSON.stringify(body, null, 2));

      // Extract message data
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const messages = value?.messages;

      if (!messages || messages.length === 0) {
        console.log('No messages in webhook');
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const message = messages[0];
      const from = message.from;
      const messageId = message.id;
      const messageText = message.text?.body;
      const contact = value?.contacts?.[0];

      if (!messageText) {
        console.log('No text in message');
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      console.log('Processing message from:', from);
      console.log('Message text:', messageText);

      // Get WhatsApp config
      const { data: config } = await supabase
        .from('whatsapp_config')
        .select('*')
        .single();

      if (!config || !config.is_active) {
        console.log('WhatsApp integration is not active');
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Normalize phone number
      const normalizedPhone = normalizePhoneNumber(from);
      console.log('Normalized phone:', normalizedPhone);

      // Check if customer is blocked
      const blocked = await isCustomerBlocked(supabase, normalizedPhone);
      if (blocked) {
        console.log('Customer is blocked');
        const customerName = await extractCustomerName(supabase, contact, from);
        
        // Send blocked message
        if (config.auto_reply_enabled) {
          await sendWhatsAppMessage(
            config.phone_number_id,
            config.access_token,
            from,
            createBlockedCustomerMessage(customerName)
          );
        }
        
        return new Response(JSON.stringify({ success: true, blocked: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Load authorized phones
      const authorizedPhones = await loadAuthorizedPhones(supabase);
      const isAuthorized = authorizedPhones.has(normalizedPhone);
      console.log('Is authorized:', isAuthorized);

      // Check if message is a greeting only
      if (isGreeting(messageText) && messageText.split(/\s+/).length <= 3) {
        console.log('Message is a greeting only');
        const customerName = await extractCustomerName(supabase, contact, from);
        
        if (config.auto_reply_enabled) {
          await sendWhatsAppMessage(
            config.phone_number_id,
            config.access_token,
            from,
            createWelcomeMessage(customerName)
          );
        }
        
        return new Response(JSON.stringify({ success: true, greeting: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Check if message is a question
      const isQuestion = QUESTION_PATTERNS.some(pattern => pattern.test(messageText));
      console.log('Is question:', isQuestion);

      // Parse message
      let cleanedMessage = messageText;
      const hasNewOrderKeyword = isNewOrderKeyword(messageText);
      
      if (hasNewOrderKeyword) {
        cleanedMessage = removeNewOrderKeywords(messageText);
        console.log('Removed new order keywords:', cleanedMessage);
      }

      const parsedItems = parseWhatsAppMessage(cleanedMessage);
      console.log('Parsed items:', parsedItems.length);

      // Determine if this should be a query or an order
      const shouldCreateQuery = !isAuthorized && (isQuestion || parsedItems.length === 0);
      console.log('Should create query:', shouldCreateQuery);

      if (shouldCreateQuery) {
        // Create query
        console.log('Creating query...');
        
        // Find existing pending order for this customer
        const { data: existingOrders } = await supabase
          .from('orders')
          .select('id, order_number, customer_name')
          .eq('customer_phone', normalizedPhone)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1);

        const existingOrder = existingOrders?.[0];
        
        if (existingOrder) {
          // Add query to existing order
          const { data: query, error: queryError } = await supabase
            .from('order_queries')
            .insert({
              order_id: existingOrder.id,
              customer_phone: normalizedPhone,
              query_text: messageText,
              whatsapp_message_id: messageId,
              direction: 'incoming',
            })
            .select()
            .single();

          if (queryError) {
            console.error('Error creating query:', queryError);
          } else {
            console.log('Query created for existing order:', existingOrder.order_number);
            
            // Add to print queue
            await addQueryToPrintQueue(supabase, query.id);
            
            // Send notification to all devices
            try {
              // Create local notification for all devices
              const notificationTitle = `💬 Consulta: ${existingOrder.order_number}`;
              const notificationBody = `${existingOrder.customer_name}: ${messageText.substring(0, 100)}`;
              
              // Create in-app notification
              await supabase.from('notifications').insert({
                user_id: null, // Not tied to specific user (PIN-based auth)
                title: notificationTitle,
                message: notificationBody,
                type: 'info',
                related_order_id: existingOrder.id,
                is_read: false,
              });
              
              console.log('Notification created for query');
            } catch (error) {
              console.error('Error sending notification:', error);
            }
          }
        } else {
          console.log('No existing pending order found for query');
          
          // Send help message if no products found
          const customerName = await extractCustomerName(supabase, contact, from);
          if (config.auto_reply_enabled && parsedItems.length === 0) {
            await sendWhatsAppMessage(
              config.phone_number_id,
              config.access_token,
              from,
              createHelpMessage(customerName)
            );
          }
        }
        
        return new Response(JSON.stringify({ success: true, query: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Create order
      console.log('Creating order...');
      
      const customerName = await extractCustomerName(supabase, contact, from);
      
      // Generate order number
      const { data: lastOrder } = await supabase
        .from('orders')
        .select('order_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let orderNumber = '001';
      if (lastOrder?.order_number) {
        const lastNumber = parseInt(lastOrder.order_number);
        orderNumber = (lastNumber + 1).toString().padStart(3, '0');
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_name: customerName,
          customer_phone: normalizedPhone,
          status: 'pending',
          source: 'whatsapp',
          whatsapp_message_id: messageId,
          is_read: false,
        })
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        return new Response(JSON.stringify({ success: false, error: orderError.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      console.log('Order created:', orderNumber);

      // Create order items
      for (const item of parsedItems) {
        // FIXED: Store unit with "unidad:" prefix for consistency
        const notes = item.unit ? `unidad: ${item.unit}` : null;
        
        await supabase.from('order_items').insert({
          order_id: order.id,
          product_name: item.product,
          quantity: item.quantity,
          unit_price: 0,
          notes: notes,
        });
      }

      console.log('Order items created:', parsedItems.length);

      // Send confirmation message
      if (config.auto_reply_enabled) {
        const confirmationMessage = createConfirmationMessage(customerName, orderNumber, parsedItems);
        await sendWhatsAppMessage(
          config.phone_number_id,
          config.access_token,
          from,
          confirmationMessage
        );
      }

      // Send notification to all devices
      try {
        const notificationTitle = `🛒 Nuevo Pedido: ${orderNumber}`;
        const notificationBody = `${customerName} - ${parsedItems.length} producto(s)`;
        
        // Create in-app notification
        await supabase.from('notifications').insert({
          user_id: null, // Not tied to specific user (PIN-based auth)
          title: notificationTitle,
          message: notificationBody,
          type: 'order',
          related_order_id: order.id,
          is_read: false,
        });
        
        console.log('Notification created for new order');
      } catch (error) {
        console.error('Error sending notification:', error);
      }

      return new Response(JSON.stringify({ success: true, order_number: orderNumber }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response('Method not allowed', { status: 405 });
});
