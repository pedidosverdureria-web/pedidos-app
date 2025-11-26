
# WhatsApp Quantity at End Fix

## Problem Description

When customers sent orders with quantities and units at the END of each product line, the parser was not correctly extracting them. 

### Example Input:
```
hola buenas tardes 
quisiéramos hacer pedido para el dia lunes 3 de noviembre por favor
- repollo verde 1 und
- cebollin 2 docenas
- cabezas de ajo 7 unds
- cebolla 2 kgs
- zanahoria 2 kgs
- cebolla morada 3kgs
- naranja 2 kgs
- jengibre 9 kgs
- limon 2 kgs
- vinagre de manzana 10 lts
- miel 1 und
- aceitunas negras 500 grs
- lechuga costina 3 unds
- pimenton 3 unds
- pepino 3 unds 
- zapallo italiano 2 unds
- tomate 5 kgs
- papas 15 kgs
- azúcar 60 kgs
- paltas 3 kgs
- beterraga 1 pqt
quedo atento gracias
```

### Previous (Incorrect) Output:
```
📦 *Productos solicitados:*
• 1 unidad - repollo verde 1 und
• 1 unidad - cebollin 2 docenas
• 1 unidad - cabezas de ajo 7 unds
• 1 unidad - cebolla 2 kgs
...
```

All products were being parsed with "1 unidad" instead of the actual quantities.

### Expected (Correct) Output:
```
📦 *Productos solicitados:*
• 1 unidad - repollo verde
• 2 docenas - cebollin
• 7 unidades - cabezas de ajo
• 2 kilos - cebolla
• 2 kilos - zanahoria
• 3 kilos - cebolla morada
• 2 kilos - naranja
• 9 kilos - jengibre
• 2 kilos - limon
• 10 litros - vinagre de manzana
• 1 unidad - miel
• 500 gramos - aceitunas negras
• 3 unidades - lechuga costina
• 3 unidades - pimenton
• 3 unidades - pepino
• 2 unidades - zapallo italiano
• 5 kilos - tomate
• 15 kilos - papas
• 60 kilos - azúcar
• 3 kilos - paltas
• 1 paquete - beterraga
```

## Solution Implemented

### 1. Enhanced Unit Detection

Added more unit variations to the `UNIT_VARIATIONS` mapping:

```typescript
const UNIT_VARIATIONS: Record<string, string[]> = {
  'kilo': ['kilo', 'kilos', 'kg', 'kgs', 'k'],
  'gramo': ['gramo', 'gramos', 'gr', 'g', 'grs'],  // Added 'grs'
  'unidad': ['unidad', 'unidades', 'u', 'und', 'unds'],  // Added 'unds'
  'paquete': ['paquete', 'paquetes', 'pqt'],  // Added 'pqt'
  'litro': ['litro', 'litros', 'lt', 'l', 'lts'],  // Added 'lts'
  // ... other units
};
```

### 2. New Parsing Strategy: Product + Quantity + Unit at End

Added a **NEW FIRST STRATEGY** in the `parseSegment()` function to handle the pattern where quantity and unit appear at the end:

```typescript
// NEW STRATEGY: Product + Quantity + Unit at the end
// Examples: "repollo verde 1 und", "cebollin 2 docenas", "cabezas de ajo 7 unds"
// This pattern matches: [product name] [number] [unit]
let match = cleaned.match(/^(.+?)\s+(\d+(?:[.,]\d+)?)\s+(\w+)$/);
if (match) {
  const product = match[1].trim();
  const quantityStr = match[2].replace(',', '.');
  const unitStr = match[3];

  // Check if the last word is actually a unit
  if (isKnownUnit(unitStr)) {
    const quantity = parseQuantityValue(quantityStr);
    if (quantity > 0 && product) {
      const unit = normalizeUnit(unitStr, quantity);
      console.log(`  ✓ Parsed (end pattern): "${cleaned}" → ${quantity} ${unit} de ${product}`);
      return { quantity, unit, product };
    }
  }
}
```

This strategy:
1. **Matches the pattern**: `[product name] [number] [unit]`
2. **Extracts three parts**:
   - Product name (everything before the last two words)
   - Quantity (second-to-last word, must be a number)
   - Unit (last word, must be a known unit)
3. **Validates** that the last word is actually a unit (not just any word)
4. **Returns** the correctly parsed item with quantity, unit, and product name

### 3. Enhanced Product Line Detection

Updated the `extractProductList()` function to better detect product lines with quantities at the end:

```typescript
// Check for quantity patterns (number + unit or number + product)
const hasQuantityPattern = 
  /^\d+\s*(kilo|kg|gramo|gr|unidad|und|bolsa|...)/i.test(trimmedLine) ||
  /\b(kilo|kg|gramo|gr|unidad|und|unds|...)\b/i.test(trimmedLine) ||
  /\b(medio|media|cuarto|tercio)\s+(kilo|kg|de\s+)/i.test(trimmedLine) ||
  /\d+\s*(kgs?|grs?|unds?|lts?|pqt)$/i.test(trimmedLine); // NEW: Quantity at the end
```

The new regex `/\d+\s*(kgs?|grs?|unds?|lts?|pqt)$/i` specifically detects lines that end with a number followed by a unit.

### 4. Improved Closing Pattern Detection

Added "quedo atento" to the closing patterns to remove it from product lists:

```typescript
const CLOSING_PATTERNS = [
  /\s*gracias\.?$/i,
  /\s*muchas\s+gracias\.?$/i,
  // ... other patterns
  /\s*quedo\s+atento\.?$/i,  // NEW
];
```

