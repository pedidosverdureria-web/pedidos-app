
/**
 * Comprehensive WhatsApp Message Parser
 * Supports multiple formats for parsing order items from WhatsApp messages
 */

/**
 * Represents a parsed order item from a WhatsApp message.
 */
export interface ParsedOrderItem {
  quantity: number;
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
  // Peso (Weight)
  'kilo': ['kilo', 'kilos', 'kg', 'kgs', 'k'],
  'gramo': ['gramo', 'gramos', 'gr', 'grs', 'g'],
  
  // Cantidad (Count)
  'unidad': ['unidad', 'unidades', 'u'],
  
  // Empaque (Packaging)
  'malla': ['malla', 'mallas'],
  'saco': ['saco', 'sacos'],
  'cajón': ['cajón', 'cajon', 'cajones'],
  
  // Contenedor (Container)
  'bolsa': ['bolsa', 'bolsas'],
  'paquete': ['paquete', 'paquetes', 'pqte', 'pqtes'],
  
  // Otros (Others)
  'caja': ['caja', 'cajas'],
  'atado': ['atado', 'atados'],
  'racimo': ['racimo', 'racimos'],
  'cabeza': ['cabeza', 'cabezas'],
};

/**
 * Converts a number word to its numeric value
 * @param word - The word to convert (e.g., "dos", "tres")
 * @returns The numeric value or null if not a number word
 */
function convertNumberWord(word: string): number | null {
  const normalized = word.toLowerCase().trim();
  return NUMBER_WORDS[normalized] ?? null;
}

/**
 * Parses a quantity value from a string, handling fractions, decimals, and text numbers
 * @param quantityStr - The quantity string to parse
 * @returns The parsed quantity value as a number, or 0 if parsing fails
 */
export function parseQuantityValue(quantityStr: string): number {
  if (!quantityStr || !quantityStr.trim()) {
    return 0;
  }

  const trimmed = quantityStr.trim();

  // 1. Try as fraction (e.g., "1/2", "1/4", "1/8")
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

  // 2. Try as number (decimal or integer)
  const numValue = parseFloat(trimmed);
  if (!isNaN(numValue)) {
    return numValue;
  }

  // 3. Try as text number (e.g., "dos", "tres")
  const textValue = convertNumberWord(trimmed);
  if (textValue !== null) {
    return textValue;
  }

  // 4. Return 0 if all parsing attempts fail
  console.warn(`Could not parse quantity: "${quantityStr}"`);
  return 0;
}

/**
 * Checks if a word is a known unit
 * @param word - The word to check
 * @returns True if the word is a known unit, false otherwise
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
 * @param unit - The unit string to normalize
 * @param quantity - The quantity to determine singular/plural
 * @returns The normalized unit string
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
 * Parses a single line or segment from the WhatsApp message
 * Supports multiple formats
 * @param segment - The segment to parse
 * @returns Parsed order item or null if parsing fails
 */
