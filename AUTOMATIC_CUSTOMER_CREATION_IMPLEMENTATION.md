
# Automatic Customer Creation for "Pendiente de Pago" Orders

## Overview
This document describes the implementation of automatic customer creation when orders transition to "Pendiente de Pago" (pending_payment) status.

## Implementation Details

### 1. Order Detail Screen (`app/order/[orderId].tsx`)

When an order's status is changed to "pending_payment", the system now automatically:

1. **Checks for existing customer** by phone number (if available) or by name
2. **Creates a new customer** if one doesn't exist
3. **Links the order** to the customer by setting `customer_id`
4. **Updates the order status** to "pending_payment"

#### Key Features:

- **Works for both WhatsApp and Manual orders**: The logic applies regardless of the order source
- **Smart customer matching**: First tries to find customer by phone, then by name
- **Automatic linking**: Orders are automatically linked to customers via `customer_id`
- **User feedback**: Clear success messages inform users about customer creation/linking

#### Code Flow:

```typescript
const updateStatus = async (newStatus: OrderStatus) => {
  // ... existing code ...
  
  if (newStatus === 'pending_payment') {
    // Validate customer information
    if (!order.customer_name || !order.customer_name.trim()) {
      Alert.alert('Error', 'Cannot change to pending payment without customer name');
      return;
    }
    
    // Check for existing customer
    let customerId = order.customer_id;
    
    if (!customerId) {
      // Search by phone
      if (order.customer_phone) {
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', order.customer_phone)
          .maybeSingle();
        
        if (existingCustomer) {
          customerId = existingCustomer.id;
        }
      }
      
      // Search by name if not found by phone
      if (!customerId) {
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('name', order.customer_name)
          .maybeSingle();
        
        if (existingCustomer) {
          customerId = existingCustomer.id;
        }
      }
      
      // Create new customer if not found
      if (!customerId) {
        const { data: newCustomer } = await supabase
          .from('customers')
          .insert({
            name: order.customer_name,
            phone: order.customer_phone || null,
            address: order.customer_address || null,
            total_debt: 0,
            total_paid: 0,
            finalized: false,
          })
          .select()
          .single();
        
        customerId = newCustomer.id;
      }
    }
    
    // Update order with customer_id and new status
    await supabase
      .from('orders')
      .update({ 
        status: newStatus,
        customer_id: customerId,
      })
      .eq('id', order.id);
  }
  
  // ... rest of the code ...
};
```

### 2. Database Schema

The implementation relies on the following database structure:

#### `customers` table:
- `id` (uuid, primary key)
- `name` (text, required)
- `phone` (text, nullable)
- `address` (text, nullable)
- `total_debt` (numeric, default 0)
- `total_paid` (numeric, default 0)
- `blocked` (boolean, default false)
- `finalized` (boolean, default false)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `orders` table:
- `id` (uuid, primary key)
- `order_number` (text, unique)
- `customer_name` (text, required)
- `customer_phone` (text, nullable)
- `customer_address` (text, nullable)
- `customer_id` (uuid, nullable, foreign key to customers)
- `status` (text, one of: pending, preparing, ready, delivered, cancelled, pending_payment, paid)
- `source` (text, one of: whatsapp, manual)
- ... other fields

### 3. Vales Pendientes Screen (`app/(tabs)/pending-payments.tsx`)

The "Vales Pendientes" screen automatically displays customers who have orders with `status = 'pending_payment'`:

```typescript
const { data, error } = await supabase
  .from('customers')
  .select(`
    *,
    orders:orders!customer_id(
      id,
      order_number,
      total_amount,
      paid_amount,
      status,
      created_at,
      items:order_items(...)
    ),
    payments:customer_payments(...)
  `)
  .eq('finalized', false)
  .order('created_at', { ascending: false });

// Filter to only show customers with pending_payment orders
const customersWithFilteredOrders = data
  .map(customer => ({
    ...customer,
    orders: customer.orders?.filter((order: Order) => 
      order.status === 'pending_payment'
    ) || [],
  }))
  .filter(customer => customer.orders.length > 0);
```

### 4. User Experience

#### For WhatsApp Orders:
1. Customer sends order via WhatsApp
2. Order is created with `status: 'pending'`
3. Staff reviews order and adds prices
4. Staff changes status to "Pendiente de Pago"
5. **System automatically creates customer** (if doesn't exist)
6. **Order appears in "Vales Pendientes"**
7. Customer can make partial payments
8. When fully paid, staff clicks "Finalizar" to remove from list

#### For Manual Orders:
1. Staff creates order manually
2. Staff enters customer name (and optionally phone/address)
3. Staff adds products and prices
4. Staff changes status to "Pendiente de Pago"
5. **System automatically creates customer** (if doesn't exist)
6. **Order appears in "Vales Pendientes"**
7. Same payment flow as WhatsApp orders

### 5. Success Messages

When an order transitions to "pending_payment", users see:

```
✅ Estado Actualizado

El pedido ahora está en estado: Pendiente de Pago

El cliente ha sido [creado/vinculado] automáticamente y aparecerá en "Vales Pendientes".
```

## Benefits

1. **No manual customer creation needed**: Customers are created automatically when needed
2. **Works for all order sources**: Both WhatsApp and manual orders are handled
3. **Smart duplicate prevention**: System checks for existing customers before creating new ones
4. **Seamless integration**: Orders automatically appear in "Vales Pendientes" after status change
5. **Flexible matching**: Finds customers by phone or name to avoid duplicates

## Testing Scenarios

### Scenario 1: New WhatsApp Order → Pending Payment
1. Customer sends order via WhatsApp
2. Order created with customer_name and customer_phone
3. Staff changes status to "pending_payment"
4. **Expected**: New customer created, order linked, appears in Vales Pendientes

### Scenario 2: Manual Order → Pending Payment
1. Staff creates manual order with customer name
2. Staff changes status to "pending_payment"
3. **Expected**: New customer created, order linked, appears in Vales Pendientes

### Scenario 3: Existing Customer → New Order
1. Customer already exists in database
2. New order created with same phone/name
3. Staff changes status to "pending_payment"
4. **Expected**: Order linked to existing customer, no duplicate created

### Scenario 4: Order Without Phone
1. Order created with only customer name (no phone)
2. Staff changes status to "pending_payment"
3. **Expected**: System searches by name, creates customer if not found

## Database Triggers

The system relies on database triggers to automatically update customer totals:

- When order status changes to "pending_payment", `total_debt` is updated
- When payments are added, `total_paid` is updated
- When order is deleted, totals are recalculated

## Notes

- Customer creation requires at minimum a `customer_name`
- Phone number is optional but recommended for better matching
- The `finalized` flag controls visibility in "Vales Pendientes"
- Customers can be manually added to the menu from order detail screen
- Blocked customers cannot send orders via WhatsApp

## Future Enhancements

Potential improvements for future versions:

1. **Automatic status transition**: Auto-change to "pending_payment" when order is marked as "ready"
2. **Payment reminders**: Send WhatsApp reminders for unpaid orders
3. **Credit limits**: Set maximum debt limits per customer
4. **Payment plans**: Support for installment payments
5. **Customer history**: View all orders and payments for a customer
