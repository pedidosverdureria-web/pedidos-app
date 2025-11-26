
# Fix: Negative Balance in Vales Pendientes

## Problem Description

The customer **Paulina Araya** showed a negative balance of **-$16,200** in the "Vales Pendientes" (Pending Payments) screen, even though all her orders were fully paid.

### Symptoms
- Customer card showed "Al Día" (Up to Date) badge
- Balance displayed as **-$16,200** (negative amount)
- All orders were fully paid
- Customer appeared in the pending payments list despite having no actual debt

## Root Cause Analysis

The issue was caused by inconsistent logic in the `update_customer_totals()` database function:

### Before the Fix

**Total Debt Calculation:**
```sql
-- Only includes orders with status: pending_payment, abonado, pagado
-- Excludes: finalizado orders
SELECT SUM(total_amount) FROM orders 
WHERE status IN ('pending_payment', 'abonado', 'pagado')
```

**Total Paid Calculation:**
```sql
-- Includes ALL payments, even for finalizado orders
SELECT SUM(amount) FROM order_payments
```

### The Problem

When an order was marked as `finalizado`:
1. The order's `total_amount` was **excluded** from `total_debt`
2. The order's payments **remained included** in `total_paid`
3. This created a negative balance: `total_debt - total_paid < 0`

### Example: Paulina Araya

**Orders:**
- Order 1 (finalizado): $16,200 - paid $16,200
- Order 2 (pagado): $15,800 - paid $15,800

**Calculation:**
- `total_debt` = $15,800 (only the "pagado" order)
- `total_paid` = $32,000 (payments for both orders)
- **Balance = $15,800 - $32,000 = -$16,200** ❌

## Solution Implemented

Updated the `update_customer_totals()` function to **exclude payments for finalized orders** from the `total_paid` calculation.

### After the Fix

**Total Debt Calculation:** (unchanged)
```sql
-- Only includes orders with status: pending_payment, abonado, pagado
SELECT SUM(total_amount) FROM orders 
WHERE status IN ('pending_payment', 'abonado', 'pagado')
```

**Total Paid Calculation:** (fixed)
```sql
-- Only includes payments for non-finalized orders
SELECT SUM(op.amount) 
FROM order_payments op
INNER JOIN orders o ON op.order_id = o.id
WHERE o.status IN ('pending_payment', 'abonado', 'pagado')
```

### Result: Paulina Araya

**Calculation:**
- `total_debt` = $15,800 (only the "pagado" order)
- `total_paid` = $15,800 (only payments for the "pagado" order)
- **Balance = $15,800 - $15,800 = $0** ✅

## Migration Applied

**Migration Name:** `fix_customer_totals_negative_balance`

**Changes:**
1. Updated `update_customer_totals()` function to filter payments by order status
2. Recalculated totals for all existing customers to fix any existing negative balances

## Verification

After applying the fix:
- ✅ Paulina Araya's balance is now $0 (was -$16,200)
- ✅ No other customers have negative balances
- ✅ The "Al Día" badge now correctly reflects the actual balance
- ✅ Customers with fully paid orders can be finalized without creating negative balances

## Impact

This fix ensures that:
1. **Finalized orders are completely excluded** from customer totals (both debt and payments)
2. **No negative balances** can occur when orders are finalized
3. **Accurate accounting** in the "Vales Pendientes" screen
4. **Correct "Al Día" badge display** for customers with zero balance

## Technical Details

### Database Function Updated
- **Function:** `public.update_customer_totals()`
- **Triggers:** 
  - `trigger_update_customer_totals_on_order` (on orders table)
  - `trigger_update_customer_totals_on_order_payment` (on order_payments table)
  - `trigger_update_customer_totals_on_customer_payment` (on customer_payments table)

### Order Status Flow
```
pending_payment → abonado → pagado → finalizado
     ↓              ↓         ↓          ↓
  Included      Included   Included   EXCLUDED
  in totals     in totals  in totals  from totals
```

## Testing Recommendations

1. **Create a test order** and mark it as `pagado`
2. **Verify the customer appears** in "Vales Pendientes" with correct balance
3. **Finalize the customer** (mark order as `finalizado`)
4. **Verify the customer is removed** from "Vales Pendientes"
5. **Check that balance remains at $0** (not negative)

## Related Files

- **Database Function:** `public.update_customer_totals()`
- **Screen:** `app/(tabs)/pending-payments.tsx`
- **Migration:** `fix_customer_totals_negative_balance`

---

**Date Fixed:** January 2025
**Issue Reporter:** User (Paulina Araya case)
**Status:** ✅ Resolved
