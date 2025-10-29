
/**
 * Comprehensive WhatsApp Message Parser
 * Supports multiple formats for parsing order items from WhatsApp messages
 * Enhanced to handle combined integers and fractions (e.g., "1 kilo y medio", "1 1/2")
 * Enhanced to handle combined quantity and product without spaces (e.g., "1lechuga", "lechuga1")
 * Enhanced to create products with "#" quantity when parsing fails
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
 * Map of Spanish fraction words to their numeric values
 */
const FRACTION_WORDS: Record<string, number> = {
  'medio': 0.5, 'media': 0.5,
  'un medio': 0.5, 'una media': 0.5,
  'cuarto': 0.25, 'un cuarto': 0.25,
  'tercio': 0.333, 'un tercio': 0.333,
  'octavo': 0.125, 'un octavo': 0.125,
};

/**
 * Known unit variations and their categories
 */
const UNIT_VARIATIONS: Record<string, string[]> = {
  // Peso (Weight)
  'kilo': ['kilo', 'kilos', 'kg', 'kgs', 'k'],
  'gramo': ['gramo', 'gramos', 'gr', 'grs', 'g'],
  
  // Cantidad (Count)
  'unidad': ['unidad', 'unidades', 'u', 'unds'],
  
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
  'docena': ['docena', 'docenas'],
  'bandeja': ['bandeja', 'bandejas'],
  'cesta': ['cesta', 'cestas'],
  'gamela': ['gamela', 'gamelas'],
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
 * Converts a fraction word to its numeric value
 * @param word - The word to convert (e.g., "medio", "cuarto")
 * @returns The numeric value or null if not a fraction word
 */
function convertFractionWord(word: string): number | null {
  const normalized = word.toLowerCase().trim();
  return FRACTION_WORDS[normalized] ?? null;
}

/**
 * Parses a quantity value from a string, handling fractions, decimals, and text numbers
 * Enhanced to handle combined integers and fractions (e.g., "1 1/2", "1 y medio")
 * @param quantityStr - The quantity string to parse
 * @returns The parsed quantity value as a number, or 0 if parsing fails
 */
export function parseQuantityValue(quantityStr: string): number {
  if (!quantityStr || !quantityStr.trim()) {
    return 0;
  }

  const trimmed = quantityStr.trim();

  // 1. Try as simple fraction (e.g., "1/2", "1/4", "1/8")
  if (trimmed.includes('/') && !trimmed.includes(' ')) {
    const parts = trimmed.split('/');
    if (parts.length === 2) {
      const numerator = parseFloat(parts[0].trim());
      const denominator = parseFloat(parts[1].trim());
      
      if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
        return numerator / denominator;
      }
    }
  }

  // 2. Try as combined integer and fraction with space (e.g., "1 1/2", "2 1/4")
  const combinedSpaceMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (combinedSpaceMatch) {
    const integer = parseFloat(combinedSpaceMatch[1]);
    const numerator = parseFloat(combinedSpaceMatch[2]);
    const denominator = parseFloat(combinedSpaceMatch[3]);
    
    if (!isNaN(integer) && !isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
      return integer + (numerator / denominator);
    }
  }

  // 3. Try as number (decimal or integer)
  const numValue = parseFloat(trimmed);
  if (!isNaN(numValue)) {
    return numValue;
  }

  // 4. Try as text number (e.g., "dos", "tres")
  const textValue = convertNumberWord(trimmed);
  if (textValue !== null) {
    return textValue;
  }

  // 5. Try as fraction word (e.g., "medio", "cuarto")
  const fractionValue = convertFractionWord(trimmed);
  if (fractionValue !== null) {
    return fractionValue;
  }

  // 6. Return 0 if all parsing attempts fail
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
 * Supports multiple formats including combined integers and fractions
 * Enhanced to handle combined quantity and product without spaces
 * Enhanced to create products with "#" quantity when parsing fails
 * IMPORTANT: Patterns are ordered from most specific to least specific to avoid incorrect matches
 * @param segment - The segment to parse
 * @returns Parsed order item (never null - returns unparseable item with "#" quantity if parsing fails)
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

  // Try different parsing patterns
  // IMPORTANT: More specific patterns MUST come first to avoid incorrect matches

  // NEW Pattern: Quantity + Product (no space) - e.g., "1lechuga", "2tomates", "3papas"
  // This pattern should be checked early to catch combined inputs
  let match = cleaned.match(/^(\d+(?:\/\d+)?)([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)$/i);
  if (match) {
    const quantityStr = match[1];
    const productStr = match[2];
    
    // Check if the product part is NOT a known unit
    if (!isKnownUnit(productStr)) {
      const quantity = parseQuantityValue(quantityStr);
      
      if (quantity > 0) {
        const unit = normalizeUnit('', quantity);
        console.log(`✓ Detected combined quantity+product: "${cleaned}" → ${quantity} ${unit} de ${productStr}`);
        return { quantity, unit, product: productStr.toLowerCase() };
      }
    }
  }

  // NEW Pattern: Product + Quantity (no space) - e.g., "lechuga1", "tomates2", "papas3"
  match = cleaned.match(/^([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)(\d+(?:\/\d+)?)$/i);
  if (match) {
    const productStr = match[1];
    const quantityStr = match[2];
    
    // Check if the product part is NOT a known unit
    if (!isKnownUnit(productStr)) {
      const quantity = parseQuantityValue(quantityStr);
      
      if (quantity > 0) {
        const unit = normalizeUnit('', quantity);
        console.log(`✓ Detected combined product+quantity: "${cleaned}" → ${quantity} ${unit} de ${productStr}`);
        return { quantity, unit, product: productStr.toLowerCase() };
      }
    }
  }

  // Pattern A: Integer + "y" + Fraction Word + Unit + "de" + Product
  // (e.g., "1 kilo y medio de manzanas", "2 kilos y medio de papas")
  match = cleaned.match(/^(\d+)\s+(\w+)\s+y\s+(medio|media|cuarto|tercio|octavo)\s+de\s+(.+)$/i);
  if (match) {
    const integer = parseFloat(match[1]);
    const unit = match[2];
    const fractionWord = match[3];
    const product = match[4].trim();
    
    const fractionValue = convertFractionWord(fractionWord);
    
    if (!isNaN(integer) && fractionValue !== null && product && isKnownUnit(unit)) {
      const quantity = integer + fractionValue;
      const normalizedUnit = normalizeUnit(unit, quantity);
      console.log(`✓ Pattern A matched: "${cleaned}" → ${quantity} ${normalizedUnit} de ${product}`);
      return { quantity, unit: normalizedUnit, product };
    }
  }

  // Pattern B: Integer + Unit + "y" + Fraction Word + "de" + Product
  // (e.g., "1 kilo y medio de manzanas")
  match = cleaned.match(/^(\d+)\s+(\w+)\s+y\s+(medio|media|cuarto|tercio|octavo)\s+de\s+(.+)$/i);
  if (match) {
    const integer = parseFloat(match[1]);
    const unit = match[2];
    const fractionWord = match[3];
    const product = match[4].trim();
    
    const fractionValue = convertFractionWord(fractionWord);
    
    if (!isNaN(integer) && fractionValue !== null && product && isKnownUnit(unit)) {
      const quantity = integer + fractionValue;
      const normalizedUnit = normalizeUnit(unit, quantity);
      console.log(`✓ Pattern B matched: "${cleaned}" → ${quantity} ${normalizedUnit} de ${product}`);
      return { quantity, unit: normalizedUnit, product };
    }
  }

  // Pattern C: Integer + Space + Fraction + Unit + "de" + Product
  // (e.g., "1 1/2 kilo de manzanas", "2 1/4 kilos de papas")
  // THIS MUST COME BEFORE Pattern 1 to avoid incorrect matching!
  match = cleaned.match(/^(\d+)\s+(\d+)\/(\d+)\s+(\w+)\s+de\s+(.+)$/i);
  if (match) {
    const integer = parseFloat(match[1]);
    const numerator = parseFloat(match[2]);
    const denominator = parseFloat(match[3]);
    const unit = match[4];
    const product = match[5].trim();
    
    if (!isNaN(integer) && !isNaN(numerator) && !isNaN(denominator) && denominator !== 0 && product && isKnownUnit(unit)) {
      const quantity = integer + (numerator / denominator);
      const normalizedUnit = normalizeUnit(unit, quantity);
      console.log(`✓ Pattern C matched: "${cleaned}" → ${quantity} ${normalizedUnit} de ${product}`);
      return { quantity, unit: normalizedUnit, product };
    }
  }

  // Pattern D: Integer + Space + Fraction + "de" + Product (no explicit unit)
  // (e.g., "1 1/2 de manzana")
  match = cleaned.match(/^(\d+)\s+(\d+)\/(\d+)\s+de\s+(.+)$/i);
  if (match) {
    const integer = parseFloat(match[1]);
    const numerator = parseFloat(match[2]);
    const denominator = parseFloat(match[3]);
    const product = match[4].trim();
    
    if (!isNaN(integer) && !isNaN(numerator) && !isNaN(denominator) && denominator !== 0 && product) {
      const quantity = integer + (numerator / denominator);
      const normalizedUnit = normalizeUnit('', quantity);
      console.log(`✓ Pattern D matched: "${cleaned}" → ${quantity} ${normalizedUnit} de ${product}`);
      return { quantity, unit: normalizedUnit, product };
    }
  }

  // Pattern E: Fraction Word + Unit + "de" + Product
  // (e.g., "medio kilo de papas", "un cuarto de ají")
  match = cleaned.match(/^(medio|media|un medio|una media|cuarto|un cuarto|tercio|un tercio|octavo|un octavo)\s+(\w+)\s+de\s+(.+)$/i);
  if (match) {
    const fractionWord = match[1];
    const unit = match[2];
    const product = match[3].trim();
    
    const quantity = convertFractionWord(fractionWord);
    
    if (quantity !== null && product && isKnownUnit(unit)) {
      const normalizedUnit = normalizeUnit(unit, quantity);
      console.log(`✓ Pattern E matched: "${cleaned}" → ${quantity} ${normalizedUnit} de ${product}`);
      return { quantity, unit: normalizedUnit, product };
    }
  }

  // Pattern F: Fraction Word + "de" + Product (no explicit unit)
  // (e.g., "medio de papas", "un cuarto de ají")
  match = cleaned.match(/^(medio|media|un medio|una media|cuarto|un cuarto|tercio|un tercio|octavo|un octavo)\s+de\s+(.+)$/i);
  if (match) {
    const fractionWord = match[1];
    const product = match[2].trim();
    
    const quantity = convertFractionWord(fractionWord);
    
    if (quantity !== null && product) {
      const normalizedUnit = normalizeUnit('', quantity);
      console.log(`✓ Pattern F matched: "${cleaned}" → ${quantity} ${normalizedUnit} de ${product}`);
      return { quantity, unit: normalizedUnit, product };
    }
  }

  // Pattern 1: Cantidad + Unidad + "de" + Producto (e.g., "3 kilos de tomates")
  // This is now AFTER the more specific patterns C and D
  match = cleaned.match(/^(\d+(?:\/\d+)?|\w+)\s+(\w+)\s+de\s+(.+)$/i);
  if (match) {
    const quantity = parseQuantityValue(match[1]);
    const unit = normalizeUnit(match[2], quantity);
    const product = match[3].trim();
    
    if (quantity > 0 && product) {
      console.log(`✓ Pattern 1 matched: "${cleaned}" → ${quantity} ${unit} de ${product}`);
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
      console.log(`✓ Pattern 2 matched: "${cleaned}" → ${quantity} ${unit} de ${product}`);
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
        console.log(`✓ Pattern 3 matched: "${cleaned}" → ${quantity} ${unit} de ${product}`);
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
        console.log(`✓ Pattern 4 matched: "${cleaned}" → ${quantity} ${unit} de ${product}`);
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
      console.log(`✓ Pattern 5 matched: "${cleaned}" → ${quantity} ${unit} de ${product}`);
      return { quantity, unit, product };
    }
  }

  // Pattern 6: Producto + Cantidad + Unidad (e.g., "tomates 3 kilos", "papas 2k")
  match = cleaned.match(/^(.+?)\s+(\d+(?:\/\d+)?|\w+)\s+(\w+)$/i);
  if (match) {
    const product = match[1].trim();
    const quantityStr = match[2];
    const unitStr = match[3];

    const quantity = parseQuantityValue(quantityStr);

    if (quantity > 0 && product && isKnownUnit(unitStr)) {
      const unit = normalizeUnit(unitStr, quantity);
      console.log(`✓ Pattern 6 matched: "${cleaned}" → ${quantity} ${unit} de ${product}`);
      return { quantity, unit, product };
    }
  }

  // Pattern 7: Producto + Unidad + Cantidad (e.g., "tomates kilos 3", "papas kg 2")
  match = cleaned.match(/^(.+?)\s+(\w+)\s+(\d+(?:\/\d+)?|\w+)$/i);
  if (match) {
    const product = match[1].trim();
    const unitStr = match[2];
    const quantityStr = match[3];

    if (isKnownUnit(unitStr)) {
      const quantity = parseQuantityValue(quantityStr);
      if (quantity > 0 && product) {
        const unit = normalizeUnit(unitStr, quantity);
        console.log(`✓ Pattern 7 matched: "${cleaned}" → ${quantity} ${unit} de ${product}`);
        return { quantity, unit, product };
      }
    }
  }

  // Pattern 8: Producto + Cantidad (sin unidad) (e.g., "tomates 3", "papas 2")
  match = cleaned.match(/^(.+?)\s+(\d+(?:\/\d+)?|\w+)$/i);
  if (match) {
    const product = match[1].trim();
    const quantityStr = match[2];
    
    const quantity = parseQuantityValue(quantityStr);
    
    if (quantity > 0 && product) {
      // Check if there's a unit or if it's attached to the quantity
      // Try to extract unit from quantity string (e.g., "2k" -> quantity=2, unit=k)
      const quantityMatch = quantityStr.match(/^(\d+(?:\/\d+)?)([a-zA-Z]+)$/);
      if (quantityMatch && isKnownUnit(quantityMatch[2])) {
        const qty = parseQuantityValue(quantityMatch[1]);
        const unit = normalizeUnit(quantityMatch[2], qty);
        console.log(`✓ Pattern 8 matched: "${cleaned}" → ${qty} ${unit} de ${product}`);
        return { quantity: qty, unit, product };
      } else {
        const unit = normalizeUnit('', quantity);
        console.log(`✓ Pattern 8 matched: "${cleaned}" → ${quantity} ${unit} de ${product}`);
        return { quantity, unit, product };
      }
    }
  }

  // Pattern 9: Fracción + "de" + Producto (e.g., "1/4 de ají")
  match = cleaned.match(/^(\d+\/\d+)\s+de\s+(.+)$/i);
  if (match) {
    const quantity = parseQuantityValue(match[1]);
    const product = match[2].trim();
    
    if (quantity > 0 && product) {
      const unit = normalizeUnit('', quantity);
      console.log(`✓ Pattern 9 matched: "${cleaned}" → ${quantity} ${unit} de ${product}`);
      return { quantity, unit, product };
    }
  }

  // Pattern 10: Solo Producto (sin cantidad ni unidad) - DEFAULT TO 1 UNIT
  // This handles cases like "tomillo bonito", "romero", "cilantro"
  if (cleaned.length > 0 && !cleaned.match(/^\d/) && !isKnownUnit(cleaned.split(/\s+/)[0])) {
    console.log(`✓ Pattern 10 matched (product only): "${cleaned}" → 1 unidad de ${cleaned}`);
    return { quantity: 1, unit: 'unidad', product: cleaned };
  }

  // If no pattern matched, create an unparseable item with "#" quantity
  console.warn(`✗ Could not parse segment: "${cleaned}" - creating unparseable item with "#" quantity`);
  return { quantity: '#', unit: '', product: cleaned };
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
  
  // Validate that we actually split correctly (each segment should be parseable or will be marked with #)
  // We now always return items, so no need to filter
  
  return segments;
}

/**
 * Parses a WhatsApp message into a list of order items
 * Supports all specified formats including combined integers and fractions
 * Enhanced to handle combined quantity and product without spaces
 * Enhanced to create products with "#" quantity when parsing fails
 * @param message - The WhatsApp message to parse
 * @returns An array of parsed order items (never empty - unparseable items get "#" quantity)
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
        
        // Always add the item (even if it has "#" quantity)
        orderItems.push(parsedItem);
        
        if (parsedItem.quantity === '#') {
          console.log(`⚠ Unparseable: "${segment}" → Created with "#" quantity`);
        } else {
          console.log(`✓ Parsed: "${segment}" →`, parsedItem);
        }
      } catch (error) {
        console.error(`✗ Error parsing segment "${segment}":`, error);
        // Even on error, create an unparseable item
        orderItems.push({ quantity: '#', unit: '', product: segment });
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
    // CRITICAL TEST CASE: Integer + Space + Fraction + Unit + "de" + Product
    '1 1/2 kilo de manzanas',
    '2 1/4 kilos de papas',
    '1 1/2 kilos de manzanas',
    
    // NEW: Combined quantity and product without spaces
    '1lechuga',
    '2tomates',
    '3papas',
    'lechuga1',
    'tomates2',
    'papas3',
    '5pepinos',
    'pepinos5',
    
    // Combined integer and fraction formats
    '1 kilo y medio de manzanas',
    '2 kilos y medio de papas',
    '1 1/2 de manzana',
    '3 1/4 de tomates',
    'medio kilo de papas',
    'un cuarto de ají',
    'medio de papas',
    
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
    
    // Formato 6: Producto primero + Cantidad + Unidad
    'tomates 3 kilos',
    'papas 2k',
    'cebollas 1kg',
    
    // Formato 7: Producto primero + Unidad + Cantidad
    'tomates kilos 3',
    'papas kg 2',
    'cebollas kilo 1',
    
    // Formato 8: Separados por comas
    '3 kilos de tomates, 2 kilos de papas, 1 lechuga',
    '3k tomates, 2k papas, 5 pepinos',
    
    // Formato 9: Solo producto (sin cantidad)
    'tomillo bonito',
    'romero',
    'cilantro',
    
    // Formato 10: Unidades especiales
    '3 mallas de cebolla',
    '2 saco de papa',
    'un cajón de tomate',
    '6 cabezas de ajo',
    '2 atados de cilantro',
    '2 docenas de huevos',
    '3 bandejas de fresas',
    '1 cesta de manzanas',
    '2 gamelas de papas',
    '5 unds de tomates',
    
    // Unparseable items (should get "#" quantity)
    'xyz123abc',
    '!!!',
    'producto extraño @#$',
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
cinco pepinos
tomillo bonito
romero
2 docenas de huevos
3 bandejas de fresas
1 kilo y medio de manzanas
2 1/4 kilos de peras
medio kilo de uvas
1 1/2 kilo de manzanas
1lechuga
2tomates
lechuga1
tomates2
producto extraño @#$
xyz123`;
  
  console.log('Input:');
  console.log(multiLineMessage);
  console.log('\nOutput:');
  const result = parseWhatsAppMessage(multiLineMessage);
  console.log(JSON.stringify(result, null, 2));
  
  return result;
}
