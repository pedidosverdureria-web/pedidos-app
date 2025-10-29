
/**
 * INTELLIGENT WhatsApp Message Parser
 * Enhanced with NLP capabilities to recognize orders in ANY format
 * Supports multiple formats, typos, variations, and context-aware parsing
 * SEQUENTIAL VALIDATION: Patterns ordered from most specific to least specific
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
 * Common product aliases and variations (for fuzzy matching)
 */
const PRODUCT_ALIASES: Record<string, string[]> = {
  'tomate': ['tomate', 'tomates', 'tomatito', 'tomatitos', 'jitomate', 'jitomates'],
  'papa': ['papa', 'papas', 'patata', 'patatas'],
  'cebolla': ['cebolla', 'cebollas', 'cebollita', 'cebollitas'],
  'lechuga': ['lechuga', 'lechugas'],
  'zanahoria': ['zanahoria', 'zanahorias'],
  'pepino': ['pepino', 'pepinos'],
  'palta': ['palta', 'paltas', 'aguacate', 'aguacates'],
  'limón': ['limón', 'limon', 'limones'],
  'naranja': ['naranja', 'naranjas'],
  'manzana': ['manzana', 'manzanas'],
  'plátano': ['plátano', 'platano', 'plátanos', 'platanos', 'banana', 'bananas', 'banano', 'bananos'],
  'cilantro': ['cilantro', 'culantro'],
  'perejil': ['perejil'],
  'ají': ['ají', 'aji', 'ajíes', 'ajies', 'chile', 'chiles'],
  'pimentón': ['pimentón', 'pimenton', 'pimentones', 'pimiento', 'pimientos'],
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
 * Enhanced to handle combined integers and fractions (e.g., "1 1/2", "1 y medio")
 */
export function parseQuantityValue(quantityStr: string): number {
  if (!quantityStr || !quantityStr.trim()) {
    return 0;
  }

  const trimmed = quantityStr.trim();

  // 1. PRIORITY: Try as combined integer and fraction with space (e.g., "1 1/2", "2 1/4")
  const combinedSpaceMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (combinedSpaceMatch) {
    const integer = parseFloat(combinedSpaceMatch[1]);
    const numerator = parseFloat(combinedSpaceMatch[2]);
    const denominator = parseFloat(combinedSpaceMatch[3]);
    
    if (!isNaN(integer) && !isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
      return integer + (numerator / denominator);
    }
  }

  // 2. Try as simple fraction (e.g., "1/2", "1/4", "1/8")
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
 * Normalizes a product name (removes accents, converts to lowercase, handles aliases)
 */
function normalizeProductName(product: string): string {
  if (!product) return '';
  
  let normalized = product.toLowerCase().trim();
  
  // Remove accents
  normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Check if it matches any known alias
  for (const [canonical, aliases] of Object.entries(PRODUCT_ALIASES)) {
    for (const alias of aliases) {
      const normalizedAlias = alias.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (normalized === normalizedAlias) {
        return canonical;
      }
    }
  }
  
  return normalized;
}

/**
 * Extracts quantity indicators from text (numbers, fractions, text numbers)
 */
function extractQuantityIndicators(text: string): { value: number; position: number; length: number }[] {
  const indicators: { value: number; position: number; length: number }[] = [];
  
  // Pattern 1: Integer + Space + Fraction (e.g., "1 1/2")
  const combinedPattern = /(\d+)\s+(\d+)\/(\d+)/g;
  let match;
  while ((match = combinedPattern.exec(text)) !== null) {
    const integer = parseFloat(match[1]);
    const numerator = parseFloat(match[2]);
    const denominator = parseFloat(match[3]);
    if (!isNaN(integer) && !isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
      indicators.push({
        value: integer + (numerator / denominator),
        position: match.index,
        length: match[0].length
      });
    }
  }
  
  // Pattern 2: Simple fraction (e.g., "1/2")
  const fractionPattern = /\b(\d+)\/(\d+)\b/g;
  while ((match = fractionPattern.exec(text)) !== null) {
    const numerator = parseFloat(match[1]);
    const denominator = parseFloat(match[2]);
    if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
      // Check if not already captured by combined pattern
      const alreadyCaptured = indicators.some(ind => 
        ind.position <= match.index && ind.position + ind.length >= match.index + match[0].length
      );
      if (!alreadyCaptured) {
        indicators.push({
          value: numerator / denominator,
          position: match.index,
          length: match[0].length
        });
      }
    }
  }
  
  // Pattern 3: Decimal numbers (e.g., "1.5", "2.25")
  const decimalPattern = /\b(\d+\.\d+)\b/g;
  while ((match = decimalPattern.exec(text)) !== null) {
    const value = parseFloat(match[1]);
    if (!isNaN(value)) {
      indicators.push({
        value,
        position: match.index,
        length: match[0].length
      });
    }
  }
  
  // Pattern 4: Integer numbers (e.g., "3", "10")
  const integerPattern = /\b(\d+)\b/g;
  while ((match = integerPattern.exec(text)) !== null) {
    // Check if not already captured by other patterns
    const alreadyCaptured = indicators.some(ind => 
      ind.position <= match.index && ind.position + ind.length >= match.index + match[0].length
    );
    if (!alreadyCaptured) {
      const value = parseFloat(match[1]);
      if (!isNaN(value)) {
        indicators.push({
          value,
          position: match.index,
          length: match[0].length
        });
      }
    }
  }
  
  // Pattern 5: Text numbers (e.g., "dos", "tres")
  const words = text.split(/\s+/);
  let currentPos = 0;
  for (const word of words) {
    const wordPos = text.indexOf(word, currentPos);
    const value = convertNumberWord(word);
    if (value !== null) {
      // Check if not already captured
      const alreadyCaptured = indicators.some(ind => 
        ind.position <= wordPos && ind.position + ind.length >= wordPos + word.length
      );
      if (!alreadyCaptured) {
        indicators.push({
          value,
          position: wordPos,
          length: word.length
        });
      }
    }
    currentPos = wordPos + word.length;
  }
  
  // Pattern 6: Fraction words (e.g., "medio", "cuarto")
  currentPos = 0;
  for (const word of words) {
    const wordPos = text.indexOf(word, currentPos);
    const value = convertFractionWord(word);
    if (value !== null) {
      // Check if not already captured
      const alreadyCaptured = indicators.some(ind => 
        ind.position <= wordPos && ind.position + ind.length >= wordPos + word.length
      );
      if (!alreadyCaptured) {
        indicators.push({
          value,
          position: wordPos,
          length: word.length
        });
      }
    }
    currentPos = wordPos + word.length;
  }
  
  return indicators.sort((a, b) => a.position - b.position);
}

/**
 * Intelligent segment parser with context awareness
 * Uses multiple strategies to extract order information
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

  // ============================================================================
  // INTELLIGENT PARSING - SEQUENTIAL VALIDATION
  // ============================================================================

  // PRIORITY 1: Combined quantity+product (no space)
  let match = cleaned.match(/^(\d+(?:\/\d+)?)([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)$/i);
  if (match) {
    const quantityStr = match[1];
    const productStr = match[2];
    
    if (!isKnownUnit(productStr)) {
      const quantity = parseQuantityValue(quantityStr);
      
      if (quantity > 0) {
        const unit = normalizeUnit('', quantity);
        const product = normalizeProductName(productStr);
        console.log(`✓ [P1] Combined quantity+product: "${cleaned}" → ${quantity} ${unit} de ${product}`);
        return { quantity, unit, product };
      }
    }
  }

  // PRIORITY 1b: Combined product+quantity (no space)
  match = cleaned.match(/^([a-zA-ZáéíóúñÁÉÍÓÚÑ]+)(\d+(?:\/\d+)?)$/i);
  if (match) {
    const productStr = match[1];
    const quantityStr = match[2];
    
    if (!isKnownUnit(productStr)) {
      const quantity = parseQuantityValue(quantityStr);
      
      if (quantity > 0) {
        const unit = normalizeUnit('', quantity);
        const product = normalizeProductName(productStr);
        console.log(`✓ [P1b] Combined product+quantity: "${cleaned}" → ${quantity} ${unit} de ${product}`);
        return { quantity, unit, product };
      }
    }
  }

  // PRIORITY 2: Integer + Space + Fraction + Unit + "de" + Product
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
      const normalizedProduct = normalizeProductName(product);
      console.log(`✓ [P2] Integer+Fraction+Unit: "${cleaned}" → ${quantity} ${normalizedUnit} de ${normalizedProduct}`);
      return { quantity, unit: normalizedUnit, product: normalizedProduct };
    }
  }

  // PRIORITY 3: Integer + Space + Fraction + "de" + Product (no explicit unit)
  match = cleaned.match(/^(\d+)\s+(\d+)\/(\d+)\s+de\s+(.+)$/i);
  if (match) {
    const integer = parseFloat(match[1]);
    const numerator = parseFloat(match[2]);
    const denominator = parseFloat(match[3]);
    const product = match[4].trim();
    
    if (!isNaN(integer) && !isNaN(numerator) && !isNaN(denominator) && denominator !== 0 && product) {
      const quantity = integer + (numerator / denominator);
      const normalizedUnit = normalizeUnit('', quantity);
      const normalizedProduct = normalizeProductName(product);
      console.log(`✓ [P3] Integer+Fraction (no unit): "${cleaned}" → ${quantity} ${normalizedUnit} de ${normalizedProduct}`);
      return { quantity, unit: normalizedUnit, product: normalizedProduct };
    }
  }

  // PRIORITY 4: Integer + Unit + "y" + Fraction Word + "de" + Product
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
      const normalizedProduct = normalizeProductName(product);
      console.log(`✓ [P4] Integer+Unit+y+Fraction: "${cleaned}" → ${quantity} ${normalizedUnit} de ${normalizedProduct}`);
      return { quantity, unit: normalizedUnit, product: normalizedProduct };
    }
  }

  // PRIORITY 5: Fraction Word + Unit + "de" + Product
  match = cleaned.match(/^(medio|media|un medio|una media|cuarto|un cuarto|tercio|un tercio|octavo|un octavo)\s+(\w+)\s+de\s+(.+)$/i);
  if (match) {
    const fractionWord = match[1];
    const unit = match[2];
    const product = match[3].trim();
    
    const quantity = convertFractionWord(fractionWord);
    
    if (quantity !== null && product && isKnownUnit(unit)) {
      const normalizedUnit = normalizeUnit(unit, quantity);
      const normalizedProduct = normalizeProductName(product);
      console.log(`✓ [P5] Fraction+Unit: "${cleaned}" → ${quantity} ${normalizedUnit} de ${normalizedProduct}`);
      return { quantity, unit: normalizedUnit, product: normalizedProduct };
    }
  }

  // PRIORITY 6: Fraction Word + "de" + Product (no explicit unit)
  match = cleaned.match(/^(medio|media|un medio|una media|cuarto|un cuarto|tercio|un tercio|octavo|un octavo)\s+de\s+(.+)$/i);
  if (match) {
    const fractionWord = match[1];
    const product = match[2].trim();
    
    const quantity = convertFractionWord(fractionWord);
    
    if (quantity !== null && product) {
      const normalizedUnit = normalizeUnit('', quantity);
      const normalizedProduct = normalizeProductName(product);
      console.log(`✓ [P6] Fraction (no unit): "${cleaned}" → ${quantity} ${normalizedUnit} de ${normalizedProduct}`);
      return { quantity, unit: normalizedUnit, product: normalizedProduct };
    }
  }

  // PRIORITY 7: Standard Pattern - Cantidad + Unidad + "de" + Producto
  match = cleaned.match(/^(\d+(?:\/\d+)?|\w+)\s+(\w+)\s+de\s+(.+)$/i);
  if (match) {
    const quantity = parseQuantityValue(match[1]);
    const unit = normalizeUnit(match[2], quantity);
    const product = normalizeProductName(match[3].trim());
    
    if (quantity > 0 && product) {
      console.log(`✓ [P7] Standard format: "${cleaned}" → ${quantity} ${unit} de ${product}`);
      return { quantity, unit, product };
    }
  }

  // PRIORITY 8: Cantidad + Unidad (sin espacio) + "de" + Producto
  match = cleaned.match(/^(\d+(?:\/\d+)?)([a-zA-Z]+)\s+de\s+(.+)$/i);
  if (match) {
    const quantity = parseQuantityValue(match[1]);
    const unit = normalizeUnit(match[2], quantity);
    const product = normalizeProductName(match[3].trim());
    
    if (quantity > 0 && product) {
      console.log(`✓ [P8] Compact format: "${cleaned}" → ${quantity} ${unit} de ${product}`);
      return { quantity, unit, product };
    }
  }

  // PRIORITY 9: Cantidad + Unidad (sin espacio) + Producto
  match = cleaned.match(/^(\d+(?:\/\d+)?)([a-zA-Z]+)\s+(.+)$/i);
  if (match) {
    const potentialUnit = match[2];
    if (isKnownUnit(potentialUnit)) {
      const quantity = parseQuantityValue(match[1]);
      const unit = normalizeUnit(potentialUnit, quantity);
      const product = normalizeProductName(match[3].trim());
      
      if (quantity > 0 && product) {
        console.log(`✓ [P9] Compact no-de: "${cleaned}" → ${quantity} ${unit} de ${product}`);
        return { quantity, unit, product };
      }
    }
  }

  // PRIORITY 10: Cantidad + Unidad + Producto (con espacio)
  match = cleaned.match(/^(\d+(?:\/\d+)?|\w+)\s+(\w+)\s+(.+)$/i);
  if (match) {
    const potentialUnit = match[2];
    if (isKnownUnit(potentialUnit)) {
      const quantity = parseQuantityValue(match[1]);
      const unit = normalizeUnit(potentialUnit, quantity);
      const product = normalizeProductName(match[3].trim());
      
      if (quantity > 0 && product) {
        console.log(`✓ [P10] Standard no-de: "${cleaned}" → ${quantity} ${unit} de ${product}`);
        return { quantity, unit, product };
      }
    }
  }

  // PRIORITY 11: Cantidad + Producto (sin unidad explícita)
  match = cleaned.match(/^(\d+(?:\/\d+)?|\w+)\s+(.+)$/i);
  if (match) {
    const quantity = parseQuantityValue(match[1]);
    const product = normalizeProductName(match[2].trim());
    
    // Make sure the second part is not a unit
    if (quantity > 0 && product && !isKnownUnit(product.split(/\s+/)[0])) {
      const unit = normalizeUnit('', quantity);
      console.log(`✓ [P11] Quantity+Product: "${cleaned}" → ${quantity} ${unit} de ${product}`);
      return { quantity, unit, product };
    }
  }

  // PRIORITY 12: Producto + Cantidad + Unidad
  match = cleaned.match(/^(.+?)\s+(\d+(?:\/\d+)?|\w+)\s+(\w+)$/i);
  if (match) {
    const product = normalizeProductName(match[1].trim());
    const quantityStr = match[2];
    const unitStr = match[3];

    const quantity = parseQuantityValue(quantityStr);

    if (quantity > 0 && product && isKnownUnit(unitStr)) {
      const unit = normalizeUnit(unitStr, quantity);
      console.log(`✓ [P12] Product+Quantity+Unit: "${cleaned}" → ${quantity} ${unit} de ${product}`);
      return { quantity, unit, product };
    }
  }

  // PRIORITY 13: Producto + Unidad + Cantidad
  match = cleaned.match(/^(.+?)\s+(\w+)\s+(\d+(?:\/\d+)?|\w+)$/i);
  if (match) {
    const product = normalizeProductName(match[1].trim());
    const unitStr = match[2];
    const quantityStr = match[3];

    if (isKnownUnit(unitStr)) {
      const quantity = parseQuantityValue(quantityStr);
      if (quantity > 0 && product) {
        const unit = normalizeUnit(unitStr, quantity);
        console.log(`✓ [P13] Product+Unit+Quantity: "${cleaned}" → ${quantity} ${unit} de ${product}`);
        return { quantity, unit, product };
      }
    }
  }

  // PRIORITY 14: Producto + Cantidad (sin unidad)
  match = cleaned.match(/^(.+?)\s+(\d+(?:\/\d+)?|\w+)$/i);
  if (match) {
    const product = normalizeProductName(match[1].trim());
    const quantityStr = match[2];
    
    const quantity = parseQuantityValue(quantityStr);
    
    if (quantity > 0 && product) {
      // Check if there's a unit attached to the quantity string (e.g., "2k" -> quantity=2, unit=k)
      const quantityMatch = quantityStr.match(/^(\d+(?:\/\d+)?)([a-zA-Z]+)$/);
      if (quantityMatch && isKnownUnit(quantityMatch[2])) {
        const qty = parseQuantityValue(quantityMatch[1]);
        const unit = normalizeUnit(quantityMatch[2], qty);
        console.log(`✓ [P14a] Product+Quantity(with unit): "${cleaned}" → ${qty} ${unit} de ${product}`);
        return { quantity: qty, unit, product };
      } else {
        const unit = normalizeUnit('', quantity);
        console.log(`✓ [P14b] Product+Quantity: "${cleaned}" → ${quantity} ${unit} de ${product}`);
        return { quantity, unit, product };
      }
    }
  }

  // PRIORITY 15: Fracción + "de" + Producto
  match = cleaned.match(/^(\d+\/\d+)\s+de\s+(.+)$/i);
  if (match) {
    const quantity = parseQuantityValue(match[1]);
    const product = normalizeProductName(match[2].trim());
    
    if (quantity > 0 && product) {
      const unit = normalizeUnit('', quantity);
      console.log(`✓ [P15] Fraction+de: "${cleaned}" → ${quantity} ${unit} de ${product}`);
      return { quantity, unit, product };
    }
  }

  // PRIORITY 16: Solo Producto (sin cantidad ni unidad) - DEFAULT TO 1 UNIT
  if (cleaned.length > 0 && !cleaned.match(/^\d/) && !isKnownUnit(cleaned.split(/\s+/)[0])) {
    const product = normalizeProductName(cleaned);
    console.log(`✓ [P16] Product only: "${cleaned}" → 1 unidad de ${product}`);
    return { quantity: 1, unit: 'unidad', product };
  }

  // FALLBACK: If no pattern matched, create an unparseable item with "#" quantity
  console.warn(`✗ [FALLBACK] Could not parse: "${cleaned}" - creating unparseable item with "#" quantity`);
  return { quantity: '#', unit: '', product: cleaned };
}

/**
 * Splits a line into multiple segments if it contains multiple items
 * Enhanced with intelligent detection of item boundaries
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

  // Extract all quantity indicators
  const indicators = extractQuantityIndicators(trimmed);
  
  // If we have multiple quantity indicators, try to split by them
  if (indicators.length > 1) {
    const segments: string[] = [];
    
    for (let i = 0; i < indicators.length; i++) {
      const currentIndicator = indicators[i];
      const nextIndicator = indicators[i + 1];
      
      const startPos = currentIndicator.position;
      const endPos = nextIndicator ? nextIndicator.position : trimmed.length;
      
      const segment = trimmed.substring(startPos, endPos).trim();
      if (segment.length > 0) {
        segments.push(segment);
      }
    }
    
    if (segments.length > 1) {
      return segments;
    }
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
  
  return segments;
}

/**
 * Parses a WhatsApp message into a list of order items
 * Enhanced with intelligent parsing and context awareness
 */
export function parseWhatsAppMessage(message: string): ParsedOrderItem[] {
  if (!message || !message.trim()) {
    console.warn('Empty message provided');
    return [];
  }

  const lines = message.split('\n');
  const orderItems: ParsedOrderItem[] = [];

  console.log(`\n========== INTELLIGENT PARSING (${lines.length} lines) ==========`);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      continue;
    }

    console.log(`\n--- Line ${i + 1}: "${line}"`);

    // Split line into segments (handles comma-separated and multiple items)
    const segments = splitLineIntoSegments(line);
    
    console.log(`  Segments: ${segments.length}`);

    for (const segment of segments) {
      try {
        const parsedItem = parseSegment(segment);
        
        // Always add the item (even if it has "#" quantity)
        orderItems.push(parsedItem);
        
        if (parsedItem.quantity === '#') {
          console.log(`  ⚠ Unparseable: "${segment}" → Created with "#" quantity`);
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

/**
 * Test function to validate parser with various formats
 */
export function testParser() {
  const testCases = [
    // CRITICAL TEST CASES: Integer + Space + Fraction formats
    '1 1/2 kilo de manzanas',
    '2 1/4 kilos de papas',
    '1 1/2 kilos de manzanas',
    '1 1/2 de manzana',
    '3 1/4 de tomates',
    
    // Combined integer and fraction with "y medio"
    '1 kilo y medio de manzanas',
    '2 kilos y medio de papas',
    
    // Combined quantity and product without spaces
    '1lechuga',
    '2tomates',
    '3papas',
    'lechuga1',
    'tomates2',
    'papas3',
    '5pepinos',
    'pepinos5',
    
    // Fraction formats
    'medio kilo de papas',
    'un cuarto de ají',
    'medio de papas',
    '1/2 kilo de papas',
    '1/4 de ají',
    '1/8 kilo de cilantro',
    
    // Standard formats
    '3 kilos de tomates',
    '2 kilos de papas',
    '1 kilo de cebollas',
    '3kilos de tomates',
    '2k de papas',
    '1kg de cebollas',
    '3 tomates',
    '2 pepinos',
    '1 lechuga',
    
    // Text numbers
    'dos kilos de tomates',
    'tres papas',
    'un kilo de cebollas',
    
    // Product first
    'tomates 3 kilos',
    'papas 2k',
    
    // Comma-separated
    '3 kilos de tomates, 2 kilos de papas, 1 lechuga',
    
    // Product only
    'tomillo bonito',
    'romero',
    
    // Special units
    '3 mallas de cebolla',
    '2 docenas de huevos',
    
    // Typos and variations
    '3 kls de tomates',
    '2 kgs papas',
    'medio kilo palta',
    
    // Mixed formats
    '3kilos tomates 2kilos paltas 3 pepinos',
    
    // Unparseable items
    'xyz123abc',
    '!!!',
  ];

  console.log('=== INTELLIGENT WhatsApp Parser Test ===\n');
  
  for (const testCase of testCases) {
    console.log(`\nInput: "${testCase}"`);
    const result = parseWhatsAppMessage(testCase);
    console.log('Output:', JSON.stringify(result, null, 2));
  }
}
