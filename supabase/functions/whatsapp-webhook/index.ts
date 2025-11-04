
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

/**
 * Phone numbers that should ALWAYS be treated as new orders, never as queries
 * These customers never send queries, only new orders
 */
const ALWAYS_NEW_ORDER_PHONES = [
  '+56968782350',
  '+56993157848',
  '+56953503831'
];

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
 * Known unit variations - loaded from database
 */
let UNIT_VARIATIONS: Record<string, string[]> = {
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
};

/**
 * Greeting patterns to remove
 */
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

/**
 * Closing patterns to remove
 */
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

/**
 * Filler patterns to remove
 */
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

    // Check if line contains product-like patterns (quantity + product)
    // This helps identify actual product lines vs. conversational text
    const hasProductPattern = 
      /\d+/.test(trimmedLine) || // Contains numbers
      /\b(kilo|kg|gramo|gr|unidad|bolsa|malla|saco|cajón|cajon|atado|cabeza|libra|lb|docena|paquete|caja|litro|lt|metro)\b/i.test(trimmedLine) || // Contains units
      /\b(medio|media|cuarto|tercio)\b/i.test(trimmedLine) || // Contains fractions
      /\b(un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\b/i.test(trimmedLine); // Contains number words

    if (hasProductPattern) {
      productLines.push(trimmedLine);
    }
  }

  // If we found product lines, use them; otherwise use the cleaned message
  const result = productLines.length > 0 ? productLines.join('\n') : cleaned.trim();

  console.log('Extracted product list:', result);

  return result;
}

/**
 * Loads known units from database
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

    // Merge database units with default units
    for (const unit of data) {
      UNIT_VARIATIONS[unit.unit_name] = unit.variations;
    }

    console.log(`Loaded ${Object.keys(UNIT_VARIATIONS).length} known units`);
  } catch (error) {
    console.error('Exception loading known units:', error);
  }
}

/**
 * Adds a new unit to the database
 */
async function addNewUnit(supabase: any, unitName: string, variation: string) {
  try {
    const normalizedUnit = unitName.toLowerCase().trim();
    const normalizedVariation = variation.toLowerCase().trim();

    const { data: existing } = await supabase
      .from('known_units')
      .select('id, variations')
      .eq('unit_name', normalizedUnit)
      .single();

    if (existing) {
      if (!existing.variations.includes(normalizedVariation)) {
        const updatedVariations = [...existing.variations, normalizedVariation];
        const { error } = await supabase
          .from('known_units')
          .update({ 
            variations: updatedVariations,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) {
          console.error('Error updating unit variations:', error);
        } else {
          console.log(`✓ Added variation "${normalizedVariation}" to unit "${normalizedUnit}"`);
          UNIT_VARIATIONS[normalizedUnit] = updatedVariations;
        }
      }
    } else {
      const { error } = await supabase
        .from('known_units')
        .insert({
          unit_name: normalizedUnit,
          variations: [normalizedVariation, normalizedUnit],
          is_custom: true
        });

      if (error) {
        console.error('Error creating new unit:', error);
      } else {
        console.log(`✓ Created new unit "${normalizedUnit}" with variation "${normalizedVariation}"`);
        UNIT_VARIATIONS[normalizedUnit] = [normalizedVariation, normalizedUnit];
      }
    }
  } catch (error) {
    console.error('Exception adding new unit:', error);
  }
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
        if (standardUnit === 'cajón') return 'cajones';
        if (standardUnit.endsWith('z')) return standardUnit.slice(0, -1) + 'ces';
        return standardUnit + 's';
      }
    }
  }

  return quantity === 1 ? 'unidad' : 'unidades';
}

/**
 * Cleans and normalizes a segment for parsing by removing bullet points, numbering, and other list formatting
 */
