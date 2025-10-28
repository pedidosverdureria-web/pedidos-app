
# Configuración Local de Impresora - Implementación Completa

## 📋 Resumen de Cambios

Se ha migrado completamente la configuración de la impresora desde la base de datos a almacenamiento local (AsyncStorage). Esto garantiza:

- ✅ **Configuración persistente** en el dispositivo
- ✅ **Sin dependencia de base de datos** para la configuración de impresora
- ✅ **Codificación CP850 mejorada** con soporte completo para caracteres españoles
- ✅ **Aplicación global** a todos los formatos de recibos

## 🔧 Cambios Implementados

### 1. Almacenamiento Local (AsyncStorage)

**Archivo:** `app/settings/printer.tsx`

La configuración ahora se guarda exclusivamente en AsyncStorage con la clave `@printer_config`:

```typescript
const config = {
  auto_print_enabled: boolean,
  auto_cut_enabled: boolean,
  text_size: 'small' | 'medium' | 'large',
  paper_size: '58mm' | '80mm',
  encoding: 'CP850' | 'UTF-8' | 'ISO-8859-1' | 'Windows-1252',
  include_logo: boolean,
  include_customer_info: boolean,
  include_totals: boolean,
  printer_name: string | null,
  printer_address: string | null,
};
```

**Funciones modificadas:**
- `loadConfig()`: Ahora carga solo desde AsyncStorage
- `handleSaveConfig()`: Guarda solo en AsyncStorage (sin base de datos)

### 2. Codificación CP850 Mejorada

**Archivo:** `hooks/usePrinter.ts`

Se ha expandido significativamente el mapa de caracteres CP850 para incluir:

#### Caracteres Españoles Críticos
- **ñ, Ñ** (164, 165) - LO MÁS IMPORTANTE
- **á, é, í, ó, ú** (160, 130, 161, 162, 163)
- **Á, É, Í, Ó, Ú** (181, 144, 214, 224, 233)
- **ü, Ü** (129, 154)
- **¿, ¡** (168, 173)

#### Caracteres Adicionales
- Vocales con acento grave: à, è, ì, ò, ù
- Vocales con circunflejo: â, ê, î, ô, û
- Símbolos: °, €, £, ¥, ¢, ª, º
- C con cedilla: ç, Ç
- Caracteres de dibujo de cajas
- Símbolos matemáticos: ±, ×, ÷, ¼, ½, ¾, ², ³

**Total:** Más de 100 caracteres mapeados correctamente

### 3. Variables Helper para Español

**Archivo:** `utils/receiptGenerator.ts`

Se han creado dos conjuntos de constantes para facilitar el uso de palabras españolas:

#### `SPANISH_WORDS`
Más de 100 palabras comunes en español con caracteres especiales:
- Palabras con Ñ: Año, Niño, Señor, Mañana, España, etc.
- Palabras con acentos: Teléfono, Dirección, Atención, etc.
- Unidades: kilo, gramo, litro, unidad, etc.
- Estados: Pendiente, Preparando, Listo, etc.

#### `SPANISH_PHRASES`
Frases completas para recibos:
- "Gracias por su compra!"
- "Gracias por su preferencia!"
- "Válido para cambios"
- "Atención al cliente"
- Y muchas más...

### 4. Generación de Recibos Actualizada

**Archivos modificados:**
- `utils/receiptGenerator.ts`
- `utils/backgroundAutoPrintTask.ts`

Todas las funciones de generación de recibos ahora usan:
1. Variables helper de `SPANISH_WORDS` y `SPANISH_PHRASES`
2. Configuración local de AsyncStorage
3. Codificación CP850 por defecto

**Funciones actualizadas:**
- `generateReceiptText()` - Recibos normales
- `generateQueryReceiptText()` - Recibos de consultas
- `generateSampleReceipt()` - Recibos de prueba

### 5. Impresión de Prueba Mejorada

**Archivo:** `hooks/usePrinter.ts`

La función `testPrint()` ahora incluye una prueba exhaustiva de caracteres españoles:

```
CARACTERES ESPECIALES ESPAÑOLES:
- Vocales con acento: á é í ó ú
- La letra Ñ: ñ Ñ
- Palabras: Año, Niño, Señor, Mañana, España
- Frases: ¿Cómo está usted?
- Símbolos: 15°C, €10.50, £8.25
```

## 📝 Cómo Usar

### Para Desarrolladores

1. **Usar palabras españolas en recibos:**
```typescript
import { SPANISH_WORDS, SPANISH_PHRASES } from '@/utils/receiptGenerator';

// En lugar de:
receipt += "Teléfono: " + phone;

// Usar:
receipt += `${SPANISH_WORDS.TELEFONO}: ${phone}`;
```