### 5. Enhanced Filler Pattern Detection

Added more conversational phrases to filter out:

```typescript
const FILLER_PATTERNS = [
  /^quiero\s+hacer\s+un\s+pedido\s*/i,
  /^quisiera\s+hacer\s+un\s+pedido\s*/i,
  /^quisiéramos\s+hacer\s+pedido\s*/i,  // NEW
  // ... other patterns
  /^para\s+el\s+día\s*/i,  // NEW
];
```

## How It Works

### Parsing Flow

1. **Extract Product List**: Remove greetings, closings, and filler text
   ```
   Input: "hola buenas tardes\nquisiéramos hacer pedido para el dia lunes 3 de noviembre por favor\n- repollo verde 1 und\n..."
   Output: "- repollo verde 1 und\n- cebollin 2 docenas\n..."
   ```

2. **Split into Lines**: Each product line is processed separately
   ```
   Line 1: "- repollo verde 1 und"
   Line 2: "- cebollin 2 docenas"
   ...
   ```

3. **Clean Segment**: Remove bullet points and list markers
   ```
   "- repollo verde 1 und" → "repollo verde 1 und"
   ```

4. **Parse Segment**: Apply parsing strategies in order
   ```
   Strategy: Product + Quantity + Unit at end
   Match: "repollo verde 1 und"
   Extract:
     - product: "repollo verde"
     - quantity: "1"
     - unit: "und"
   Result: { quantity: 1, unit: 'unidad', product: 'repollo verde' }
   ```

5. **Format for Display**: Create the confirmation message
   ```
   "• 1 unidad - repollo verde"
   ```

## Supported Patterns

The parser now supports ALL of these patterns:

### Quantity at Beginning
- `3 kilos de tomates`
- `2 kg de papas`
- `5 pepinos`
- `1/2 kilo de cebollas`

### Quantity at End (NEW)
- `repollo verde 1 und`
- `cebollin 2 docenas`
- `cabezas de ajo 7 unds`
- `vinagre de manzana 10 lts`
- `aceitunas negras 500 grs`

### Mixed Formats
- `tomates 3 kilos` (reversed)
- `3k de tomates` (abbreviated)
- `tres kilos de tomates` (text numbers)
- `1 y medio kilo de papas` (fractions)

## Testing

### Test Case 1: Quantity at End
```
Input: "repollo verde 1 und"
Expected: { quantity: 1, unit: 'unidad', product: 'repollo verde' }
Result: ✅ PASS
```

### Test Case 2: Multiple Units
```
Input: "cebollin 2 docenas"
Expected: { quantity: 2, unit: 'docenas', product: 'cebollin' }
Result: ✅ PASS
```

### Test Case 3: Large Quantities
```
Input: "azúcar 60 kgs"
Expected: { quantity: 60, unit: 'kilos', product: 'azúcar' }
Result: ✅ PASS
```

### Test Case 4: Decimal Quantities
```
Input: "aceitunas negras 500 grs"
Expected: { quantity: 500, unit: 'gramos', product: 'aceitunas negras' }
Result: ✅ PASS
```

### Test Case 5: Full Order
```
Input:
"hola buenas tardes 
quisiéramos hacer pedido para el dia lunes 3 de noviembre por favor
- repollo verde 1 und
- cebollin 2 docenas
- cabezas de ajo 7 unds
- cebolla 2 kgs
- zanahoria 2 kgs
quedo atento gracias"

Expected: 5 products with correct quantities
Result: ✅ PASS
```

## Benefits

1. **Flexible Input**: Customers can write quantities at the beginning OR end
2. **Natural Language**: Supports how people naturally write orders
3. **Accurate Parsing**: Correctly extracts quantities, units, and product names
4. **Clean Output**: Removes conversational text and formatting
5. **Robust**: Handles various unit abbreviations and formats

## Edge Cases Handled

1. **Multi-word Products**: "cabezas de ajo 7 unds" → "cabezas de ajo"
2. **Abbreviated Units**: "kgs", "grs", "unds", "lts", "pqt"
3. **Large Numbers**: "60 kgs", "500 grs"
4. **Conversational Text**: Filters out greetings, dates, and closings
5. **Mixed Formats**: Can handle both "3 kilos de tomates" and "tomates 3 kilos"

## Future Improvements

Potential enhancements:
1. Support for ranges: "2-3 kilos de tomates"
2. Support for approximate quantities: "unos 5 kilos"
3. Support for compound units: "1 kilo y medio"
4. Machine learning for ambiguous cases
5. Customer-specific format learning

## Deployment

The fix has been deployed to the Supabase Edge Function `whatsapp-webhook` (version 43).

To verify the fix is working:
1. Send a test order via WhatsApp with quantities at the end
2. Check the order confirmation message
3. Verify the order in the app shows correct quantities

## Rollback Plan

If issues occur, you can rollback to version 42 of the Edge Function:
```bash
supabase functions deploy whatsapp-webhook --project-ref lgiqpypnhnkylzyhhtze --version 42
```

## Related Documentation

- `WHATSAPP_PARSER_GUIDE.md` - Complete parser documentation
- `WHATSAPP_INTELLIGENT_ORDER_VALIDATION.md` - Order validation logic
- `WHATSAPP_PARSER_FRACTIONS_GUIDE.md` - Fraction parsing
- `WHATSAPP_ORDER_EXAMPLES.md` - Example orders

