
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

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
 * Known unit variations - loaded from database
 */
let UNIT_VARIATIONS: Record<string, string[]> = {};

/**
 * Greeting patterns
 */
const GREETINGS = [
  'hola', 'buenos días', 'buenas tardes', 'buenas noches',
  'buen día', 'buena tarde', 'buena noche',
  'saludos', 'holi', 'holaaa', 'hey', 'ey',
  'qué tal', 'que tal', 'cómo estás', 'como estas',
  'cómo están', 'como estan', 'qué onda', 'que onda'
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

    UNIT_VARIATIONS = {};
    for (const unit of data) {
      UNIT_VARIATIONS[unit.unit_name] = unit.variations;
    }

    console.log(`Loaded ${Object.keys(UNIT_VARIATIONS).length} known units from database`);
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

    // Check if unit already exists
    const { data: existing } = await supabase
      .from('known_units')
      .select('id, variations')
      .eq('unit_name', normalizedUnit)
      .single();

    if (existing) {
      // Unit exists, check if variation is already included
      if (!existing.variations.includes(normalizedVariation)) {
        // Add variation to existing unit
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
          // Update local cache
          UNIT_VARIATIONS[normalizedUnit] = updatedVariations;
        }
      }
    } else {
      // Create new unit
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
        // Update local cache
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
 * Parses a quantity value from a string, handling fractions, decimals, and text numbers
 * Enhanced to handle combined integers and fractions (e.g., "1 1/2", "1 y medio")
 */
function parseQuantityValue(quantityStr: string): number {
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

  console.warn(`Could not parse quantity: "${quantityStr}"`);
  return 0;
}

/**
 * Checks if a word is a known unit
 */
function isKnownUnit(word: string): boolean {
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
 * Normalizes a unit to its standard form
 */
function normalizeUnit(unit: string, quantity: number = 1): string {
  if (!unit || !unit.trim()) {
    return quantity === 1 ? 'unidad' : 'unidades';
  }

  const normalized = unit.toLowerCase().trim();

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
 * Parses a single segment from the WhatsApp message
 * Returns parsed item and detected unknown unit (if any)
 * Enhanced to handle combined integers and fractions
 * Enhanced to handle combined quantity and product without spaces
 */
function parseSegment(segment: string): { item: any, unknownUnit?: string } | null {
  const trimmed = segment.trim();

  if (!trimmed) {
    return null;
  }

  const cleaned = trimmed.replace(/^[-•*]\s*/, '').trim();

  if (!cleaned) {
    return null;
  }

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
        return { item: { quantity, unit, product: productStr.toLowerCase() } };
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
        return { item: { quantity, unit, product: productStr.toLowerCase() } };
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
      return { item: { quantity, unit: normalizedUnit, product } };
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
      return { item: { quantity, unit: normalizedUnit, product } };
    }
  }

  // Pattern C: Integer + Space + Fraction + Unit + "de" + Product
  // (e.g., "1 1/2 kilo de manzanas", "2 1/4 kilos de papas")
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
      return { item: { quantity, unit: normalizedUnit, product } };
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
      return { item: { quantity, unit: normalizedUnit, product } };
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
      return { item: { quantity, unit: normalizedUnit, product } };
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
      return { item: { quantity, unit: normalizedUnit, product } };
    }
  }

  // Pattern 1: Cantidad + Unidad + "de" + Producto
  match = cleaned.match(/^(\d+(?:\/\d+)?|\w+)\s+(\w+)\s+de\s+(.+)$/i);
  if (match) {
    const quantity = parseQuantityValue(match[1]);
    const unitStr = match[2];
    const product = match[3].trim();

    if (quantity > 0 && product) {
      const isKnown = isKnownUnit(unitStr);
      const unit = isKnown ? normalizeUnit(unitStr, quantity) : unitStr.toLowerCase();
      
      return { 
        item: { quantity, unit, product },
        unknownUnit: isKnown ? undefined : unitStr.toLowerCase()
      };
    }
  }

  // Pattern 2: Cantidad + Unidad (sin espacio) + "de" + Producto
  match = cleaned.match(/^(\d+(?:\/\d+)?)([a-zA-Z]+)\s+de\s+(.+)$/i);
  if (match) {
    const quantity = parseQuantityValue(match[1]);
    const unitStr = match[2];
    const product = match[3].trim();

    if (quantity > 0 && product) {
      const isKnown = isKnownUnit(unitStr);
      const unit = isKnown ? normalizeUnit(unitStr, quantity) : unitStr.toLowerCase();
      
      return { 
        item: { quantity, unit, product },
        unknownUnit: isKnown ? undefined : unitStr.toLowerCase()
      };
    }
  }

  // Pattern 3: Cantidad + Unidad (sin espacio) + Producto
  match = cleaned.match(/^(\d+(?:\/\d+)?)([a-zA-Z]+)\s+(.+)$/i);
  if (match) {
    const potentialUnit = match[2];
    const quantity = parseQuantityValue(match[1]);
    const product = match[3].trim();

    if (quantity > 0 && product) {
      const isKnown = isKnownUnit(potentialUnit);
      const unit = isKnown ? normalizeUnit(potentialUnit, quantity) : potentialUnit.toLowerCase();
      
      return { 
        item: { quantity, unit, product },
        unknownUnit: isKnown ? undefined : potentialUnit.toLowerCase()
      };
    }
  }

  // Pattern 4: Cantidad + Unidad + Producto (con espacio)
  match = cleaned.match(/^(\d+(?:\/\d+)?|\w+)\s+(\w+)\s+(.+)$/i);
  if (match) {
    const potentialUnit = match[2];
    const quantity = parseQuantityValue(match[1]);
    const product = match[3].trim();

    if (quantity > 0 && product) {
      const isKnown = isKnownUnit(potentialUnit);
      
      if (isKnown) {
        const unit = normalizeUnit(potentialUnit, quantity);
        return { item: { quantity, unit, product } };
      } else {
        // Check if it might be part of the product name
        const nextWord = product.split(/\s+/)[0];
        if (nextWord && !isKnownUnit(nextWord)) {
          // Treat potentialUnit as unknown unit
          const unit = potentialUnit.toLowerCase();
          return { 
            item: { quantity, unit, product },
            unknownUnit: unit
          };
        }
      }
    }
  }

  // Pattern 5: Cantidad + Producto (sin unidad explícita)
  match = cleaned.match(/^(\d+(?:\/\d+)?|\w+)\s+(.+)$/i);
  if (match) {
    const quantity = parseQuantityValue(match[1]);
    const product = match[2].trim();

    if (quantity > 0 && product && !isKnownUnit(product.split(/\s+/)[0])) {
      const unit = normalizeUnit('', quantity);
      return { item: { quantity, unit, product } };
    }
  }

  // Pattern 6: Producto + Cantidad + Unidad
  match = cleaned.match(/^(.+?)\s+(\d+(?:\/\d+)?|\w+)\s+(\w+)$/i);
  if (match) {
    const product = match[1].trim();
    const quantityStr = match[2];
    const unitStr = match[3];

    const quantity = parseQuantityValue(quantityStr);

    if (quantity > 0 && product) {
      const isKnown = isKnownUnit(unitStr);
      const unit = isKnown ? normalizeUnit(unitStr, quantity) : unitStr.toLowerCase();
      
      return { 
        item: { quantity, unit, product },
        unknownUnit: isKnown ? undefined : unitStr.toLowerCase()
      };
    }
  }

  // Pattern 7: Producto + Unidad + Cantidad
  match = cleaned.match(/^(.+?)\s+(\w+)\s+(\d+(?:\/\d+)?|\w+)$/i);
  if (match) {
    const product = match[1].trim();
    const unitStr = match[2];
    const quantityStr = match[3];

    const quantity = parseQuantityValue(quantityStr);
    
    if (quantity > 0 && product) {
      const isKnown = isKnownUnit(unitStr);
      
      if (isKnown) {
        const unit = normalizeUnit(unitStr, quantity);
        return { item: { quantity, unit, product } };
      } else {
        const unit = unitStr.toLowerCase();
        return { 
          item: { quantity, unit, product },
          unknownUnit: unit
        };
      }
    }
  }

  // Pattern 8: Producto + Cantidad (sin unidad)
  match = cleaned.match(/^(.+?)\s+(\d+(?:\/\d+)?|\w+)$/i);
  if (match) {
    const product = match[1].trim();
    const quantityStr = match[2];

    const quantity = parseQuantityValue(quantityStr);

    if (quantity > 0 && product) {
      const quantityMatch = quantityStr.match(/^(\d+(?:\/\d+)?)([a-zA-Z]+)$/);
      if (quantityMatch) {
        const unitStr = quantityMatch[2];
        const isKnown = isKnownUnit(unitStr);
        const qty = parseQuantityValue(quantityMatch[1]);
        const unit = isKnown ? normalizeUnit(unitStr, qty) : unitStr.toLowerCase();
        
        return { 
          item: { quantity: qty, unit, product },
          unknownUnit: isKnown ? undefined : unitStr.toLowerCase()
        };
      } else {
        const unit = normalizeUnit('', quantity);
        return { item: { quantity, unit, product } };
      }
    }
  }

  // Pattern 9: Fracción + "de" + Producto
  match = cleaned.match(/^(\d+\/\d+)\s+de\s+(.+)$/i);
  if (match) {
    const quantity = parseQuantityValue(match[1]);
    const product = match[2].trim();

    if (quantity > 0 && product) {
      const unit = normalizeUnit('', quantity);
      return { item: { quantity, unit, product } };
    }
  }

  // Pattern 10: Solo Producto (sin cantidad ni unidad) - DEFAULT TO 1 UNIT
  if (cleaned.length > 0 && !cleaned.match(/^\d/) && !isKnownUnit(cleaned.split(/\s+/)[0])) {
    console.log(`Product without quantity detected: "${cleaned}" - assigning quantity 1`);
    return { item: { quantity: 1, unit: 'unidad', product: cleaned } };
  }

  console.warn(`Could not parse segment: "${cleaned}"`);
  return null;
}

