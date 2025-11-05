
# Implementación del Perfil "Impresor"

## Resumen

Se ha implementado un nuevo perfil de usuario llamado "Impresor" con PIN de acceso "5010". Este perfil está dedicado exclusivamente a la impresión de documentos y permite que otros perfiles (Admin y Trabajador) envíen trabajos de impresión a una cola cuando no tienen una impresora conectada localmente.

## Características Implementadas

### 1. Nuevo Rol de Usuario "Impresor"

- **PIN de Acceso**: 5010
- **Tipo de Usuario**: `printer` (agregado al tipo `UserRole`)
- **Autenticación**: Sistema de autenticación basado en PIN (igual que Admin y Trabajador)

### 2. Cola de Impresión (Print Queue)

Se utiliza la tabla existente `print_queue` con las siguientes mejoras:

#### Estructura de la Tabla
```sql
- id: UUID (primary key)
- item_type: 'order' | 'query' | 'payment' | 'customer_orders'
- item_id: UUID (referencia al elemento a imprimir)
- status: 'pending' | 'printed' | 'failed'
- created_at: timestamp
- printed_at: timestamp (nullable)
- error_message: text (nullable)
- metadata: jsonb (nuevo - para datos adicionales)
```

#### Tipos de Elementos Imprimibles
1. **order**: Pedidos individuales
2. **query**: Consultas de clientes
3. **payment**: Recibos de pago
4. **customer_orders**: Estado de cuenta de clientes (pedidos pendientes)

### 3. Pantalla de Cola de Impresión (`/printer-queue`)

Pantalla dedicada para el perfil Impresor con las siguientes funcionalidades:

#### Características
- **Indicador de Conexión**: Muestra si hay una impresora conectada
- **Lista de Trabajos Pendientes**: Muestra todos los elementos en cola ordenados por fecha
- **Acciones por Elemento**:
  - Botón de imprimir (solo si hay impresora conectada)
  - Botón de eliminar de la cola
- **Actualización Automática**: Pull-to-refresh para actualizar la cola
- **Limpiar Impresos**: Botón para eliminar todos los elementos ya impresos

#### Flujo de Impresión
1. El Impresor ve la lista de trabajos pendientes
2. Presiona el botón de imprimir en cada elemento
3. El sistema carga los datos necesarios (pedido, consulta, etc.)
4. Genera el recibo con la configuración de impresora guardada
5. Imprime el documento
6. Marca el elemento como "impreso" en la base de datos
7. El elemento se mantiene en la lista pero puede ser eliminado

### 4. Funcionalidad "Enviar a Impresor"

Los perfiles Admin y Trabajador ahora tienen la opción de enviar trabajos a la cola de impresión cuando no tienen una impresora conectada.

#### Ubicaciones de la Funcionalidad

##### En Detalle de Pedido (`/order/[orderId]`)
- **Botón "Imprimir Pedido"**: Aparece cuando HAY impresora conectada
- **Botón "Enviar a Impresor"**: Aparece cuando NO hay impresora conectada
- Envía el pedido completo a la cola de impresión

##### En Pantalla de Clientes (`/customers`)
- **Botón "Imprimir Estado de Cuenta"**: Aparece cuando HAY impresora conectada
- **Botón "Enviar a Impresor"**: Aparece cuando NO hay impresora conectada
- Envía el estado de cuenta del cliente (pedidos pendientes) a la cola

### 5. Utilidades de Cola de Impresión (`utils/printQueue.ts`)

Funciones para gestionar la cola de impresión:

```typescript
// Agregar elemento a la cola
addToPrintQueue(itemType, itemId, metadata?)

// Obtener elementos pendientes
getPendingPrintQueue()

// Marcar como impreso
markAsPrinted(queueItemId)

// Marcar como fallido
markAsFailed(queueItemId, errorMessage)

// Eliminar elemento
deletePrintQueueItem(queueItemId)

// Limpiar elementos impresos
clearPrintedItems()
```

### 6. Redirección Automática

El sistema redirige automáticamente según el rol del usuario:

- **Admin/Trabajador**: `/(tabs)/(home)/` (pantalla de pedidos)
- **Impresor**: `/printer-queue` (cola de impresión)

Esta redirección ocurre en:
- Login exitoso (`app/login.tsx`)
- Inicio de la aplicación (`app/index.tsx`)

### 7. Interfaz de Usuario Adaptada

