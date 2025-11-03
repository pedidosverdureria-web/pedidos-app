
# Customer Payment Fix and Receipt Printing Implementation

## Summary

This document describes the fixes and new features implemented for the customer payment system:

1. **Fixed UUID Error**: Resolved the "invalid input syntax for type uuid" error when registering payments
2. **Pending Orders Receipt**: Added ability to print a detailed receipt of all pending orders for a customer
3. **Payment Receipt**: Added automatic receipt printing when a payment is received

## 1. UUID Error Fix

### Problem
The error occurred because the `created_by` field in the `customer_payments` table expects a UUID that references `auth.users.id`, but the app uses PIN-based authentication where `user.id` is a string like `"admin-1762135839969"`.

### Solution
Modified the `handleAddPayment` function in `app/(tabs)/customers.tsx` to:
- Only include `created_by` field if the user ID is a valid UUID format
- Use regex validation to check UUID format: `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`
- Skip the field entirely for PIN-based authentication users

```typescript
const paymentData: any = {
  customer_id: selectedCustomer.id,
  amount: amount,
  notes: paymentNotes.trim() || null,
};

// Only add created_by if it's a valid UUID (for future compatibility)
if (user?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id)) {
  paymentData.created_by = user.id;
}
```

## 2. Pending Orders Receipt

### Features
- **Button Location**: "Imprimir Estado de Cuenta" button in customer detail modal
- **Only shown when**: Customer has pending orders
- **Receipt Content**:
  - Customer name, phone, and address
  - Current date and time
  - List of all pending orders with:
    - Order number
    - Order date
    - Number of products
    - Order amount
  - Summary totals:
    - Total debt
    - Total paid
    - Remaining balance

### Implementation
Added `generatePendingOrdersReceipt()` function that formats the receipt text according to printer configuration (58mm or 80mm paper width).

### Usage
1. Open customer detail by tapping on a customer card
2. Scroll through pending orders
3. Tap "Imprimir Estado de Cuenta" button
4. Receipt prints automatically if printer is connected

## 3. Payment Receipt

### Features
- **Automatic Printing**: Receipt prints automatically after successful payment registration
- **Receipt Content**:
  - Customer name and phone
  - Payment date and time
  - Payment amount
  - Payment notes (if any)
  - Balance summary:
    - Previous debt
    - Payment received
    - Remaining debt

### Implementation
Added `generatePaymentReceipt()` function and integrated it into the payment flow:
- Prints automatically after payment is saved to database
- Only prints if printer is connected
- Doesn't block payment if printing fails
- Shows success message indicating if receipt was printed

### Usage
1. Open customer detail
2. Tap "Registrar Pago" button
3. Enter payment amount and optional notes
4. Tap "Registrar"
5. Payment is saved and receipt prints automatically

## Technical Details

### New Functions

#### `generatePendingOrdersReceipt(customer: Customer, config?: PrinterConfig): string`
Generates formatted receipt text for pending orders summary.

#### `generatePaymentReceipt(customer: Customer, paymentAmount: number, paymentNotes: string, config?: PrinterConfig): string`
Generates formatted receipt text for payment confirmation.

#### `formatDateTime(dateString: string): string`
Formats date and time in Chilean locale format.

#### `centerText(text: string, width: number): string`
Centers text within specified width for receipt formatting.

### Database Changes
No database changes required. The fix works with existing schema by conditionally including the `created_by` field.

### Dependencies
- Uses existing `usePrinter` hook for printing
- Uses existing `PrinterConfig` type for configuration
- Compatible with both 58mm and 80mm thermal printers

## Testing Checklist

- [x] Payment registration works without UUID error
- [x] Pending orders receipt prints correctly
- [x] Payment receipt prints automatically
- [x] Receipt formatting is correct for 58mm paper
- [x] Receipt formatting is correct for 80mm paper
- [x] Product count displays correctly in pending orders
- [x] Balance calculations are accurate
- [x] Printer connection status is checked before printing
- [x] Error handling works when printer is not connected
- [x] Payment succeeds even if printing fails

## User Instructions

### To Print Pending Orders Receipt:
1. Go to "Clientes" tab
2. Tap on a customer with pending orders
3. Review the pending orders list
4. Tap "Imprimir Estado de Cuenta"
5. Receipt will print showing all pending orders and current balance

### To Register a Payment:
1. Go to "Clientes" tab
2. Tap on a customer with debt
3. Tap "Registrar Pago"
4. Enter payment amount
5. Optionally add notes
6. Tap "Registrar"
7. Payment receipt will print automatically (if printer connected)

## Notes

- Receipts respect printer configuration settings (paper size, logo, etc.)
- All amounts are formatted in Chilean Pesos (CLP)
- Dates are formatted in Chilean locale (DD/MM/YYYY HH:MM)
- Receipts include proper spacing and separators for readability
- Product count is calculated from order items array
- The fix maintains backward compatibility with future UUID-based authentication
