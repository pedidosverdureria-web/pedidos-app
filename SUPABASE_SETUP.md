
# Supabase Database Setup Guide

This guide will help you set up the required database tables and functions for the Order Management App.

## Prerequisites

- A Supabase project (create one at https://supabase.com)
- Access to the SQL Editor in your Supabase dashboard

## Database Schema

### 1. Users Table (extends auth.users)

```sql
-- Create users profile table
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'worker' CHECK (role IN ('admin', 'worker')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update users" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'worker'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 2. Orders Table

```sql
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
  pending DECIMAL(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('whatsapp', 'manual')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view orders" ON public.orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert orders" ON public.orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update orders" ON public.orders
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete orders" ON public.orders
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_customer_phone ON public.orders(customer_phone);
```

### 3. Order Items Table

```sql
CREATE TABLE public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view order items" ON public.order_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert order items" ON public.order_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update order items" ON public.order_items
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete order items" ON public.order_items
  FOR DELETE USING (auth.role() = 'authenticated');

-- Index
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
```

### 4. WhatsApp Configuration Table

```sql
CREATE TABLE public.whatsapp_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  verify_token TEXT NOT NULL,
  access_token TEXT NOT NULL,
  phone_number_id TEXT NOT NULL,
  webhook_url TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;

-- Policies (Admin only)
CREATE POLICY "Admins can manage whatsapp config" ON public.whatsapp_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 5. Printer Configuration Table

```sql
CREATE TABLE public.printer_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  auto_print BOOLEAN DEFAULT false,
  header_font_size INTEGER DEFAULT 2,
  separator_lines INTEGER DEFAULT 1,
  include_logo BOOLEAN DEFAULT true,
  include_customer_info BOOLEAN DEFAULT true,
  include_totals BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.printer_config ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their printer config" ON public.printer_config
  FOR ALL USING (auth.uid() = user_id);
```

### 6. Notifications Table

```sql
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('order_new', 'order_status', 'system')),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
```

## Database Functions

### Auto-update timestamp

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_config_updated_at BEFORE UPDATE ON public.whatsapp_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_printer_config_updated_at BEFORE UPDATE ON public.printer_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Create notification on new order

```sql
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for all active users
  INSERT INTO public.notifications (user_id, title, message, type, order_id)
  SELECT 
    id,
    'New Order',
    'Order #' || NEW.order_number || ' from ' || NEW.customer_name,
    'order_new',
    NEW.id
  FROM public.users
  WHERE active = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_order_created
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION notify_new_order();
```

## Setup Instructions

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Click on "SQL Editor" in the left sidebar

2. **Run the SQL Scripts**
   - Copy and paste each section above into the SQL Editor
   - Run them in order (Users → Orders → Order Items → etc.)

3. **Verify Tables**
   - Go to "Table Editor" to see all created tables
   - Check that RLS is enabled for all tables

4. **Create First Admin User**
   ```sql
   -- After signing up through the app, promote your user to admin
   UPDATE public.users 
   SET role = 'admin' 
   WHERE email = 'your-email@example.com';
   ```

5. **Configure Authentication**
   - Go to Authentication → Settings
   - Enable email confirmation if desired
   - Set up email templates

## WhatsApp Integration (Optional)

To enable WhatsApp integration, you'll need to:

1. Create a Meta (Facebook) Developer account
2. Set up WhatsApp Business API
3. Create a webhook using Supabase Edge Functions
4. Configure the webhook URL in the app settings

## Testing

After setup, test the following:

- ✅ User registration and login
- ✅ Creating manual orders
- ✅ Viewing order list
- ✅ Updating order status
- ✅ Notifications appear for new orders
- ✅ Profile and settings access

## Troubleshooting

**Issue: Can't create orders**
- Check RLS policies are correctly set
- Verify user is authenticated
- Check browser console for errors

**Issue: Notifications not appearing**
- Verify trigger is created
- Check notifications table has entries
- Ensure user is active

**Issue: Can't access admin features**
- Verify user role is set to 'admin'
- Check RLS policies for admin access

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- Review RLS policies in Table Editor
- Check logs in Supabase Dashboard

---

**Note:** This is a production-ready schema with proper security (RLS) enabled. Always test in a development environment first!
