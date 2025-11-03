
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled' | 'pending_payment';

export type UserRole = 'admin' | 'worker';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'order';

export type QueryDirection = 'incoming' | 'outgoing';

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  is_active: boolean;
  push_token?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number | string; // Can be a number or "#" for unparseable items
  unit_price: number;
  total_price: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderQuery {
  id: string;
  order_id: string;
  customer_phone: string;
  query_text: string;
  direction: QueryDirection; // 'incoming' (from customer) or 'outgoing' (from business)
  whatsapp_message_id?: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  status: OrderStatus;
  total_amount: number;
  paid_amount: number;
  notes?: string;
  source: 'whatsapp' | 'manual';
  whatsapp_message_id?: string;
  is_read: boolean;
  created_by?: string;
  customer_id?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  queries?: OrderQuery[];
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  total_debt: number;
  total_paid: number;
  created_at: string;
  updated_at: string;
  orders?: Order[];
  payments?: CustomerPayment[];
}

export interface CustomerPayment {
  id: string;
  customer_id: string;
  amount: number;
  payment_date: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface WhatsAppConfig {
  id: string;
  verify_token?: string;
  access_token?: string;
  phone_number_id?: string;
  webhook_url?: string;
  is_active: boolean;
  auto_reply_enabled: boolean;
  auto_reply_message: string;
  created_at: string;
  updated_at: string;
}

export interface PrinterConfig {
  id: string;
  user_id: string;
  printer_name?: string;
  printer_address?: string;
  is_default: boolean;
  auto_print_enabled: boolean;
  header_font_size: number;
  separator_lines: number;
  include_logo: boolean;
  include_customer_info: boolean;
  include_totals: boolean;
  paper_size?: '58mm' | '80mm';
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  type: NotificationType;
  related_order_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// Helper type for creating new orders
export interface CreateOrderInput {
  customer_name: string;
  customer_phone?: string;
  customer_address?: string;
  notes?: string;
  items: {
    product_name: string;
    quantity: number | string; // Can be a number or "#" for unparseable items
    unit_price: number;
    notes?: string;
  }[];
}

// Helper type for updating orders
export interface UpdateOrderInput {
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  status?: OrderStatus;
  paid_amount?: number;
  notes?: string;
}
