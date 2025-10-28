
# Order Queries Implementation

## Overview

This implementation adds support for handling customer queries about their orders via WhatsApp. When a customer has an active (non-delivered) order, any messages they send are treated as queries about that order, unless they use specific keywords to indicate they want to place a new order.

## Features Implemented

### 1. Database Schema

**New Table: `order_queries`**
- Stores customer queries related to orders
- Fields:
  - `id`: UUID primary key
  - `order_id`: Reference to the order
  - `customer_phone`: Customer's phone number
  - `query_text`: The actual query message
  - `whatsapp_message_id`: WhatsApp message ID (optional)
  - `created_at`: Timestamp

**RLS Policies:**
- Full access for all operations (SELECT, INSERT, UPDATE, DELETE)
- Indexed on `order_id` and `customer_phone` for performance

### 2. WhatsApp Webhook Logic

**Query Detection:**
- When a message arrives, the webhook checks if the customer has any non-delivered orders
- If they do, the message is treated as a query UNLESS it contains new order keywords

**New Order Keywords (case-insensitive):**
- "nuevo pedido"
- "otro pedido"

Examples that trigger new orders:
- "Nuevo Pedido: 2 kilos de papas"
- "OTRO PEDIDO 3 mallas de cebolla"
- "otro pedido\n2 kilos de tomates"

**Query Handling:**
1. Message is saved to `order_queries` table
2. Customer receives acknowledgment message with:
   - Confirmation that query was received
   - Their order number
   - Current order status
   - Promise to respond soon

**Query Acknowledgment Message Format:**
```
📋 *Consulta Recibida*

Hola [Customer Name], hemos recibido tu consulta sobre el pedido [Order Number].

Tu consulta:
"[Query Text]"

Estado actual: [Order Status]

Te responderemos pronto. ¡Gracias por tu paciencia! 😊
```

### 3. Receipt Generation

**New Function: `generateQueryReceiptText()`**
- Generates a "Consulta de Pedido" receipt
- Includes:
  - Order number and customer name
  - Query text
  - Current order status
  - List of products in the order
  - Formatted for thermal printer (58mm or 80mm)

**Receipt Format:**
```
================================
       CONSULTA DE PEDIDO
================================

Pedido: PED-XXX
Cliente: [Name]
Fecha: [Date/Time]
--------------------------------

CONSULTA:

[Query Text]

--------------------------------
ESTADO DEL PEDIDO:
Estado: [Status]

PRODUCTOS:

[Product List]

================================
           Gracias!
================================
```

### 4. Order Detail Screen Updates

**New Section: "Consultas del Pedido"**
- Displays all queries for the order
- Shows query text and timestamp
- Sorted by most recent first
- Each query has a "Imprimir" button to print the query receipt

**UI Features:**
- Queries are displayed in cards with left border accent
- Each query shows:
  - Query text
  - Date/time received
  - Print button
- Only visible when order has queries

### 5. Type Definitions

**New Type: `OrderQuery`**
```typescript
export interface OrderQuery {
  id: string;
  order_id: string;
  customer_phone: string;
  query_text: string;
  whatsapp_message_id?: string;
  created_at: string;
}
```

**Updated Order Type:**
- Added optional `queries?: OrderQuery[]` field

## Usage Examples

### Scenario 1: Customer with Active Order Sends Query

**Customer sends:** "¿Cuándo estará listo mi pedido?"

**System behavior:**
1. Checks for active orders from this phone number
2. Finds order PED-123 in "preparing" status
3. Saves query to database
4. Sends acknowledgment message
5. Query appears in order detail screen
6. Can be printed as "Consulta de Pedido" receipt

### Scenario 2: Customer Wants New Order While Having Active Order

**Customer sends:** "Nuevo pedido\n3 kilos de papas\n2 mallas de cebolla"

**System behavior:**
1. Detects "nuevo pedido" keyword
2. Removes keyword from message
3. Processes remaining text as new order
4. Creates new order PED-124
5. Sends order confirmation

### Scenario 3: Customer with Delivered Order Sends Message

**Customer sends:** "2 kilos de tomates"

**System behavior:**
1. Checks for active orders
2. Finds no non-delivered orders
3. Processes as new order
4. Creates order PED-125

## Technical Details

### Query Detection Logic

```typescript
// Check for existing non-delivered orders
const { data: existingOrders } = await supabase
  .from('orders')
  .select('*')
  .eq('customer_phone', customerPhone)
  .neq('status', 'delivered')
  .order('created_at', { ascending: false })
  .limit(1);

const hasActiveOrder = existingOrders && existingOrders.length > 0;
const hasNewOrderKeyword = isNewOrderKeyword(messageText);

// If has active order and no new order keyword → query
if (hasActiveOrder && !hasNewOrderKeyword) {
  // Handle as query
}
```

### Keyword Detection

```typescript
function isNewOrderKeyword(message: string): boolean {
  const normalized = message.toLowerCase().trim();
  const newOrderPatterns = [
    /\bnuevo\s+pedido\b/i,
    /\botro\s+pedido\b/i,
  ];
  
  for (const pattern of newOrderPatterns) {
    if (pattern.test(normalized)) {
      return true;
    }
  }
  
  return false;
}
```

## Benefits

1. **Better Customer Service:** All customer queries are tracked and can be reviewed
2. **Automatic Routing:** Messages are intelligently routed as queries or new orders
3. **Documentation:** Query receipts provide physical record of customer inquiries
4. **Flexibility:** Customers can still place new orders using keywords
5. **Order Context:** Queries are linked to specific orders for easy reference

## Future Enhancements

Possible improvements:
- Add query response tracking
- Implement query status (pending/answered)
- Add query categories/tags
- Send automatic responses based on query type
- Query analytics and reporting
- Multi-language support for keywords
