
/**
 * Intelligent WhatsApp Message Parser
 * Handles multiple order formats with advanced pattern recognition
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
  'veinte': 20,
  'treinta': 30,
  'cuarenta': 40,
  'cincuenta': 50,
};

/**
 * Map of Spanish fraction words to their numeric values
 */
const FRACTION_WORDS: Record<string, number> = {
  'medio': 0.5, 'media': 0.5,
  'cuarto': 0.25,
  'tercio': 0.33,
};

/**
 * Known unit variations and their categories
 */
const UNIT_VARIATIONS: Record<string, string[]> = {
  // Peso (Weight)
  'kilo': ['kilo', 'kilos', 'kg', 'kgs', 'k', 'kl', 'kls', 'kilogramo', 'kilogramos', 'kilo.', 'kilos.'],
  'gramo': ['gramo', 'gramos', 'gr', 'grs', 'g', 'gm', 'gms', 'gramo.', 'gramos.'],
  
  // Cantidad (Count)
  'unidad': ['unidad', 'unidades', 'u', 'unds', 'und', 'uni', 'unis', 'unid', 'unids'],
  
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
const CONNECTORS = ['de', 'y', 'con', 'sin', 'para', 'por', 'en', 'a', 'el', 'la', 'los', 'las', 'del'];

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

  const trimmed = quantityStr.trim().toLowerCase();

  // Handle "y medio" or "y media" patterns (e.g., "1 y medio", "2 y media")
  const yMedioMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*y\s*(medio|media)$/);
  if (yMedioMatch) {
    const integer = parseFloat(yMedioMatch[1]);
    if (!isNaN(integer)) {
      return integer + 0.5;
    }
  }

  // Handle "y cuarto" patterns (e.g., "1 y cuarto")
  const yCuartoMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*y\s*cuarto$/);
  if (yCuartoMatch) {
    const integer = parseFloat(yCuartoMatch[1]);
    if (!isNaN(integer)) {
      return integer + 0.25;
    }
  }

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
  
  const normalized = word.toLowerCase().trim().replace(/[.,;:!?]$/, '');
  
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

  const normalized = unit.toLowerCase().trim().replace(/[.,;:!?]$/, '');
  
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
 * Cleans and normalizes a segment for parsing
 */
function cleanSegment(segment: string): string {
  return segment
    .trim()
    .replace(/^[-•*·→➤➢▸▹►▻⇒⇨⇾⟹⟶⟼⤏⤐⤑⤔⤕⤖⤗⤘⤙⤚⤛⤜⤝⤞⤟⤠⤡⤢⤣⤤⤥⤦⤧⤨⤩⤪⤫⤬⤭⤮⤯⤰⤱⤲⤳⤴⤵⤶⤷⤸⤹⤺⤻⤼⤽⤾⤿⥀⥁⥂⥃⥄⥅⥆⥇⥈⥉⥊⥋⥌⥍⥎⥏⥐⥑⥒⥓⥔⥕⥖⥗⥘⥙⥚⥛⥜⥝⥞⥟⥠⥡⥢⥣⥤⥥⥦⥧⥨⥩⥪⥫⥬⥭⥮⥯⥰⥱⥲⥳⥴⥵⥶⥷⥸⥹⥺⥻⥼⥽⥾⥿]\s*/, '')
    .replace(/^\d+[\.\)]\s*/, '') // Remove numbered list markers (1. or 1))
    .replace(/^[a-z][\.\)]\s*/i, '') // Remove lettered list markers (a. or a))
    .trim();
}