function cleanSegment(segment: string): string {
  let cleaned = segment.trim();
  
  // Remove common bullet point characters at the start
  // Includes: • ● ○ ◦ ▪ ▫ ■ □ ★ ☆ ✓ ✔ ✗ ✘ ➤ ➢ ► ▸ ▹ ▻ ⇒ ⇨ → ⟶ ⟹ ⟼ ⤏ ⤐ and many more
  cleaned = cleaned.replace(/^[•●○◦▪▫■□★☆✓✔✗✘➤➢►▸▹▻⇒⇨→⟶⟹⟼⤏⤐⤑⤔⤕⤖⤗⤘⤙⤚⤛⤜⤝⤞⤟⤠⤡⤢⤣⤤⤥⤦⤧⤨⤩⤪⤫⤬⤭⤮⤯⤰⤱⤲⤳⤴⤵⤶⤷⤸⤹⤺⤻⤼⤽⤾⤿⥀⥁⥂⥃⥄⥅⥆⥇⥈⥉⥊⥋⥌⥍⥎⥏⥐⥑⥒⥓⥔⥕⥖⥗⥘⥙⥚⥛⥜⥝⥞⥟⥠⥡⥢⥣⥤⥥⥦⥧⥨⥩⥪⥫⥬⥭⥮⥯⥰⥱⥲⥳⥴⥵⥶⥷⥸⥹⥺⥻⥼⥽⥾⥿·*+~]\s*/, '');
  
  // Remove numbered list markers (1. or 1) or 1- or 1: )
  cleaned = cleaned.replace(/^\d+[.):]\s*/, '');
  
  // Remove lettered list markers (a. or a) or A. or A) )
  cleaned = cleaned.replace(/^[a-zA-Z][.):]\s*/, '');
  
  // Remove Roman numeral list markers (i. or I. or iv) or IV) )
  cleaned = cleaned.replace(/^(?:i{1,3}|iv|v|vi{0,3}|ix|x|xi{0,3}|xiv|xv)[.):]\s*/i, '');
  
  // Remove parenthesized numbers or letters at the start: (1) or (a) or (A)
  cleaned = cleaned.replace(/^\([0-9a-zA-Z]+\)\s*/, '');
  
  // Remove square bracketed numbers or letters at the start: [1] or [a] or [A]
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
function parseSegment(segment: string): { item: any, unknownUnit?: string } {
  const trimmed = segment.trim();

  if (!trimmed) {
    return { item: { quantity: '#', unit: '', product: trimmed } };
  }

  const cleaned = cleanSegment(trimmed);

  if (!cleaned) {
    return { item: { quantity: '#', unit: '', product: trimmed } };
  }

  // NEW Strategy 0a: Integer + Space + Fraction + Space + Product (no unit, no "de")
  // Examples: "1 1/2 manzana", "2 3/4 papas"
  // This should be parsed as "1.5 kilos de manzana", "2.75 kilos de papas"
  let match = cleaned.match(/^(\d+)\s+(\d+)\/(\d+)\s+([a-zA-ZáéíóúñÁÉÍÓÚÑ].+)$/i);
  if (match) {
    const integerPart = parseInt(match[1]);
    const numerator = parseInt(match[2]);
    const denominator = parseInt(match[3]);
    const restOfText = match[4].trim();
    
    // Check if the first word after the fraction is a known unit
    const firstWord = restOfText.split(/\s+/)[0];
    const isFirstWordUnit = isKnownUnit(firstWord);
    
    if (!isFirstWordUnit) {
      // No unit found, so this is "quantity product" format
      const quantity = integerPart + (numerator / denominator);
      const product = restOfText;
      
      if (quantity > 0 && product) {
        const unit = normalizeUnit('kilo', quantity);
        console.log(`✓ Strategy 0a (NEW): "${cleaned}" → ${quantity} ${unit} de ${product}`);
        return { item: { quantity, unit, product } };
      }
    }
  }

  // NEW Strategy 0b: Integer + Space + Fraction + Unit + Product (no "de")
  // Examples: "1 1/2 kilo manzana", "2 3/4 kg papas"
  // This should be parsed as "1.5 kilos de manzana", "2.75 kg de papas"
  match = cleaned.match(/^(\d+)\s+(\d+)\/(\d+)\s+(\w+)\s+(.+)$/i);
  if (match) {
    const integerPart = parseInt(match[1]);
    const numerator = parseInt(match[2]);
    const denominator = parseInt(match[3]);
    const unitStr = match[4];
    const product = match[5].trim();
    
    if (isKnownUnit(unitStr)) {
      const quantity = integerPart + (numerator / denominator);
      
      if (quantity > 0 && product) {
        const unit = normalizeUnit(unitStr, quantity);
        console.log(`✓ Strategy 0b (NEW): "${cleaned}" → ${quantity} ${unit} de ${product}`);
        return { item: { quantity, unit, product } };
      }
    }
  }

  // Strategy 1: Integer + Space + Fraction + Unit + "de" + Product
  // Examples: "1 1/2 kilo de manzanas", "2 3/4 kg de papas"
  match = cleaned.match(/^(\d+\s+\d+\/\d+)\s+(\w+)\s+de\s+(.+)$/i);
  if (match) {
    const quantityStr = match[1];
    const quantity = parseQuantityValue(quantityStr);
    const unitStr = match[2];
    const product = match[3].trim();
    
    if (quantity > 0 && product) {
      const isKnown = isKnownUnit(unitStr);
      const unit = isKnown ? normalizeUnit(unitStr, quantity) : unitStr.toLowerCase();
      
      console.log(`✓ Strategy 1: "${cleaned}" → ${quantity} ${unit} de ${product}`);
      return { 
        item: { quantity, unit, product },
        unknownUnit: isKnown ? undefined : unitStr.toLowerCase()
      };
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
      const unit = normalizeUnit('kilo', quantity);
      console.log(`✓ Strategy 2: "${cleaned}" → ${quantity} ${unit} de ${product}`);
      return { item: { quantity, unit, product } };
    }
  }

  // Strategy 3: Quantity + "y medio/media/cuarto/tercio" + Unit + "de" + Product
  // Examples: "1 y medio kilo de manzanas", "2 y media libras de papas"
  match = cleaned.match(/^(\d+(?:\.\d+)?)\s*y\s*(medio|media|cuarto|tercio)\s+(\w+)\s+de\s+(.+)$/i);
  if (match) {
    const baseQuantity = parseFloat(match[1]);
    const fractionWord = match[2].toLowerCase();
    const fractionValue = fractionWord === 'cuarto' ? 0.25 : fractionWord === 'tercio' ? 0.33 : 0.5;
    const quantity = baseQuantity + fractionValue;
    const unitStr = match[3];
    const product = match[4].trim();

    if (quantity > 0 && product) {
      const isKnown = isKnownUnit(unitStr);
      const unit = isKnown ? normalizeUnit(unitStr, quantity) : unitStr.toLowerCase();
      
      console.log(`✓ Strategy 3: "${cleaned}" → ${quantity} ${unit} de ${product}`);
      return { 
        item: { quantity, unit, product },
        unknownUnit: isKnown ? undefined : unitStr.toLowerCase()
      };
    }
  }

  // Strategy 4: Quantity + "y medio/media/cuarto/tercio" + "de" + Product (no explicit unit)
  // Examples: "1 y medio de manzanas", "2 y media de papas"
  match = cleaned.match(/^(\d+(?:\.\d+)?)\s*y\s*(medio|media|cuarto|tercio)\s+de\s+(.+)$/i);
  if (match) {
    const baseQuantity = parseFloat(match[1]);
    const fractionWord = match[2].toLowerCase();
    const fractionValue = fractionWord === 'cuarto' ? 0.25 : fractionWord === 'tercio' ? 0.33 : 0.5;
    const quantity = baseQuantity + fractionValue;
    const product = match[3].trim();

    if (quantity > 0 && product) {
      const unit = normalizeUnit('kilo', quantity);
      console.log(`✓ Strategy 4: "${cleaned}" → ${quantity} ${unit} de ${product}`);
      return { item: { quantity, unit, product } };
    }
  }

  // Strategy 5: Fraction word + Unit + "de" + Product
  // Examples: "medio kilo de papas", "un cuarto de lechuga"
  match = cleaned.match(/^(medio|media|cuarto|tercio|un|uno|una)\s+(\w+)\s+de\s+(.+)$/i);
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
    }

    if (product) {
      const isKnown = isKnownUnit(unitStr);
      const unit = isKnown ? normalizeUnit(unitStr, quantity) : unitStr.toLowerCase();
      
      console.log(`✓ Strategy 5: "${cleaned}" → ${quantity} ${unit} de ${product}`);
      return { 
        item: { quantity, unit, product },
        unknownUnit: isKnown ? undefined : unitStr.toLowerCase()
      };
    }
  }

  // Strategy 6: Fraction word + "de" + Product (no explicit unit)
  // Examples: "medio de papas", "un cuarto de lechuga"
  match = cleaned.match(/^(medio|media|cuarto|tercio)\s+de\s+(.+)$/i);
  if (match) {
    const quantityWord = match[1].toLowerCase();
    const product = match[2].trim();

    let quantity = 0.5;
    if (quantityWord === 'cuarto') {
      quantity = 0.25;
    } else if (quantityWord === 'tercio') {
      quantity = 0.33;
    }

    if (product) {
      const unit = normalizeUnit('kilo', quantity);
      console.log(`✓ Strategy 6: "${cleaned}" → ${quantity} ${unit} de ${product}`);
      return { item: { quantity, unit, product } };
    }
  }

  // Strategy 7: Quantity + Unit + "de" + Product
  // Examples: "3 kilos de tomates", "2 kg de papas", "dos kilos de cebollas"
  match = cleaned.match(/^(\d+(?:[.,]\d+)?(?:\/\d+)?|\w+)\s+(\w+)\s+de\s+(.+)$/i);
  if (match) {
    const quantityStr = match[1].replace(',', '.');
    const quantity = parseQuantityValue(quantityStr);
    const unitStr = match[2];
    const product = match[3].trim();

    if (quantity > 0 && product) {
      const isKnown = isKnownUnit(unitStr);
      const unit = isKnown ? normalizeUnit(unitStr, quantity) : unitStr.toLowerCase();
      
      console.log(`✓ Strategy 7: "${cleaned}" → ${quantity} ${unit} de ${product}`);
      return { 
        item: { quantity, unit, product },
        unknownUnit: isKnown ? undefined : unitStr.toLowerCase()
      };
    }
  }

  // Strategy 8: Quantity + Unit + Product (no "de")
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
        console.log(`✓ Strategy 8: "${cleaned}" → ${quantity} ${unit} de ${product}`);
        return { item: { quantity, unit, product } };
      }
    }
  }

  // Strategy 9: Quantity + Product (no explicit unit)
  // Examples: "3 tomates", "5 pepinos", "dos lechugas"
  match = cleaned.match(/^(\d+(?:[.,]\d+)?(?:\/\d+)?|\w+)\s+(.+)$/i);
  if (match) {
    const quantityStr = match[1].replace(',', '.');
    const quantity = parseQuantityValue(quantityStr);
    const restOfText = match[2].trim();

    const firstWord = restOfText.split(/\s+/)[0];
    if (quantity > 0 && restOfText && !isKnownUnit(firstWord)) {
      const unit = normalizeUnit('', quantity);
      console.log(`✓ Strategy 9: "${cleaned}" → ${quantity} ${unit} de ${restOfText}`);
      return { item: { quantity, unit, product: restOfText } };
    }
  }

  // Strategy 10: Product + Quantity + Unit (reversed order)
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
        console.log(`✓ Strategy 10: "${cleaned}" → ${quantity} ${unit} de ${product}`);
        return { item: { quantity, unit, product } };
      }
    }
  }

  // Strategy 11: Product + Quantity (no unit, reversed order)
  // Examples: "tomates 3", "pepinos 5"
  match = cleaned.match(/^([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+?)\s+(\d+(?:[.,]\d+)?(?:\/\d+)?|\w+)$/i);
  if (match) {
    const product = match[1].trim();
    const quantityStr = match[2].replace(',', '.');
    const quantity = parseQuantityValue(quantityStr);

    if (quantity > 0 && product && !isKnownUnit(product.split(/\s+/).pop() || '')) {
      const unit = normalizeUnit('', quantity);
      console.log(`✓ Strategy 11: "${cleaned}" → ${quantity} ${unit} de ${product}`);
      return { item: { quantity, unit, product } };
    }
  }

  // Strategy 12: Unit + "de" + Product (no explicit quantity, assume 1)
  // Examples: "kilo de tomates", "bolsa de papas"
  match = cleaned.match(/^(\w+)\s+de\s+(.+)$/i);
  if (match) {
    const unitStr = match[1];
    const product = match[2].trim();

    if (isKnownUnit(unitStr) && product) {
      const quantity = 1;
      const unit = normalizeUnit(unitStr, quantity);
      console.log(`✓ Strategy 12: "${cleaned}" → ${quantity} ${unit} de ${product}`);
      return { item: { quantity, unit, product } };
    }
  }

  // Strategy 13: Just Product (default to 1 unit)
  // Examples: "tomates", "cilantro", "lechuga"
  if (cleaned.length > 0 && !cleaned.match(/^\d/) && !isKnownUnit(cleaned.split(/\s+/)[0])) {
    console.log(`✓ Strategy 13: "${cleaned}" → 1 unidad de ${cleaned}`);
    return { item: { quantity: 1, unit: 'unidad', product: cleaned } };
  }

  // Fallback: unparseable item with "#" quantity
  console.warn(`✗ Could not parse: "${cleaned}"`);
  return { item: { quantity: '#', unit: '', product: cleaned } };
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
 * Detects if the message is in horizontal format
 */
function isHorizontalFormat(message: string): boolean {
  const lines = message.split('\n').filter(l => l.trim().length > 0);

  if (lines.length === 1 && message.match(/[,;|]/)) {
    return true;
  }

  const yPattern = /\s+y\s+\d/i;
  if (lines.some(line => yPattern.test(line))) {
    return true;
  }

  return false;
}

/**
 * Intelligent WhatsApp message parser
 */
function parseWhatsAppMessage(message: string): { items: any[], unknownUnits: string[] } {
  if (!message || !message.trim()) {
    console.warn('Empty message provided');
    return { items: [], unknownUnits: [] };
  }

  // First, extract only the product list from the message
  const productListOnly = extractProductList(message);

  if (!productListOnly || !productListOnly.trim()) {
    console.log('No product list found after extraction');
    return { items: [], unknownUnits: [] };
  }

  const lines = productListOnly.split('\n');
  const orderItems: any[] = [];
  const unknownUnits: string[] = [];

  console.log(`\n========== INTELLIGENT PARSING (${lines.length} lines) ==========`);
  console.log(`Format: ${isHorizontalFormat(productListOnly) ? 'HORIZONTAL' : 'VERTICAL'}`);

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
        const parsed = parseSegment(segment);

        orderItems.push(parsed.item);

        if (parsed.unknownUnit && !unknownUnits.includes(parsed.unknownUnit)) {
          unknownUnits.push(parsed.unknownUnit);
        }

        if (parsed.item.quantity === '#') {
          console.log(`  ⚠ Unparseable: "${segment}"`);
        } else {
          console.log(`  ✓ Success: "${segment}" → ${parsed.item.quantity} ${parsed.item.unit} de ${parsed.item.product}`);
        }
      } catch (error) {
        console.error(`  ✗ Error parsing segment "${segment}":`, error);
        orderItems.push({ quantity: '#', unit: '', product: segment });
      }
    }
  }

  console.log(`\n========== PARSING COMPLETE: ${orderItems.length} items ==========`);

  return { items: orderItems, unknownUnits };
}