function parseSegment(segment: string): ParsedOrderItem | null {
  const trimmed = segment.trim();
  
  if (!trimmed) {
    return null;
  }

  // Remove common separators and clean up
  const cleaned = trimmed.replace(/^[-•*]\s*/, '').trim();
  
  if (!cleaned) {
    return null;
  }

  // Try different parsing patterns
  
  // Pattern 1: Cantidad + Unidad + "de" + Producto (e.g., "3 kilos de tomates")
  let match = cleaned.match(/^(\d+(?:\/\d+)?|\w+)\s+(\w+)\s+de\s+(.+)$/i);
  if (match) {
    const quantity = parseQuantityValue(match[1]);
    const unit = normalizeUnit(match[2], quantity);
    const product = match[3].trim();
    
    if (quantity > 0 && product) {
      return { quantity, unit, product };
    }
  }

  // Pattern 2: Cantidad + Unidad (sin espacio) + "de" + Producto (e.g., "3kilos de tomates", "2k de papas")
  match = cleaned.match(/^(\d+(?:\/\d+)?)([a-zA-Z]+)\s+de\s+(.+)$/i);
  if (match) {
    const quantity = parseQuantityValue(match[1]);
    const unit = normalizeUnit(match[2], quantity);
    const product = match[3].trim();
    
    if (quantity > 0 && product) {
      return { quantity, unit, product };
    }
  }

  // Pattern 3: Cantidad + Unidad (sin espacio) + Producto (e.g., "3kilos tomates", "2k papas")
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

  // Pattern 4: Cantidad + Unidad + Producto (con espacio) (e.g., "3 kilos tomates")
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

  // Pattern 5: Cantidad + Producto (sin unidad explícita) (e.g., "3 tomates", "dos pepinos")
  match = cleaned.match(/^(\d+(?:\/\d+)?|\w+)\s+(.+)$/i);
  if (match) {
    const quantity = parseQuantityValue(match[1]);
    const product = match[2].trim();
    
    // Make sure the second part is not a unit
    if (quantity > 0 && product && !isKnownUnit(product.split(/\s+/)[0])) {
      const unit = normalizeUnit('', quantity);
      return { quantity, unit, product };
    }
  }

  // Pattern 6: Producto + Cantidad + Unidad (e.g., "tomates 3 kilos", "papas 2k")
  match = cleaned.match(/^(.+?)\s+(\d+(?:\/\d+)?|\w+)\s*([a-zA-Z]*)$/i);
  if (match) {
    const product = match[1].trim();
    const quantityStr = match[2];
    const unitStr = match[3];
    
    const quantity = parseQuantityValue(quantityStr);
    
    if (quantity > 0 && product) {
      // Check if there's a unit or if it's attached to the quantity
      if (unitStr && isKnownUnit(unitStr)) {
        const unit = normalizeUnit(unitStr, quantity);
        return { quantity, unit, product };
      } else {
        // Try to extract unit from quantity string (e.g., "2k" -> quantity=2, unit=k)
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

  // Pattern 7: Fracción + "de" + Producto (e.g., "1/4 de ají")
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
 * Splits a line into multiple segments if it contains multiple items
 * Handles comma-separated items and items without separators
 * @param line - The line to split
 * @returns Array of segments
 */
function splitLineIntoSegments(line: string): string[] {
  const trimmed = line.trim();
  
  if (!trimmed) {
    return [];
  }

  // First, try splitting by commas
  if (trimmed.includes(',')) {
    return trimmed.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }

  // Try to detect multiple items in one line without separators
  // Look for patterns like "3kilos tomates 2kilos papas"
  const segments: string[] = [];
  let currentSegment = '';
  const words = trimmed.split(/\s+/);
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    // Check if this word starts a new item (quantity pattern)
    const isQuantityStart = /^\d+(?:\/\d+)?[a-zA-Z]*$/.test(word) || convertNumberWord(word) !== null;
    
    if (isQuantityStart && currentSegment.trim().length > 0) {
      // This looks like the start of a new item
      segments.push(currentSegment.trim());
      currentSegment = word;
    } else {
      currentSegment += (currentSegment ? ' ' : '') + word;
    }
  }
  
  if (currentSegment.trim().length > 0) {
    segments.push(currentSegment.trim());
  }
  
  // If we only got one segment, return it as-is
  if (segments.length === 1) {
    return [trimmed];
  }
  
  // Validate that we actually split correctly (each segment should be parseable)
  const validSegments = segments.filter(seg => {
    const parsed = parseSegment(seg);
    return parsed !== null;
  });
  
  // If splitting didn't work well, return the original line
  if (validSegments.length === 0) {
    return [trimmed];
  }
  
  return segments;
}

/**
 * Parses a WhatsApp message into a list of order items
 * Supports all specified formats
 * @param message - The WhatsApp message to parse
 * @returns An array of parsed order items
 */
export function parseWhatsAppMessage(message: string): ParsedOrderItem[] {
  if (!message || !message.trim()) {
    console.warn('Empty message provided');
    return [];
  }

  const lines = message.split('\n');
  const orderItems: ParsedOrderItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      continue;
    }

    // Split line into segments (handles comma-separated and multiple items)
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

  console.log(`\nParsed ${orderItems.length} items from ${lines.length} lines`);
  return orderItems;
}

/**
 * Test function to validate parser with various formats
 */
export function testParser() {
  const testCases = [
    // Formato 1: Cantidad + Unidad + "de" + Producto
    '3 kilos de tomates',
    '2 kilos de papas',
    '1 kilo de cebollas',
    
    // Formato 2: Cantidad + Unidad (sin espacio) + Producto
    '3kilos de tomates',
    '2k de papas',
    '1kg de cebollas',
    '12kilos de papas',
    
    // Formato 3: Cantidad + Producto (sin unidad explícita)
    '3 tomates',
    '2 pepinos',
    '1 lechuga',
    '5 pepinos',
    
    // Formato 4: Fracciones
    '1/2 kilo de papas',
    '1/4 de ají',
    '1/8 kilo de cilantro',
    '1/2 kg de tomates',
    
    // Formato 5: Números en texto
    'dos kilos de tomates',
    'tres papas',
    'un kilo de cebollas',
    'una lechuga',
    'cinco pepinos',
    
    // Formato 6: Producto primero + Cantidad
    'tomates 3 kilos',
    'papas 2k',
    'cebollas 1kg',
    
    // Formato 8: Separados por comas
    '3 kilos de tomates, 2 kilos de papas, 1 lechuga',
    '3k tomates, 2k papas, 5 pepinos',
    
    // Formato 10: Unidades especiales
    '3 mallas de cebolla',
    '2 saco de papa',
    'un cajón de tomate',
    '6 cabezas de ajo',
    '2 atados de cilantro',
  ];

  console.log('=== WhatsApp Parser Test ===\n');
  
  for (const testCase of testCases) {
    console.log(`\nInput: "${testCase}"`);
    const result = parseWhatsAppMessage(testCase);
    console.log('Output:', JSON.stringify(result, null, 2));
  }
  
  // Test multi-line message
  console.log('\n\n=== Multi-line Test ===');
  const multiLineMessage = `3 kilos de tomates
2 kilos de papas
1 lechuga
1/2 kilo de cilantro
cinco pepinos`;
  
  console.log('Input:');
  console.log(multiLineMessage);
  console.log('\nOutput:');
  const result = parseWhatsAppMessage(multiLineMessage);
  console.log(JSON.stringify(result, null, 2));
  
  return result;
}
