
import { getSupabase } from '@/lib/supabase';

export type ActionType = 'create' | 'update' | 'delete' | 'status_change' | 'payment';
export type EntityType = 'order' | 'customer' | 'product' | 'user' | 'payment';

interface LogActivityParams {
  actionType: ActionType;
  entityType: EntityType;
  entityId: string;
  entityName?: string;
  description: string;
  metadata?: any;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const supabase = getSupabase();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('[ActivityLogger] No user found, skipping activity log');
      return;
    }

    // Insert activity log
    const { error } = await supabase
      .from('activity_logs')
      .insert([
        {
          user_id: user.id,
          user_email: user.email || 'unknown',
          action_type: params.actionType,
          entity_type: params.entityType,
          entity_id: params.entityId,
          entity_name: params.entityName,
          description: params.description,
          metadata: params.metadata,
        },
      ]);

    if (error) {
      console.error('[ActivityLogger] Error logging activity:', error);
    } else {
      console.log('[ActivityLogger] Activity logged:', params.description);
    }
  } catch (error) {
    console.error('[ActivityLogger] Exception logging activity:', error);
  }
}

// Convenience functions for common activities
export async function logOrderCreated(orderId: string, orderNumber: string, customerName: string): Promise<void> {
  await logActivity({
    actionType: 'create',
    entityType: 'order',
    entityId: orderId,
    entityName: orderNumber,
    description: `Pedido creado para ${customerName}`,
    metadata: { customer_name: customerName },
  });
}

export async function logOrderUpdated(orderId: string, orderNumber: string, changes: string): Promise<void> {
  await logActivity({
    actionType: 'update',
    entityType: 'order',
    entityId: orderId,
    entityName: orderNumber,
    description: `Pedido actualizado: ${changes}`,
  });
}

export async function logOrderStatusChanged(
  orderId: string,
  orderNumber: string,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  await logActivity({
    actionType: 'status_change',
    entityType: 'order',
    entityId: orderId,
    entityName: orderNumber,
    description: `Estado cambiado de ${oldStatus} a ${newStatus}`,
    metadata: { old_status: oldStatus, new_status: newStatus },
  });
}

export async function logOrderDeleted(orderId: string, orderNumber: string): Promise<void> {
  await logActivity({
    actionType: 'delete',
    entityType: 'order',
    entityId: orderId,
    entityName: orderNumber,
    description: `Pedido eliminado`,
  });
}

export async function logCustomerCreated(customerId: string, customerName: string): Promise<void> {
  await logActivity({
    actionType: 'create',
    entityType: 'customer',
    entityId: customerId,
    entityName: customerName,
    description: `Cliente creado: ${customerName}`,
  });
}

export async function logCustomerUpdated(customerId: string, customerName: string, changes: string): Promise<void> {
  await logActivity({
    actionType: 'update',
    entityType: 'customer',
    entityId: customerId,
    entityName: customerName,
    description: `Cliente actualizado: ${changes}`,
  });
}

export async function logPaymentCreated(
  paymentId: string,
  customerName: string,
  amount: number
): Promise<void> {
  await logActivity({
    actionType: 'payment',
    entityType: 'payment',
    entityId: paymentId,
    entityName: customerName,
    description: `Pago registrado: $${amount.toFixed(0)} para ${customerName}`,
    metadata: { amount },
  });
}

export async function logProductCreated(productId: string, productName: string): Promise<void> {
  await logActivity({
    actionType: 'create',
    entityType: 'product',
    entityId: productId,
    entityName: productName,
    description: `Producto creado: ${productName}`,
  });
}

export async function logProductUpdated(productId: string, productName: string, changes: string): Promise<void> {
  await logActivity({
    actionType: 'update',
    entityType: 'product',
    entityId: productId,
    entityName: productName,
    description: `Producto actualizado: ${changes}`,
  });
}

export async function logProductDeleted(productId: string, productName: string): Promise<void> {
  await logActivity({
    actionType: 'delete',
    entityType: 'product',
    entityId: productId,
    entityName: productName,
    description: `Producto eliminado: ${productName}`,
  });
}
