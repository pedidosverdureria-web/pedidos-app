
/**
 * Basic WhatsApp Message Parser
 * Handles standard order formats with quantity, unit, and product
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
};

/**
 * Map of Spanish fraction words to their numeric values
 */
const FRACTION_WORDS: Record<string, number> = {
  'medio': 0.5, 'media': 0.5,
  'cuarto': 0.25,
};

/**
 * Known unit variations and their categories
 */
const UNIT_VARIATIONS: Record<string, string[]> = {
  // Peso (Weight)
  'kilo': ['kilo', 'kilos', 'kg', 'kgs', 'k', 'kl', 'kls', 'kilogramo', 'kilogramos'],
  'gramo': ['gramo', 'gramos', 'gr', 'grs', 'g', 'gm', 'gms'],
  
  // Cantidad (Count)
  'unidad': ['unidad', 'unidades', 'u', 'unds', 'und', 'uni', 'unis'],
  
  // Empaque (Packaging)
  'malla': ['malla', 'mallas'],
  'saco': ['saco', 'sacos'],
  'cajón': ['cajón', 'cajon', 'cajones'],
  
  // Contenedor (Container)
  'bolsa': ['bolsa', 'bolsas'],
  'paquete': ['paquete', 'paquetes', 'pqte', 'pqtes', 'paq', 'paqs'],
  
  // Otros (Others)
  'caja': ['caja', 'cajas'],
  'atado': ['atado', 'atados'],
  'racimo': ['racimo', 'racimos'],
  'cabeza': ['cabeza', 'cabezas'],
  'docena': ['docena', 'docenas', 'doc', 'docs'],
  'bandeja': ['bandeja', 'bandejas'],
  'cesta': ['cesta', 'cestas', 'canasta', 'canastas'],
  'gamela': ['gamela', 'gamelas'],
  'mano': ['mano', 'manos'],
  'cuelga': ['cuelga', 'cuelgas'],
  'libra': ['libra', 'libras', 'lb', 'lbs'],
};

/**
 * Connectors and prepositions to ignore
 */
const CONNECTORS = ['de', 'y', 'con', 'sin', 'para', 'por', 'en', 'a', 'el', 'la', 'los', 'las'];

/**
 * Converts a number word to its numeric value
 */
function convertNumberWord(word: string): number | null {
  const normalized = word.toLowerCase().trim();
  return NUMBER_WORDS[normalized] ?? null;
}

/**
 * Converts a fraction word to its numeric value
 */
function convertFractionWord(word: string): number | null {
  const normalized = word.toLowerCase().trim();
  return FRACTION_WORDS[normalized] ?? null;
}

/**
 * Parses a quantity value from a string, handling fractions, decimals, and text numbers
 */
export function parseQuantityValue(quantityStr: string): number {
  if (!quantityStr || !quantityStr.trim()) {
    return 0;
  }

  const trimmed = quantityStr.trim();

  // Combined integer and fraction with space (e.g., "1 1/2")
  const combinedSpaceMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (combinedSpaceMatch) {
    const integer = parseFloat(combinedSpaceMatch[1]);
    const numerator = parseFloat(combinedSpaceMatch[2]);
    const denominator = parseFloat(combinedSpaceMatch[3]);
    
    if (!isNaN(integer) && !isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
      return integer + (numerator / denominator);
    }
  }

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

  // Text number (e.g., "dos", "tres")
  const textValue = convertNumberWord(trimmed);
  if (textValue !== null) {
    return textValue;
  }

  // Fraction word (e.g., "medio", "cuarto")
  const fractionValue = convertFractionWord(trimmed);
  if (fractionValue !== null) {
    return fractionValue;
  }

  console.warn(`Could not parse quantity: "${quantityStr}"`);
  return 0;
}

/**
 * Checks if a word is a known unit
 */
