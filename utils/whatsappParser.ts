
/**
 * Parses a quantity value from a string, handling decimals and fractions.
 * @param quantityStr - The quantity string to parse (e.g., "1", "1.5", "1/2")
 * @returns The parsed quantity value as a number
 */
export function parseQuantityValue(quantityStr: string): number {
  if (!quantityStr) {
    throw new Error('Quantity string is empty');
  }

  // Handle fractions (e.g., "1/2", "3/4")
  if (quantityStr.includes('/')) {
    const parts = quantityStr.split('/');
    if (parts.length !== 2) {
      throw new Error(`Invalid fraction format: ${quantityStr}`);
    }
    const numerator = parseInt(parts[0].trim(), 10);
    const denominator = parseInt(parts[1].trim(), 10);
    
    if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
      throw new Error(`Invalid fraction values: ${quantityStr}`);
    }
    
    return numerator / denominator;
  }

  // Handle decimals and whole numbers
  const value = parseFloat(quantityStr);
  if (isNaN(value)) {
    throw new Error(`Invalid number format: ${quantityStr}`);
  }

  return value;
}

/**
 * Normalizes a unit string to a standard format.
 * @param unit - The unit string to normalize
 * @returns The normalized unit string
 */
export function normalizeUnit(unit: string): string {
  if (!unit) {
    return 'unit';
  }

  const normalized = unit.toLowerCase().trim();

  // Weight units
  if (normalized === 'kg' || normalized === 'kgs' || normalized === 'kilo' || normalized === 'kilos' || normalized === 'kilogramo' || normalized === 'kilogramos') {
    return 'kg';
  }
  if (normalized === 'g' || normalized === 'gs' || normalized === 'gramo' || normalized === 'gramos') {
    return 'g';
  }

  // Volume units
  if (normalized === 'l' || normalized === 'ls' || normalized === 'litro' || normalized === 'litros') {
    return 'l';
  }
  if (normalized === 'ml' || normalized === 'mls' || normalized === 'mililitro' || normalized === 'mililitros') {
    return 'ml';
  }

  // Count units
  if (normalized === 'unit' || normalized === 'units' || normalized === 'unidad' || normalized === 'unidades' || normalized === 'u' || normalized === 'pza' || normalized === 'pzas' || normalized === 'pieza' || normalized === 'piezas') {
    return 'unit';
  }

  // Default to unit if unknown
  return 'unit';
}

/**
 * Represents a parsed order item from a WhatsApp message line.
 */
export interface ParsedOrderItem {
  quantity: number;
  unit: string;
  product: string;
}

/**
 * Parses a single line from the WhatsApp message.
 * @param line - The line to parse
 * @returns Parsed order item data
 * @throws Error if the line cannot be parsed
 */
export function parseLine(line: string): ParsedOrderItem {
  const trimmedLine = line.trim();
  
  if (!trimmedLine) {
    throw new Error('Line is empty');
  }

  // Split by whitespace
  const parts = trimmedLine.split(/\s+/);
  
  if (parts.length < 3) {
    throw new Error(`Line has insufficient parts: ${trimmedLine}`);
  }

  // First part is quantity
  const quantityStr = parts[0];
  
  // Second part is unit
  const unitStr = parts[1];
  
  // Remaining parts are the product name
  const productParts = parts.slice(2);
  const product = productParts.join(' ').trim();

  if (!product) {
    throw new Error(`No product name found in line: ${trimmedLine}`);
  }

  try {
    const quantity = parseQuantityValue(quantityStr);
    const unit = normalizeUnit(unitStr);

    return {
      quantity,
      unit,
      product,
    };
  } catch (error) {
    throw new Error(`Failed to parse line "${trimmedLine}": ${error.message}`);
  }
}

/**
 * Parses a WhatsApp message into a list of order items.
 * @param message - The WhatsApp message to parse
 * @returns An array of parsed order items
 */
export function parseWhatsAppMessage(message: string): ParsedOrderItem[] {
  if (!message || !message.trim()) {
    console.error('Empty message provided');
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

    try {
      const parsedItem = parseLine(line);
      orderItems.push(parsedItem);
      console.log(`Successfully parsed line ${i + 1}:`, parsedItem);
    } catch (error) {
      console.error(`Failed to parse line ${i + 1} ("${line}"):`, error.message);
      // Continue to next line instead of stopping
    }
  }

  return orderItems;
}

/**
 * Example usage and test function
 */
export function testParser() {
  const testMessage = `2 kg tomatoes
1/2 kg cheese
1 unit bread
1.5 l milk
3 pza eggs`;

  console.log('Testing WhatsApp message parser...');
  console.log('Input message:');
  console.log(testMessage);
  console.log('\nParsed output:');
  
  const result = parseWhatsAppMessage(testMessage);
  console.log(JSON.stringify(result, null, 2));
  
  return result;
}
