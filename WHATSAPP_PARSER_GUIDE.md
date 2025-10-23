
# WhatsApp Message Parser Guide

## Overview

The WhatsApp message parser has been enhanced to intelligently parse order messages with the following capabilities:

- **Quantity Parsing**: Handles whole numbers, decimals, and fractions
- **Unit Normalization**: Converts various unit formats to standard units
- **Error Handling**: Gracefully skips unparsable lines and logs errors
- **Multi-language Support**: Supports Spanish and English unit names

## Message Format

Each line in the WhatsApp message should follow this format:

```
<quantity> <unit> <product_name>
```

### Examples

**Valid formats:**
- `2 kg tomatoes`
- `1/2 kg cheese`
- `1.5 l milk`
- `3 pza eggs`
- `0.5 kg butter`
- `1 unidad bread`

**Invalid formats (will be skipped):**
- `tomatoes` (missing quantity and unit)
- `2 tomatoes` (missing unit)
- `kg tomatoes` (missing quantity)

## Supported Quantities

### Whole Numbers
```
1 kg rice
5 unit bread
10 pza eggs
```

### Decimals
```
1.5 kg flour
0.5 l oil
2.25 kg sugar
```

### Fractions
```
1/2 kg cheese
1/4 l milk
3/4 kg butter
```

## Supported Units

### Weight Units
- **Kilograms**: `kg`, `kgs`, `kilo`, `kilos`, `kilogramo`, `kilogramos` → normalized to `kg`
- **Grams**: `g`, `gs`, `gramo`, `gramos` → normalized to `g`

### Volume Units
- **Liters**: `l`, `ls`, `litro`, `litros` → normalized to `l`
- **Milliliters**: `ml`, `mls`, `mililitro`, `mililitros` → normalized to `ml`

### Count Units
- **Units**: `unit`, `units`, `unidad`, `unidades`, `u`, `pza`, `pzas`, `pieza`, `piezas` → normalized to `unit`

## Parser Functions

### `parseQuantityValue(quantityStr: string): number`

Parses a quantity string into a numeric value.

**Examples:**
```typescript
parseQuantityValue("2")      // Returns: 2
parseQuantityValue("1.5")    // Returns: 1.5
parseQuantityValue("1/2")    // Returns: 0.5
parseQuantityValue("3/4")    // Returns: 0.75
```

### `normalizeUnit(unit: string): string`

Normalizes a unit string to a standard format.

**Examples:**
```typescript
normalizeUnit("kg")          // Returns: "kg"
normalizeUnit("kilos")       // Returns: "kg"
normalizeUnit("litro")       // Returns: "l"
normalizeUnit("pza")         // Returns: "unit"
normalizeUnit("unknown")     // Returns: "unit" (default)
```

### `parseLine(line: string): ParsedOrderItem`

Parses a single line into a structured order item.

**Example:**
```typescript
parseLine("2 kg tomatoes")
// Returns: { quantity: 2, unit: "kg", product: "tomatoes" }
```

### `parseWhatsAppMessage(message: string): ParsedOrderItem[]`

Parses a complete WhatsApp message into an array of order items.

**Example:**
```typescript
const message = `2 kg tomatoes
1/2 kg cheese
1 unit bread`;

parseWhatsAppMessage(message)
// Returns:
// [
//   { quantity: 2, unit: "kg", product: "tomatoes" },
//   { quantity: 0.5, unit: "kg", product: "cheese" },
//   { quantity: 1, unit: "unit", product: "bread" }
// ]
```

## Integration

### Edge Function

The parser is integrated into the `whatsapp-webhook` Edge Function, which:

1. Receives incoming WhatsApp messages
2. Parses the message using the new parsing logic
3. Creates orders in the database with parsed items
4. Sends auto-reply messages if configured

### Mobile App

The parser utility is available in the mobile app at:
- **File**: `utils/whatsappParser.ts`
- **Test Screen**: Settings → WhatsApp Integration → "Probar Parser de Mensajes"

## Testing

### Using the Test Screen

1. Navigate to **Settings** → **WhatsApp Integration**
2. Tap **"Probar Parser de Mensajes"**
3. Enter or select a test message
4. Tap **"Probar Parser"** to see the parsed results

### Example Test Messages

**Example 1 - Basic Items:**
```
2 kg tomatoes
1/2 kg cheese
1 unit bread
```

**Example 2 - Decimals:**
```
1.5 l milk
3 pza eggs
0.5 kg butter
```

**Example 3 - Spanish Units:**
```
1 kg arroz
2 litros aceite
1/4 kg mantequilla
3 unidades pan
```

## Error Handling

The parser includes robust error handling:

- **Empty lines**: Automatically skipped
- **Invalid format**: Line is skipped, error is logged
- **Invalid quantity**: Line is skipped, error is logged
- **Missing product name**: Line is skipped, error is logged

### Error Logs

Errors are logged to the console with detailed information:

```
Failed to parse line 2 ("invalid line"): Line has insufficient parts: invalid line
```

## Fallback Behavior

If no lines can be parsed from a message, the webhook creates a fallback order:

- **Product Name**: "Pedido por WhatsApp"
- **Quantity**: 1
- **Unit Price**: 0
- **Notes**: Contains the original message text
- **Order Notes**: "Pedido no pudo ser parseado automáticamente"

This ensures that no orders are lost, even if the message format is incorrect.

## Best Practices

### For Users Sending Orders

1. **Use the correct format**: `quantity unit product`
2. **One item per line**: Each line should contain one product
3. **Use supported units**: Refer to the supported units list
4. **Be consistent**: Use the same format for all items

### For Developers

1. **Test thoroughly**: Use the test screen to validate parsing
2. **Monitor logs**: Check Edge Function logs for parsing errors
3. **Handle edge cases**: The parser is designed to be forgiving
4. **Update unit mappings**: Add new unit variations as needed

## Future Enhancements

Potential improvements to consider:

- **AI/NLP Integration**: Use AI to parse more complex message formats
- **Price Extraction**: Automatically extract prices from messages
- **Customer Name Detection**: Identify customer names in messages
- **Multi-line Products**: Support products with descriptions spanning multiple lines
- **Custom Unit Mappings**: Allow users to define custom unit conversions
- **Validation Rules**: Add configurable validation rules for quantities and units

## Troubleshooting

### Common Issues

**Issue**: Items not being parsed
- **Solution**: Check that the format is `quantity unit product`
- **Solution**: Verify the unit is in the supported units list

**Issue**: Fractions not working
- **Solution**: Use the format `1/2` without spaces
- **Solution**: Ensure numerator and denominator are valid numbers

**Issue**: Decimal separator
- **Solution**: Use period (`.`) as decimal separator, not comma (`,`)

**Issue**: Product names with numbers
- **Solution**: Ensure quantity and unit come first
- **Example**: `2 kg tomatoes 500g` will parse as "tomatoes 500g"

## Support

For issues or questions:
1. Check the test screen for parsing validation
2. Review Edge Function logs in Supabase dashboard
3. Verify WhatsApp configuration is active
4. Test with the provided example messages