/**
 * Splits a line into multiple segments
 */
function splitLineIntoSegments(line: string): string[] {
  const trimmed = line.trim();

  if (!trimmed) {
    return [];
  }

  if (trimmed.includes(',')) {
    return trimmed.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }

  const segments: string[] = [];
  let currentSegment = '';
  const words = trimmed.split(/\s+/);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    const isQuantityStart = /^\d+(?:\/\d+)?[a-zA-Z]*$/.test(word) || convertNumberWord(word) !== null;

    if (isQuantityStart && currentSegment.trim().length > 0) {
      segments.push(currentSegment.trim());
      currentSegment = word;
    } else {
      currentSegment += (currentSegment ? ' ' : '') + word;
    }
  }

  if (currentSegment.trim().length > 0) {
    segments.push(currentSegment.trim());
  }

  if (segments.length === 1) {
    return [trimmed];
  }

  const validSegments = segments.filter(seg => {
    const parsed = parseSegment(seg);
    return parsed !== null;
  });

  if (validSegments.length === 0) {
    return [trimmed];
  }

  return segments;
}

/**
 * Parses a WhatsApp message into a list of order items
 * Returns items, list of unknown units detected, and list of unparseable lines
 * Enhanced to handle combined quantity and product without spaces
 */
function parseWhatsAppMessage(message: string): { items: any[], unknownUnits: string[], unparseableLines: string[] } {
  if (!message || !message.trim()) {
    console.warn('Empty message provided');
    return { items: [], unknownUnits: [], unparseableLines: [] };
  }

  const lines = message.split('\n');
  const orderItems: any[] = [];
  const unknownUnits: string[] = [];
  const unparseableLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      continue;
    }

    const segments = splitLineIntoSegments(line);
    let lineHadSuccessfulParse = false;

    for (const segment of segments) {
      try {
        const parsed = parseSegment(segment);

        if (parsed) {
          orderItems.push(parsed.item);
          lineHadSuccessfulParse = true;
          if (parsed.unknownUnit && !unknownUnits.includes(parsed.unknownUnit)) {
            unknownUnits.push(parsed.unknownUnit);
          }
          console.log(`✓ Parsed: "${segment}" →`, parsed.item);
          if (parsed.unknownUnit) {
            console.log(`  ⚠ Unknown unit detected: "${parsed.unknownUnit}"`);
          }
        } else {
          console.warn(`✗ Could not parse: "${segment}"`);
        }
      } catch (error) {
        console.error(`✗ Error parsing segment "${segment}":`, error);
      }
    }

    // If no segment from this line was successfully parsed, add to unparseable lines
    if (!lineHadSuccessfulParse && line.length > 0) {
      unparseableLines.push(line);
    }
  }

  console.log(`Parsed ${orderItems.length} items from ${lines.length} lines`);
  if (unknownUnits.length > 0) {
    console.log(`Detected ${unknownUnits.length} unknown units:`, unknownUnits);
  }
  if (unparseableLines.length > 0) {
    console.log(`Could not parse ${unparseableLines.length} lines:`, unparseableLines);
  }
  
  return { items: orderItems, unknownUnits, unparseableLines };
}

