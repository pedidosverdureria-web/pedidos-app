
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export type UserRole = 'admin' | 'worker';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  phone?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  price: number;
  notes?: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  status: OrderStatus;
  total: number;
  paid: number;
  pending: number;
  notes?: string;
  source: 'whatsapp' | 'manual';
  is_read: boolean;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface WhatsAppConfig {
  id: string;
  verify_token: string;
  access_token: string;
  phone_number_id: string;
  webhook_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PrinterConfig {
  id: string;
  device_id: string;
  device_name: string;
  is_default: boolean;
  auto_print: boolean;
  header_font_size: number;
  separator_lines: number;
  include_logo: boolean;
  include_customer_info: boolean;
  include_totals: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'order_new' | 'order_status' | 'system';
  order_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}
