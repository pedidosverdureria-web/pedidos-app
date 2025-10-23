
# WhatsApp Integration Improvements

## Overview
This document describes the improvements made to the WhatsApp webhook integration for automatic customer notifications and enhanced message handling.

## Key Features Implemented

### 1. Customer Name Extraction
- **Feature**: Extract customer name from WhatsApp contact information
- **Implementation**: The webhook now extracts the customer's name from the WhatsApp contact profile
- **Fallback**: If no name is available, uses the phone number (wa_id) as the customer name
- **Location**: `supabase/functions/whatsapp-webhook/index.ts` - `extractCustomerName()` function

### 2. Greeting and Question Detection
- **Feature**: Automatically detect when a customer sends a greeting or question without products
- **Patterns Detected**:
  - Greetings: hola, buenos días, buenas tardes, saludos, etc.
  - Questions: cómo hago, quiero pedir, tienen, precio, horario, etc.
  - Messages containing '?' or '¿'
- **Response**: Sends a welcome message with instructions on how to place an order
- **Location**: `supabase/functions/whatsapp-webhook/index.ts` - `isGreeting()` function

### 3. Automatic Customer Notifications

#### A. Order Confirmation Message
**Sent when**: A new order is created from WhatsApp
**Format**:
```
✅ *¡Pedido Recibido!*

Hola [CustomerName], hemos recibido tu pedido correctamente.

📋 *Número de pedido:* [OrderNumber]

📦 *Productos solicitados:*
1. [quantity] [unit] de [product]
2. [quantity] [unit] de [product]
...

💰 Los precios se asignarán y te confirmaremos el total cuando tu pedido esté en preparación.

Te mantendremos informado sobre el estado de tu pedido. ⏰

¡Gracias por tu preferencia! 😊
```

#### B. Help Message
**Sent when**: No products can be identified in the message
**Format**:
```
❌ *No pudimos identificar productos*

Hola [CustomerName]! No pude identificar productos en tu mensaje.

📝 *Formato sugerido:*
• 3 kilos de tomates
• 2 kilos de palta
• 1 kg de papas
• 5 pepinos
• 1 cilantro

También puedes escribir:
• tomates 3 kilos
• 3k de tomates
• tres kilos de tomates
• 3kilos de papas
• papas 3k
• 1/4 de ají
• 1/2 kilo de papas
• 2 saco de papa, un cajón de tomate
• 2 kilos de tomates 1 kilo de papa
• 3kilos tomates 2kilos paltas 3 pepinos

¡Gracias por tu comprensión! 😊
```

#### C. Welcome Message
**Sent when**: Customer sends a greeting or question
**Format**:
```
👋 *¡Hola [CustomerName]!*

Gracias por contactarnos. Para hacer un pedido, simplemente envía la lista de productos que necesitas.

📝 *Ejemplos de cómo hacer tu pedido:*

*Formato vertical:*
• 3 kilos de tomates
• 2 kilos de paltas
• 5 pepinos
• 1 cilantro

*Formato horizontal:*
• 3 kilos de tomates, 2 kilos de paltas, 5 pepinos

*Otros formatos válidos:*
• 3k de tomates
• tomates 3 kilos
• 1/4 de ají
• 2 saco de papa
• 3kilos tomates 2kilos paltas

💡 *Tip:* Puedes escribir los productos como prefieras, nosotros entenderemos tu pedido.

¿En qué podemos ayudarte hoy? 😊
```

#### D. Status Update Message
**Sent when**: Order status is changed
**Format**:
```
[StatusEmoji] *Actualización de Pedido*

Hola [CustomerName], tu pedido ha sido actualizado.

📋 *Número de pedido:* [OrderNumber]
🔄 *Nuevo estado:* [StatusText]

📦 *Productos:*
1. [quantity] [unit] de [product]
2. [quantity] [unit] de [product]
...

[Additional status-specific information]

¡Gracias por tu preferencia! 😊
```

**Status-specific emojis and messages**:
- **Preparando** (👨‍🍳): "Estamos asignando los precios y preparando tu pedido."
- **Listo** (✅): "Tu pedido está listo. ¡Puedes pasar a recogerlo!"
- **Entregado** (🎉): "¡Esperamos que disfrutes tus productos! Gracias por tu compra."
- **Cancelado** (❌): "Si tienes alguna pregunta, no dudes en contactarnos."

#### E. Product Added Message
**Sent when**: A new product is added to an existing order
**Format**:
```
➕ *Producto Agregado*

Hola [CustomerName], se ha agregado un producto a tu pedido.

📋 *Número de pedido:* [OrderNumber]

✨ *Producto agregado:*
[quantity] [unit] de [product]

📦 *Lista completa de productos:*
1. [quantity] [unit] de [product]
2. [quantity] [unit] de [product]
...

¡Gracias por tu preferencia! 😊
```

## Implementation Details

### Files Modified/Created

1. **`supabase/functions/whatsapp-webhook/index.ts`**
   - Added greeting and question detection
   - Added customer name extraction
   - Added message formatting functions
   - Implemented automatic responses for greetings, help, and confirmations

