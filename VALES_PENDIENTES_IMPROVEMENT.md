
# Mejora al Sistema de Vales Pendientes

## Resumen de Cambios

Se ha implementado una mejora significativa al sistema de vales pendientes para proporcionar un mejor control financiero y evitar montos negativos.

## Nuevos Estados de Pedido

### 1. **pending_payment** (Pendiente de Pago)
- Estado inicial cuando un pedido entra al sistema de vales pendientes
- El pedido aparece en la vista "Vales Pendientes"
- El cliente es creado/vinculado automáticamente

### 2. **abonado** (Abonado)
- Estado cuando un pedido tiene pagos parciales
- Se activa automáticamente cuando se registra un pago que no cubre el total
- El pedido permanece en "Vales Pendientes"
- Color: Naranja (#F59E0B)

### 3. **pagado** (Pagado)
- Estado cuando un pedido está completamente pagado
- Se activa automáticamente cuando los pagos cubren el total del pedido
- El pedido permanece en "Vales Pendientes" hasta que se presione "Finalizar"
- Cuando todos los pedidos de un cliente están en estado "pagado", aparece el badge "Al Día" en verde
- Color: Verde (#10B981)

### 4. **finalizado** (Finalizado)
- Estado final del pedido
- Se activa manualmente al presionar el botón "Finalizar" en "Vales Pendientes"
- Solo disponible cuando el cliente está "Al Día" (deuda total = pagos totales)
- El cliente es removido de la lista de "Vales Pendientes"
- Los pedidos finalizados aparecen en "Pedidos Completados" del perfil
- Color: Verde Oscuro (#059669)

## Flujo de Trabajo

```
pending_payment → [Pago Parcial] → abonado → [Pago Completo] → pagado → [Botón Finalizar] → finalizado
                                                                    ↓
                                                            Badge "Al Día" visible
```

## Cambios en la Base de Datos

### Migración Aplicada
- **Nombre**: `add_abonado_and_finalizado_statuses_v3`
- **Cambios**:
  - Actualización del constraint `orders_status_check` para incluir los nuevos estados
  - Migración automática de pedidos con estado `paid` a `pagado`
  - Actualización de triggers para manejar los nuevos estados

### Triggers Actualizados

#### 1. `check_and_update_order_payment_status()`
- Actualiza automáticamente el estado del pedido basado en los pagos:
  - Si `paid_amount >= total_amount`: cambia a `pagado`
  - Si `paid_amount > 0 AND paid_amount < total_amount`: cambia a `abonado`
  - Solo actualiza pedidos en estado `pending_payment` o `abonado`

#### 2. `update_customer_totals()`
- Calcula `total_debt` sumando pedidos en estados: `pending_payment`, `abonado`, `pagado`
- Los pedidos en estado `finalizado` NO se incluyen en el cálculo de deuda
- Calcula `total_paid` sumando solo `order_payments` (evita doble conteo)

## Cambios en la Interfaz

### Vista "Vales Pendientes"

#### Tarjetas de Cliente
- **Badge "Al Día"**: Aparece cuando `total_debt - total_paid === 0`
- **Badge de Estado**: Muestra "Con Deuda" o "Al Día" según el balance

#### Modal de Detalle de Cliente
- **Pedidos Pendientes**: Muestra pedidos en estados `pending_payment`, `abonado`, `pagado`
- **Indicadores de Estado**: Cada pedido muestra su estado con color distintivo
- **Botón "Finalizar"**: Solo visible cuando el cliente está "Al Día"
- **Botón "Registrar Pago"**: Oculto para pedidos en estado `pagado`

#### Registro de Pagos
- **Pago a Pedido**: Actualiza automáticamente el estado del pedido
- **Abono a Cuenta**: Distribuye el pago entre pedidos pendientes
- **Validación**: Previene pagos mayores al monto pendiente

### Vista "Detalle de Pedido"

#### Información de Pago
- Visible para pedidos en estados: `abonado`, `pagado`, `finalizado`
- Muestra tipo de pago: "Pago Total" o "Pagos Parciales"
- Lista todos los pagos con fecha y notas

#### Transiciones de Estado
- Los estados `pending_payment`, `abonado`, `pagado` no permiten cambios manuales
- Solo el perfil "desarrollador" puede cambiar manualmente estos estados
- Los cambios de estado se realizan automáticamente mediante pagos

## Beneficios de la Mejora

### 1. **Control Financiero Mejorado**
- Distinción clara entre pedidos sin pago, con pago parcial y pagados completamente
- Eliminación de montos negativos
- Mejor seguimiento del flujo de pagos

### 2. **Flujo de Trabajo Claro**
- Estados bien definidos para cada etapa del proceso de pago
- Transiciones automáticas basadas en pagos reales
- Finalización explícita mediante botón

### 3. **Visibilidad Mejorada**
- Badge "Al Día" para identificar rápidamente clientes sin deuda
- Colores distintivos para cada estado
- Información detallada de pagos en cada pedido

### 4. **Prevención de Errores**
- Validación de montos de pago
- Prevención de pagos excesivos
- Cálculo automático de estados

## Compatibilidad

### Datos Existentes
- Los pedidos con estado `paid` se migraron automáticamente a `pagado`
- Los clientes existentes mantienen su información de deuda y pagos
- No se requiere intervención manual

### Funcionalidad Existente
- Todas las funciones previas se mantienen
- Los triggers de base de datos se actualizaron para manejar los nuevos estados
- La impresión de recibos funciona con todos los estados

## Notas Técnicas

### Archivos Modificados
1. `types/index.ts` - Actualización de tipo `OrderStatus`
2. `app/(tabs)/pending-payments.tsx` - Lógica de vales pendientes
3. `app/(tabs)/(home)/index.tsx` - Colores y etiquetas de estados
4. `app/order/[orderId].tsx` - Detalle de pedido y transiciones

### Migración de Base de Datos
- **Versión**: `20251108_add_abonado_and_finalizado_statuses_v3`
- **Estado**: Aplicada exitosamente
- **Reversible**: No (requiere migración manual)

## Próximos Pasos Recomendados

1. **Monitoreo**: Observar el comportamiento del sistema con los nuevos estados
2. **Capacitación**: Informar al equipo sobre el nuevo flujo de trabajo
3. **Documentación**: Actualizar manuales de usuario si existen
4. **Reportes**: Considerar agregar reportes específicos para cada estado

## Soporte

Si encuentras algún problema o tienes preguntas sobre esta mejora, por favor documenta:
- El estado del pedido antes y después
- Los montos involucrados
- Los pasos realizados
- Cualquier mensaje de error

---

**Fecha de Implementación**: 2025-01-08
**Versión**: 1.0.0
**Estado**: Producción
