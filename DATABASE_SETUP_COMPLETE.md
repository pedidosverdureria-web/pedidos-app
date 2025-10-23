
# ✅ Database Setup Complete

## Overview
Your Supabase database has been successfully configured for the order management application with WhatsApp integration. All tables, RLS policies, triggers, and Edge Functions are now in place.

## 📊 Database Tables Created

### 1. **profiles**
Stores user information and roles (Admin/Worker).

**Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users) - Links to Supabase Auth
- `email` (text)
- `full_name` (text, optional)
- `role` (text) - 'admin' or 'worker'
- `is_active` (boolean) - User account status
- `created_at`, `updated_at` (timestamps)

**Features:**
- Automatic profile creation on user signup via trigger
- Role-based access control
- Users can view/update their own profile
- Admins can view/update all profiles

### 2. **orders**
Main orders table with customer information.

**Columns:**
- `id` (uuid, primary key)
- `order_number` (text, unique) - Auto-generated (YYYYMMDD-####)
- `customer_name` (text)
- `customer_phone` (text, optional)
- `customer_address` (text, optional)
- `status` (text) - pending, preparing, ready, delivered, cancelled
- `total_amount` (decimal) - Auto-calculated from items
- `paid_amount` (decimal)
- `notes` (text, optional)
- `source` (text) - 'manual' or 'whatsapp'
- `whatsapp_message_id` (text, optional)
- `is_read` (boolean) - For notification tracking
- `created_by` (uuid, references auth.users)
- `created_at`, `updated_at` (timestamps)

**Features:**
- Auto-generated order numbers with date prefix
- Automatic total calculation from order items
- Real-time updates via Supabase Realtime
- Authenticated users can view/create/update orders
- Only admins can delete orders

### 3. **order_items**
Individual items within orders.

**Columns:**
- `id` (uuid, primary key)
- `order_id` (uuid, references orders)
- `product_name` (text)
- `quantity` (integer)
- `unit_price` (decimal)
- `total_price` (decimal) - Auto-calculated (quantity × unit_price)
- `notes` (text, optional)
- `created_at`, `updated_at` (timestamps)

**Features:**
- Automatic total_price calculation
- Cascading delete when order is deleted
- Triggers to update order total when items change

### 4. **whatsapp_config**
WhatsApp Business API configuration (Admin only).

**Columns:**
- `id` (uuid, primary key)
- `verify_token` (text) - For webhook verification
- `access_token` (text) - WhatsApp API access token
- `phone_number_id` (text) - WhatsApp phone number ID
- `webhook_url` (text) - Webhook endpoint URL
- `is_active` (boolean) - Enable/disable integration
- `auto_reply_enabled` (boolean) - Send automatic replies
- `auto_reply_message` (text) - Customizable reply message
- `created_at`, `updated_at` (timestamps)

**Features:**
- Only admins can view/modify configuration
- Secure storage of API credentials

### 5. **printer_config**
Bluetooth printer settings per user.

**Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users)
- `printer_name` (text, optional)
- `printer_address` (text, optional)
- `is_default` (boolean) - Only one default per user
- `auto_print_enabled` (boolean) - Auto-print new orders
- `header_font_size` (integer, 1-4)
- `separator_lines` (integer, 0-5)
- `include_logo` (boolean)
- `include_customer_info` (boolean)
- `include_totals` (boolean)
- `created_at`, `updated_at` (timestamps)

**Features:**
- User-specific printer configurations
- Automatic enforcement of single default printer
- Customizable receipt formatting

### 6. **notifications**
In-app notifications for orders and system events.

**Columns:**
- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users, optional) - null for broadcast
- `title` (text)
- `message` (text)
- `type` (text) - info, success, warning, error, order
- `related_order_id` (uuid, references orders, optional)
- `is_read` (boolean)
- `created_at` (timestamp)

**Features:**
- Automatic notifications for new orders
- Automatic notifications for order status changes
- Broadcast notifications (user_id = null)
- Users can view/update/delete their own notifications

## 🔒 Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

- **profiles**: Users can view/update their own profile; Admins can view/update all
- **orders**: Authenticated users can view/create/update; Only admins can delete
- **order_items**: Authenticated users have full access
- **whatsapp_config**: Only admins have access
- **printer_config**: Users can only access their own configurations
- **notifications**: Users can view their own or broadcast notifications

## ⚡ Database Triggers & Functions

### Automatic Profile Creation
When a user signs up via Supabase Auth, a profile is automatically created with their email and role.

### Order Number Generation
Orders automatically receive a unique number in format: `YYYYMMDD-####`
Example: `20250122-0001`

### Order Total Calculation
When order items are added, updated, or deleted, the order's `total_amount` is automatically recalculated.

### Notification Creation
- New orders automatically create notifications for all users
- Order status changes automatically create notifications

### Updated Timestamps
All tables with `updated_at` columns automatically update the timestamp on modifications.

## 🌐 WhatsApp Webhook Edge Function

**Endpoint:** `https://lgiqpypnhnkylzyhhtze.supabase.co/functions/v1/whatsapp-webhook`

**Features:**
- Webhook verification (GET request)
- Incoming message processing (POST request)
- Intelligent order parsing from WhatsApp messages
- Automatic order creation in database
- Auto-reply functionality
- Support for multiple message formats

**Message Parsing Patterns:**
- `2 Pizza Margherita $10`
- `1x Hamburguesa $8`
- `Coca Cola x3 $2`

If no pattern matches, creates a generic order with the full message as notes.

## 🔑 Next Steps

### 1. Configure WhatsApp Integration (Admin Only)
Navigate to Settings → WhatsApp Configuration and enter:
- Verify Token (for webhook verification)
- Access Token (from Meta Business)
- Phone Number ID (from WhatsApp Business API)
- Webhook URL: `https://lgiqpypnhnkylzyhhtze.supabase.co/functions/v1/whatsapp-webhook`

### 2. Set Up Webhook in Meta Business
1. Go to Meta for Developers
2. Configure webhook with the URL above
3. Use your verify token for verification
4. Subscribe to `messages` events

### 3. Create Your First Admin User
Register through the app - the first user should be set as admin manually in the database:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### 4. Test the System
1. Create a manual order to test the database
2. Send a WhatsApp message to test the webhook
3. Configure printer settings
4. Test printing functionality

## 📱 App Features Now Available

✅ User authentication with roles (Admin/Worker)
✅ Create manual orders
✅ Receive orders from WhatsApp automatically
✅ View and filter orders by status
✅ Update order status
✅ Real-time order updates
✅ In-app notifications
✅ Bluetooth printer configuration
✅ Print receipts
✅ Send WhatsApp messages to customers
✅ Search orders
✅ Delete orders (Admin only)

## 🔍 Useful SQL Queries

### View all orders with items:
```sql
SELECT o.*, 
       json_agg(oi.*) as items
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id
ORDER BY o.created_at DESC;
```

### Check RLS policies:
```sql
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

### View unread notifications:
```sql
SELECT * FROM notifications 
WHERE is_read = false 
ORDER BY created_at DESC;
```

### Get order statistics:
```sql
SELECT 
  status,
  COUNT(*) as count,
  SUM(total_amount) as total_revenue
FROM orders
GROUP BY status;
```

## 🎉 Success!

Your database is fully configured and ready to use. The app can now:
- Manage orders from multiple sources
- Handle user authentication and roles
- Process WhatsApp messages automatically
- Send notifications
- Print receipts
- And much more!

For any issues or questions, check the Supabase logs or the app console for debugging information.
