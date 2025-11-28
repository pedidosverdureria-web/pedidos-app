
# WhatsApp Parser Date Phrase Fix

## Problem
The WhatsApp webhook was incorrectly parsing conversational text containing date/time information as product orders. For example:

**Input:**
```
quisiéramos hacer pedido para el dia lunes 3 de noviembre por favor
```

**Incorrect Output:**
```
1 unidad de quisiéramos hacer pedido para el dia lunes 3 de noviembre por favor
```

This happened because the parser was not properly filtering out conversational phrases that contained date/time information and order request keywords.

## Root Cause
The `isPurelyConversational()` function was checking for product patterns (produce items, quantity+unit patterns) **BEFORE** checking for date/time and order request patterns. This meant that if a line contained any numbers (like "3 de noviembre"), it could be misidentified as a potential product line.

## Solution
Enhanced the `isPurelyConversational()` function to check patterns in the following priority order:

### Priority 1: Date/Time Patterns (HIGHEST PRIORITY)
Check for date/time information FIRST, before any other checks:
- `para el día`
- `para mañana`
- `para hoy`
- `para el lunes/martes/etc.`
- `el día 3`
- `3 de noviembre`
- `lunes 3`

If any of these patterns are found, the line is immediately marked as conversational.

### Priority 2: Order Request Phrases
Check for order request phrases:
- `quisiéramos hacer pedido`
- `quiero hacer pedido`
- `quisiera hacer pedido`
- `necesito hacer pedido`
- `hacer un pedido`

If any of these patterns are found, the line is immediately marked as conversational.

### Priority 3: Common Conversational Phrases
Check for common closing/greeting phrases:
- `por favor`
- `gracias`
- `quedo atento`

### Priority 4: Known Produce Items
Check if the line contains known produce items from the database. If it does, it's likely NOT conversational.

### Priority 5: Quantity + Unit Patterns
Check if the line has product-like patterns (numbers + units like "3 kilos"). If it does, it's likely NOT conversational.

### Priority 6: Conversational Keyword Count
Count conversational keywords in the line. If there are 2 or more conversational keywords and no product patterns, mark as conversational.

**Changed threshold from 3 to 2** to catch more conversational lines.

## Changes Made

### 1. `utils/whatsappParser.ts`
- Enhanced `isPurelyConversational()` function with priority-based checking
- Date/time and order request patterns are now checked FIRST
- Reduced conversational keyword threshold from 3 to 2
- Added more conversational keywords including "por" and "favor"

### 2. `supabase/functions/whatsapp-webhook/index.ts`
- Applied the same enhancements to the Edge Function version
- Deployed updated version to Supabase

## Testing
Test the fix with these example messages:

### Should be filtered out (conversational):
```
quisiéramos hacer pedido para el dia lunes 3 de noviembre por favor
```

### Should be parsed (product order):
```
1 unidad de repollo verde
2 docenas de cebollin
7 unidades de cabezas de ajo
2 kilos de cebolla
```

## Expected Behavior
After this fix:
1. Lines containing date/time information will be filtered out
2. Lines with order request phrases will be filtered out
3. Only actual product lines will be parsed
4. The parser will be more strict about what constitutes a product line

## Deployment
✅ Edge Function deployed successfully (version 61)
✅ Local parser updated

## Notes
- The fix prioritizes date/time detection over product detection
- This prevents false positives where dates with numbers are mistaken for quantities
- The conversational keyword threshold was reduced to catch more edge cases
- All changes are backward compatible with existing functionality
