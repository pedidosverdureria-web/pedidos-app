
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// ============================================================================
// PARSING UTILITIES (Extracted from local whatsappParser.ts)
// ============================================================================

interface ParsedOrderItem {
  quantity: number | string;
  unit: string;
  product: string;
}

// Spanish number words mapping
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

// Spanish fraction words mapping
const FRACTION_WORDS: Record<string, number> = {
  'medio': 0.5, 'media': 0.5,
  'cuarto': 0.25,
  'tercio': 0.33,
  'tres cuartos': 0.75,
};

// Common unit variations
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

// Greeting and closing patterns to remove
const GREETING_PATTERNS = [
  /^hola\s*/i,
  /^buenos?\s+d[ií]as?\s*/i,
  /^buenas?\s+tardes?\s*/i,
  /^buenas?\s+noches?\s*/i,
  /^buen\s+d[ií]a\s*/i,
  /^buena\s+tarde\s*/i,
  /^buena\s+noche\s*/i,
  /^saludos?\s*/i,
  /^holi+\s*/i,
  /^hey\s*/i,
  /^ey\s*/i,
  /^qu[eé]\s+tal\s*/i,
  /^c[oó]mo\s+est[aá]s?\s*/i,
  /^c[oó]mo\s+est[aá]n\s*/i,
  /^qu[eé]\s+onda\s*/i,
];

const CLOSING_PATTERNS = [
  /\s*gracias\.?$/i,
  /\s*muchas\s+gracias\.?$/i,
  /\s*mil\s+gracias\.?$/i,
  /\s*saludos\.?$/i,
  /\s*bendiciones\.?$/i,
  /\s*que\s+est[eé]s?\s+bien\.?$/i,
  /\s*que\s+est[eé]n\s+bien\.?$/i,
  /\s*hasta\s+luego\.?$/i,
  /\s*nos\s+vemos\.?$/i,
  /\s*chao\.?$/i,
  /\s*adi[oó]s\.?$/i,
  /\s*buen\s+d[ií]a\.?$/i,
  /\s*buena\s+tarde\.?$/i,
  /\s*buena\s+noche\.?$/i,
];

const FILLER_PATTERNS = [
  /^quiero\s+hacer\s+un\s+pedido\s*/i,
  /^quisiera\s+hacer\s+un\s+pedido\s*/i,
  /^necesito\s+hacer\s+un\s+pedido\s*/i,
  /^me\s+gustar[ií]a\s+hacer\s+un\s+pedido\s*/i,
  /^quiero\s+pedir\s*/i,
  /^quisiera\s+pedir\s*/i,
  /^necesito\s+pedir\s*/i,
  /^me\s+gustar[ií]a\s+pedir\s*/i,
  /^mi\s+pedido\s+es\s*/i,
  /^el\s+pedido\s+es\s*/i,
  /^voy\s+a\s+pedir\s*/i,
  /^por\s+favor\s*/i,
];

const QUESTION_PATTERNS = [
  /\?$/,
  /^(cuánto|cuanto|cuando|dónde|donde|qué|que|cómo|como|por qué|porque)/i,
  /^(how much|when|where|what|how|why)/i,
];

/**
 * Extracts only the product list from a message, removing greetings, closings, and filler text
 */
