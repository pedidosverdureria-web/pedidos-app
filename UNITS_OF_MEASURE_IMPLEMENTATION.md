
# Implementación de Gestión de Unidades de Medida y Eliminación de Productos

## Resumen

Se han implementado dos nuevas funcionalidades en la aplicación:

### 1. Eliminación de Productos en Detalle de Pedido ✅

**Ubicación:** `app/order/[orderId].tsx`

**Funcionalidad:**
- Los usuarios pueden eliminar productos individuales de un pedido desde la pantalla de detalle
- Cada producto tiene un ícono de papelera (🗑️) al lado del botón de editar
- Al hacer clic, aparece un diálogo de confirmación
- Si el usuario confirma, el producto se elimina de la base de datos
- Se envía una notificación automática por WhatsApp al cliente informando del cambio
- El pedido se recarga automáticamente para mostrar los cambios

**Características:**
- ✅ Confirmación antes de eliminar (evita eliminaciones accidentales)
- ✅ Notificación por WhatsApp al cliente
- ✅ Feedback visual con haptics
- ✅ Mensajes de éxito/error
- ✅ Actualización automática de la interfaz

### 2. Gestión de Unidades de Medida 🆕

**Ubicación:** `app/settings/units.tsx`

**Funcionalidad:**
Esta nueva pantalla permite a los usuarios gestionar las unidades de medida utilizadas en los pedidos de WhatsApp.

**Características principales:**

#### Visualización de Unidades
- Lista completa de todas las unidades de medida
- Diferenciación visual entre unidades del sistema y personalizadas
- Muestra el nombre de la unidad y todas sus variaciones
- Badge que indica si es "Sistema" o "Personalizada"

#### Agregar Nuevas Unidades
- Botón prominente "Agregar Unidad" en la parte superior
- Modal con formulario para:
  - Nombre de la unidad (ej: "paquete")
  - Variaciones separadas por comas (ej: "paquete, paquetes, paq, pqt")
- Validación de campos requeridos
- Las variaciones se guardan en minúsculas para consistencia
- El nombre de la unidad siempre se incluye automáticamente en las variaciones

#### Editar Unidades Existentes
- Botón "Editar" en cada tarjeta de unidad
- Modal similar al de agregar, pero pre-poblado con los datos actuales
- Permite modificar tanto el nombre como las variaciones
- Funciona para unidades del sistema y personalizadas

#### Eliminar Unidades
- Botón "Eliminar" en cada tarjeta de unidad
- Solo se pueden eliminar unidades personalizadas (las del sistema están protegidas)
- Confirmación doble antes de eliminar
- Feedback visual cuando una unidad no se puede eliminar

#### Integración con el Parser de WhatsApp
Las unidades definidas aquí se utilizan automáticamente en:
- `utils/whatsappParser.ts` - Parser del lado del cliente
- `supabase/functions/whatsapp-webhook/index.ts` - Parser del lado del servidor

Ambos parsers cargan las unidades desde la tabla `known_units` en la base de datos.

## Estructura de la Base de Datos

### Tabla: `known_units`

```sql
CREATE TABLE known_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_name TEXT NOT NULL,
  variations TEXT[] DEFAULT '{}',
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Campos:**
- `id`: Identificador único
- `unit_name`: Nombre estándar de la unidad (ej: "kilo", "paquete")
- `variations`: Array de variaciones/abreviaturas (ej: ["kilo", "kilos", "kg", "kgs", "k"])
- `is_custom`: Indica si es una unidad personalizada (true) o del sistema (false)
- `created_at`: Fecha de creación
- `updated_at`: Fecha de última actualización

## Ejemplos de Uso

### Agregar una Unidad Personalizada

1. Ir a **Configuración** → **Unidades de Medida**
2. Hacer clic en **"Agregar Unidad"**
3. Ingresar:
   - Nombre: `paquete`
   - Variaciones: `paquete, paquetes, paq, pqt`
4. Hacer clic en **"Agregar"**

Ahora los clientes pueden enviar pedidos como:
- "3 paquetes de galletas"
- "2 paq de arroz"
- "1 pqt de fideos"

### Editar una Unidad Existente

1. Ir a **Configuración** → **Unidades de Medida**
2. Encontrar la unidad que deseas editar
3. Hacer clic en **"Editar"**
4. Modificar el nombre o las variaciones
5. Hacer clic en **"Guardar"**

### Eliminar Productos de un Pedido

1. Abrir el detalle de un pedido
2. En la sección de productos, hacer clic en el ícono de papelera (🗑️) junto al producto
3. Confirmar la eliminación en el diálogo
4. El producto se elimina y el cliente recibe una notificación por WhatsApp

## Unidades Predeterminadas del Sistema

La aplicación incluye las siguientes unidades predeterminadas:

- **kilo**: kilo, kilos, kg, kgs, k
- **gramo**: gramo, gramos, gr, grs, g
- **unidad**: unidad, unidades, u, und, unds
- **malla**: malla, mallas
- **saco**: saco, sacos
- **cajón**: cajón, cajon, cajones
- **atado**: atado, atados
- **cabeza**: cabeza, cabezas
- **libra**: libra, libras, lb, lbs
- **docena**: docena, docenas
- **paquete**: paquete, paquetes
- **caja**: caja, cajas
- **litro**: litro, litros, lt, l
- **metro**: metro, metros, m
- **bolsa**: bolsa, bolsas

Estas unidades no se pueden eliminar, pero sí se pueden editar para agregar más variaciones.

## Navegación

Para acceder a la gestión de unidades de medida:

1. Abrir el menú principal
2. Ir a **"Configuración"**
3. En la sección **"Integraciones"**, hacer clic en **"Unidades de Medida"**

## Notas Técnicas

### Sincronización con el Parser
- Los cambios en las unidades se reflejan inmediatamente en el parser de WhatsApp
- El webhook de WhatsApp carga las unidades al inicio de cada solicitud
- El parser del cliente también consulta la base de datos

### Validación
- Los nombres de unidades y variaciones se convierten automáticamente a minúsculas
- Las variaciones duplicadas se eliminan automáticamente
- El nombre de la unidad siempre se incluye en las variaciones

### Permisos
- Todos los usuarios autenticados pueden ver las unidades
- Solo los administradores pueden agregar, editar o eliminar unidades (recomendado)
- Las unidades del sistema están protegidas contra eliminación

## Mejoras Futuras Sugeridas

1. **Búsqueda y Filtrado**: Agregar un campo de búsqueda para filtrar unidades
2. **Importar/Exportar**: Permitir importar/exportar unidades en formato CSV o JSON
3. **Estadísticas de Uso**: Mostrar qué unidades se usan más frecuentemente
4. **Sugerencias Automáticas**: Sugerir variaciones comunes basadas en el nombre de la unidad
5. **Validación de Conflictos**: Detectar si una variación ya existe en otra unidad
6. **Historial de Cambios**: Registrar quién y cuándo modificó cada unidad

## Soporte

Si encuentras algún problema o tienes sugerencias, por favor contacta al equipo de desarrollo.
