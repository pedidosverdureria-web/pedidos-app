
# Sistema de Clientes y Pagos Parcelados - Implementación Completa

## Resumen de Cambios

Se ha implementado un sistema completo de gestión de clientes con pagos parcelados para pedidos con estado "Pendiente de pago".

## 1. Nuevo Estado de Pedido: "Pendiente de Pago"

### Base de Datos
- Se actualizó la restricción de la tabla `orders` para incluir el nuevo estado `pending_payment`
- El estado está disponible después del estado "Entregado"

### Interfaz de Usuario
- **Color**: Púrpura (#8B5CF6)
- **Icono**: creditcard
- **Etiqueta**: "Pendiente de Pago" / "Pend. Pago" (versión corta)

### Transiciones de Estado
- **Entregado** → **Pendiente de Pago** (nueva transición)
- **Pendiente de Pago** → Sin transiciones (estado final)

## 2. Nueva Tabla "Clientes"

### Estructura de Base de Datos

#### Tabla `customers`
```sql
- id: uuid (PK)
- name: text (NOT NULL)
- phone: text
- address: text
- total_debt: numeric (DEFAULT 0)
- total_paid: numeric (DEFAULT 0)
- created_at: timestamptz
- updated_at: timestamptz
```

#### Tabla `customer_payments`
```sql
- id: uuid (PK)
- customer_id: uuid (FK → customers.id)
- amount: numeric (NOT NULL, CHECK > 0)
- payment_date: timestamptz (DEFAULT now())
- notes: text
- created_by: uuid (FK → auth.users.id)
- created_at: timestamptz
```

### Relaciones
- Se agregó columna `customer_id` a la tabla `orders`
- Relación: `orders.customer_id` → `customers.id`

### Triggers Automáticos
Se crearon triggers que actualizan automáticamente:
- `total_debt`: Suma de `total_amount` de todos los pedidos con estado `pending_payment`
- `total_paid`: Suma de todos los pagos registrados en `customer_payments`

## 3. Nuevo Menú "Clientes"

### Ubicación
- Nueva pestaña en el tab bar principal
- Icono: person.2.fill
- Etiqueta: "Clientes"

### Funcionalidades

#### Vista Principal
- Lista de todos los clientes con pedidos pendientes de pago
- Búsqueda por nombre o teléfono
- Tarjetas con información resumida:
  - Nombre del cliente
  - Teléfono y dirección
  - Número de pedidos pendientes
  - Deuda total
  - Total pagado
  - Saldo pendiente
  - Badge visual: "Con Deuda" (rojo) o "Al Día" (verde)

#### Vista de Detalle del Cliente
Al tocar una tarjeta de cliente se abre un modal con:

1. **Información del Cliente**
   - Nombre
   - Deuda pendiente actual

2. **Pedidos Pendientes**
   - Lista de todos los pedidos con estado `pending_payment`
   - Número de pedido
   - Monto total
   - Fecha de creación
   - Toque para ver detalle del pedido

3. **Historial de Pagos**
   - Lista de todos los pagos realizados
   - Monto del pago
   - Fecha del pago
   - Notas (opcional)
   - Ordenados por fecha (más reciente primero)

4. **Botón "Registrar Pago"**
   - Solo visible si hay deuda pendiente
   - Abre modal para registrar nuevo pago

## 4. Sistema de Pagos Parcelados

### Registro de Pagos
Modal con campos:
- **Monto**: Campo numérico obligatorio
- **Notas**: Campo de texto opcional (multilinea)

### Validaciones
- El monto debe ser mayor a 0
- El monto no puede exceder la deuda pendiente
- Muestra advertencia si el monto es mayor a la deuda

### Proceso de Pago
1. Usuario ingresa monto y notas opcionales
2. Sistema valida el monto
3. Se registra el pago en `customer_payments`
4. Los triggers actualizan automáticamente `total_paid` del cliente
5. Se recalcula el saldo pendiente
6. Se muestra confirmación al usuario
7. Se actualiza la vista del cliente

## 5. Creación Automática de Clientes

### Flujo
Cuando un pedido cambia a estado "Pendiente de Pago":

1. **Verificación**: Sistema busca cliente existente por teléfono
2. **Creación**: Si no existe, crea nuevo cliente con:
   - Nombre del pedido
   - Teléfono del pedido
   - Dirección del pedido
3. **Vinculación**: Asocia el pedido al cliente (campo `customer_id`)
4. **Notificación**: Muestra mensaje confirmando creación/vinculación

### Mensaje de Confirmación
```
✅ Estado Actualizado

El pedido ahora está en estado: Pendiente de Pago

El cliente ha sido [creado/vinculado] y puede realizar 
pagos parciales desde el menú de Clientes.
```

## 6. Integración con WhatsApp

### Mensaje de Estado
Cuando un pedido cambia a "Pendiente de Pago", se envía:

```
💳 Actualización de Pedido

Hola [Nombre], tu pedido ha sido actualizado.

📋 Número de pedido: [Número]
🔄 Nuevo estado: Pendiente de Pago

📦 Productos:
[Lista de productos]

💰 Tu pedido ha sido entregado y está pendiente de pago. 
Puedes realizar pagos parciales cuando lo desees.

💵 Total a pagar: $[Monto]

¡Gracias por tu preferencia! 😊
```

## 7. Políticas de Seguridad (RLS)

Todas las tablas nuevas tienen RLS habilitado con políticas que permiten:
- SELECT, INSERT, UPDATE, DELETE para usuarios autenticados
- Protección de datos a nivel de base de datos

## 8. Índices de Base de Datos

Se crearon índices para optimizar consultas:
- `idx_customers_phone` en `customers(phone)`
- `idx_customers_name` en `customers(name)`
- `idx_customer_payments_customer_id` en `customer_payments(customer_id)`
- `idx_orders_customer_id` en `orders(customer_id)`

## 9. Tipos TypeScript

### Nuevos Tipos
```typescript
export type OrderStatus = 
  'pending' | 'preparing' | 'ready' | 
  'delivered' | 'cancelled' | 'pending_payment';

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
```

### Actualización de Order
```typescript
export interface Order {
  // ... campos existentes
  customer_id?: string; // Nueva relación
}
```

## 10. Archivos Modificados

### Nuevos Archivos
- `app/(tabs)/customers.tsx` - Pantalla principal de clientes

### Archivos Modificados
- `types/index.ts` - Nuevos tipos y actualización de OrderStatus
- `app/(tabs)/_layout.tsx` - Agregado tab de Clientes
- `app/order/[orderId].tsx` - Lógica de creación de clientes
- `app/(tabs)/(home)/index.tsx` - Filtro de nuevo estado
- `utils/whatsappNotifications.ts` - Mensaje para nuevo estado
- `utils/receiptGenerator.ts` - Etiqueta para nuevo estado
- `utils/backgroundAutoPrintTask.ts` - Etiqueta para nuevo estado

### Migraciones de Base de Datos
- `add_pending_payment_status_and_customers` - Migración completa

## 11. Características Destacadas

### UX/UI
- ✅ Diseño consistente con el resto de la app
- ✅ Colores distintivos para estados de deuda
- ✅ Navegación fluida entre clientes y pedidos
- ✅ Feedback visual inmediato en todas las acciones
- ✅ Validaciones en tiempo real

### Funcionalidad
- ✅ Creación automática de clientes
- ✅ Detección de clientes duplicados por teléfono
- ✅ Actualización automática de totales
- ✅ Historial completo de pagos
- ✅ Integración con sistema de pedidos existente
- ✅ Notificaciones por WhatsApp

### Rendimiento
- ✅ Índices de base de datos optimizados
- ✅ Triggers eficientes para cálculos automáticos
- ✅ Consultas optimizadas con relaciones
- ✅ Pull-to-refresh para actualizar datos

### Seguridad
- ✅ RLS habilitado en todas las tablas
- ✅ Validación de montos en cliente y servidor
- ✅ Restricciones de base de datos (CHECK constraints)
- ✅ Autenticación requerida para todas las operaciones

## 12. Flujo de Uso Completo

### Escenario: Cliente con Pedido Pendiente de Pago

1. **Entrega del Pedido**
   - Trabajador marca pedido como "Entregado"
   - Aparece botón "Pendiente de Pago"

2. **Cambio a Pendiente de Pago**
   - Trabajador toca "Pendiente de Pago"
   - Sistema crea/vincula cliente automáticamente
   - Cliente recibe notificación por WhatsApp
   - Pedido aparece en menú "Clientes"

3. **Gestión de Pagos**
   - Trabajador va al menú "Clientes"
   - Busca y selecciona al cliente
   - Ve lista de pedidos pendientes
   - Toca "Registrar Pago"
   - Ingresa monto y notas
   - Sistema valida y registra el pago
   - Totales se actualizan automáticamente

4. **Seguimiento**
   - Cliente puede hacer múltiples pagos parciales
   - Historial completo de pagos visible
   - Saldo pendiente siempre actualizado
   - Badge visual indica estado de deuda

## 13. Consideraciones Futuras

### Posibles Mejoras
- Reportes de cobranza
- Recordatorios automáticos de pago
- Exportación de historial de pagos
- Gráficos de deuda por cliente
- Filtros avanzados en lista de clientes
- Búsqueda por rango de deuda
- Integración con sistemas de pago online

### Mantenimiento
- Los triggers mantienen los totales sincronizados automáticamente
- La limpieza de datos antiguos puede implementarse con jobs programados
- Los índices mejoran el rendimiento a medida que crece la base de datos

## 14. Testing Recomendado

### Casos de Prueba
1. ✅ Crear cliente nuevo al cambiar estado
2. ✅ Vincular cliente existente por teléfono
3. ✅ Registrar pago parcial
4. ✅ Registrar múltiples pagos
5. ✅ Validar monto mayor a deuda
6. ✅ Validar monto negativo o cero
7. ✅ Ver historial de pagos
8. ✅ Navegar de cliente a pedido
9. ✅ Actualización automática de totales
10. ✅ Notificación por WhatsApp

## Conclusión

El sistema de clientes y pagos parcelados está completamente implementado y funcional. Permite una gestión eficiente de cuentas por cobrar con una interfaz intuitiva y procesos automatizados que reducen errores y mejoran la experiencia del usuario.
