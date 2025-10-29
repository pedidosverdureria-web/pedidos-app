
# Guía del Parser Inteligente de WhatsApp

## 🎯 Resumen

El parser de WhatsApp ha sido mejorado significativamente para reconocer pedidos del cliente **independientemente de cómo los envíe**. El sistema ahora utiliza técnicas de procesamiento de lenguaje natural (NLP) y validación secuencial para entender múltiples formatos, variaciones, y hasta errores tipográficos.

## ✨ Nuevas Capacidades

### 1. **Reconocimiento Inteligente de Productos**
- **Normalización de nombres**: Elimina acentos y convierte a minúsculas
- **Aliases de productos**: Reconoce variaciones comunes
  - `tomate` = `tomates`, `tomatito`, `jitomate`
  - `papa` = `papas`, `patata`, `patatas`
  - `palta` = `paltas`, `aguacate`, `aguacates`
  - `plátano` = `platano`, `banana`, `banano`
  - Y muchos más...

### 2. **Formatos Flexibles de Cantidad**
El parser reconoce cantidades en múltiples formatos:

#### Números Enteros
```
3 kilos de tomates
tres kilos de tomates
```

#### Fracciones
```
1/2 kilo de papas
medio kilo de papas
un cuarto de ají
```

#### Enteros + Fracciones
```
1 1/2 kilo de manzanas
1 kilo y medio de manzanas
2 1/4 kilos de papas
```

#### Decimales
```
1.5 kilos de tomates
2.25 kilos de papas
```

### 3. **Formatos de Pedido Soportados**

#### Formato Estándar
```
3 kilos de tomates
2 kilos de papas
1 lechuga
```

#### Formato Compacto (sin espacios)
```
3kilos de tomates
2k de papas
1kg de cebollas
```

#### Formato Sin "de"
```
3 kilos tomates
2 kilos papas
```

#### Producto + Cantidad
```
tomates 3 kilos
papas 2k
lechuga 1
```

#### Cantidad + Producto (sin unidad)
```
3 tomates
2 pepinos
5 lechugas
```

#### Solo Producto (asume 1 unidad)
```
cilantro
romero
tomillo bonito
```

#### Formato Pegado (sin espacios entre cantidad y producto)
```
1lechuga
2tomates
3papas
lechuga1
tomates2
```

#### Formato Horizontal (separado por comas)
```
3 kilos de tomates, 2 kilos de papas, 1 lechuga
```

#### Formato Mixto (múltiples items sin separadores)
```
3kilos tomates 2kilos papas 3 pepinos
```

### 4. **Unidades Reconocidas**

#### Peso
- `kilo`, `kilos`, `kg`, `kgs`, `k`, `kl`, `kilogramo`, `kilogramos`
- `gramo`, `gramos`, `gr`, `grs`, `g`, `gm`
- `libra`, `libras`, `lb`, `lbs`

#### Cantidad
- `unidad`, `unidades`, `u`, `und`, `unds`, `uni`

#### Empaque
- `malla`, `mallas`
- `saco`, `sacos`
- `cajón`, `cajon`, `cajones`

#### Contenedor
- `bolsa`, `bolsas`
- `paquete`, `paquetes`, `pqte`, `paq`

#### Otros
- `caja`, `cajas`
- `atado`, `atados`
- `racimo`, `racimos`
- `cabeza`, `cabezas`
- `docena`, `docenas`, `doc`
- `bandeja`, `bandejas`
- `cesta`, `cestas`, `canasta`, `canastas`
- `mano`, `manos`
- `cuelga`, `cuelgas`

### 5. **Validación Secuencial**

El parser utiliza **16 patrones de validación** ordenados de más específico a menos específico:

1. **Cantidad+Producto pegado** (sin espacio): `1lechuga`, `lechuga1`
2. **Entero + Fracción + Unidad + "de" + Producto**: `1 1/2 kilo de manzanas`
3. **Entero + Fracción + "de" + Producto**: `1 1/2 de manzana`
4. **Entero + Unidad + "y" + Fracción + "de" + Producto**: `1 kilo y medio de manzanas`
5. **Fracción + Unidad + "de" + Producto**: `medio kilo de papas`
6. **Fracción + "de" + Producto**: `medio de papas`
7. **Cantidad + Unidad + "de" + Producto**: `3 kilos de tomates`
8. **Cantidad + Unidad (sin espacio) + "de" + Producto**: `3kilos de tomates`
9. **Cantidad + Unidad (sin espacio) + Producto**: `3kilos tomates`
10. **Cantidad + Unidad + Producto**: `3 kilos tomates`
11. **Cantidad + Producto**: `3 tomates`
12. **Producto + Cantidad + Unidad**: `tomates 3 kilos`
13. **Producto + Unidad + Cantidad**: `tomates kilos 3`
14. **Producto + Cantidad**: `tomates 3`
15. **Fracción + "de" + Producto**: `1/4 de ají`
16. **Solo Producto**: `cilantro` (asume 1 unidad)

### 6. **Manejo de Errores**

#### Productos No Parseables
Si un producto no puede ser parseado correctamente, el sistema:
- Crea el producto con cantidad `#`
- Guarda el texto original como nombre del producto
- Notifica al cliente que debe revisar las cantidades
- Permite edición manual en la app

#### Unidades Desconocidas
Si se detecta una unidad no conocida:
- Se guarda en la base de datos automáticamente
- Se agrega a las variaciones de unidades
- Estará disponible para futuros pedidos

## 📝 Ejemplos de Uso

### Ejemplo 1: Formato Mixto
**Entrada del cliente:**
```
3kilos tomates 2kilos papas 1lechuga medio kilo cilantro
```

**Resultado:**
- 3 kilos de tomate
- 2 kilos de papa
- 1 unidad de lechuga
- 0.5 kilos de cilantro

### Ejemplo 2: Fracciones Complejas
**Entrada del cliente:**
```
1 1/2 kilo de manzanas
1 kilo y medio de papas
medio kilo de cilantro
1/4 de ají
```

**Resultado:**
- 1.5 kilos de manzana
- 1.5 kilos de papa
- 0.5 kilos de cilantro
- 0.25 unidades de ají

### Ejemplo 3: Formato Pegado
**Entrada del cliente:**
```
1lechuga
2tomates
3papas
pepinos5
```

**Resultado:**
- 1 unidad de lechuga
- 2 unidades de tomate
- 3 unidades de papa
- 5 unidades de pepino

### Ejemplo 4: Solo Productos
**Entrada del cliente:**
```
cilantro
romero
tomillo bonito
perejil
```

**Resultado:**
- 1 unidad de cilantro
- 1 unidad de romero
- 1 unidad de tomillo bonito
- 1 unidad de perejil

### Ejemplo 5: Formato Horizontal
**Entrada del cliente:**
```
3 kilos de tomates, 2 kilos de papas, 1 lechuga, medio kilo de cilantro
```

**Resultado:**
- 3 kilos de tomate
- 2 kilos de papa
- 1 unidad de lechuga
- 0.5 kilos de cilantro

## 🔧 Implementación Técnica

### Archivos Modificados

1. **`utils/whatsappParser.ts`**
   - Parser inteligente del lado del cliente
   - Normalización de productos
   - Validación secuencial
   - Manejo de errores

2. **`supabase/functions/whatsapp-webhook/index.ts`**
   - Parser inteligente del lado del servidor
   - Integración con base de datos
   - Detección de unidades desconocidas
   - Creación automática de pedidos

### Funciones Clave

#### `parseQuantityValue(quantityStr: string): number`
Parsea valores de cantidad en múltiples formatos:
- Enteros + fracciones con espacio
- Fracciones simples
- Números decimales
- Números en texto
- Palabras de fracciones