function extractProductList(message: string): string {
  let cleaned = message.trim();

  console.log('Original message:', cleaned);

  // Remove greeting patterns from the beginning
  for (const pattern of GREETING_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Remove closing patterns from the end
  for (const pattern of CLOSING_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Remove filler patterns from the beginning
  for (const pattern of FILLER_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Remove lines that are purely greetings or questions (no product info)
  const lines = cleaned.split('\n');
  const productLines: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) continue;

    // Skip lines that are only greetings
    let isGreeting = false;
    for (const pattern of GREETING_PATTERNS) {
      if (pattern.test(trimmedLine) && trimmedLine.replace(pattern, '').trim().length === 0) {
        isGreeting = true;
        break;
      }
    }
    if (isGreeting) continue;

    // Skip lines that are only closings
    let isClosing = false;
    for (const pattern of CLOSING_PATTERNS) {
      if (pattern.test(trimmedLine) && trimmedLine.replace(pattern, '').trim().length === 0) {
        isClosing = true;
        break;
      }
    }
    if (isClosing) continue;

    // Skip lines that are only filler text
    let isFiller = false;
    for (const pattern of FILLER_PATTERNS) {
      if (pattern.test(trimmedLine) && trimmedLine.replace(pattern, '').trim().length === 0) {
        isFiller = true;
        break;
      }
    }
    if (isFiller) continue;

    // Skip lines that are questions (contain ?)
    if (trimmedLine.includes('?') || trimmedLine.includes('¿')) continue;

    // Check if line contains product-like patterns
    // A line is considered a product line if it:
    // 1. Starts with a bullet point or dash
    // 2. Contains a quantity followed by a unit or product name
    // 3. Has a clear quantity + product structure
    
    const startsWithBullet = /^[-•●○◦▪▫■□★☆✓✔✗✘➤➢►▸▹▻⇒⇨→*+~\d]/.test(trimmedLine);
    
    // Check for quantity patterns (number + unit or number + product)
    const hasQuantityPattern = 
      /^\d+\s*(kilo|kg|gramo|gr|unidad|und|bolsa|malla|saco|cajón|cajon|atado|cabeza|libra|lb|docena|paquete|caja|litro|lt|metro|de\s+)/i.test(trimmedLine) ||
      /\b(kilo|kg|gramo|gr|unidad|und|bolsa|malla|saco|cajón|cajon|atado|cabeza|libra|lb|docena|paquete|caja|litro|lt|metro)\b/i.test(trimmedLine) ||
      /\b(medio|media|cuarto|tercio)\s+(kilo|kg|de\s+)/i.test(trimmedLine);
    
    // Exclude lines that are clearly conversational
    const isConversational = 
      /\b(quiero|quisiera|necesito|me gustaría|hacer|pedido|para|el|dia|lunes|martes|miércoles|jueves|viernes|sábado|domingo|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|por favor|quedo atento)\b/i.test(trimmedLine) &&
      !hasQuantityPattern;
    
    // Include line if it starts with bullet/dash OR has quantity pattern AND is not conversational
    if ((startsWithBullet || hasQuantityPattern) && !isConversational) {
      productLines.push(trimmedLine);
    }
  }

  const result = productLines.length > 0 ? productLines.join('\n') : cleaned.trim();

  console.log('Extracted product list:', result);

  return result;
}

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
function normalizeUnit(unit: string, quantity: number = 1): string {
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
function parseQuantityValue(quantityStr: string): number {
  if (!quantityStr || !quantityStr.trim()) {
    return 0;
  }

  const trimmed = quantityStr.trim().toLowerCase();

  // Handle "y medio" or "y media" patterns
  const yMedioMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*y\s*(medio|media)$/);
  if (yMedioMatch) {
    const integer = parseFloat(yMedioMatch[1]);
    if (!isNaN(integer)) {
      return integer + 0.5;
    }
  }

  // Handle "y cuarto" patterns
  const yCuartoMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*y\s*cuarto$/);
  if (yCuartoMatch) {
    const integer = parseFloat(yCuartoMatch[1]);
    if (!isNaN(integer)) {
      return integer + 0.25;
    }
  }

  // Handle "y tres cuartos" patterns
  const yTresCuartosMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*y\s*tres\s+cuartos$/);
  if (yTresCuartosMatch) {
    const integer = parseFloat(yTresCuartosMatch[1]);
    if (!isNaN(integer)) {
      return integer + 0.75;
    }
  }

  // Handle "y tercio" patterns
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

  // Text number
  const textValue = convertNumberWord(trimmed);
  if (textValue !== null) {
    return textValue;
  }

  // Fraction word
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
  cleaned = cleaned.replace(/^[•●○◦▪▫■□★☆✓✔✗✘➤➢►▸▹▻⇒⇨→⟶⟹⟼⤏⤐⤑⤔⤕⤖⤗⤘⤙⤚⤛⤜⤝⤞⤟⤠⤡⤢⤣⤤⤥⤦⤧⤨⤩⤪⤫⤬⤭⤮⤯⤰⤱⤲⤳⤴⤵⤶⤷⤸⤹⤺⤻⤼⤽⤾⤿⥀⥁⥂⥃⥄⥅⥆⥇⥈⥉⥊⥋⥌⥍⥎⥏⥐⥑⥒⥓⥔⥕⥖⥗⥘⥙⥚⥛⥜⥝⥞⥟⥠⥡⥢⥣⥤⥥⥦⥧⥨⥩⥪⥫⥬⥭⥮⥯⥰⥱⥲⥳⥴⥵⥶⥷⥸⥹⥺⥻⥼⥽⥾⥿·*+~]\s*/, '');
  
  // Remove numbered list markers
  cleaned = cleaned.replace(/^\d+[.):]\s*/, '');
  
  // Remove lettered list markers
  cleaned = cleaned.replace(/^[a-zA-Z][.):]\s*/, '');
  
  // Remove Roman numeral list markers
  cleaned = cleaned.replace(/^(?:i{1,3}|iv|v|vi{0,3}|ix|x|xi{0,3}|xiv|xv)[.):]\s*/i, '');
  
  // Remove parenthesized numbers or letters at the start
  cleaned = cleaned.replace(/^\([0-9a-zA-Z]+\)\s*/, '');
  
  // Remove square bracketed numbers or letters at the start
  cleaned = cleaned.replace(/^\[[0-9a-zA-Z]+\]\s*/, '');
  
  // Remove dashes, asterisks, or plus signs that might be used as bullets
  cleaned = cleaned.replace(/^[*+~]\s+/, '');
  
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
  match = cleaned.match(/^(\d+\s+\d+\/\d+)\s+de\s+(.+)$/i);
  if (match) {
    const quantityStr = match[1];
    const quantity = parseQuantityValue(quantityStr);
    const product = match[2].trim();
    
    if (quantity > 0 && product) {
      const unit = normalizeUnit('kilo', quantity);
      return { quantity, unit, product };
    }
  }

  // Strategy 3: Integer + Space + Fraction + Product (no "de", no explicit unit)
  match = cleaned.match(/^(\d+\s+\d+\/\d+)\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ].+)$/i);
  if (match) {
    const quantityStr = match[1];
    const quantity = parseQuantityValue(quantityStr);
    const restOfText = match[2].trim();
    
    const firstWord = restOfText.split(/\s+/)[0];
    if (isKnownUnit(firstWord)) {
      const unitStr = firstWord;
      const product = restOfText.substring(firstWord.length).trim();
      if (quantity > 0 && product) {
        const unit = normalizeUnit(unitStr, quantity);
        return { quantity, unit, product };
      }
    } else {
      if (quantity > 0 && restOfText) {
        const unit = normalizeUnit('kilo', quantity);
        return { quantity, unit, product: restOfText };
      }
    }
  }

  // Strategy 4: Number word + "y" + fraction word + Unit + "de" + Product
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
  const yPattern = /\s+y\s+(?=\d|medio|media|cuarto|tercio|un|uno|una|dos|tres|cuatro|cinco)/i;
  if (yPattern.test(trimmed)) {
    return trimmed.split(yPattern).map(s => s.trim()).filter(s => s.length > 0);
  }

  return [trimmed];
}

