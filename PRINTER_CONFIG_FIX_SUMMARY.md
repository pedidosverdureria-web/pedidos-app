
# Printer Configuration Fix Summary

## Issues Fixed

### 1. Auto-printing receipts now match manual printing format
**Problem**: The auto-printing logic in `HomeScreen` was using a simplified receipt generation function that didn't match the format used in `OrderDetailScreen`.

**Solution**: 
- Created a unified receipt generator utility (`utils/receiptGenerator.ts`)
- Both auto-printing and manual printing now use the same `generateReceiptText()` function
- Ensures consistent formatting across all printing scenarios

### 2. Ticket format preview in printer settings
**Problem**: Users couldn't see how their ticket would look before printing.

**Solution**:
- Added a "Vista Previa del Ticket" section in printer settings
- Shows a sample receipt with the current configuration
- Allows users to see exactly how the ticket will be formatted
- Includes option to print a test receipt directly from the preview

### 3. Printer configuration is now properly saved and applied
**Problem**: Configuration changes weren't being consistently applied to both auto-printing and manual printing.

**Solution**:
- Unified the `PrinterConfig` interface across all components
- Both `HomeScreen` and `OrderDetailScreen` now import and use the same configuration
- Configuration is loaded from AsyncStorage and applied consistently
- All printing operations respect the saved settings:
  - Paper size (58mm or 80mm)
  - Text size (small, medium, large)
  - Encoding (CP850, UTF-8, ISO-8859-1, Windows-1252)
  - Include/exclude logo
  - Include/exclude customer info
  - Include/exclude totals
  - Auto-cut enabled/disabled

## Files Modified

### New Files
- `utils/receiptGenerator.ts` - Unified receipt generation logic

### Modified Files
- `app/(tabs)/(home)/index.tsx` - Updated to use unified receipt generator
- `app/order/[orderId].tsx` - Updated to use unified receipt generator
- `app/settings/printer.tsx` - Added preview functionality and modal

## Key Features

### Unified Receipt Generator (`utils/receiptGenerator.ts`)
```typescript
export function generateReceiptText(order: Order, config?: PrinterConfig): string
export function generateSampleReceipt(config?: PrinterConfig): string
```

- Handles all receipt formatting logic in one place
- Respects all configuration options
- Uses the webhook format for product display (e.g., "2 kilos de papas")
- Properly formats prices, totals, and customer information

### Preview Modal
- Shows real-time preview of ticket format
- Updates when configuration changes
- Allows direct printing from preview
- Displays sample order with realistic data

### Configuration Persistence
- Saved to AsyncStorage for quick access
- Synced with Supabase database for persistence
- Loaded on app start and when settings screen opens
- Applied to all printing operations automatically

## Usage

### For Users
1. Go to Settings → Printer Configuration
2. Adjust settings as desired (paper size, text size, what to include, etc.)
3. Click "Ver Vista Previa" to see how the ticket will look
4. Click "Guardar configuración" to save changes
5. All future prints (both manual and auto) will use these settings

### For Developers
```typescript
import { generateReceiptText, generateSampleReceipt } from '@/utils/receiptGenerator';

// Generate receipt for an order
const receiptText = generateReceiptText(order, printerConfig);

// Generate sample receipt for preview
const sampleText = generateSampleReceipt(printerConfig);
```

## Testing

To verify the fixes:

1. **Test Configuration Saving**:
   - Change printer settings
   - Save configuration
   - Close and reopen the app
   - Verify settings are preserved

2. **Test Auto-printing Format**:
   - Enable auto-printing
   - Connect printer
   - Create a new order via WhatsApp
   - Verify the auto-printed receipt matches the manual print format

3. **Test Preview**:
   - Open printer settings
   - Click "Ver Vista Previa"
   - Verify the preview shows the correct format
   - Change settings and verify preview updates

4. **Test Manual Printing**:
   - Open an order detail
   - Click "Imprimir Pedido"
   - Verify the receipt uses the saved configuration

## Benefits

- **Consistency**: All receipts look the same regardless of how they're printed
- **Customization**: Users can fully customize their receipt format
- **Preview**: Users can see changes before printing
- **Reliability**: Configuration is properly saved and applied
- **Maintainability**: Single source of truth for receipt generation logic