/**
 * Checks if message is a greeting
 */
function isGreeting(message: string): boolean {
  const normalized = message.toLowerCase().trim();
  
  if (normalized.includes('?') || normalized.includes('¿')) {
    return true;
  }
  
  for (const greeting of GREETINGS) {
    if (normalized.includes(greeting)) {
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
  
  // Check for "nuevo pedido" or "otro pedido" (case-insensitive)
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
  
  // Remove "nuevo pedido" or "otro pedido" (case-insensitive)
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
    return `${item.quantity} ${item.unit} de ${item.product}`;
  }).join('\n');
}

/**
 * Creates confirmation message
 */
function createConfirmationMessage(customerName: string, orderNumber: string, items: any[]): string {
  const itemsList = formatItemsList(items, false);
  
  return `✅ *¡Pedido Recibido!*

Hola ${customerName}, hemos recibido tu pedido correctamente.

📋 *Número de pedido:* ${orderNumber}

📦 *Productos solicitados:*
${itemsList}

💰 Los precios se asignarán y te confirmaremos el total cuando tu pedido esté en preparación.

Te mantendremos informado sobre el estado de tu pedido. ⏰

¡Gracias por tu preferencia! 😊`;
}

/**
 * Creates parsing error message for unparseable products
 */
function createParsingErrorMessage(customerName: string, unparseableLines: string[]): string {
  const unparseableList = unparseableLines.map(line => `- ${line}`).join('\n');
  
  return `⚠️ *Algunos productos no pudieron ser procesados*

Hola ${customerName}, recibimos tu mensaje pero algunos productos no pudieron ser ingresados correctamente.

❌ *Productos no procesados:*
${unparseableList}

📝 *Por favor, intenta con un formato diferente:*

*Ejemplos válidos:*
- 3 kilos de tomates
- 2 kilos de palta
- 5 pepinos
- 1 cilantro
- 1/2 kilo de papas
- 2 docenas de huevos
- 1lechuga
- tomates2

💡 *Tip:* Puedes escribir cada producto en una línea separada o usar comas para separarlos.

¡Gracias por tu comprensión! 😊`;
}

