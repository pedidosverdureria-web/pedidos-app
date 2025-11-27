
# WhatsApp Parser - Date/Order Phrase Detection Fix

## Problem Description

The WhatsApp parser was incorrectly parsing conversational text that contained date and order request phrases as products. Specifically, messages like:

```
hola buenas tardes 
quisiéramos hacer pedido para el dia lunes 3 de noviembre por favor
- repollo verde 1 und
- cebollin 2 docenas
...
```

Were being parsed with the first line "quisiéramos hacer pedido para el dia lunes 3 de noviembre por favor" being treated as a product, resulting in:
- "1 unidad de quisiéramos hacer pedido para el dia lunes 3 de noviembre por favor"

This was happening even though the parser had logic to filter out conversational phrases.

## Root Cause

The parser's `extractProductList` function was not detecting date-related phrases and order request phrases that contained:
- Date references: "para el dia lunes 3 de noviembre"
- Order request phrases: "quisiéramos hacer pedido"
- Plural forms: "quisiéramos" (we would like) vs "quisiera" (I would like)

While the parser had patterns for simple conversational phrases, it lacked comprehensive detection for:
1. Date and time information
2. Order request phrases with plural forms
3. Combined date + order request phrases

## Solution Implemented

### 1. Enhanced Conversational Phrase Patterns

Added new patterns to `CONVERSATIONAL_PHRASES`:

```typescript
// Date and time related phrases
/para\s+el\s+d[ií]a/i,
/para\s+ma[ñn]ana/i,
/para\s+hoy/i,
/para\s+el\s+(lunes|martes|miércoles|jueves|viernes|sábado|domingo)/i,
/el\s+d[ií]a\s+\d+/i,
/\d+\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,

// Order request phrases
/quisiéramos?\s+hacer/i,
/quiero\s+hacer/i,
/necesito\s+hacer/i,
/me\s+gustaría\s+hacer/i,
/hacer\s+un?\s+pedido/i,
/hacer\s+pedido/i,
```

### 2. Enhanced Filler Patterns

Updated `FILLER_PATTERNS` to include plural forms:

```typescript
/^quisiéramos\s+hacer\s+un?\s+pedido\s*/i,
/^necesitamos\s+hacer\s+un?\s+pedido\s*/i,
/^nos\s+gustaría\s+hacer\s+un?\s+pedido\s*/i,
/^quisiéramos\s+pedir\s*/i,
/^necesitamos\s+pedir\s*/i,
/^nos\s+gustaría\s+pedir\s*/i,
/^nuestro\s+pedido\s+es\s*/i,
/^vamos\s+a\s+pedir\s*/i,
```

### 3. New Detection Functions

Added three new helper functions:

#### `containsDateTimeInfo(line: string): boolean`
Detects lines containing date/time information:
- "para el dia lunes"
- "3 de noviembre"
- "para mañana"
- "para hoy"

#### `isOrderRequestPhrase(line: string): boolean`
Detects order request phrases:
- "quisiéramos hacer pedido"
- "quiero hacer un pedido"
- "necesitamos hacer pedido"

### 4. Enhanced Product Line Detection

Updated the `extractProductList` function to:

1. **Skip date/time lines**: Lines containing date information are now skipped
2. **Skip order request lines**: Lines with order request phrases are skipped
3. **Additional keyword check**: Lines with numbers but also containing date/order keywords are skipped if no product lines have been found yet

```typescript
// Additional check: if the line has numbers but also contains date/order keywords, skip it
if (hasProductPattern) {
  const hasDateOrderKeywords = 
    /\b(día|lunes|martes|miércoles|jueves|viernes|sábado|domingo|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|pedido|hacer|favor)\b/i.test(trimmedLine);
  
  if (hasDateOrderKeywords && !foundProductLines) {
    // If we haven't found product lines yet and this line has date/order keywords, skip it
    console.log(`Skipping line with date/order keywords: "${trimmedLine}"`);
    continue;
  }
}
```

## Files Modified

1. **`utils/whatsappParser.ts`** - Local parser utility
2. **`supabase/functions/whatsapp-webhook/index.ts`** - Edge Function webhook handler

Both files received identical updates to ensure consistency between local and server-side parsing.

## Testing

The fix now correctly handles messages like:

### Example 1: Date + Order Request
```
hola buenas tardes 
quisiéramos hacer pedido para el dia lunes 3 de noviembre por favor
- repollo verde 1 und
- cebollin 2 docenas
```

**Before**: Parsed "quisiéramos hacer pedido para el dia lunes 3 de noviembre por favor" as a product

**After**: Skips the conversational/date line and only parses the actual products

### Example 2: Closing Phrase
```
- paltas 3 kgs
- beterraga 1 pqt
quedo atento gracias
```

**Before**: Parsed "quedo atento gracias" as a product

**After**: Skips the closing phrase (already working, but now more robust)

## Benefits

1. **More accurate parsing**: Conversational text is properly filtered out
2. **Better user experience**: Orders are created with only actual products
3. **Reduced errors**: No more invalid products in orders
4. **Comprehensive coverage**: Handles various date formats and order request phrases
5. **Plural form support**: Works with both singular and plural forms (quisiera/quisiéramos)

## Deployment

The Edge Function has been deployed successfully (version 51) and is now active in production.

## Logging

The parser now logs when it detects and skips:
- Conversational phrases
- Date/time information
- Order request phrases
- Lines with date/order keywords

This helps with debugging and monitoring parser behavior.