2. **`utils/whatsappNotifications.ts`** (NEW)
   - Created utility functions for sending WhatsApp notifications
   - `sendOrderStatusUpdate()`: Sends status update notifications
   - `sendProductAddedNotification()`: Sends product added notifications
   - Message formatting functions for different notification types

3. **`app/order/[orderId].tsx`**
   - Integrated WhatsApp notifications when order status changes
   - Integrated WhatsApp notifications when products are added
   - Imports notification functions from `utils/whatsappNotifications.ts`

### How It Works

#### Webhook Flow
1. WhatsApp sends a message to the webhook
2. Webhook extracts customer name from contact info
3. Webhook checks if message is a greeting/question
   - If yes: Send welcome message and exit
4. Webhook parses message for products
   - If no products found: Send help message and exit
   - If products found: Create order and send confirmation message

#### Order Update Flow
1. User changes order status in the app
2. App calls `sendOrderStatusUpdate()` function
3. Function checks if WhatsApp is configured and order is from WhatsApp
4. Function retrieves order details and formats status update message
5. Function sends message to customer via WhatsApp API

#### Product Added Flow
1. User adds a product to an order in the app
2. App calls `sendProductAddedNotification()` function
3. Function checks if WhatsApp is configured and order is from WhatsApp
4. Function retrieves order details and formats product added message
5. Function sends message to customer via WhatsApp API

## Configuration Requirements

### WhatsApp Business API
- **Access Token**: Required for sending messages
- **Phone Number ID**: Required for sending messages
- **Verify Token**: Required for webhook verification
- **Webhook URL**: Must be configured in WhatsApp Business settings

### Supabase Configuration
- **Environment Variables**:
  - `SUPABASE_URL`: Your Supabase project URL
  - `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access

### Database Tables
- **whatsapp_config**: Stores WhatsApp configuration
  - `is_active`: Must be true for notifications to work
  - `access_token`: WhatsApp API access token
  - `phone_number_id`: WhatsApp phone number ID

## Testing

### Test Scenarios

1. **Greeting Detection**
   - Send "Hola" → Should receive welcome message
   - Send "Buenos días" → Should receive welcome message
   - Send "¿Cómo hago un pedido?" → Should receive welcome message

2. **Order Creation**
   - Send "3 kilos de tomates" → Should create order and receive confirmation
   - Send "2k papas, 1 lechuga" → Should create order and receive confirmation

3. **Help Message**
   - Send "abc xyz 123" → Should receive help message
   - Send random text without products → Should receive help message

4. **Status Updates**
   - Change order status to "Preparando" → Customer receives status update
   - Change order status to "Listo" → Customer receives status update

5. **Product Addition**
   - Add product to existing order → Customer receives product added notification

## Benefits

1. **Improved Customer Experience**
   - Customers receive immediate feedback on their orders
   - Clear instructions when orders can't be processed
   - Friendly, emoji-rich messages that are easy to read

2. **Reduced Support Burden**
   - Automatic responses to common questions
   - Clear formatting instructions reduce parsing errors
   - Status updates keep customers informed

3. **Better Communication**
   - Customers know exactly what was ordered
   - Customers are notified of any changes
   - Professional, consistent messaging

4. **Personalization**
   - Uses customer's actual name from WhatsApp profile
   - Contextual messages based on order status
   - Specific product information in notifications

## Future Enhancements

Potential improvements for future versions:

1. **Rich Media Messages**
   - Send images of products
   - Send location for pickup
   - Send payment links

2. **Interactive Messages**
   - Quick reply buttons for status confirmation
   - List messages for product selection
   - Template messages for common scenarios

3. **Advanced Notifications**
   - Delivery time estimates
   - Payment reminders
   - Promotional messages

4. **Analytics**
   - Track message delivery rates
   - Monitor customer engagement
   - Measure response times

## Troubleshooting

### Common Issues

1. **Messages Not Sending**
   - Check WhatsApp config is active in database
   - Verify access token is valid
   - Ensure phone number ID is correct
   - Check Supabase Edge Function logs

2. **Customer Name Not Showing**
   - WhatsApp contact may not have profile name set
   - Falls back to phone number automatically
   - No action needed

3. **Notifications Not Triggering**
   - Ensure order source is 'whatsapp'
   - Check order has customer_phone field
   - Verify WhatsApp config is active

### Debug Steps

1. Check Edge Function logs:
   ```bash
   supabase functions logs whatsapp-webhook
   ```

2. Verify WhatsApp config:
   ```sql
   SELECT * FROM whatsapp_config WHERE is_active = true;
   ```

3. Check order details:
   ```sql
   SELECT * FROM orders WHERE source = 'whatsapp' ORDER BY created_at DESC LIMIT 10;
   ```

## Conclusion

These improvements significantly enhance the WhatsApp integration by providing automatic, contextual, and emoji-rich notifications to customers. The system now handles greetings, provides help when needed, and keeps customers informed throughout the order lifecycle.
