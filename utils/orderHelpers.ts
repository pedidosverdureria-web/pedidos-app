
import { OrderStatus, OrderPriority } from '@/types';

// Get color for order status
export function getStatusColor(status: OrderStatus, theme: any): string {
  const colors = theme.colors;
  
  switch (status) {
    case 'pending':
      return '#F59E0B'; // Yellow
    case 'preparing':
      return '#3B82F6'; // Blue
    case 'ready':
      return '#10B981'; // Green
    case 'delivered':
      return '#6B7280'; // Gray
    case 'cancelled':
      return '#EF4444'; // Red
    case 'pending_payment':
      return '#F59E0B'; // Yellow
    case 'abonado':
      return '#8B5CF6'; // Purple
    case 'pagado':
      return '#10B981'; // Green
    case 'finalizado':
      return '#6B7280'; // Gray
    default:
      return colors.textSecondary;
  }
}

// Get label for order status
export function getStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'preparing':
      return 'Preparando';
    case 'ready':
      return 'Listo';
    case 'delivered':
      return 'Entregado';
    case 'cancelled':
      return 'Cancelado';
    case 'pending_payment':
      return 'Pendiente de Pago';
    case 'abonado':
      return 'Abonado';
    case 'pagado':
      return 'Pagado';
    case 'finalizado':
      return 'Finalizado';
    default:
      return status;
  }
}

// Get color for order priority
export function getPriorityColor(priority: OrderPriority): string {
  switch (priority) {
    case 'high':
      return '#EF4444'; // Red
    case 'normal':
      return '#6B7280'; // Gray
    case 'low':
      return '#3B82F6'; // Blue
    default:
      return '#6B7280';
  }
}

// Get label for order priority
export function getPriorityLabel(priority: OrderPriority): string {
  switch (priority) {
    case 'high':
      return 'Alta';
    case 'normal':
      return 'Normal';
    case 'low':
      return 'Baja';
    default:
      return priority;
  }
}

// Get icon for order priority
export function getPriorityIcon(priority: OrderPriority): { ios: string; android: string } {
  switch (priority) {
    case 'high':
      return { ios: 'exclamationmark.3', android: 'priority_high' };
    case 'normal':
      return { ios: 'equal.circle', android: 'remove' };
    case 'low':
      return { ios: 'arrow.down.circle', android: 'arrow_downward' };
    default:
      return { ios: 'equal.circle', android: 'remove' };
  }
}

// Get available status transitions based on current status and user role
export function getAvailableStatusTransitions(
  currentStatus: OrderStatus,
  userRole?: string
): OrderStatus[] {
  // Developers can transition to any status
  if (userRole === 'desarrollador') {
    return [
      'pending',
      'preparing',
      'ready',
      'delivered',
      'cancelled',
      'pending_payment',
      'abonado',
      'pagado',
      'finalizado',
    ];
  }

  // Normal workflow transitions
  switch (currentStatus) {
    case 'pending':
      return ['preparing', 'cancelled', 'pending_payment'];
    case 'preparing':
      return ['ready', 'pending', 'cancelled'];
    case 'ready':
      return ['delivered', 'preparing', 'pending_payment'];
    case 'delivered':
      return ['pending_payment', 'pagado', 'finalizado'];
    case 'cancelled':
      return ['pending'];
    case 'pending_payment':
      return ['abonado', 'pagado', 'cancelled'];
    case 'abonado':
      return ['pagado', 'pending_payment'];
    case 'pagado':
      return ['finalizado', 'abonado'];
    case 'finalizado':
      return [];
    default:
      return [];
  }
}

// Format currency as Chilean Pesos
export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);
}

// Format product display with quantity and unit
export function formatProductDisplay(item: any): string {
  const unit = item.notes?.match(/unidad:\s*(\w+)/)?.[1] || '';
  
  if (item.quantity === '#') {
    return `# ${item.product_name}`;
  }
  
  if (unit) {
    return `${item.quantity} ${unit} de ${item.product_name}`;
  }
  
  return `${item.quantity} ${item.product_name}`;
}

// Get additional notes (excluding unit information)
export function getAdditionalNotes(notes?: string): string {
  if (!notes) return '';
  
  // Remove "unidad: xxx" from notes
  const cleanedNotes = notes.replace(/unidad:\s*\w+\s*/i, '').trim();
  return cleanedNotes;
}

// Format date
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format short date
export function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins}m`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
  });
}
