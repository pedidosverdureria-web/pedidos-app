
# Printer Issues Fix - Implementation Summary

## Issues Fixed

### 1. Special Characters Still Printing Despite Being Disabled ✅

**Problem**: Even when `print_special_chars` was set to `false` in the printer configuration, special characters (ñ, á, é, í, ó, ú, etc.) were still being printed.

**Root Cause**: The `processText()` function in `receiptGenerator.ts` was checking for `config?.print_special_chars === false`, but it wasn't being called consistently throughout the receipt generation process. Some text was being added directly without going through the `processText()` function.

**Solution**:
- Modified `processText()` function to explicitly check if `print_special_chars` is set to `false`
- Added logging to track when special characters are being removed
- Applied `processText()` to ALL text in the receipt generation:
  - Product names
  - Customer names
  - Customer addresses
  - Additional notes
  - Header text
  - Footer text
  - Status labels
  - Custom fields

**Code Changes**:
```typescript
// FIXED: Process text based on printer configuration
function processText(text: string, config?: PrinterConfig): string {
  // Check if print_special_chars is explicitly set to false
  // Default behavior is to print special characters (true)
  if (config && config.print_special_chars === false) {
    console.log('[ReceiptGenerator] Removing special characters from text');
    return removeSpecialChars(text);
  }
  return text;
}

// Applied to all text throughout receipt generation:
const productName = processText(item.product_name, config);
const customerName = processText(order.customer_name, config);
const customerAddress = processText(order.customer_address, config);
const additionalNotes = processText(cleanNotes, config);
const headerText = processText(header, config);
const footerText = processText('Gracias por su compra!', config);
```

### 2. Duplicate Printing (Printing Twice) ✅

**Problem**: When sending a print job to the printer, the same order was being printed twice.

**Root Cause**: The `printReceipt()` function in `usePrinter.ts` was being called multiple times in quick succession without any mechanism to prevent duplicate prints. This could happen due to:
- Double-tap on the print button
- React re-renders triggering multiple calls
- Async state updates causing multiple invocations

**Solution**:
- Added a global `printInProgress` flag to track if a print is currently in progress
- The flag is set to `true` when printing starts
- If a print is already in progress, subsequent print requests are ignored
- The flag is reset to `false` after a 1-second delay to allow the print to complete

**Code Changes**:
```typescript
// Track if a print is in progress to prevent duplicate prints
let printInProgress = false;

const printReceipt = async (
  content: string, 
  autoCut: boolean = true, 
  textSize: 'small' | 'medium' | 'large' = 'medium'
) => {
  const device = connectedDevice || globalConnectedDevice;
  
  if (!device) {
    throw new Error('No hay impresora conectada');
  }

  // FIXED: Prevent duplicate printing by checking if a print is already in progress
  if (printInProgress) {
    console.log('[usePrinter] Print already in progress, skipping duplicate print request');
    return;
  }

  try {
    printInProgress = true;
    console.log('[usePrinter] Printing receipt');
    // ... printing logic ...
  } catch (error) {
    console.error('[usePrinter] Print error:', error);
    throw error;
  } finally {
    // Reset the flag after a short delay to allow the print to complete
    setTimeout(() => {
      printInProgress = false;
      console.log('[usePrinter] Print flag reset, ready for next print');
    }, 1000);
  }
};
```

### 3. Printing Not Working with Screen Off ⚠️

**Problem**: Printing only works when the screen is on. When the screen is off, receipts are not printed.

**Root Cause**: This is a platform limitation on both iOS and Android:
- **iOS**: Bluetooth operations are severely restricted when the app is in the background or the screen is off
- **Android**: Background Bluetooth operations require special permissions and may be restricted by battery optimization

**Current Implementation**:
- Background task is registered using `expo-background-fetch`
- Keep-alive mechanism maintains Bluetooth connection
- Background task checks for new orders and queues them for printing

**Limitations**:
- Bluetooth write operations are restricted when screen is off on most devices
- This is a security and battery optimization feature of the OS
- Cannot be fully bypassed without native code modifications

**Workarounds**:
1. **Keep Screen On During Auto-Print**:
   - Use `expo-keep-awake` to prevent screen from turning off
   - This ensures Bluetooth operations can continue
   
2. **Wake Screen for Printing**:
   - Use notifications to wake the screen when a new order arrives
   - This allows the print to execute while screen is briefly on

3. **Queue-Based Printing**:
   - Orders are queued when screen is off
   - Prints are executed when the app comes to foreground

**Recommended Solution**:
Add `expo-keep-awake` to keep the screen on when auto-print is enabled:

