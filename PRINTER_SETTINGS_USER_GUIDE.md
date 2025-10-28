
# Guía de Configuración de Impresora

## Cómo Configurar tu Impresora

### 1. Conectar la Impresora

1. Ve a **Configuración** → **Impresora**
2. Toca **"Buscar impresoras"**
3. Espera a que aparezca tu impresora en la lista
4. Toca **"Conectar"** junto al nombre de tu impresora
5. Verás el mensaje "✅ Conectado"

### 2. Configurar el Formato del Ticket

#### Tamaño de Papel
- **58mm**: Para impresoras pequeñas (32 caracteres por línea)
- **80mm**: Para impresoras estándar (48 caracteres por línea) - **Recomendado**

#### Tamaño de Texto
- **Pequeño**: Texto más compacto, cabe más información
- **Mediano**: Tamaño estándar, fácil de leer - **Recomendado**
- **Grande**: Texto más grande, ideal para personas con problemas de visión

#### Codificación
- **CP850**: Recomendado para español - Soporta ñ, tildes y caracteres especiales
- **UTF-8**: Estándar moderno
- **ISO-8859-1**: Alternativa para español
- **Windows-1252**: Compatible con Windows

#### Opciones de Contenido
- **Incluir logo**: Muestra "PEDIDO" en el encabezado
- **Incluir info del cliente**: Muestra nombre, teléfono y dirección
- **Incluir totales**: Muestra el total, pagado y pendiente
- **Corte automático**: Corta el papel automáticamente al terminar

### 3. Ver Vista Previa

1. Después de configurar, toca **"Ver Vista Previa"**
2. Verás exactamente cómo se verá tu ticket
3. Si tienes la impresora conectada, puedes tocar **"Imprimir Prueba"**
4. Ajusta la configuración hasta que te guste el resultado

### 4. Guardar Configuración

1. Toca **"Guardar configuración"**
2. Verás el mensaje "✅ Configuración Guardada"
3. La configuración se aplicará a:
   - Impresiones manuales desde el detalle del pedido
   - Auto-impresiones de pedidos nuevos
   - Impresiones de prueba

### 5. Activar Auto-Impresión

1. Asegúrate de que la impresora esté conectada
2. Activa el switch **"Activar auto-impresión"**
3. Toca **"Guardar configuración"**
4. Verás el banner verde en la pantalla principal: "Auto-impresión activa"

#### Cómo Funciona la Auto-Impresión
- Los pedidos nuevos se imprimen automáticamente cuando llegan
- Funciona incluso con la pantalla apagada
- Solo imprime pedidos en estado "Pendiente"
- No imprime el mismo pedido dos veces
- Usa la misma configuración que las impresiones manuales

### 6. Solución de Problemas

#### La impresora no aparece al buscar
- Verifica que la impresora esté encendida
- Asegúrate de que el Bluetooth esté activado
- Acerca el teléfono a la impresora
- Reinicia la impresora y vuelve a buscar

#### Los caracteres especiales no se ven bien (ñ, tildes)
- Cambia la codificación a **CP850**
- Guarda la configuración
- Imprime una prueba para verificar

#### La auto-impresión no funciona
- Verifica que la impresora esté conectada (banner verde)
- Asegúrate de que "Activar auto-impresión" esté activado
- Guarda la configuración después de activarla
- Verifica que el pedido esté en estado "Pendiente"

#### El ticket se ve diferente al esperado
- Usa "Ver Vista Previa" para verificar el formato
- Ajusta las opciones de contenido según necesites
- Cambia el tamaño de texto si es necesario
- Guarda la configuración después de cada cambio

### 7. Consejos y Recomendaciones

#### Configuración Recomendada
```
Tamaño de papel: 80mm
Tamaño de texto: Mediano
Codificación: CP850
Incluir logo: ✓
Incluir info del cliente: ✓
Incluir totales: ✓
Corte automático: ✓
```

#### Para Ahorrar Papel
- Desactiva "Incluir logo"
- Usa tamaño de texto "Pequeño"
- Desactiva "Corte automático" y corta manualmente

#### Para Mejor Legibilidad
- Usa tamaño de papel 80mm
- Usa tamaño de texto "Grande"
- Mantén todas las opciones de contenido activadas

#### Para Pedidos Simples
- Desactiva "Incluir info del cliente" si no es necesaria
- Desactiva "Incluir totales" si los precios no están configurados

### 8. Formato del Ticket

El ticket incluye:

```
================================
           PEDIDO
================================

Pedido: PED-001
Estado: Pendiente
Fecha: 15/01/2024 14:30

--------------------------------

Cliente: Juan Pérez
Telefono: +56912345678
Direccion: Av. Principal 123

--------------------------------

PRODUCTOS:

2 kilos de Tomates
  $3.000

1 malla de Cebollas
  $2.000

3 kilos de Papas
  Papas blancas
  $4.500

--------------------------------
TOTAL: $9.500
Pagado: $5.000
Pendiente: $4.500

================================
    Gracias por su compra!
================================
```

### 9. Mantenimiento

#### Mantener la Conexión
- La app mantiene la conexión activa automáticamente
- Si se desconecta, reconecta desde Configuración → Impresora
- La impresora se reconecta automáticamente al abrir la app

#### Actualizar Configuración
- Puedes cambiar la configuración en cualquier momento
- Los cambios se aplican inmediatamente a nuevas impresiones
- Las impresiones anteriores no se ven afectadas

#### Cambiar de Impresora
1. Desconecta la impresora actual
2. Busca y conecta la nueva impresora
3. Verifica la configuración
4. Guarda los cambios

## Preguntas Frecuentes

**P: ¿Puedo usar cualquier impresora térmica?**
R: Sí, la app es compatible con impresoras térmicas Bluetooth de 58mm y 80mm.

**P: ¿La auto-impresión consume mucha batería?**
R: No, la app está optimizada para consumir mínima batería en segundo plano.

**P: ¿Qué pasa si me quedo sin papel?**
R: Los pedidos pendientes se guardan y se pueden imprimir manualmente después.

**P: ¿Puedo imprimir pedidos antiguos?**
R: Sí, abre cualquier pedido y toca "Imprimir Pedido".

**P: ¿La configuración se guarda si cierro la app?**
R: Sí, la configuración se guarda permanentemente hasta que la cambies.
