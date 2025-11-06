
import { AdvancedReceiptConfig, ReceiptStyle } from '@/types';

export const RECEIPT_STYLES: Record<ReceiptStyle, AdvancedReceiptConfig> = {
  classic: {
    style: 'classic',
    header_text: 'PEDIDO',
    footer_text: 'Gracias por su compra!',
    header_alignment: 'center',
    footer_alignment: 'center',
    header_spacing: 1,
    footer_spacing: 2,
    item_spacing: 1,
    show_logo: true,
    logo_position: 'top',
    show_separator_lines: true,
    separator_char: '=',
    show_prices: true,
    show_item_totals: true,
    bold_headers: true,
    bold_totals: true,
    date_format: 'long',
    show_order_number: true,
    show_status: true,
    custom_fields: [],
  },
  modern: {
    style: 'modern',
    header_text: '• NUEVO PEDIDO •',
    footer_text: '¡Vuelve pronto!',
    header_alignment: 'center',
    footer_alignment: 'center',
    header_spacing: 2,
    footer_spacing: 3,
    item_spacing: 1,
    show_logo: true,
    logo_position: 'header',
    show_separator_lines: true,
    separator_char: '-',
    show_prices: true,
    show_item_totals: true,
    bold_headers: true,
    bold_totals: true,
    date_format: 'short',
    show_order_number: true,
    show_status: true,
    custom_fields: [],
  },
  minimal: {
    style: 'minimal',
    header_text: 'Pedido',
    footer_text: 'Gracias',
    header_alignment: 'left',
    footer_alignment: 'left',
    header_spacing: 0,
    footer_spacing: 1,
    item_spacing: 0,
    show_logo: false,
    logo_position: 'top',
    show_separator_lines: false,
    separator_char: '-',
    show_prices: true,
    show_item_totals: false,
    bold_headers: false,
    bold_totals: false,
    date_format: 'short',
    show_order_number: true,
    show_status: false,
    custom_fields: [],
  },
  detailed: {
    style: 'detailed',
    header_text: '═══ ORDEN DE PEDIDO ═══',
    footer_text: 'Gracias por confiar en nosotros\nEsperamos verte pronto',
    header_alignment: 'center',
    footer_alignment: 'center',
    header_spacing: 2,
    footer_spacing: 3,
    item_spacing: 2,
    show_logo: true,
    logo_position: 'top',
    show_separator_lines: true,
    separator_char: '═',
    show_prices: true,
    show_item_totals: true,
    bold_headers: true,
    bold_totals: true,
    date_format: 'long',
    show_order_number: true,
    show_status: true,
    custom_fields: [
      { label: 'Atencion', value: 'Servicio al Cliente' },
      { label: 'Contacto', value: '+56 9 1234 5678' },
    ],
  },
  compact: {
    style: 'compact',
    header_text: 'PEDIDO',
    footer_text: 'Gracias',
    header_alignment: 'center',
    footer_alignment: 'center',
    header_spacing: 0,
    footer_spacing: 1,
    item_spacing: 0,
    show_logo: false,
    logo_position: 'top',
    show_separator_lines: true,
    separator_char: '-',
    show_prices: true,
    show_item_totals: false,
    bold_headers: false,
    bold_totals: true,
    date_format: 'time',
    show_order_number: true,
    show_status: true,
    custom_fields: [],
  },
};

export function getStyleName(style: ReceiptStyle): string {
  switch (style) {
    case 'classic':
      return 'Clásico';
    case 'modern':
      return 'Moderno';
    case 'minimal':
      return 'Minimalista';
    case 'detailed':
      return 'Detallado';
    case 'compact':
      return 'Compacto';
    default:
      return 'Clásico';
  }
}

export function getStyleDescription(style: ReceiptStyle): string {
  switch (style) {
    case 'classic':
      return 'Estilo tradicional con encabezado centrado y separadores completos';
    case 'modern':
      return 'Diseño contemporáneo con espaciado amplio y elementos decorativos';
    case 'minimal':
      return 'Diseño limpio y simple sin elementos decorativos';
    case 'detailed':
      return 'Formato completo con información extendida y campos personalizados';
    case 'compact':
      return 'Formato reducido para ahorrar papel';
    default:
      return '';
  }
}
