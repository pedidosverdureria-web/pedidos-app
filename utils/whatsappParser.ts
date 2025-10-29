
/**
 * Simple WhatsApp Message Parser
 * Handles basic order formats
 */

/**
 * Represents a parsed order item from a WhatsApp message.
 */
export interface ParsedOrderItem {
  quantity: number | string; // Can be number or "#" for unparseable items
  unit: string;
  product: string;
}

/**
 * Parses a quantity value from a string
 */
export function parseQuantityValue(quantityStr: string): number {
  if (!quantityStr || !quantityStr.trim()) {
    return 0;
  }

  const trimmed = quantityStr.trim().replace(',', '.');

  // Simple fraction (e.g., "1/2")
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

  // Number (decimal or integer)
  const numValue = parseFloat(trimmed);
  if (!isNaN(numValue)) {
    return numValue;
  }

  console.warn(`Could not parse quantity: "${quantityStr}"`);
  return 0;
}

/**
 * Normalizes a unit to its standard form
 */
export function normalizeUnit(unit: string, quantity: number = 1): string {
  if (!unit || !unit.trim()) {
    return quantity === 1 ? 'unidad' : 'unidades';
  }

  const normalized = unit.toLowerCase().trim().replace(/[.,;:!?]$/, '');
  
  // Basic unit mappings
  const unitMap: Record<string, string> = {
    'kilo': 'kilo',
    'kilos': 'kilos',
    'kg': 'kilo',
    'kgs': 'kilos',
    'k': 'kilo',
    'gramo': 'gramo',
    'gramos': 'gramos',
    'gr': 'gramo',
    'g': 'gramo',
    'unidad': 'unidad',
    'unidades': 'unidades',
    'u': 'unidad',
    'und': 'unidad',
    'bolsa': 'bolsa',
    'bolsas': 'bolsas',
    'malla': 'malla',
    'mallas': 'mallas',
    'saco': 'saco',
    'sacos': 'sacos',
  };
  
  return unitMap[normalized] || normalized;
}

/**
 * Cleans a segment for parsing
 */
function cleanSegment(segment: string): string {
  return segment
    .trim()
    .replace(/^[-•*·]\s*/, '')
    .replace(/^\d+[.)]\s*/, '')
    .trim();
}

/**
 * Parses a single segment
 */
function parseSegment(segment: string): ParsedOrderItem {
  const trimmed = segment.trim();
  
  if (!trimmed) {
    return { quantity: '#', unit: '', product: trimmed };
  }

  const cleaned = cleanSegment(trimmed);
  
  if (!cleaned) {
    return { quantity: '#', unit: '', product: trimmed };
  }

  // Pattern 1: Cantidad + Unidad + "de" + Producto
  // Examples: "3 kilos de tomates", "2 kg de papas"
  let match = cleaned.match(/^(\d+(?:[.,]\d+)?(?:\/\d+)?)\s+(\w+)\s+de\s+(.+)$/i);
  if (match) {
    const quantityStr = match[1].replace(',', '.');
    const quantity = parseQuantityValue(quantityStr);
    const unitStr = match[2];
    const product = match[3].trim();
    
    if (quantity > 0 && product) {
      const unit = normalizeUnit(unitStr, quantity);
      return { quantity, unit, product };
    }
  }

  // Pattern 2: Cantidad + Unidad + Producto (sin "de")
  // Examples: "3 kilos tomates", "2 kg papas"
  match = cleaned.match(/^(\d+(?:[.,]\d+)?(?:\/\d+)?)\s+(\w+)\s+(.+)$/i);
  if (match) {
    const quantityStr = match[1].replace(',', '.');
    const quantity = parseQuantityValue(quantityStr);
    const unitStr = match[2];
    const product = match[3].trim();
    
    if (quantity > 0 && product) {
      const unit = normalizeUnit(unitStr, quantity);
      return { quantity, unit, product };
    }
  }

  // Pattern 3: Cantidad + Producto (sin unidad)
  // Examples: "3 tomates", "5 pepinos"
  match = cleaned.match(/^(\d+(?:[.,]\d+)?(?:\/\d+)?)\s+(.+)$/i);
  if (match) {
    const quantityStr = match[1].replace(',', '.');
    const quantity = parseQuantityValue(quantityStr);
    const product = match[2].trim();
    
    if (quantity > 0 && product) {
      const unit = normalizeUnit('', quantity);
      return { quantity, unit, product };
    }
  }

  // Pattern 4: Solo Producto (default to 1 unit)
  // Examples: "tomates", "cilantro"
  if (cleaned.length > 0 && !cleaned.match(/^\d/)) {
    return { quantity: 1, unit: 'unidad', product: cleaned };
  }

  // Fallback: unparseable item
  console.warn(`Could not parse: "${cleaned}"`);
  return { quantity: '#', unit: '', product: cleaned };
}

/**
 * Splits a line into segments
 */
function splitLineIntoSegments(line: string): string[] {
  const trimmed = line.trim();
  
  if (!trimmed) {
    return [];
  }

  // Split by commas or semicolons
  if (trimmed.match(/[,;]/)) {
    return trimmed.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 0);
  }

  return [trimmed];
}

/**
 * Parses a WhatsApp message into a list of order items
 */
export function parseWhatsAppMessage(message: string): ParsedOrderItem[] {
  if (!message || !message.trim()) {
    console.warn('Empty message provided');
    return [];
  }

  const lines = message.split('\n');
  const orderItems: ParsedOrderItem[] = [];

  console.log(`\n========== PARSING ${lines.length} LINES ==========`);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) {
      continue;
    }

    const segments = splitLineIntoSegments(line);

    for (const segment of segments) {
      try {
        const parsedItem = parseSegment(segment);
        orderItems.push(parsedItem);
        
        if (parsedItem.quantity === '#') {
          console.log(`⚠ Unparseable: "${segment}"`);
        } else {
          console.log(`✓ Parsed: "${segment}" → ${parsedItem.quantity} ${parsedItem.unit} de ${parsedItem.product}`);
        }
      } catch (error) {
        console.error(`Error parsing segment "${segment}":`, error);
        orderItems.push({ quantity: '#', unit: '', product: segment });
      }
    }
  }

  console.log(`\n========== PARSING COMPLETE: ${orderItems.length} items ==========\n`);
  return orderItems;
}