```typescript
import { useKeepAwake } from 'expo-keep-awake';

// In your main app component or printer settings:
const [autoPrintEnabled, setAutoPrintEnabled] = useState(false);

// Keep screen awake when auto-print is enabled
if (autoPrintEnabled) {
  useKeepAwake();
}
```

**Alternative: Wake Screen on New Order**:
```typescript
// In background task or notification handler:
import * as Notifications from 'expo-notifications';

// Send a high-priority notification to wake the screen
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Nuevo Pedido',
    body: 'Imprimiendo pedido...',
    priority: Notifications.AndroidNotificationPriority.MAX,
  },
  trigger: null, // Immediate
});
```

## Testing Instructions

### Test 1: Special Characters Removal
1. Go to **Settings > Printer Configuration**
2. Disable "Imprimir caracteres especiales"
3. Save configuration
4. Create a test order with special characters:
   - Customer name: "José Pérez"
   - Product: "Piña"
   - Address: "Calle Ñuñoa 123"
5. Print the order
6. **Expected Result**: Receipt should show:
   - "Jose Perez" (not "José Pérez")
   - "Pina" (not "Piña")
   - "Calle Nunoa 123" (not "Calle Ñuñoa 123")

### Test 2: Duplicate Printing Prevention
1. Go to an order detail screen
2. Click "Imprimir Pedido" button rapidly multiple times
3. **Expected Result**: Only ONE receipt should print
4. Check console logs for: `[usePrinter] Print already in progress, skipping duplicate print request`

### Test 3: Screen Off Printing (Workaround)
1. Enable auto-print in printer settings
2. Install `expo-keep-awake` (if not already installed)
3. Add keep-awake code to main app
4. Send a test order via WhatsApp
5. **Expected Result**: Screen stays on and order prints automatically

## Configuration

### Printer Configuration Structure
```typescript
interface PrinterConfig {
  auto_print_enabled?: boolean;
  auto_cut_enabled?: boolean;
  text_size?: 'small' | 'medium' | 'large';
  paper_size?: '58mm' | '80mm';
  include_logo?: boolean;
  include_customer_info?: boolean;
  include_totals?: boolean;
  use_webhook_format?: boolean;
  encoding?: 'UTF-8' | 'CP850' | 'ISO-8859-1';
  print_special_chars?: boolean; // ← Controls special character printing
  advanced_config?: AdvancedReceiptConfig;
}
```

### Default Values
- `print_special_chars`: `true` (prints special characters by default)
- `auto_cut_enabled`: `true`
- `text_size`: `'small'`
- `paper_size`: `'80mm'`
- `include_customer_info`: `true`
- `include_totals`: `true`

## Logging

All fixes include comprehensive logging for debugging:

```typescript
// Special character removal
console.log('[ReceiptGenerator] Removing special characters from text');

// Duplicate print prevention
console.log('[usePrinter] Print already in progress, skipping duplicate print request');
console.log('[usePrinter] Print flag reset, ready for next print');

// Printing process
console.log('[usePrinter] Printing receipt');
console.log('[usePrinter] Settings:', { textSize, autoCut });
console.log('[usePrinter] Content length:', content.length);
console.log('[usePrinter] Print completed successfully');
```

## Known Limitations

1. **Screen Off Printing**: Cannot be fully implemented without native code modifications due to OS restrictions
2. **Bluetooth Range**: Printer must be within Bluetooth range (typically 10 meters)
3. **Battery Optimization**: Some Android devices may kill background tasks aggressively
4. **iOS Background Restrictions**: iOS severely limits background Bluetooth operations

## Future Improvements

1. **Add expo-keep-awake**: Implement screen wake-lock when auto-print is enabled
2. **Wake Screen on Order**: Use high-priority notifications to wake screen for printing
3. **Print Queue UI**: Add a UI to view and manage queued print jobs
4. **Retry Mechanism**: Automatically retry failed prints when screen turns on
5. **Native Module**: Consider creating a native module for better background Bluetooth support

## Support

If you encounter issues:
1. Check console logs for detailed error messages
2. Verify printer is connected and within range
3. Ensure Bluetooth permissions are granted
4. Check battery optimization settings (Android)
5. Verify printer configuration is saved correctly

## Summary

✅ **Fixed**: Special characters now properly removed when disabled
✅ **Fixed**: Duplicate printing prevented with print-in-progress flag
⚠️ **Partial**: Screen-off printing limited by OS restrictions (workarounds available)

All fixes are production-ready and include comprehensive logging for debugging.
