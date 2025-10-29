
/**
 * Intelligent WhatsApp Message Parser
 * Handles a wide variety of natural order formats
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
 * Spanish number words mapping
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
  'veintiuno': 21, 'veintiuna': 21,
  'veintidós': 22, 'veintidos': 22,
  'veintitrés': 23, 'veintitres': 23,
  'veinticuatro': 24,
  'veinticinco': 25,
  'treinta': 30,
  'cuarenta': 40,
  'cincuenta': 50,
  'sesenta': 60,
  'setenta': 70,
  'ochenta': 80,
  'noventa': 90,
  'cien': 100, 'ciento': 100,
};

/**
 * Spanish fraction words mapping
 */
const FRACTION_WORDS: Record<string, number> = {
  'medio': 0.5, 'media': 0.5,
  'cuarto': 0.25,
  'tercio': 0.33,
  'tres cuartos': 0.75,
};

/**
 * Common unit variations
 */
const UNIT_VARIATIONS: Record<string, string[]> = {
  'kilo': ['kilo', 'kilos', 'kg', 'kgs', 'k'],
  'gramo': ['gramo', 'gramos', 'gr', 'g'],
  'unidad': ['unidad', 'unidades', 'u', 'und'],
  'bolsa': ['bolsa', 'bolsas'],
  'malla': ['malla', 'mallas'],
  'saco': ['saco', 'sacos'],
  'cajón': ['cajón', 'cajon', 'cajones'],
  'atado': ['atado', 'atados'],
  'cabeza': ['cabeza', 'cabezas'],
  'libra': ['libra', 'libras', 'lb', 'lbs'],
  'docena': ['docena', 'docenas'],
  'paquete': ['paquete', 'paquetes'],
  'caja': ['caja', 'cajas'],
  'litro': ['litro', 'litros', 'lt', 'l'],
  'metro': ['metro', 'metros', 'm'],
};

/**
 * Checks if a word is a known unit
 */