2. **Cargar configuración:**
```typescript
const configStr = await AsyncStorage.getItem('@printer_config');
const config = configStr ? JSON.parse(configStr) : null;
```

3. **Generar recibo con configuración:**
```typescript
import { generateReceiptText } from '@/utils/receiptGenerator';

const receiptText = generateReceiptText(order, config);
await printReceipt(receiptText, config?.auto_cut_enabled, config?.text_size, config?.encoding);
```

### Para Usuarios

1. **Configurar impresora:**
   - Ir a Configuración → Impresora
   - Conectar impresora Bluetooth
   - Seleccionar codificación: **CP850 (Recomendado para español)**
   - Ajustar tamaño de texto y papel
   - Guardar configuración

2. **Probar impresión:**
   - Usar el botón "Imprimir prueba"
   - Verificar que todos los caracteres españoles se impriman correctamente
   - Si ves espacios en blanco en lugar de ñ o acentos, verifica la codificación

3. **Auto-impresión:**
   - Activar "Auto-impresión" en configuración
   - Los pedidos nuevos se imprimirán automáticamente
   - Funciona en segundo plano y con pantalla apagada

## 🔍 Solución de Problemas

### Problema: Caracteres en blanco en lugar de ñ o acentos

**Solución:**
1. Verificar que la codificación esté en **CP850**
2. Hacer una impresión de prueba
3. Si persiste, probar con ISO-8859-1

### Problema: Configuración no se guarda

**Solución:**
1. Verificar permisos de almacenamiento
2. Revisar logs de consola para errores
3. La configuración se guarda en AsyncStorage, no requiere conexión a internet

### Problema: Auto-impresión no funciona

**Solución:**
1. Verificar que la impresora esté conectada
2. Activar "Auto-impresión" en configuración
3. Verificar estado de tarea en segundo plano
4. Revisar permisos de Bluetooth

## 📊 Archivos Modificados

1. **app/settings/printer.tsx**
   - Eliminada dependencia de base de datos
   - Configuración solo en AsyncStorage
   - Añadida información sobre CP850

2. **hooks/usePrinter.ts**
   - Mapa CP850 expandido (100+ caracteres)
   - Impresión de prueba mejorada
   - Mejor logging de conversión

3. **utils/receiptGenerator.ts**
   - Variables helper SPANISH_WORDS
   - Variables helper SPANISH_PHRASES
   - Funciones actualizadas para usar helpers

4. **utils/backgroundAutoPrintTask.ts**
   - Usa configuración local
   - Palabras españolas en recibos
   - Sin dependencia de base de datos

5. **app/order/[orderId].tsx**
   - Carga configuración de AsyncStorage
   - Aplica configuración a todas las impresiones

## ✅ Verificación

Para verificar que todo funciona correctamente:

1. **Configuración persistente:**
   ```typescript
   // Guardar configuración
   await AsyncStorage.setItem('@printer_config', JSON.stringify(config));
   
   // Cerrar y reabrir app
   
   // Cargar configuración
   const saved = await AsyncStorage.getItem('@printer_config');
   // Debe contener la configuración guardada
   ```

2. **Caracteres españoles:**
   - Imprimir prueba desde configuración
   - Verificar que se impriman: ñ, Ñ, á, é, í, ó, ú, ¿, ¡
   - Si se ven correctamente, CP850 está funcionando

3. **Aplicación global:**
   - Imprimir desde detalle de pedido
   - Imprimir consulta
   - Auto-impresión de pedido nuevo
   - Todos deben usar la misma configuración

## 🎯 Beneficios

1. **Simplicidad:** No requiere base de datos para configuración
2. **Velocidad:** Carga instantánea desde AsyncStorage
3. **Confiabilidad:** Funciona sin conexión a internet
4. **Persistencia:** Configuración se mantiene entre reinicios
5. **Corrección:** Caracteres españoles se imprimen correctamente
6. **Consistencia:** Misma configuración en todos los recibos

## 📚 Referencias

- **CP850:** Code Page 850 (Multilingual Latin 1)
- **AsyncStorage:** React Native persistent storage
- **ESC/POS:** Printer command language
- **Thermal Printing:** 58mm and 80mm paper sizes

## 🔄 Migración desde Base de Datos

Si tenías configuración en la base de datos:

1. La configuración anterior en `printer_config` table ya no se usa
2. Configurar nuevamente desde la app
3. La nueva configuración se guarda en AsyncStorage
4. No se requiere migración de datos

## 🚀 Próximos Pasos

Posibles mejoras futuras:

1. Backup de configuración en la nube (opcional)
2. Perfiles de impresora múltiples
3. Plantillas de recibo personalizables
4. Soporte para más codificaciones
5. Previsualización de recibo antes de imprimir

---

**Fecha de implementación:** 2024
**Versión:** 1.0.0
**Estado:** ✅ Completado y probado
