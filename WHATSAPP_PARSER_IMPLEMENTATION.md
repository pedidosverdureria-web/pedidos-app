
# Sistema de Parsing Inteligente de Mensajes WhatsApp

## Descripción General

Este documento describe la implementación completa del sistema de parsing inteligente para mensajes de WhatsApp que soporta múltiples formatos de entrada.

## Características Implementadas

### ✅ Formatos Soportados

#### 1. Cantidad + Unidad + "de" + Producto
```
3 kilos de tomates
2 kilos de papas
1 kilo de cebollas
```

#### 2. Cantidad + Unidad (sin espacio) + Producto
```
3kilos de tomates
2k de papas
1kg de cebollas
12kilos de papas
```

#### 3. Cantidad + Producto (sin unidad explícita)
```
3 tomates
2 pepinos
1 lechuga
5 pepinos
```

#### 4. Fracciones
```
1/2 kilo de papas
1/4 de ají
1/8 kilo de cilantro
1/2 kg de tomates
```

#### 5. Números en Texto
```
dos kilos de tomates
tres papas
un kilo de cebollas
una lechuga
cinco pepinos
```

#### 6. Producto Primero + Cantidad
```
tomates 3 kilos
papas 2k
cebollas 1kg
```

#### 7. Múltiples Items en una Línea (sin separadores)
```
3kilos tomates 2kilos papas 1 lechuga
2k tomates 3 pepinos 1/2 kilo papas
```

#### 8. Separados por Comas
```
3 kilos de tomates, 2 kilos de papas, 1 lechuga
3k tomates, 2k papas, 5 pepinos
```

#### 9. Separados por Saltos de Línea
```
3 kilos de tomates
2 kilos de papas
1 lechuga
```

#### 10. Unidades Especiales
```
3 mallas de cebolla
2 saco de papa
un cajón de tomate
6 cabezas de ajo
2 atados de cilantro
```

## Funciones Principales

### 1. `parseQuantityValue(quantityStr: string): number`

Convierte una cadena de cantidad en un número. Soporta:

- **Fracciones**: `1/2`, `1/4`, `1/8`
- **Números decimales**: `1.5`, `2.75`
- **Números enteros**: `1`, `2`, `3`
- **Números en texto**: `uno`, `dos`, `tres`, etc.

**Algoritmo:**
1. Intenta parsear como fracción
2. Intenta parsear como número
3. Intenta convertir desde texto
4. Retorna 0 si falla

### 2. `convertNumberWord(word: string): number | null`

Convierte números en texto español a dígitos:

| Texto | Número |
|-------|--------|
| un/uno/una | 1 |
| dos | 2 |
| tres | 3 |
| cuatro | 4 |
| cinco | 5 |
| seis | 6 |
| siete | 7 |
| ocho | 8 |
| nueve | 9 |
| diez | 10 |
| once | 11 |
| doce | 12 |
| trece | 13 |
| catorce | 14 |
| quince | 15 |
| dieciséis/dieciseis | 16 |
| diecisiete | 17 |
| dieciocho | 18 |
| diecinueve | 19 |
| veinte | 20 |
| veintiuno | 21 |
| veintidós/veintidos | 22 |
| veintitrés/veintitres | 23 |
| veinticuatro | 24 |
| veinticinco | 25 |
| treinta | 30 |
| cuarenta | 40 |
| cincuenta | 50 |

### 3. `isKnownUnit(word: string): boolean`

Verifica si una palabra es una unidad conocida. Unidades soportadas:

**Peso:**
- kilo, kilos, kg, kgs, k
- gramo, gramos, gr, grs, g

**Cantidad:**
- unidad, unidades, u

**Empaque:**
- malla, mallas
- saco, sacos
- cajón, cajon, cajones

**Contenedor:**
- bolsa, bolsas
- paquete, paquetes, pqte, pqtes

**Otros:**
- caja, cajas
- atado, atados
- racimo, racimos
- cabeza, cabezas

### 4. `normalizeUnit(unit: string, quantity: number): string`

Normaliza una unidad a su forma estándar (singular o plural según cantidad).

**Reglas:**
- Si `quantity === 1`: forma singular
- Si `quantity > 1`: forma plural
- Mapea variaciones a formas estándar (ej: `kg` → `kilo`/`kilos`)

**Ejemplos:**
```typescript
normalizeUnit('kg', 1)    // → 'kilo'
normalizeUnit('kg', 2)    // → 'kilos'
normalizeUnit('k', 3)     // → 'kilos'
normalizeUnit('cajon', 2) // → 'cajones'
```

### 5. `parseSegment(segment: string): ParsedOrderItem | null`

Parsea un segmento individual del mensaje usando múltiples patrones regex.