/**
 * Checks if message is a greeting
 */
function isGreeting(message: string): boolean {
  const normalized = message.toLowerCase().trim();
  
  if (normalized.includes('?') || normalized.includes('¿')) {
    return true;
  }
  
  for (const pattern of GREETING_PATTERNS) {
    if (pattern.test(normalized)) {
      return true;
    }
  }
  
  for (const pattern of QUESTION_PATTERNS) {
    if (normalized.includes(pattern)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Checks if message contains new order keywords
 */
function isNewOrderKeyword(message: string): boolean {
  const normalized = message.toLowerCase().trim();
  
  const newOrderPatterns = [
    /\bnuevo\s+pedido\b/i,
    /\botro\s+pedido\b/i,
  ];
  
  for (const pattern of newOrderPatterns) {
    if (pattern.test(normalized)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Removes new order keywords from message
 */
function removeNewOrderKeywords(message: string): string {
  let cleaned = message;
  
  cleaned = cleaned.replace(/\bnuevo\s+pedido\b/gi, '');
  cleaned = cleaned.replace(/\botro\s+pedido\b/gi, '');
  
  return cleaned.trim();
}

/**
 * Format currency as Chilean Pesos
 */
function formatCLP(amount: number): string {
  return `$${amount.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Formats items list for messages
 */
function formatItemsList(items: any[], showPrices: boolean = false): string {
  return items.map((item) => {
    const priceText = showPrices && item.unit_price > 0 ? ` - ${formatCLP(item.unit_price)}` : '';
    const quantityDisplay = item.quantity === '#' ? '#' : item.quantity;
    const unitDisplay = item.unit ? ` ${item.unit}` : '';
    return `${quantityDisplay}${unitDisplay} de ${item.product}`;
  }).join('\n');
}

/**
 * Creates confirmation message
 */
function createConfirmationMessage(customerName: string, orderNumber: string, items: any[]): string {
  const itemsList = formatItemsList(items, false);
  
  const hasUnparseableItems = items.some(item => item.quantity === '#');
  const unparseableNote = hasUnparseableItems ? '\n\n⚠️ *Nota:* Algunos productos tienen cantidad "#" porque no pudieron ser procesados correctamente. Por favor revisa tu pedido y confirma las cantidades.' : '';
  
  return `✅ *¡Pedido Recibido!*

Hola ${customerName}, hemos recibido tu pedido correctamente.

📋 *Número de pedido:* ${orderNumber}

📦 *Productos solicitados:*
${itemsList}${unparseableNote}

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

⚠️ *IMPORTANTE:* Envía SOLO la lista de productos, sin saludos ni texto extra. La aplicación detectará automáticamente quién eres.

📝 *Formatos sugeridos:*

*Formato vertical:*
3 kilos de tomates
2 kilos de palta
1 kg de papas
5 pepinos

*Formato horizontal:*
3 kilos de tomates, 2 kilos de palta, 5 pepinos

*Otros formatos válidos:*
3k de tomates
1/2 kilo de papas
1 1/2 kilo de manzanas
1 1/2 manzana (se asume kilos)
1 y medio kilo de papas
medio kilo de cebollas
tomates 3 kilos (orden invertido)
dos kilos de papas (números en texto)

🚫 *NO envíes:* "Hola, quiero pedir...", "Gracias", etc.
✅ *SÍ envía:* Solo la lista de productos

¡Gracias por tu comprensión! 😊`;
}

/**
 * Creates welcome message
 */
function createWelcomeMessage(customerName: string): string {
  return `👋 *¡Hola ${customerName}!*

Gracias por contactarnos. Para hacer un pedido, es muy importante que sigas estas instrucciones:

⚠️ *IMPORTANTE:*
🔹 Envía SOLO la lista de productos
🔹 NO incluyas saludos, despedidas ni texto extra
🔹 La aplicación detectará automáticamente quién eres

📝 *Ejemplos de cómo hacer tu pedido:*

*Formato vertical:*
3 kilos de tomates
2 kilos de paltas
5 pepinos
1 cilantro

*Formato horizontal:*
3 kilos de tomates, 2 kilos de paltas, 5 pepinos

*Otros formatos válidos:*
3k de tomates
1/2 kilo de papas
1 1/2 kilo de manzanas
1 1/2 manzana (se asume kilos)
1 y medio kilo de papas
medio kilo de cebollas
tomates 3 kilos
dos kilos de papas

🚫 *Ejemplo INCORRECTO:*
"Hola, buenos días, quiero hacer un pedido de 3 kilos de tomates. Gracias"

✅ *Ejemplo CORRECTO:*
3 kilos de tomates
2 kilos de paltas

¿En qué podemos ayudarte hoy? 😊`;
}

/**
 * Creates status update message
 */
function createStatusUpdateMessage(customerName: string, orderNumber: string, status: string, items: any[]): string {
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
  const itemsList = formatItemsList(allItems, false);
  const quantityDisplay = addedProduct.quantity === '#' ? '#' : addedProduct.quantity;
  const unitDisplay = addedProduct.unit ? ` ${addedProduct.unit}` : '';

  return `➕ *Producto Agregado*

Hola ${customerName}, se ha agregado un producto a tu pedido.

📋 *Número de pedido:* ${orderNumber}

✨ *Producto agregado:*
${quantityDisplay}${unitDisplay} de ${addedProduct.product}

📦 *Lista completa de productos:*
${itemsList}

¡Gracias por tu preferencia! 😊`;
}

/**
 * Gets status label in Spanish
 */
function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'preparing':
      return 'En Preparación';
    case 'ready':
      return 'Listo para Entrega';
    case 'delivered':
      return 'Entregado';
    case 'cancelled':
      return 'Cancelado';
    default:
      return status;
  }
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

/**
 * Adds query to print queue for auto-printing
 * This marks the query for auto-printing when the app is active
 */
async function addQueryToPrintQueue(supabase: any, queryId: string) {
  try {
    console.log('[WhatsApp Webhook] Adding query to print queue:', queryId);
    
    // Get existing print queue
    const QUERIES_TO_PRINT_KEY = '@queries_to_print';
    
    // We can't directly access AsyncStorage from Edge Function,
    // so we'll use a database table to track queries that need printing
    const { error } = await supabase
      .from('print_queue')
      .insert({
        item_type: 'query',
        item_id: queryId,
        status: 'pending',
      });
    
    if (error) {
      console.error('[WhatsApp Webhook] Error adding query to print queue:', error);
    } else {
      console.log('[WhatsApp Webhook] Query added to print queue successfully');
    }
  } catch (error) {
    console.error('[WhatsApp Webhook] Exception adding query to print queue:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Load known units from database
    await loadKnownUnits(supabase);

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
        
        const contact = contacts?.find((c: any) => c.wa_id === customerPhone);
        let customerName = extractCustomerName(contact, customerPhone);

        console.log('Processing message from:', customerName, '(', customerPhone, ')');
        console.log('Message text:', messageText);

        // NEW LOGIC: Check if this phone number should ALWAYS be treated as a new order
        const isAlwaysNewOrderPhone = ALWAYS_NEW_ORDER_PHONES.includes(customerPhone);
        console.log('Is always-new-order phone:', isAlwaysNewOrderPhone);

        // Check if customer has an order in active statuses (pending, preparing, ready)
        // Orders in delivered, pending_payment, paid, or cancelled statuses should NOT trigger query behavior
        // UNLESS the phone number is in the ALWAYS_NEW_ORDER_PHONES list
        const { data: existingOrders } = await supabase
          .from('orders')
          .select('id, order_number, customer_name, status, items:order_items(*)')
          .eq('customer_phone', customerPhone)
          .in('status', ['pending', 'preparing', 'ready']) // Only these statuses trigger query behavior
          .order('created_at', { ascending: false })
          .limit(1);

        const hasActiveOrder = existingOrders && existingOrders.length > 0;
        const activeOrder = hasActiveOrder ? existingOrders[0] : null;

        console.log('Has active order (pending/preparing/ready):', hasActiveOrder);
        if (activeOrder) {
          console.log('Active order:', activeOrder.order_number, 'Status:', activeOrder.status);
        } else {
          console.log('No active order found - message will be treated as new order');
        }

        // Check for new order keywords
        const hasNewOrderKeyword = isNewOrderKeyword(messageText);
        console.log('Has new order keyword:', hasNewOrderKeyword);

        // If customer has active order (pending/preparing/ready) and no new order keyword, 
        // AND is NOT in the always-new-order list, treat as query
        if (hasActiveOrder && !hasNewOrderKeyword && !isAlwaysNewOrderPhone && activeOrder) {
          console.log('Treating message as order query');
          
          // Save query to database with direction='incoming'
          const { data: queryData, error: queryError } = await supabase
            .from('order_queries')
            .insert({
              order_id: activeOrder.id,
              customer_phone: customerPhone,
              query_text: messageText,
              direction: 'incoming',
              whatsapp_message_id: messageId,
            })
            .select()
            .single();

          if (queryError) {
            console.error('Error saving query:', queryError);
          } else {
            console.log('Query saved successfully with ID:', queryData.id);
            
            // Add query to print queue for auto-printing
            await addQueryToPrintQueue(supabase, queryData.id);
          }

          // Send immediate acknowledgment message
          if (config.access_token && config.phone_number_id) {
            try {
              const queryResponse = `📋 *Consulta Recibida*

Hola ${activeOrder.customer_name}, hemos recibido tu consulta sobre el pedido ${activeOrder.order_number}.

❓ *Tu consulta:*
${messageText}

⏰ Estamos revisando tu consulta y te responderemos a la brevedad.

¡Gracias por tu paciencia! 😊`;

              await sendWhatsAppMessage(
                config.phone_number_id,
                config.access_token,
                customerPhone,
                queryResponse
              );
              console.log('Sent query acknowledgment to:', customerPhone);
            } catch (error) {
              console.error('Error sending query acknowledgment:', error);
            }
          }

          continue;
        }

        // If phone is in always-new-order list, log it
        if (isAlwaysNewOrderPhone) {
          console.log('Phone number is in always-new-order list - bypassing query check and treating as new order');
        }

        // If has new order keyword, remove it and process as new order
        let processedMessageText = messageText;
        if (hasNewOrderKeyword) {
          processedMessageText = removeNewOrderKeywords(messageText);
          console.log('Removed new order keywords, processing:', processedMessageText);
        }

        // Check for Manual keyword
        const startsWithManual = /^\s*manual\s*/i.test(processedMessageText);
        
        if (startsWithManual) {
          console.log('Detected Manual keyword');
          
          const withoutManual = processedMessageText.replace(/^\s*manual\s*[:#]?\s*/i, '');
          
          let customCustomerName = '';
          let orderText = '';
          
          const hashPattern = /^#([^#]+)#\s*(.+)$/s;
          const hashMatch = withoutManual.match(hashPattern);
          
          if (hashMatch) {
            customCustomerName = hashMatch[1].trim();
            orderText = hashMatch[2].trim();
            console.log('Extracted name from # pattern:', customCustomerName);
          } else {
            const lines = withoutManual.split('\n');
            
            if (lines.length >= 2) {
              customCustomerName = lines[0].trim();
              orderText = lines.slice(1).join('\n').trim();
              console.log('Extracted name from first line:', customCustomerName);
            } else if (lines.length === 1) {
              const singleLine = lines[0].trim();
              
              const orderStartMatch = singleLine.match(/\b(\d+(?:\/\d+)?|\w+)\s+(?:\w+\s+)?(?:de\s+)?[a-zA-Z]/);
              
              if (orderStartMatch && orderStartMatch.index !== undefined && orderStartMatch.index > 0) {
                customCustomerName = singleLine.substring(0, orderStartMatch.index).trim();
                orderText = singleLine.substring(orderStartMatch.index).trim();
                console.log('Extracted name from single line split:', customCustomerName);
              } else {
                console.log('Could not split name and order from single line');
                customCustomerName = singleLine;
                orderText = '';
              }
            }
          }
          
          if (!customCustomerName || !orderText) {
            console.log('Manual format error: missing name or order text');
            
            if (config.access_token && config.phone_number_id) {
              try {
                const errorMsg = `❌ *Formato Manual Incorrecto*

Hola! Para usar el formato Manual, debes especificar el nombre del cliente y los productos.

📝 *Formatos válidos:*

*Opción 1 (con #):*
Manual #Juan Pérez#
3 kilos de tomates
2 kilos de papas

*Opción 2 (con salto de línea):*
Manual: Juan Pérez
3 kilos de tomates
2 kilos de papas

*Opción 3 (simple):*
Manual Juan Pérez
3 kilos de tomates
2 kilos de papas

¡Intenta nuevamente! 😊`;
                
                await sendWhatsAppMessage(
                  config.phone_number_id,
                  config.access_token,
                  customerPhone,
                  errorMsg
                );
                console.log('Sent Manual format error message to:', customerPhone);
              } catch (error) {
                console.error('Error sending Manual format error message:', error);
              }
            }
            
            continue;
          }
          
          console.log('Custom customer name:', customCustomerName);
          console.log('Order text:', orderText);
          
          const parseResult = parseWhatsAppMessage(orderText);
          const parsedItems = parseResult.items;
          const unknownUnits = parseResult.unknownUnits;
          
          // Add unknown units to database
          for (const unknownUnit of unknownUnits) {
            await addNewUnit(supabase, unknownUnit, unknownUnit);
          }
          
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

          // Create order items (including unparseable ones with "#" quantity)
          const orderItems = parsedItems.map((item) => {
            const notes = item.unit ? `Unidad: ${item.unit}` : '';
            return {
              order_id: order.id,
              product_name: `${item.product}`,
              quantity: item.quantity === '#' ? '#' : item.quantity,
              unit_price: 0,
              notes,
            };
          });

          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

          if (itemsError) {
            console.error('Error creating order items for Manual order:', itemsError);
          }

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
        if (isGreeting(processedMessageText)) {
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
        const parseResult = parseWhatsAppMessage(processedMessageText);
        const parsedItems = parseResult.items;
        const unknownUnits = parseResult.unknownUnits;

        // Add unknown units to database
        for (const unknownUnit of unknownUnits) {
          await addNewUnit(supabase, unknownUnit, unknownUnit);
        }

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

        // Create order items (including unparseable ones with "#" quantity)
        const orderItems = parsedItems.map((item) => {
          const notes = item.unit ? `Unidad: ${item.unit}` : '';
          return {
            order_id: order.id,
            product_name: `${item.product}`,
            quantity: item.quantity === '#' ? '#' : item.quantity,
            unit_price: 0,
            notes,
          };
        });

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