/**
 * Advanced segment parser with multiple strategies
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

  // Strategy 1: Cantidad + "y medio/media/cuarto" + Unidad + "de" + Producto
  // Examples: "1 y medio kilo de manzanas", "2 y media libras de papas"
  let match = cleaned.match(/^(\d+(?:\.\d+)?)\s*y\s*(medio|media|cuarto)\s+(\w+)\s+de\s+(.+)$/i);
  if (match) {
    const baseQuantity = parseFloat(match[1]);
    const fractionWord = match[2].toLowerCase();
    const fractionValue = fractionWord === 'cuarto' ? 0.25 : 0.5;
    const quantity = baseQuantity + fractionValue;
    const unitStr = match[3];
    const product = match[4].trim();
    
    if (quantity > 0 && product && isKnownUnit(unitStr)) {
      const unit = normalizeUnit(unitStr, quantity);
      console.log(`✓ Strategy 1: "${cleaned}" → ${quantity} ${unit} de ${product}`);
      return { quantity, unit, product };
    }
  }

  // Strategy 2: Cantidad + "y medio/media/cuarto" + "de" + Producto (sin unidad explícita)
  // Examples: "1 y medio de manzanas", "2 y media de papas"
  match = cleaned.match(/^(\d+(?:\.\d+)?)\s*y\s*(medio|media|cuarto)\s+de\s+(.+)$/i);
  if (match) {
    const baseQuantity = parseFloat(match[1]);
    const fractionWord = match[2].toLowerCase();
    const fractionValue = fractionWord === 'cuarto' ? 0.25 : 0.5;
    const quantity = baseQuantity + fractionValue;
    const product = match[3].trim();
    
    if (quantity > 0 && product) {
      const unit = normalizeUnit('kilo', quantity); // Default to kilo for "y medio" patterns
      console.log(`✓ Strategy 2: "${cleaned}" → ${quantity} ${unit} de ${product}`);
      return { quantity, unit, product };
    }
  }

  // Strategy 3: Cantidad + Unidad + "de" + Producto
  // Examples: "3 kilos de tomates", "2 kg de papas"
  match = cleaned.match(/^(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?|\w+)\s+(\w+)\s+de\s+(.+)$/i);
  if (match) {
    const quantityStr = match[1].replace(',', '.');
    const quantity = parseQuantityValue(quantityStr);
    const unitStr = match[2];
    const product = match[3].trim();
    
    if (quantity > 0 && product && isKnownUnit(unitStr)) {
      const unit = normalizeUnit(unitStr, quantity);
      console.log(`✓ Strategy 3: "${cleaned}" → ${quantity} ${unit} de ${product}`);
      return { quantity, unit, product };
    }
  }

  // Strategy 4: Cantidad + Unidad + Producto (sin "de")
  // Examples: "3 kilos tomates", "2 kg papas"
  match = cleaned.match(/^(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?|\w+)\s+(\w+)\s+(.+)$/i);
  if (match) {
    const quantityStr = match[1].replace(',', '.');
    const potentialUnit = match[2];
    
    if (isKnownUnit(potentialUnit)) {
      const quantity = parseQuantityValue(quantityStr);
      const product = match[3].trim();
      
      if (quantity > 0 && product) {
        const unit = normalizeUnit(potentialUnit, quantity);
        console.log(`✓ Strategy 4: "${cleaned}" → ${quantity} ${unit} de ${product}`);
        return { quantity, unit, product };
      }
    }
  }

  // Strategy 5: Cantidad + Producto (sin unidad explícita)
  // Examples: "3 tomates", "5 pepinos"
  match = cleaned.match(/^(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?|\w+)\s+(.+)$/i);
  if (match) {
    const quantityStr = match[1].replace(',', '.');
    const quantity = parseQuantityValue(quantityStr);
    const restOfText = match[2].trim();
    
    // Make sure the second part is not a unit
    const firstWord = restOfText.split(/\s+/)[0];
    if (quantity > 0 && restOfText && !isKnownUnit(firstWord)) {
      const unit = normalizeUnit('', quantity);
      console.log(`✓ Strategy 5: "${cleaned}" → ${quantity} ${unit} de ${restOfText}`);
      return { quantity, unit, product: restOfText };
    }
  }

  // Strategy 6: Producto + Cantidad + Unidad (orden invertido)
  // Examples: "tomates 3 kilos", "papas 2 kg"
  match = cleaned.match(/^([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+?)\s+(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?|\w+)\s+(\w+)$/i);
  if (match) {
    const product = match[1].trim();
    const quantityStr = match[2].replace(',', '.');
    const unitStr = match[3];
    
    if (isKnownUnit(unitStr)) {
      const quantity = parseQuantityValue(quantityStr);
      
      if (quantity > 0 && product) {
        const unit = normalizeUnit(unitStr, quantity);
        console.log(`✓ Strategy 6: "${cleaned}" → ${quantity} ${unit} de ${product}`);
        return { quantity, unit, product };
      }
    }
  }

  // Strategy 7: Producto + Cantidad (sin unidad, orden invertido)
  // Examples: "tomates 3", "pepinos 5"
  match = cleaned.match(/^([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+?)\s+(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?|\w+)$/i);
  if (match) {
    const product = match[1].trim();
    const quantityStr = match[2].replace(',', '.');
    const quantity = parseQuantityValue(quantityStr);
    
    if (quantity > 0 && product && !isKnownUnit(product.split(/\s+/).pop() || '')) {
      const unit = normalizeUnit('', quantity);
      console.log(`✓ Strategy 7: "${cleaned}" → ${quantity} ${unit} de ${product}`);
      return { quantity, unit, product };
    }
  }

  // Strategy 8: Solo Producto (default to 1 unit)
  // Examples: "tomates", "cilantro"
  if (cleaned.length > 0 && !cleaned.match(/^\d/) && !isKnownUnit(cleaned.split(/\s+/)[0])) {
    console.log(`✓ Strategy 8: "${cleaned}" → 1 unidad de ${cleaned}`);
    return { quantity: 1, unit: 'unidad', product: cleaned };
  }

  // Strategy 9: Unidad + "de" + Producto (sin cantidad explícita, asume 1)
  // Examples: "kilo de tomates", "bolsa de papas"
  match = cleaned.match(/^(\w+)\s+de\s+(.+)$/i);
  if (match) {
    const unitStr = match[1];
    const product = match[2].trim();
    
    if (isKnownUnit(unitStr) && product) {
      const quantity = 1;
      const unit = normalizeUnit(unitStr, quantity);
      console.log(`✓ Strategy 9: "${cleaned}" → ${quantity} ${unit} de ${product}`);
      return { quantity, unit, product };
    }
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

  // Split by commas, semicolons, or pipe characters
  if (trimmed.match(/[,;|]/)) {
    return trimmed.split(/[,;|]/).map(s => s.trim()).filter(s => s.length > 0);
  }

  // Check for multiple items on same line with "y" separator
  // Example: "3 kilos de tomates y 2 kilos de papas"
  const yPattern = /\s+y\s+(?=\d)/i;
  if (yPattern.test(trimmed)) {
    return trimmed.split(yPattern).map(s => s.trim()).filter(s => s.length > 0);
  }

  return [trimmed];
}

/**
 * Detects if the message is in horizontal format (comma-separated or "y" separated)
 */
function isHorizontalFormat(message: string): boolean {
  const lines = message.split('\n').filter(l => l.trim().length > 0);
  
  // If only one line with commas or semicolons, it's horizontal
  if (lines.length === 1 && message.match(/[,;|]/)) {
    return true;
  }
  
  // If lines contain "y" separators between quantities, it's horizontal
  const yPattern = /\s+y\s+\d/i;
  if (lines.some(line => yPattern.test(line))) {
    return true;
  }
  
  return false;
}

/**
 * Parses a WhatsApp message into a list of order items
 * Intelligently handles multiple formats and variations
 */
export function parseWhatsAppMessage(message: string): ParsedOrderItem[] {
  if (!message || !message.trim()) {
    console.warn('Empty message provided');
    return [];
  }

  const lines = message.split('\n');
  const orderItems: ParsedOrderItem[] = [];

  console.log(`\n========== INTELLIGENT PARSING (${lines.length} lines) ==========`);
  console.log(`Format: ${isHorizontalFormat(message) ? 'HORIZONTAL' : 'VERTICAL'}`);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      continue;
    }

    console.log(`\n--- Line ${i + 1}: "${line}"`);

    // Split line into segments (handles comma-separated, semicolon-separated, and "y" separated items)
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