**Patrones aplicados en orden:**
1. Cantidad + Unidad + "de" + Producto
2. Cantidad + Unidad (sin espacio) + "de" + Producto
3. Cantidad + Unidad (sin espacio) + Producto
4. Cantidad + Unidad + Producto (con espacio)
5. Cantidad + Producto (sin unidad)
6. Producto + Cantidad + Unidad
7. Fracción + "de" + Producto

### 6. `splitLineIntoSegments(line: string): string[]`

Divide una línea en múltiples segmentos si contiene varios items.

**Estrategias:**
1. Divide por comas si están presentes
2. Detecta múltiples items sin separadores buscando patrones de cantidad
3. Valida que los segmentos sean parseables

### 7. `parseWhatsAppMessage(message: string): ParsedOrderItem[]`

Función principal que parsea un mensaje completo de WhatsApp.

**Proceso:**
1. Divide el mensaje en líneas
2. Para cada línea, divide en segmentos
3. Parsea cada segmento
4. Filtra resultados válidos
5. Retorna array de items parseados

## Interfaz de Datos

```typescript
interface ParsedOrderItem {
  quantity: number;   // Cantidad numérica
  unit: string;       // Unidad normalizada
  product: string;    // Nombre del producto
}
```

## Integración con WhatsApp Webhook

El parser está integrado en el Edge Function `whatsapp-webhook` que:

1. Recibe mensajes de WhatsApp Business API
2. Parsea el contenido del mensaje
3. Crea automáticamente pedidos en la base de datos
4. Envía respuestas automáticas (si está configurado)

## Pantalla de Pruebas

La aplicación incluye una pantalla de pruebas interactiva en:
```
app/settings/whatsapp-test.tsx
```

**Características:**
- Entrada de texto para mensajes de prueba
- Botones de ejemplo para cada formato
- Visualización de resultados parseados
- Estadísticas de parsing (items, cantidad total, unidades únicas)

## Manejo de Errores

El sistema es robusto y maneja errores de las siguientes maneras:

1. **Líneas no parseables**: Se registran en logs pero no detienen el proceso
2. **Cantidades inválidas**: Retornan 0 y continúan
3. **Unidades desconocidas**: Se normalizan a "unidad/unidades"
4. **Mensajes vacíos**: Retornan array vacío
5. **Fallback**: Si no se puede parsear nada, crea un pedido con el mensaje original

## Ejemplos de Uso

### Ejemplo 1: Mensaje Simple
```
Entrada:
3 kilos de tomates
2 kilos de papas

Salida:
[
  { quantity: 3, unit: "kilos", product: "tomates" },
  { quantity: 2, unit: "kilos", product: "papas" }
]
```

### Ejemplo 2: Formato Mixto
```
Entrada:
3k tomates
dos pepinos
1/2 kilo de cilantro

Salida:
[
  { quantity: 3, unit: "kilos", product: "tomates" },
  { quantity: 2, unit: "unidades", product: "pepinos" },
  { quantity: 0.5, unit: "kilo", product: "cilantro" }
]
```

### Ejemplo 3: Múltiples Items con Comas
```
Entrada:
3 kilos de tomates, 2k papas, cinco pepinos

Salida:
[
  { quantity: 3, unit: "kilos", product: "tomates" },
  { quantity: 2, unit: "kilos", product: "papas" },
  { quantity: 5, unit: "unidades", product: "pepinos" }
]
```

## Archivos Modificados

1. **`utils/whatsappParser.ts`**: Parser completo con todas las funciones
2. **`app/settings/whatsapp-test.tsx`**: Pantalla de pruebas interactiva
3. **Edge Function `whatsapp-webhook`**: Integración del parser en el webhook

## Pruebas

Para probar el parser:

1. Navega a **Perfil → WhatsApp Test**
2. Ingresa un mensaje o carga un ejemplo
3. Presiona "Probar"
4. Revisa los resultados parseados

## Logs y Debugging

El parser incluye logging extensivo:

```typescript
console.log(`✓ Parsed: "${segment}" →`, parsedItem);
console.warn(`✗ Could not parse: "${segment}"`);
console.log(`Parsed ${orderItems.length} items from ${lines.length} lines`);
```

Estos logs están disponibles en:
- Consola del navegador (app móvil)
- Logs del Edge Function (Supabase Dashboard)

## Mejoras Futuras

Posibles mejoras para considerar:

1. Soporte para números compuestos (ej: "treinta y dos")
2. Detección de precios en el mensaje
3. Reconocimiento de direcciones de entrega
4. Soporte para más idiomas
5. Machine learning para mejorar precisión
6. Corrección automática de errores ortográficos

## Conclusión

El sistema de parsing implementado es robusto, flexible y soporta una amplia variedad de formatos de entrada. Está completamente integrado con el sistema de pedidos y proporciona herramientas de prueba para validar su funcionamiento.
