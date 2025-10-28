
# Estandarización del Formato de Recibos

## Problema Resuelto

Los recibos de impresión de auto-impresión y de detalle de productos eran diferentes. Ahora ambos usan el mismo formato consistente.

## Cambios Realizados

### 1. Actualización de `app/(tabs)/(home)/index.tsx`

Se actualizó la función `generateReceiptText` en la pantalla principal (HomeScreen) para usar el mismo formato que la pantalla de detalle de pedidos.

#### Funciones Agregadas:

- **`formatProductDisplay(item)`**: Formatea productos en el estilo webhook
  - Ejemplo: "2 kilos de papas" en lugar de "2kg papas"
  - Maneja pluralización correcta (kilo/kilos, unidad/unidades, etc.)
  - Soporta unidades personalizadas extraídas del formato "Unidad: xxx"

- **`getAdditionalNotes(notes)`**: Extrae notas adicionales excluyendo la información de unidad
  - Remueve el formato "Unidad: xxx" de las notas
  - Retorna solo las notas adicionales limpias

- **`getUnitFromNotes(notes)` mejorada**: Ahora extrae unidades del formato "Unidad: xxx"
  - Busca primero el patrón "Unidad: xxx"
  - Si no lo encuentra, usa el método de detección anterior

#### Formato de Recibo Actualizado:

```
=================================
           PEDIDO
=================================

Pedido: #12345
Estado: Pendiente
Fecha: 15/01/2025 14:30
---------------------------------

Cliente: Juan Pérez
Telefono: +56912345678
Direccion: Calle Principal 123
---------------------------------

PRODUCTOS:

2 kilos de papas
  $2000

3 mallas de cebolla
  Nota adicional del producto
  $1500

1 unidad de lechuga
  $800

---------------------------------
TOTAL: $4300
Pagado: $2000
Pendiente: $2300

=================================
    Gracias por su compra!
=================================
```

## Beneficios

1. **Consistencia**: Ambos métodos de impresión (auto-impresión y manual) ahora generan recibos idénticos
2. **Legibilidad**: El formato "2 kilos de papas" es más natural y fácil de leer que "2kg papas"
3. **Profesionalismo**: Los recibos se ven más profesionales y consistentes
4. **Mantenibilidad**: Un solo formato facilita el mantenimiento futuro

## Formato de Productos

El formato ahora sigue estas reglas:

- **Cantidad + Unidad + "de" + Producto**
  - "2 kilos de papas"
  - "3 mallas de cebolla"
  - "1 unidad de lechuga"

- **Pluralización automática**:
  - 1 kilo / 2 kilos
  - 1 unidad / 2 unidades
  - 1 litro / 2 litros
  - 1 malla / 2 mallas (unidades personalizadas)

- **Notas adicionales**: Se muestran debajo del producto, indentadas
- **Precios**: Se muestran debajo de las notas, indentados

## Codificación de Caracteres

Ambos métodos de impresión usan:
- **CP850** por defecto (soporta caracteres españoles como ñ, á, é, etc.)
- Configuración consistente de codificación
- Mismo tamaño de texto y configuración de corte automático

## Archivos Modificados

- `app/(tabs)/(home)/index.tsx`: Actualizado para usar el formato consistente
- `app/order/[orderId].tsx`: Ya tenía el formato correcto (sin cambios)

## Notas Técnicas

- La función `formatProductDisplay` es la clave para el formato consistente
- Las unidades se extraen del campo `notes` usando el patrón "Unidad: xxx"
- Las notas adicionales se limpian removiendo la información de unidad
- El formato es compatible con el parser de WhatsApp para mantener consistencia en toda la aplicación
