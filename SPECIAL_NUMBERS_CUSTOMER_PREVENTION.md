
# Prevención de Números Especiales como Clientes

## Resumen de Cambios

Se implementó una funcionalidad para prevenir que los pedidos creados con números especiales (números autorizados registrados en `authorized_phones`) sean considerados como clientes.

## Cambios Implementados

### 1. Hook `useOrderCustomer.ts`

**Función `addCustomerToMenu`:**
- Se agregó una validación para verificar si el número de teléfono del pedido está registrado en la tabla `authorized_phones`
- Si el número es especial, se muestra una alerta informativa y se previene la creación del cliente
- Mensaje de alerta: "Este número está registrado como número especial para subir pedidos. Los números especiales no se pueden agregar como clientes."

```typescript
// Check if the phone number is a special number (authorized phone)
if (order.customer_phone) {
  const { data: authorizedPhone } = await supabase
    .from('authorized_phones')
    .select('id, phone_number, customer_name')
    .eq('phone_number', order.customer_phone)
    .maybeSingle();

  if (authorizedPhone) {
    // Show warning and prevent customer creation
    return;
  }
}
```

### 2. Hook `useOrderDetail.ts`

**Función `checkIfCustomerExists`:**
- Se agregó una verificación previa para comprobar si el número de teléfono es un número especial
- Si es un número especial, se marca como que NO existe en el menú de clientes
- Esto previene que se muestre el banner "Este cliente ya existe en el menú de Clientes"

```typescript
// First check if this is a special number (authorized phone)
const { data: authorizedPhone } = await supabase
  .from('authorized_phones')
  .select('id')
  .eq('phone_number', phone.trim())
  .maybeSingle();

// If it's a special number, don't consider it as a customer
if (authorizedPhone) {
  setCustomerExistsInMenu(false);
  return;
}
```

**Función `updateStatus`:**
- Se agregó una validación al cambiar el estado a "Pendiente de Pago"
- Si el número de teléfono es especial, se previene el cambio de estado y se muestra una alerta
- Mensaje de alerta: "Este número está registrado como número especial para subir pedidos. Los pedidos de números especiales no se pueden cambiar a 'Pendiente de Pago' porque no se consideran como clientes."

```typescript
// Check if the phone number is a special number (authorized phone)
if (order.customer_phone && order.customer_phone.trim()) {
  const { data: authorizedPhone } = await supabase
    .from('authorized_phones')
    .select('id, phone_number, customer_name')
    .eq('phone_number', order.customer_phone)
    .maybeSingle();

  if (authorizedPhone) {
    // Show warning and prevent status change
    return;
  }
}
```

## Comportamiento Esperado

### Escenario 1: Agregar Cliente desde Detalle de Pedido
1. Usuario intenta agregar un cliente con el botón "+" en la sección Cliente
2. Si el número de teléfono está en `authorized_phones`:
   - Se muestra una alerta informativa
   - No se crea el cliente
   - El botón "+" permanece visible

### Escenario 2: Cambiar Estado a "Pendiente de Pago"
1. Usuario intenta cambiar el estado del pedido a "Pendiente de Pago"
2. Si el número de teléfono está en `authorized_phones`:
   - Se muestra una alerta informativa
   - No se cambia el estado
   - No se crea el cliente automáticamente

### Escenario 3: Verificación de Cliente Existente
1. Al cargar un pedido con número de teléfono
2. Si el número está en `authorized_phones`:
   - No se muestra el banner "Este cliente ya existe en el menú de Clientes"
   - El botón "+" permanece habilitado (pero mostrará alerta al intentar agregar)

## Tabla `authorized_phones`

La tabla `authorized_phones` contiene los números especiales que no deben ser considerados como clientes:

```sql
CREATE TABLE authorized_phones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT UNIQUE NOT NULL,
  customer_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Gestión de Números Especiales

Los números especiales se gestionan desde la pantalla "Gestión de Usuarios" (`app/settings/users.tsx`):
- Solo administradores y desarrolladores pueden acceder
- Se pueden agregar nuevos números especiales
- Se pueden eliminar números especiales existentes
- Cada número puede tener un nombre de cliente y notas asociadas

## Notas Técnicas

- Los números especiales siempre crean nuevos pedidos, nunca consultas
- Los números especiales no se bloquean ni desbloquean
- Los números especiales no aparecen en el menú de Clientes
- Los números especiales no pueden tener deuda pendiente
- Los pedidos de números especiales no se pueden cambiar a estados relacionados con pagos

## Validaciones Implementadas

1. ✅ Prevenir creación de cliente desde botón "+"
2. ✅ Prevenir cambio de estado a "Pendiente de Pago"
3. ✅ No mostrar banner de "Cliente existente"
4. ✅ Mantener botón "+" visible pero con validación
5. ✅ Mensajes de alerta informativos y claros

## Archivos Modificados

- `hooks/useOrderCustomer.ts` - Validación en `addCustomerToMenu`
- `hooks/useOrderDetail.ts` - Validaciones en `checkIfCustomerExists` y `updateStatus`

## Pruebas Recomendadas

1. Crear un pedido con un número especial desde WhatsApp
2. Intentar agregar el cliente con el botón "+"
3. Verificar que se muestra la alerta y no se crea el cliente
4. Intentar cambiar el estado a "Pendiente de Pago"
5. Verificar que se muestra la alerta y no se cambia el estado
6. Verificar que no se muestra el banner de "Cliente existente"