/**
 * Creates help message
 */
function createHelpMessage(customerName: string): string {
  return `❌ *No pudimos identificar productos*

Hola ${customerName}! No pude identificar productos en tu mensaje.

📝 *Formato sugerido:*
3 kilos de tomates
2 kilos de palta
1 kg de papas
5 pepinos
1 cilantro
tomillo bonito
romero

También puedes escribir:
tomates 3 kilos
tomates kilos 3
3k de tomates
tres kilos de tomates
3kilos de papas
papas 3k
1/4 de ají
1/2 kilo de papas
2 saco de papa, un cajón de tomate
2 kilos de tomates 1 kilo de papa
3kilos tomates 2kilos paltas 3 pepinos
2 docenas de huevos
3 bandejas de fresas
1 cesta de manzanas
1 mano de platano
2 cuelgas de platano
1lechuga
2tomates
lechuga1
tomates2

¡Gracias por tu comprensión! 😊`;
}

/**
 * Creates welcome message
 */
function createWelcomeMessage(customerName: string): string {
  return `👋 *¡Hola ${customerName}!*

Gracias por contactarnos. Para hacer un pedido, simplemente envía la lista de productos que necesitas.

📝 *Ejemplos de cómo hacer tu pedido:*

*Formato vertical:*
3 kilos de tomates
2 kilos de paltas
5 pepinos
1 cilantro
romero
tomillo bonito

*Formato horizontal:*
3 kilos de tomates, 2 kilos de paltas, 5 pepinos

*Otros formatos válidos:*
3k de tomates
tomates 3 kilos
tomates kilos 3
1/4 de ají
2 saco de papa
3kilos tomates 2kilos paltas
2 docenas de huevos
3 bandejas de fresas
1 mano de platano
2 cuelgas de platano
1lechuga
2tomates
lechuga1
tomates2

💡 *Tip:* Puedes escribir los productos como prefieras, nosotros entenderemos tu pedido. Si no especificas cantidad, asignaremos 1 unidad automáticamente.

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

  return `➕ *Producto Agregado*

Hola ${customerName}, se ha agregado un producto a tu pedido.

📋 *Número de pedido:* ${orderNumber}

✨ *Producto agregado:*
${addedProduct.quantity} ${addedProduct.unit} de ${addedProduct.product}

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

        // Check if customer has a non-delivered order
        const { data: existingOrders } = await supabase
          .from('orders')
          .select('id, order_number, customer_name, status, items:order_items(*)')
          .eq('customer_phone', customerPhone)
          .neq('status', 'delivered')
          .order('created_at', { ascending: false })
          .limit(1);

        const hasActiveOrder = existingOrders && existingOrders.length > 0;
        const activeOrder = hasActiveOrder ? existingOrders[0] : null;

        console.log('Has active order:', hasActiveOrder);
        if (activeOrder) {
          console.log('Active order:', activeOrder.order_number, 'Status:', activeOrder.status);
        }

        // Check for new order keywords
        const hasNewOrderKeyword = isNewOrderKeyword(messageText);
        console.log('Has new order keyword:', hasNewOrderKeyword);

        // If customer has active order and no new order keyword, treat as query
        if (hasActiveOrder && !hasNewOrderKeyword && activeOrder) {
          console.log('Treating message as order query');
          
          // Save query to database
          const { error: queryError } = await supabase
            .from('order_queries')
            .insert({
              order_id: activeOrder.id,
              customer_phone: customerPhone,
              query_text: messageText,
              whatsapp_message_id: messageId,
            });

          if (queryError) {
            console.error('Error saving query:', queryError);
          } else {
            console.log('Query saved successfully');
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

          continue; // Skip to next message
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
          const unparseableLines = parseResult.unparseableLines;
          
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

          const orderItems = parsedItems.map((item) => ({
            order_id: order.id,
            product_name: `${item.product}`,
            quantity: item.quantity,
            unit_price: 0,
            notes: `Unidad: ${item.unit}`,
          }));

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
              
              // If there were unparseable lines, send error message
              if (unparseableLines.length > 0) {
                const errorMsg = createParsingErrorMessage(customCustomerName, unparseableLines);
                await sendWhatsAppMessage(
                  config.phone_number_id,
                  config.access_token,
                  customerPhone,
                  errorMsg
                );
                console.log('Sent parsing error message to:', customerPhone);
              }
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
        const unparseableLines = parseResult.unparseableLines;

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

        // Create order items
        const orderItems = parsedItems.map((item) => ({
          order_id: order.id,
          product_name: `${item.product}`,
          quantity: item.quantity,
          unit_price: 0,
          notes: `Unidad: ${item.unit}`,
        }));

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
            
            // If there were unparseable lines, send error message
            if (unparseableLines.length > 0) {
              const errorMsg = createParsingErrorMessage(customerName, unparseableLines);
              await sendWhatsAppMessage(
                config.phone_number_id,
                config.access_token,
                customerPhone,
                errorMsg
              );
              console.log('Sent parsing error message to:', customerPhone);
            }
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
