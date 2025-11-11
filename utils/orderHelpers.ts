
import { OrderStatus, OrderItem } from '@/types';

export function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return '#F59E0B';
    case 'preparing':
      return '#3B82F6';
    case 'ready':
      return '#10B981';
    case 'delivered':
      return '#6B7280';
    case 'cancelled':
      return '#EF4444';
    case 'pending_payment':
      return '#8B5CF6';
    case 'abonado':
      return '#F59E0B';
    case 'pagado':
      return '#10B981';
    case 'finalizado':
      return '#059669';
    default:
      return '#6B7280';
  }
}

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

export function getStatusIcon(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'clock';
    case 'preparing':
      return 'flame';
    case 'ready':
      return 'checkmark.circle';
    case 'delivered':
      return 'shippingbox';
    case 'cancelled':
      return 'xmark.circle';
    case 'pending_payment':
      return 'creditcard';
    case 'abonado':
      return 'creditcard.fill';
    case 'pagado':
      return 'checkmark.circle.fill';
    case 'finalizado':
      return 'checkmark.seal.fill';
    default:
      return 'circle';
  }
}

export function getAvailableStatusTransitions(currentStatus: OrderStatus, userRole?: string): OrderStatus[] {
  // Developer profile can change to any status
  if (userRole === 'desarrollador') {
    return ['pending', 'preparing', 'ready', 'delivered', 'pending_payment', 'abonado', 'pagado', 'finalizado', 'cancelled'].filter(
      status => status !== currentStatus
    ) as OrderStatus[];
  }

  // Normal restrictions for other roles
  switch (currentStatus) {
    case 'pending':
      return ['preparing', 'cancelled'];
    case 'preparing':
      return ['ready', 'cancelled'];
    case 'ready':
      return ['delivered', 'pending_payment', 'cancelled'];
    case 'delivered':
      return [];
    case 'pending_payment':
      return [];
    case 'abonado':
      return [];
    case 'pagado':
      return [];
    case 'finalizado':
      return [];
    case 'cancelled':
      return [];
    default:
      return [];
  }
}

export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);
}

export function getUnitFromNotes(notes: string | null | undefined): string {
  if (!notes) return '';
  const lowerNotes = notes.toLowerCase();
  
  const unitMatch = lowerNotes.match(/unidad:\s*(\w+)/);
  if (unitMatch) {
    return unitMatch[1];
  }
  
  if (lowerNotes.includes('kg') || lowerNotes.includes('kilo')) return 'kg';
  if (lowerNotes.includes('gr') || lowerNotes.includes('gramo')) return 'gr';
  if (lowerNotes.includes('lt') || lowerNotes.includes('litro')) return 'lt';
  if (lowerNotes.includes('ml')) return 'ml';
  if (lowerNotes.includes('un') || lowerNotes.includes('unidad')) return 'un';
  return '';
}

export function formatProductDisplay(item: OrderItem): string {
  const unit = getUnitFromNotes(item.notes);
  
  if (item.quantity === '#') {
    return `# ${item.product_name} ⚠️`;
  }
  
  const quantityNum = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;
  
  let unitText = '';
  if (unit === 'kg' || unit === 'kilo' || unit === 'kilos') {
    unitText = quantityNum === 1 ? 'kilo' : 'kilos';
  } else if (unit === 'gr' || unit === 'gramo' || unit === 'gramos') {
    unitText = quantityNum === 1 ? 'gramo' : 'gramos';
  } else if (unit === 'lt' || unit === 'litro' || unit === 'litros') {
    unitText = quantityNum === 1 ? 'litro' : 'litros';
  } else if (unit === 'ml') {
    unitText = 'ml';
  } else if (unit === 'un' || unit === 'unidad' || unit === 'unidades') {
    unitText = quantityNum === 1 ? 'unidad' : 'unidades';
  } else if (unit) {
    if (quantityNum === 1) {
      unitText = unit;
    } else {
      unitText = unit.endsWith('s') ? unit : unit + 's';
    }
  } else {
    unitText = quantityNum === 1 ? 'unidad' : 'unidades';
  }
  
  return `${item.quantity} ${unitText} de ${item.product_name}`;
}

export function getAdditionalNotes(notes: string | null | undefined): string {
  if (!notes) return '';
  
  const cleanNotes = notes.replace(/unidad:\s*\w+/gi, '').trim();
  
  return cleanNotes;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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