#### Pantalla de Perfil
- Muestra el rol "Impresor" con color morado (#8B5CF6)
- Acceso rápido a "Cola de Impresión" para usuarios Impresor
- Oculta opciones no relevantes (Actividad, Estadísticas) para Impresor

#### Indicadores Visuales
- **Botón "Enviar a Impresor"**: Color morado (#8B5CF6) con ícono de avión de papel
- **Botón "Imprimir"**: Color azul (#3B82F6) con ícono de impresora
- **Estado de Conexión**: Verde para conectado, amarillo para desconectado

## Flujo de Trabajo Completo

### Escenario 1: Admin/Trabajador SIN Impresora

1. Usuario Admin/Trabajador abre un pedido
2. Ve el botón "Enviar a Impresor" (en lugar de "Imprimir")
3. Presiona el botón
4. El pedido se agrega a la cola de impresión
5. Recibe confirmación: "El pedido se agregó a la cola de impresión"

### Escenario 2: Impresor Imprime el Pedido

1. Usuario Impresor inicia sesión con PIN 5010
2. Es redirigido automáticamente a `/printer-queue`
3. Ve la lista de trabajos pendientes
4. Conecta su impresora (si no está conectada)
5. Presiona "Imprimir" en cada trabajo
6. El sistema imprime el documento
7. El trabajo se marca como "impreso"
8. Puede limpiar los trabajos impresos cuando lo desee

### Escenario 3: Admin/Trabajador CON Impresora

1. Usuario Admin/Trabajador abre un pedido
2. Ve el botón "Imprimir Pedido" (impresión directa)
3. Presiona el botón
4. El pedido se imprime inmediatamente
5. No se agrega a la cola de impresión

## Archivos Modificados/Creados

### Archivos Nuevos
- `app/printer-queue.tsx` - Pantalla de cola de impresión
- `utils/printQueue.ts` - Utilidades para gestionar la cola

### Archivos Modificados
- `types/index.ts` - Agregado rol 'printer' y tipos relacionados
- `contexts/AuthContext.tsx` - Agregado PIN 5010 para Impresor
- `app/login.tsx` - Redirección basada en rol
- `app/index.tsx` - Redirección inicial basada en rol
- `app/(tabs)/profile.tsx` - UI adaptada para rol Impresor
- `app/order/[orderId].tsx` - Botón "Enviar a Impresor"
- `app/(tabs)/customers.tsx` - Botón "Enviar a Impresor" para estado de cuenta

### Migraciones de Base de Datos
- `add_print_queue_metadata` - Agregada columna `metadata` a tabla `print_queue`

## Configuración de Impresora

El perfil Impresor utiliza la misma configuración de impresora que los otros perfiles:

- **Ruta**: Configuración > Impresora
- **Opciones**:
  - Conexión Bluetooth
  - Tamaño de papel (58mm/80mm)
  - Tamaño de texto (pequeño/mediano/grande)
  - Corte automático
  - Incluir logo, información del cliente, totales

## Ventajas del Sistema

1. **Centralización**: Un dispositivo dedicado a la impresión
2. **Flexibilidad**: Otros usuarios pueden trabajar sin impresora
3. **Eficiencia**: El Impresor puede procesar múltiples trabajos en lote
4. **Simplicidad**: Interfaz dedicada y enfocada para el rol de impresión
5. **Escalabilidad**: Fácil agregar más tipos de documentos imprimibles

## Consideraciones de Seguridad

- El perfil Impresor solo tiene acceso a:
  - Cola de impresión
  - Configuración de impresora
  - Cerrar sesión
- No puede:
  - Ver/editar pedidos
  - Gestionar clientes
  - Acceder a estadísticas
  - Gestionar usuarios (solo Admin)

## Próximos Pasos Sugeridos

1. **Notificaciones Push**: Notificar al Impresor cuando hay nuevos trabajos
2. **Auto-impresión**: Opción para imprimir automáticamente al llegar trabajos
3. **Prioridades**: Sistema de prioridades para trabajos urgentes
4. **Historial**: Registro de todos los trabajos impresos
5. **Múltiples Impresores**: Soporte para varios dispositivos Impresor

## Notas Técnicas

- La tabla `print_queue` usa RLS (Row Level Security) habilitado
- Los trabajos se ordenan por `created_at` ascendente (FIFO)
- El campo `metadata` permite almacenar datos adicionales en formato JSON
- Los recibos se generan usando las mismas funciones que la impresión directa
- Compatible con impresoras térmicas de 58mm y 80mm

## Soporte

Para problemas o preguntas sobre el perfil Impresor:
1. Verificar que la impresora esté conectada correctamente
2. Revisar la configuración de impresora
3. Verificar permisos de Bluetooth
4. Consultar logs en la consola para errores específicos