export function isKnownUnit(word: string): boolean {
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
 * Normalizes a unit to its standard form (singular or plural based on quantity)
 */
export function normalizeUnit(unit: string, quantity: number = 1): string {
  if (!unit || !unit.trim()) {
    return quantity === 1 ? 'unidad' : 'unidades';
  }

  const normalized = unit.toLowerCase().trim();
  
  // Find which standard unit this variation belongs to
  for (const [standardUnit, variations] of Object.entries(UNIT_VARIATIONS)) {
    if (variations.includes(normalized)) {
      // Return singular or plural based on quantity
      if (quantity === 1) {
        return standardUnit;
      } else {
        // Add 's' for plural (with special cases)
        if (standardUnit === 'cajón') return 'cajones';
        if (standardUnit.endsWith('z')) return standardUnit.slice(0, -1) + 'ces';
        return standardUnit + 's';
      }
    }
  }
  
  // If not found in variations, return as-is or default to unidad/unidades
  return quantity === 1 ? 'unidad' : 'unidades';
}

/**
 * Basic segment parser
 */
function parseSegment(segment: string): ParsedOrderItem {
  const trimmed = segment.trim();
  
  if (!trimmed) {
    return { quantity: '#', unit: '', product: trimmed };
  }

  // Remove common separators and clean up
  const cleaned = trimmed.replace(/^[-•*]\s*/, '').trim();
  
  if (!cleaned) {
    return { quantity: '#', unit: '', product: trimmed };
  }

  // Pattern 1: Cantidad + Unidad + "de" + Producto (e.g., "3 kilos de tomates")
  let match = cleaned.match(/^(\d+(?:\/\d+)?|\w+)\s+(\w+)\s+de\s+(.+)$/i);
  if (match) {
    const quantity = parseQuantityValue(match[1]);
    const unit = normalizeUnit(match[2], quantity);
    const product = match[3].trim();
    
    if (quantity > 0 && product) {
      console.log(`✓ Pattern 1: "${cleaned}" → ${quantity} ${unit} de ${product}`);
      return { quantity, unit, product };
    }
  }

  // Pattern 2: Cantidad + Unidad + Producto (sin "de") (e.g., "3 kilos tomates")
  match = cleaned.match(/^(\d+(?:\/\d+)?|\w+)\s+(\w+)\s+(.+)$/i);
  if (match) {
    const potentialUnit = match[2];
    if (isKnownUnit(potentialUnit)) {
      const quantity = parseQuantityValue(match[1]);
      const unit = normalizeUnit(potentialUnit, quantity);
      const product = match[3].trim();
      
      if (quantity > 0 && product) {
        console.log(`✓ Pattern 2: "${cleaned}" → ${quantity} ${unit} de ${product}`);
        return { quantity, unit, product };
      }
    }
  }

  // Pattern 3: Cantidad + Producto (sin unidad) (e.g., "3 tomates")
  match = cleaned.match(/^(\d+(?:\/\d+)?|\w+)\s+(.+)$/i);
  if (match) {
    const quantity = parseQuantityValue(match[1]);
    const product = match[2].trim();
    
    // Make sure the second part is not a unit
    if (quantity > 0 && product && !isKnownUnit(product.split(/\s+/)[0])) {
      const unit = normalizeUnit('', quantity);
      console.log(`✓ Pattern 3: "${cleaned}" → ${quantity} ${unit} de ${product}`);
      return { quantity, unit, product };
    }
  }

  // Pattern 4: Solo Producto (default to 1 unit) (e.g., "tomates")
  if (cleaned.length > 0 && !cleaned.match(/^\d/)) {
    console.log(`✓ Pattern 4: "${cleaned}" → 1 unidad de ${cleaned}`);
    return { quantity: 1, unit: 'unidad', product: cleaned };
  }

  // Fallback: unparseable item with "#" quantity
  console.warn(`✗ Could not parse: "${cleaned}"`);
  return { quantity: '#', unit: '', product: cleaned };
}

/**
 * Splits a line into multiple segments if it contains multiple items
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

  console.log(`\n========== PARSING (${lines.length} lines) ==========`);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      continue;
    }

    console.log(`\n--- Line ${i + 1}: "${line}"`);

    // Split line into segments (handles comma-separated items)
    const segments = splitLineIntoSegments(line);
    
    console.log(`  Segments: ${segments.length}`);

    for (const segment of segments) {
      try {
        const parsedItem = parseSegment(segment);
        
        // Always add the item (even if it has "#" quantity)
        orderItems.push(parsedItem);
        
        if (parsedItem.quantity === '#') {
          console.log(`  ⚠ Unparseable: "${segment}"`);
        } else {
          console.log(`  ✓ Success: "${segment}" → ${parsedItem.quantity} ${parsedItem.unit} de ${parsedItem.product}`);
        }
      } catch (error) {
        console.error(`  ✗ Error parsing segment "${segment}":`, error);
        // Even on error, create an unparseable item
        orderItems.push({ quantity: '#', unit: '', product: segment });
      }
    }
  }

  console.log(`\n========== PARSING COMPLETE: ${orderItems.length} items ==========\n`);
  return orderItems;
}
