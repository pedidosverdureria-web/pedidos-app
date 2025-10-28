
# WhatsApp Parser - Enhanced Fraction Support

## Overview

The WhatsApp message parser has been enhanced to support **combined integer and fraction quantities**, allowing for more natural order expressions like "1 kilo y medio de manzanas" or "1 1/2 de manzana".

## New Features

### 1. Combined Integer and Fraction Parsing

The parser now recognizes and correctly interprets quantities that combine whole numbers with fractions:

#### Format A: Integer + "y" + Fraction Word + Unit + "de" + Product
```
1 kilo y medio de manzanas → 1.5 kilos de manzanas
2 kilos y medio de papas → 2.5 kilos de papas
3 kilos y cuarto de tomates → 3.25 kilos de tomates
```

#### Format B: Integer + Space + Fraction + Unit + "de" + Product
```
1 1/2 kilo de manzanas → 1.5 kilos de manzanas
2 1/4 kilos de papas → 2.25 kilos de papas
3 3/4 kg de tomates → 3.75 kilos de tomates
```

#### Format C: Integer + Space + Fraction + "de" + Product (no explicit unit)
```
1 1/2 de manzana → 1.5 unidades de manzana
2 1/4 de papas → 2.25 unidades de papas
```

### 2. Fraction Word Support

The parser now understands Spanish fraction words:

```javascript
'medio' / 'media' → 0.5
'un medio' / 'una media' → 0.5
'cuarto' / 'un cuarto' → 0.25
'tercio' / 'un tercio' → 0.333
'octavo' / 'un octavo' → 0.125
```

#### Examples:
```
medio kilo de papas → 0.5 kilos de papas
un cuarto de ají → 0.25 unidades de ají
medio de papas → 0.5 unidades de papas
```

## Complete Format Support

The parser now supports all of the following formats:

### 1. Combined Integer and Fractions (NEW)
- `1 kilo y medio de manzanas`
- `2 kilos y medio de papas`
- `1 1/2 kilo de manzanas`
- `2 1/4 kilos de papas`
- `1 1/2 de manzana`
- `medio kilo de papas`
- `un cuarto de ají`

### 2. Standard Formats (Existing)
- `3 kilos de tomates` (Quantity + Unit + "de" + Product)
- `3kilos de tomates` (Quantity + Unit without space + "de" + Product)
- `3 tomates` (Quantity + Product, no unit)
- `1/2 kilo de papas` (Simple fraction)
- `dos kilos de tomates` (Text numbers)
- `tomates 3 kilos` (Product first)
- `3k tomates, 2k papas` (Comma-separated)
- `tomillo bonito` (Product only, defaults to 1 unit)

### 3. Special Units (Existing)
- `3 mallas de cebolla`
- `2 saco de papa`
- `un cajón de tomate`
- `2 docenas de huevos`
- `3 bandejas de fresas`

## Implementation Details

### Enhanced Functions

#### `parseQuantityValue(quantityStr: string): number`
Now handles:
1. Simple fractions: `"1/2"` → `0.5`
2. Combined integers and fractions: `"1 1/2"` → `1.5`
3. Decimal numbers: `"2.5"` → `2.5`
4. Text numbers: `"dos"` → `2`
5. Fraction words: `"medio"` → `0.5`

#### `convertFractionWord(word: string): number | null`
New function that converts Spanish fraction words to their numeric values.

#### `parseSegment(segment: string): ParsedOrderItem | null`
Enhanced with 6 new patterns (A-F) to handle combined integer and fraction formats.

## Usage Examples

### Example 1: Mixed Format Order
```
Input:
1 kilo y medio de manzanas
2 1/4 kilos de papas
medio kilo de tomates
3 pepinos

Output:
[
  { quantity: 1.5, unit: "kilos", product: "manzanas" },
  { quantity: 2.25, unit: "kilos", product: "papas" },
  { quantity: 0.5, unit: "kilo", product: "tomates" },
  { quantity: 3, unit: "unidades", product: "pepinos" }
]
```

### Example 2: Horizontal Format with Fractions
```
Input:
1 kilo y medio de manzanas, 2 1/4 kilos de papas, medio kilo de tomates

Output:
[
  { quantity: 1.5, unit: "kilos", product: "manzanas" },
  { quantity: 2.25, unit: "kilos", product: "papas" },
  { quantity: 0.5, unit: "kilo", product: "tomates" }
]
```

### Example 3: Vertical Format with Fractions
```
Input:
1 kilo y medio de manzanas
2 1/4 kilos de papas
medio kilo de tomates
un cuarto de ají
3 pepinos

Output:
[
  { quantity: 1.5, unit: "kilos", product: "manzanas" },
  { quantity: 2.25, unit: "kilos", product: "papas" },
  { quantity: 0.5, unit: "kilo", product: "tomates" },
  { quantity: 0.25, unit: "unidades", product: "ají" },
  { quantity: 3, unit: "unidades", product: "pepinos" }
]
```

## Order Parsing Rules

The parser respects all existing product ordering rules:

### 1. Vertical Layout (Line-by-line)
Each line is treated as a separate product:
```
1 kilo y medio de manzanas
2 kilos de papas
3 pepinos
```

### 2. Horizontal Layout (Comma-separated)
Products separated by commas on the same line:
```
1 kilo y medio de manzanas, 2 kilos de papas, 3 pepinos
```

### 3. Mixed Layout (Space-separated with quantity detection)
Multiple products on one line without commas:
```
1 kilo y medio de manzanas 2 kilos de papas 3 pepinos
```

## Testing

To test the parser with the new formats, you can use the `testParser()` function:

```typescript
import { testParser } from '@/utils/whatsappParser';

// Run comprehensive tests
testParser();
```

This will test all formats including the new combined integer and fraction formats.

## Edge Function Integration

The same enhanced parsing logic has been implemented in the Supabase Edge Function (`supabase/functions/whatsapp-webhook/index.ts`), ensuring consistent parsing behavior across:

1. **Client-side parsing** (in the app when adding products via WhatsApp-style input)
2. **Server-side parsing** (when receiving WhatsApp messages via webhook)

## Backward Compatibility

All existing formats continue to work as before. The new fraction support is additive and does not break any existing functionality.

## Error Handling

The parser gracefully handles invalid inputs:
- Invalid fractions return 0
- Unparseable segments are logged with warnings
- The parser continues processing other segments even if one fails

## Future Enhancements

Potential future improvements:
- Support for more complex fractions (e.g., "dos y medio")
- Support for decimal fractions in text (e.g., "uno punto cinco")
- Support for ranges (e.g., "1 a 2 kilos")
- Support for approximate quantities (e.g., "como 2 kilos")

## Summary

The enhanced parser now provides comprehensive support for natural language quantity expressions, including:

✅ Combined integers and fractions with "y" (e.g., "1 kilo y medio")
✅ Combined integers and fractions with space (e.g., "1 1/2 kilo")
✅ Fraction words (e.g., "medio kilo", "un cuarto")
✅ All existing formats (vertical, horizontal, comma-separated, etc.)
✅ Consistent behavior across client and server
✅ Backward compatibility with existing orders

This makes the order entry process more intuitive and flexible for users while maintaining robust parsing accuracy.