/**
 * Calculate the ratio of conversational text to product text
 */
function calculateConversationalRatio(originalMessage: string, extractedProducts: string): number {
  const originalLength = originalMessage.trim().length;
  const extractedLength = extractedProducts.trim().length;
  
  if (originalLength === 0) return 0;
  
  const conversationalLength = originalLength - extractedLength;
  return conversationalLength / originalLength;
}

/**
 * Parses a WhatsApp message into a list of order items
 */
function parseWhatsAppMessage(message: string): ParsedOrderItem[] {
  if (!message || !message.trim()) {
    console.log('Empty message provided');
    return [];
  }

  const productListOnly = extractProductList(message);

  if (!productListOnly || !productListOnly.trim()) {
    console.log('No product list found after extraction');
    return [];
  }

  const lines = productListOnly.split('\n');
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

/**
 * Check if message is a greeting
 */
function isGreeting(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();
  return GREETING_PATTERNS.some(pattern => pattern.test(lowerMessage));
}

/**
 * Check if message is a question
 */
function isQuestion(message: string): boolean {
  return QUESTION_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Determines if the message should create an order or send a help message
 * Returns true if the message is valid for order creation
 */
function shouldCreateOrder(message: string, parsedItems: ParsedOrderItem[]): boolean {
  // If no items were parsed, don't create order
  if (parsedItems.length === 0) {
    console.log('No items parsed - should not create order');
    return false;
  }

  // If all items are unparseable, don't create order
  const allUnparseable = parsedItems.every(item => item.quantity === '#');
  if (allUnparseable) {
    console.log('All items unparseable - should not create order');
    return false;
  }

  // Calculate conversational ratio
  const productListOnly = extractProductList(message);
  const conversationalRatio = calculateConversationalRatio(message, productListOnly);
  
  console.log(`Conversational ratio: ${(conversationalRatio * 100).toFixed(1)}%`);
  
  // If more than 60% of the message is conversational text and we only have 1-2 items,
  // it's likely not a proper order
  if (conversationalRatio > 0.6 && parsedItems.length <= 2) {
    console.log('Too much conversational text for few items - should not create order');
    return false;
  }

  // If the message is very short (less than 15 characters after extraction) and only has 1 item,
  // it might be too vague
  if (productListOnly.length < 15 && parsedItems.length === 1) {
    console.log('Message too short with only 1 item - should not create order');
    return false;
  }

  console.log('Message is valid for order creation');
  return true;
}

// ============================================================================
// MESSAGE FORMATTING UTILITIES
// ============================================================================

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
function formatItemsList(items: ParsedOrderItem[], showPrices: boolean = false): string {
  return items.map((item) => {
    const quantity = item.quantity === '#' ? '' : `${item.quantity} `;
    const unit = item.unit ? `${item.unit} ` : '';
    const productName = item.product || 'Producto';
    return `• ${quantity}${unit}${productName}`;
  }).join('\n');
}

/**
 * Create confirmation message for new order
 */
function createConfirmationMessage(customerName: string, orderNumber: string, items: ParsedOrderItem[]): string {
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

// ============================================================================
// WHATSAPP API UTILITIES
// ============================================================================

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

// ============================================================================
// DATABASE UTILITIES
// ============================================================================

/**
 * Normalize phone number to international format
 */
function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('56')) {
    return '+' + cleaned;
  }
  
  if (cleaned.startsWith('9') && cleaned.length === 9) {
    return '+56' + cleaned;
  }
  
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
  const dbName = await getCustomerNameFromDatabase(supabase, phone);
  if (dbName) {
    console.log('Using customer name from database:', dbName);
    return dbName;
  }
  
  if (contact?.profile?.name) {
    console.log('Using customer name from WhatsApp contact:', contact.profile.name);
    return contact.profile.name;
  }
  
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

// ============================================================================
// MAIN WEBHOOK HANDLER
// ============================================================================

serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Handle GET request (webhook verification)
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

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

      const normalizedPhone = normalizePhoneNumber(from);
      console.log('Normalized phone:', normalizedPhone);

      const blocked = await isCustomerBlocked(supabase, normalizedPhone);
      if (blocked) {
        console.log('Customer is blocked');
        const customerName = await extractCustomerName(supabase, contact, from);
        
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

      const authorizedPhones = await loadAuthorizedPhones(supabase);
      const isAuthorized = authorizedPhones.has(normalizedPhone);
      console.log('Is authorized:', isAuthorized);

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

      const parsedItems = parseWhatsAppMessage(messageText);
      console.log('Parsed items:', parsedItems.length);

      // Check if this should be a query instead of an order
      const shouldBeQuery = !isAuthorized && (isQuestion(messageText) || parsedItems.length === 0);
      
      // Check if the message is valid for order creation
      const validForOrder = shouldCreateOrder(messageText, parsedItems);
      
      console.log('Should be query:', shouldBeQuery);
      console.log('Valid for order:', validForOrder);

      if (shouldBeQuery || !validForOrder) {
        console.log('Creating query or sending help message...');
        
        const { data: existingOrders } = await supabase
          .from('orders')
          .select('id, order_number, customer_name')
          .eq('customer_phone', normalizedPhone)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1);

        const existingOrder = existingOrders?.[0];
        
        if (existingOrder) {
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
            
            await addQueryToPrintQueue(supabase, query.id);
            
            try {
              const notificationTitle = `💬 Consulta: ${existingOrder.order_number}`;
              const notificationBody = `${existingOrder.customer_name}: ${messageText.substring(0, 100)}`;
              
              await supabase.from('notifications').insert({
                user_id: null,
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
          
          const customerName = await extractCustomerName(supabase, contact, from);
          if (config.auto_reply_enabled) {
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

      console.log('Creating order...');
      
      const customerName = await extractCustomerName(supabase, contact, from);
      
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

      // Only add parseable items to the order
      const parseableItems = parsedItems.filter(item => item.quantity !== '#');
      
      for (const item of parseableItems) {
        const notes = item.unit ? `unidad: ${item.unit}` : null;
        
        await supabase.from('order_items').insert({
          order_id: order.id,
          product_name: item.product,
          quantity: item.quantity,
          unit_price: 0,
          notes: notes,
        });
      }

      console.log('Order items created:', parseableItems.length);

      if (config.auto_reply_enabled) {
        const confirmationMessage = createConfirmationMessage(customerName, orderNumber, parseableItems);
        await sendWhatsAppMessage(
          config.phone_number_id,
          config.access_token,
          from,
          confirmationMessage
        );
      }

      try {
        const notificationTitle = `🛒 Nuevo Pedido: ${orderNumber}`;
        const notificationBody = `${customerName} - ${parseableItems.length} producto(s)`;
        
        await supabase.from('notifications').insert({
          user_id: null,
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
</write file>

Now let me deploy this updated webhook to Supabase:Perfect! The webhook has been deployed. Now let me create a documentation file explaining the improvements:

<write file="WHATSAPP_INTELLIGENT_ORDER_VALIDATION.md">
# WhatsApp Intelligent Order Validation

## Problem Solved

Previously, when a customer sent a message like:
```
"Hola buenas tardes quiero hacer un pedido de dos kilos de papas"
```

The system would create an order with the entire text, including greetings and conversational phrases. This resulted in orders with unnecessary text that should have been filtered out.

## Solution Implemented

The WhatsApp webhook now includes intelligent validation to determine whether a message should:
1. **Create an order** - When the message contains a clear product list
2. **Send a help message** - When the message is too conversational or unclear
3. **Create a query** - When the message is a question about an existing order

## How It Works

### 1. Product Extraction
The `extractProductList()` function removes:
- Greetings: "Hola", "Buenos días", "Buenas tardes", etc.
- Closings: "Gracias", "Saludos", "Bendiciones", etc.
- Filler phrases: "Quiero hacer un pedido", "Quisiera pedir", etc.
- Questions: Lines containing "?" or "¿"

### 2. Order Validation
The new `shouldCreateOrder()` function checks:

#### No Items Parsed
```javascript
if (parsedItems.length === 0) {
  return false; // Don't create order
}
```

#### All Items Unparseable
```javascript
const allUnparseable = parsedItems.every(item => item.quantity === '#');
if (allUnparseable) {
  return false; // Don't create order
}
```

#### Conversational Ratio Check
```javascript
const conversationalRatio = calculateConversationalRatio(message, productListOnly);

// If more than 60% is conversational text and only 1-2 items
if (conversationalRatio > 0.6 && parsedItems.length <= 2) {
  return false; // Too much conversation, not enough products
}
```

#### Message Length Check
```javascript
// If message is very short (< 15 chars) with only 1 item
if (productListOnly.length < 15 && parsedItems.length === 1) {
  return false; // Too vague
}
```

## Examples

### ✅ Valid Orders (Will Create Order)

**Example 1: Clear product list**
```
3 kilos de tomates
2 kilos de papas
5 pepinos
```
- Conversational ratio: 0%
- Items: 3
- Result: ✅ Order created

**Example 2: With greeting but clear products**
```
Hola, quiero:
3 kilos de tomates
2 kilos de papas
5 pepinos
1 cilantro
```
- Conversational ratio: ~20%
- Items: 4
- Result: ✅ Order created (enough products to be clear)

**Example 3: Horizontal format**
```
3 kilos de tomates, 2 kilos de papas, 5 pepinos, 1 cilantro
```
- Conversational ratio: 0%
- Items: 4
- Result: ✅ Order created

### ❌ Invalid Orders (Will Send Help Message)

**Example 1: Too much conversation, few products**
```
Hola buenas tardes quiero hacer un pedido de dos kilos de papas
```
- Conversational ratio: ~70%
- Items: 1
- Result: ❌ Help message sent

**Example 2: Only greeting**
```
Hola buenos días
```
- Conversational ratio: 100%
- Items: 0
- Result: ❌ Welcome message sent

**Example 3: Question**
```
¿Cuánto cuesta el kilo de tomates?
```
- Is question: Yes
- Result: ❌ Query created (if existing order) or help message

**Example 4: Vague message**
```
Quiero papas
```
- Message length: 13 chars
- Items: 1
- Result: ❌ Help message sent (too vague)

## Help Message

When validation fails, customers receive a helpful message:

```
❌ *No pudimos identificar productos*

Hola [Nombre]! No pude identificar productos en tu mensaje.

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

¡Gracias por tu comprensión! 😊
```

## Benefits

1. **Cleaner Orders**: Only actual products are added to orders
2. **Better User Experience**: Customers get immediate feedback if their message format is unclear
3. **Reduced Manual Work**: Less need to manually clean up orders
4. **Educational**: Help messages teach customers the correct format
5. **Flexible**: Still accepts various formats when the intent is clear

## Technical Details

### Conversational Ratio Calculation
```typescript
function calculateConversationalRatio(originalMessage: string, extractedProducts: string): number {
  const originalLength = originalMessage.trim().length;
  const extractedLength = extractedProducts.trim().length;
  
  if (originalLength === 0) return 0;
  
  const conversationalLength = originalLength - extractedLength;
  return conversationalLength / originalLength;
}
```

### Validation Thresholds
- **Conversational ratio threshold**: 60%
- **Minimum items for high conversation**: 3 items
- **Minimum message length for single item**: 15 characters

These thresholds can be adjusted based on real-world usage patterns.

## Future Improvements

Potential enhancements:
1. Machine learning to improve validation accuracy
2. Customer-specific learning (remember their typical order format)
3. Confidence scores for parsed items
4. Automatic correction suggestions
5. Multi-language support

## Testing

To test the new validation:

1. **Valid order**: Send "3 kilos de tomates, 2 kilos de papas, 5 pepinos"
   - Expected: Order created with 3 items

2. **Invalid order**: Send "Hola buenas tardes quiero hacer un pedido de dos kilos de papas"
   - Expected: Help message received

3. **Question**: Send "¿Cuánto cuesta?"
   - Expected: Query created (if existing order) or help message

4. **Greeting only**: Send "Hola"
   - Expected: Welcome message received