#### `normalizeProductName(product: string): string`
Normaliza nombres de productos:
- Elimina acentos
- Convierte a minúsculas
- Aplica aliases conocidos

#### `parseSegment(segment: string): ParsedOrderItem`
Parsea un segmento individual usando validación secuencial:
- Prueba 16 patrones diferentes
- Retorna el primer match exitoso
- Crea item con `#` si falla

#### `splitLineIntoSegments(line: string): string[]`
Divide una línea en múltiples segmentos:
- Detecta separadores (comas)
- Identifica múltiples items sin separadores
- Usa indicadores de cantidad

## 🎓 Mejores Prácticas

### Para Clientes

1. **Formato Recomendado** (más claro):
   ```
   3 kilos de tomates
   2 kilos de papas
   1 lechuga
   ```

2. **Formato Rápido** (también funciona):
   ```
   3k tomates
   2k papas
   1 lechuga
   ```

3. **Formato Horizontal** (para pedidos cortos):
   ```
   3 kilos de tomates, 2 kilos de papas, 1 lechuga
   ```

### Para Administradores

1. **Revisar Productos con `#`**:
   - Estos productos no pudieron ser parseados
   - Editar manualmente en la app
   - Confirmar cantidades con el cliente

2. **Monitorear Unidades Nuevas**:
   - El sistema detecta unidades desconocidas
   - Se agregan automáticamente a la base de datos
   - Revisar periódicamente en la tabla `known_units`

3. **Educar a los Clientes**:
   - Compartir ejemplos de formatos válidos
   - Usar el mensaje de ayuda automático
   - Mostrar el mensaje de bienvenida

## 🚀 Ventajas del Sistema

1. **Flexibilidad Total**: Acepta cualquier formato de pedido
2. **Tolerancia a Errores**: Maneja typos y variaciones
3. **Aprendizaje Automático**: Detecta y guarda nuevas unidades
4. **Normalización**: Unifica productos similares
5. **Feedback Claro**: Notifica al cliente sobre items no parseables
6. **Edición Manual**: Permite corrección en la app
7. **Validación Secuencial**: Prioriza formatos más específicos
8. **Soporte Multiidioma**: Reconoce variaciones regionales

## 📊 Estadísticas de Parsing

El parser registra en consola:
- Número de líneas procesadas
- Número de segmentos detectados
- Patrón utilizado para cada item
- Items no parseables
- Unidades desconocidas detectadas

Ejemplo de log:
```
========== INTELLIGENT PARSING (3 lines) ==========

--- Line 1: "3kilos tomates 2kilos papas"
  Segments: 2
  ✓ [P9] Compact no-de: "3kilos tomates" → 3 kilos de tomate
  ✓ [P9] Compact no-de: "2kilos papas" → 2 kilos de papa

--- Line 2: "1lechuga"
  Segments: 1
  ✓ [P1] Combined quantity+product: "1lechuga" → 1 unidad de lechuga

--- Line 3: "medio kilo cilantro"
  Segments: 1
  ✓ [P5] Fraction+Unit: "medio kilo cilantro" → 0.5 kilos de cilantro

========== PARSING COMPLETE: 4 items ==========
```

## 🔮 Futuras Mejoras

1. **Machine Learning**: Aprender de correcciones manuales
2. **Sugerencias Automáticas**: Proponer correcciones para items con `#`
3. **Detección de Contexto**: Inferir unidades basado en el producto
4. **Corrección de Typos**: Sugerir productos similares
5. **Análisis de Patrones**: Identificar formatos más usados por cliente
6. **Integración con IA**: Usar GPT para parsing complejo

## 📞 Soporte

Si encuentras un formato que no es reconocido:
1. Revisa los logs del parser
2. Identifica el patrón que falta
3. Agrega un nuevo patrón de validación
4. Actualiza esta documentación

---

**Última actualización**: Enero 2025
**Versión del Parser**: 2.0 (Intelligent)