function isKnownUnit(word: string): boolean {
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
 * Normalizes a unit to its standard form
 */
export function normalizeUnit(unit: string, quantity: number = 1): string {
  if (!unit || !unit.trim()) {
    return quantity === 1 ? 'unidad' : 'unidades';
  }

  const normalized = unit.toLowerCase().trim().replace(/[.,;:!?]$/, '');

  for (const [standardUnit, variations] of Object.entries(UNIT_VARIATIONS)) {
    if (variations.includes(normalized)) {
      if (quantity === 1) {
        return standardUnit;
      } else {
        // Handle pluralization
        if (standardUnit === 'cajón') return 'cajones';
        if (standardUnit.endsWith('z')) return standardUnit.slice(0, -1) + 'ces';
        return standardUnit + 's';
      }
    }
  }

  // Return as-is if not found
  return normalized;
}

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
 * Parses a quantity value from a string with enhanced intelligence
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

  // Handle "y tres cuartos" patterns (e.g., "1 y tres cuartos")
  const yTresCuartosMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*y\s*tres\s+cuartos$/);
  if (yTresCuartosMatch) {
    const integer = parseFloat(yTresCuartosMatch[1]);
    if (!isNaN(integer)) {
      return integer + 0.75;
    }
  }

  // Handle "y tercio" patterns (e.g., "1 y tercio")
  const yTercioMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*y\s*tercio$/);
  if (yTercioMatch) {
    const integer = parseFloat(yTercioMatch[1]);
    if (!isNaN(integer)) {
      return integer + 0.33;
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

  // Simple fraction (e.g., "1/2", "3/4")
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

  // Number (decimal or integer) - handle both comma and period
  const numValue = parseFloat(trimmed.replace(',', '.'));
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
 * Cleans a segment for parsing by removing bullet points, numbering, and other list formatting
 */
function cleanSegment(segment: string): string {
  let cleaned = segment.trim();
  
  // Remove common bullet point characters at the start
  // Includes: • ● ○ ◦ ▪ ▫ ■ □ ★ ☆ ✓ ✔ ✗ ✘ ➤ ➢ ► ▸ ▹ ▻ ⇒ ⇨ → ⟶ ⟹ ⟼ ⤏ ⤐ and many more
  cleaned = cleaned.replace(/^[•●○◦▪▫■□★☆✓✔✗✘➤➢►▸▹▻⇒⇨→⟶⟹⟼⤏⤐⤑⤔⤕⤖⤗⤘⤙⤚⤛⤜⤝⤞⤟⤠⤡⤢⤣⤤⤥⤦⤧⤨⤩⤪⤫⤬⤭⤮⤯⤰⤱⤲⤳⤴⤵⤶⤷⤸⤹⤺⤻⤼⤽⤾⤿⥀⥁⥂⥃⥄⥅⥆⥇⥈⥉⥊⥋⥌⥍⥎⥏⥐⥑⥒⥓⥔⥕⥖⥗⥘⥙⥚⥛⥜⥝⥞⥟⥠⥡⥢⥣⥤⥥⥦⥧⥨⥩⥪⥫⥬⥭⥮⥯⥰⥱⥲⥳⥴⥵⥶⥷⥸⥹⥺⥻⥼⥽⥾⥿·\-*+~]\s*/, '');
  
  // Remove numbered list markers (1. or 1) or 1- or 1: )
  cleaned = cleaned.replace(/^\d+[.):\-]\s*/, '');
  
  // Remove lettered list markers (a. or a) or A. or A) )
  cleaned = cleaned.replace(/^[a-zA-Z][.):\-]\s*/, '');
  
  // Remove Roman numeral list markers (i. or I. or iv) or IV) )
  cleaned = cleaned.replace(/^(?:i{1,3}|iv|v|vi{0,3}|ix|x|xi{0,3}|xiv|xv)[.):\-]\s*/i, '');
  
  // Remove parenthesized numbers or letters at the start: (1) or (a) or (A)
  cleaned = cleaned.replace(/^\([0-9a-zA-Z]+\)\s*/, '');
  
  // Remove square bracketed numbers or letters at the start: [1] or [a] or [A]
  cleaned = cleaned.replace(/^\[[0-9a-zA-Z]+\]\s*/, '');
  
  // Remove dashes, asterisks, or plus signs that might be used as bullets
  cleaned = cleaned.replace(/^[\-*+~]\s+/, '');
  
  // Remove any remaining leading whitespace
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Advanced segment parser with multiple intelligent strategies
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

  // Strategy 1: Integer + Space + Fraction + Unit + "de" + Product
  // Examples: "1 1/2 kilo de manzanas", "2 3/4 kg de papas"
  let match = cleaned.match(/^(\d+\s+\d+\/\d+)\s+(\w+)\s+de\s+(.+)$/i);
  if (match) {
    const quantityStr = match[1];
    const quantity = parseQuantityValue(quantityStr);
    const unitStr = match[2];
    const product = match[3].trim();
    
    if (quantity > 0 && product) {
      const unit = normalizeUnit(unitStr, quantity);
      return { quantity, unit, product };
    }
  }

  // Strategy 2: Integer + Space + Fraction + "de" + Product (no explicit unit)
  // Examples: "1 1/2 de manzanas", "2 3/4 de papas"
  match = cleaned.match(/^(\d+\s+\d+\/\d+)\s+de\s+(.+)$/i);
  if (match) {
    const quantityStr = match[1];
    const quantity = parseQuantityValue(quantityStr);
    const product = match[2].trim();
    
    if (quantity > 0 && product) {
      const unit = normalizeUnit('kilo', quantity); // Default to kilo for mixed fractions
      return { quantity, unit, product };
    }
  }

  // Strategy 3: Integer + Space + Fraction + Product (no "de", no explicit unit)
  // Examples: "1 1/2 manzanas", "2 3/4 papas"
  match = cleaned.match(/^(\d+\s+\d+\/\d+)\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ].+)$/i);
  if (match) {
    const quantityStr = match[1];
    const quantity = parseQuantityValue(quantityStr);
    const restOfText = match[2].trim();
    
    // Check if first word is a unit
    const firstWord = restOfText.split(/\s+/)[0];
    if (isKnownUnit(firstWord)) {
      // It's actually a unit, so extract it
      const unitStr = firstWord;
      const product = restOfText.substring(firstWord.length).trim();
      if (quantity > 0 && product) {
        const unit = normalizeUnit(unitStr, quantity);
        return { quantity, unit, product };
      }
    } else {
      // No unit, treat as product
      if (quantity > 0 && restOfText) {
        const unit = normalizeUnit('kilo', quantity);
        return { quantity, unit, product: restOfText };
      }
    }
  }

  // Strategy 4: Number word + "y" + fraction word + Unit + "de" + Product
  // Examples: "un kilo y medio de manzanas", "una libra y media de papas"
  match = cleaned.match(/^(un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s*y\s*(medio|media|cuarto|tercio)\s+(\w+)\s+de\s+(.+)$/i);
  if (match) {
    const numberWord = match[1].toLowerCase();
    const fractionWord = match[2].toLowerCase();
    const unitStr = match[3];
    const product = match[4].trim();

    const baseQuantity = convertNumberWord(numberWord) || 1;
    const fractionValue = fractionWord === 'cuarto' ? 0.25 : fractionWord === 'tercio' ? 0.33 : 0.5;
    const quantity = baseQuantity + fractionValue;

    if (quantity > 0 && product) {
      const unit = normalizeUnit(unitStr, quantity);
      return { quantity, unit, product };
    }
  }

  // Strategy 5: Number word + "y" + fraction word + "de" + Product (no explicit unit)
  // Examples: "un y medio de manzanas", "una y media de papas"
  match = cleaned.match(/^(un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s*y\s*(medio|media|cuarto|tercio)\s+de\s+(.+)$/i);
  if (match) {
    const numberWord = match[1].toLowerCase();
    const fractionWord = match[2].toLowerCase();
    const product = match[3].trim();

    const baseQuantity = convertNumberWord(numberWord) || 1;
    const fractionValue = fractionWord === 'cuarto' ? 0.25 : fractionWord === 'tercio' ? 0.33 : 0.5;
    const quantity = baseQuantity + fractionValue;

    if (quantity > 0 && product) {
      const unit = normalizeUnit('kilo', quantity);
      return { quantity, unit, product };
    }
  }

  // Strategy 6: Quantity + "y medio/media/cuarto/tercio" + Unit + "de" + Product
  // Examples: "1 y medio kilo de manzanas", "2 y media libras de papas"
  match = cleaned.match(/^(\d+(?:\.\d+)?)\s*y\s*(medio|media|cuarto|tercio|tres\s+cuartos)\s+(\w+)\s+de\s+(.+)$/i);
  if (match) {
    const baseQuantity = parseFloat(match[1]);
    const fractionWord = match[2].toLowerCase();
    let fractionValue = 0.5;
    if (fractionWord === 'cuarto') fractionValue = 0.25;
    else if (fractionWord === 'tercio') fractionValue = 0.33;
    else if (fractionWord.includes('tres') && fractionWord.includes('cuartos')) fractionValue = 0.75;
    
    const quantity = baseQuantity + fractionValue;
    const unitStr = match[3];
    const product = match[4].trim();

    if (quantity > 0 && product) {
      const unit = normalizeUnit(unitStr, quantity);
      return { quantity, unit, product };
    }
  }

  // Strategy 7: Quantity + "y medio/media/cuarto/tercio" + "de" + Product (no explicit unit)
  // Examples: "1 y medio de manzanas", "2 y media de papas"
  match = cleaned.match(/^(\d+(?:\.\d+)?)\s*y\s*(medio|media|cuarto|tercio|tres\s+cuartos)\s+de\s+(.+)$/i);
  if (match) {
    const baseQuantity = parseFloat(match[1]);
    const fractionWord = match[2].toLowerCase();
    let fractionValue = 0.5;
    if (fractionWord === 'cuarto') fractionValue = 0.25;
    else if (fractionWord === 'tercio') fractionValue = 0.33;
    else if (fractionWord.includes('tres') && fractionWord.includes('cuartos')) fractionValue = 0.75;
    
    const quantity = baseQuantity + fractionValue;
    const product = match[3].trim();

    if (quantity > 0 && product) {
      const unit = normalizeUnit('kilo', quantity);
      return { quantity, unit, product };
    }
  }

  // Strategy 8: Fraction word + Unit + "de" + Product
  // Examples: "medio kilo de papas", "un cuarto de lechuga"
  match = cleaned.match(/^(medio|media|cuarto|tercio|tres\s+cuartos|un|uno|una)\s+(\w+)\s+de\s+(.+)$/i);
  if (match) {
    const quantityWord = match[1].toLowerCase();
    const unitStr = match[2];
    const product = match[3].trim();

    let quantity = 1;
    if (quantityWord === 'medio' || quantityWord === 'media') {
      quantity = 0.5;
    } else if (quantityWord === 'cuarto') {
      quantity = 0.25;
    } else if (quantityWord === 'tercio') {
      quantity = 0.33;
    } else if (quantityWord.includes('tres') && quantityWord.includes('cuartos')) {
      quantity = 0.75;
    }

    if (product) {
      const unit = normalizeUnit(unitStr, quantity);
      return { quantity, unit, product };
    }
  }

  // Strategy 9: Fraction word + "de" + Product (no explicit unit)
  // Examples: "medio de papas", "un cuarto de lechuga"
  match = cleaned.match(/^(medio|media|cuarto|tercio|tres\s+cuartos)\s+de\s+(.+)$/i);
  if (match) {
    const quantityWord = match[1].toLowerCase();
    const product = match[2].trim();

    let quantity = 0.5;
    if (quantityWord === 'cuarto') {
      quantity = 0.25;
    } else if (quantityWord === 'tercio') {
      quantity = 0.33;
    } else if (quantityWord.includes('tres') && quantityWord.includes('cuartos')) {
      quantity = 0.75;
    }

    if (product) {
      const unit = normalizeUnit('kilo', quantity);
      return { quantity, unit, product };
    }
  }

  // Strategy 10: Quantity + Unit + "de" + Product
  // Examples: "3 kilos de tomates", "2 kg de papas", "dos kilos de cebollas"
  match = cleaned.match(/^(\d+(?:[.,]\d+)?(?:\/\d+)?|\w+)\s+(\w+)\s+de\s+(.+)$/i);
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

  // Strategy 11: Quantity + Unit + Product (no "de")
  // Examples: "3 kilos tomates", "2 kg papas"
  match = cleaned.match(/^(\d+(?:[.,]\d+)?(?:\/\d+)?|\w+)\s+(\w+)\s+(.+)$/i);
  if (match) {
    const quantityStr = match[1].replace(',', '.');
    const potentialUnit = match[2];

    if (isKnownUnit(potentialUnit)) {
      const quantity = parseQuantityValue(quantityStr);
      const product = match[3].trim();

      if (quantity > 0 && product) {
        const unit = normalizeUnit(potentialUnit, quantity);
        return { quantity, unit, product };
      }
    }
  }

  // Strategy 12: Quantity + Product (no explicit unit)
  // Examples: "3 tomates", "5 pepinos", "dos lechugas"
  match = cleaned.match(/^(\d+(?:[.,]\d+)?(?:\/\d+)?|\w+)\s+(.+)$/i);
  if (match) {
    const quantityStr = match[1].replace(',', '.');
    const quantity = parseQuantityValue(quantityStr);
    const restOfText = match[2].trim();

    const firstWord = restOfText.split(/\s+/)[0];
    if (quantity > 0 && restOfText && !isKnownUnit(firstWord)) {
      const unit = normalizeUnit('', quantity);
      return { quantity, unit, product: restOfText };
    }
  }

  // Strategy 13: Product + Quantity + Unit (reversed order)
  // Examples: "tomates 3 kilos", "papas 2 kg"
  match = cleaned.match(/^([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+?)\s+(\d+(?:[.,]\d+)?(?:\/\d+)?|\w+)\s+(\w+)$/i);
  if (match) {
    const product = match[1].trim();
    const quantityStr = match[2].replace(',', '.');
    const unitStr = match[3];

    if (isKnownUnit(unitStr)) {
      const quantity = parseQuantityValue(quantityStr);

      if (quantity > 0 && product) {
        const unit = normalizeUnit(unitStr, quantity);
        return { quantity, unit, product };
      }
    }
  }

  // Strategy 14: Product + Quantity (no unit, reversed order)
  // Examples: "tomates 3", "pepinos 5"
  match = cleaned.match(/^([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+?)\s+(\d+(?:[.,]\d+)?(?:\/\d+)?|\w+)$/i);
  if (match) {
    const product = match[1].trim();
    const quantityStr = match[2].replace(',', '.');
    const quantity = parseQuantityValue(quantityStr);

    if (quantity > 0 && product && !isKnownUnit(product.split(/\s+/).pop() || '')) {
      const unit = normalizeUnit('', quantity);
      return { quantity, unit, product };
    }
  }

  // Strategy 15: Unit + "de" + Product (no explicit quantity, assume 1)
  // Examples: "kilo de tomates", "bolsa de papas"
  match = cleaned.match(/^(\w+)\s+de\s+(.+)$/i);
  if (match) {
    const unitStr = match[1];
    const product = match[2].trim();

    if (isKnownUnit(unitStr) && product) {
      const quantity = 1;
      const unit = normalizeUnit(unitStr, quantity);
      return { quantity, unit, product };
    }
  }

  // Strategy 16: Just Product (default to 1 unit)
  // Examples: "tomates", "cilantro", "lechuga"
  if (cleaned.length > 0 && !cleaned.match(/^\d/) && !isKnownUnit(cleaned.split(/\s+/)[0])) {
    return { quantity: 1, unit: 'unidad', product: cleaned };
  }

  // Fallback: unparseable item with "#" quantity
  console.warn(`Could not parse: "${cleaned}"`);
  return { quantity: '#', unit: '', product: cleaned };
}

/**
 * Splits a line into multiple segments
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
  // Only split if "y" is followed by a number or quantity word
  const yPattern = /\s+y\s+(?=\d|medio|media|cuarto|tercio|un|uno|una|dos|tres|cuatro|cinco)/i;
  if (yPattern.test(trimmed)) {
    return trimmed.split(yPattern).map(s => s.trim()).filter(s => s.length > 0);
  }

  return [trimmed];
}

/**
 * Parses a WhatsApp message into a list of order items
 */
export function parseWhatsAppMessage(message: string): ParsedOrderItem[] {
  if (!message || !message.trim()) {
    console.log('Empty message provided');
    return [];
  }

  const lines = message.split('\n');
  const orderItems: ParsedOrderItem[] = [];

  console.log(`\n========== INTELLIGENT PARSING (${lines.length} lines) ==========`);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      continue;
    }

    console.log(`\n--- Line ${i + 1}: "${line}"`);

    const segments = splitLineIntoSegments(line);
    console.log(`  Segments: ${segments.length}`);

    for (const segment of segments) {
      try {
        const parsedItem = parseSegment(segment);
        orderItems.push(parsedItem);

        if (parsedItem.quantity === '#') {
          console.log(`  ⚠ Unparseable: "${segment}"`);
        } else {
          console.log(`  ✓ Success: "${segment}" → ${parsedItem.quantity} ${parsedItem.unit} de ${parsedItem.product}`);
        }
      } catch (error) {
        console.error(`  ✗ Error parsing segment "${segment}":`, error);
        orderItems.push({ quantity: '#', unit: '', product: segment });
      }
    }
  }

  console.log(`\n========== PARSING COMPLETE: ${orderItems.length} items ==========\n`);
  return orderItems;
}
