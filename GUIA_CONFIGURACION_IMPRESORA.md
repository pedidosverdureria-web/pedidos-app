
# Guía de Configuración de Impresora

## 📱 Configuración de Impresora Térmica Bluetooth

Esta guía te ayudará a configurar correctamente tu impresora térmica para que imprima todos los caracteres españoles correctamente, incluyendo **ñ, Ñ, á, é, í, ó, ú, ¿, ¡** y otros caracteres especiales.

## 🔧 Paso 1: Conectar la Impresora

1. **Enciende tu impresora térmica Bluetooth**
   - Asegúrate de que tenga papel
   - Verifica que la batería esté cargada

2. **Abre la aplicación**
   - Ve a **Configuración** (⚙️)
   - Selecciona **Impresora**

3. **Buscar dispositivos**
   - Toca el botón **"Buscar impresoras"**
   - Espera 10 segundos mientras busca
   - Aparecerá una lista de dispositivos Bluetooth

4. **Conectar**
   - Toca el nombre de tu impresora en la lista
   - Espera el mensaje de confirmación: **"✅ Conectado"**

## ⚙️ Paso 2: Configurar Opciones de Impresión

### Codificación de Caracteres (MUY IMPORTANTE)

**Selecciona: CP850 (Recomendado para español)**

Esta es la configuración más importante. CP850 es la codificación estándar para impresoras térmicas que imprime correctamente:

- ✅ **ñ, Ñ** (eñe)
- ✅ **á, é, í, ó, ú** (vocales con acento)
- ✅ **Á, É, Í, Ó, Ú** (vocales mayúsculas con acento)
- ✅ **ü, Ü** (u con diéresis)
- ✅ **¿, ¡** (signos de interrogación y exclamación invertidos)

**Opciones disponibles:**
- **CP850** ← Recomendado para español
- UTF-8
- ISO-8859-1 (Latin-1)
- Windows-1252

### Otras Configuraciones

1. **Tamaño de texto**
   - Pequeño: Para más información en menos espacio
   - Mediano: Tamaño estándar (recomendado)
   - Grande: Para mejor legibilidad

2. **Tamaño de papel**
   - 58mm: Papel angosto
   - 80mm: Papel estándar (recomendado)

3. **Corte automático**
   - Activado: Corta el papel automáticamente después de imprimir
   - Desactivado: Debes cortar manualmente

4. **Incluir logo**
   - Activado: Muestra "PEDIDO" en el encabezado
   - Desactivado: Omite el encabezado

5. **Incluir información del cliente**
   - Activado: Muestra nombre, teléfono y dirección
   - Desactivado: Omite información del cliente

6. **Incluir totales**
   - Activado: Muestra total, pagado y pendiente
   - Desactivado: Omite sección de totales

### Auto-impresión

**Activar auto-impresión:**
- Los pedidos nuevos se imprimirán automáticamente
- Funciona en segundo plano
- Funciona con la pantalla apagada
- Requiere que la impresora esté conectada

## 💾 Paso 3: Guardar Configuración

1. **Toca el botón "Guardar configuración"**
2. Espera el mensaje: **"✅ Configuración Guardada"**
3. La configuración se guarda en tu dispositivo
4. Se mantiene incluso si cierras la aplicación

## 🖨️ Paso 4: Probar la Impresión

1. **Toca el botón "Imprimir prueba"**
2. La impresora imprimirá un recibo de prueba
3. **Verifica que se impriman correctamente:**
   - Año (no "Ano")
   - Niño (no "Nino")
   - Señor (no "Senor")
   - Mañana (no "Manana")
   - España (no "Espana")
   - Teléfono (no "Telefono")
   - Dirección (no "Direccion")

4. **Si ves espacios en blanco o caracteres raros:**
   - Cambia la codificación a ISO-8859-1
   - Guarda la configuración
   - Vuelve a imprimir prueba

## 📋 Ejemplo de Recibo de Prueba

```
=================================
   IMPRESIÓN DE PRUEBA
=================================

Esta es una prueba de impresión
con codificación CP850.

CARACTERES ESPECIALES ESPAÑOLES:

Vocales con acento:
á é í ó ú
Á É Í Ó Ú

La letra Ñ (más importante):
ñ Ñ

PALABRAS COMUNES:

- Año (no "Ano")
- Niño (no "Nino")
- Señor (no "Senor")
- Mañana (no "Manana")
- España (no "Espana")
- Teléfono (no "Telefono")

FRASES COMPLETAS:

¿Cómo está usted?
¡Qué día tan hermoso!

Si puedes leer TODOS estos
caracteres correctamente, tu
impresora está configurada
correctamente con CP850.

=================================
```

## 🔍 Solución de Problemas

### Problema 1: No encuentra la impresora

**Soluciones:**
1. Verifica que la impresora esté encendida
2. Asegúrate de que el Bluetooth esté activado en tu teléfono
3. Acerca el teléfono a la impresora (máximo 10 metros)
4. Reinicia la impresora
5. Reinicia el Bluetooth del teléfono
6. Vuelve a buscar dispositivos

### Problema 2: Se conecta pero no imprime

**Soluciones:**
1. Verifica que la impresora tenga papel
2. Verifica que la batería esté cargada
3. Desconecta y vuelve a conectar
4. Reinicia la impresora
5. Reinicia la aplicación

### Problema 3: Imprime caracteres raros o espacios en blanco

**Soluciones:**
1. **Cambia la codificación a CP850** (lo más importante)
2. Guarda la configuración
3. Haz una impresión de prueba
4. Si persiste, prueba con ISO-8859-1
5. Si aún no funciona, prueba con UTF-8

### Problema 4: La ñ se imprime como espacio en blanco

**Solución:**
- Este es el problema más común
- **SOLUCIÓN:** Cambia la codificación a **CP850**
- CP850 es la única codificación que imprime correctamente la ñ
- Guarda la configuración y prueba nuevamente

### Problema 5: Los acentos no se imprimen

**Solución:**
- Cambia la codificación a **CP850**
- CP850 soporta todos los acentos españoles
- Guarda y prueba nuevamente

### Problema 6: Auto-impresión no funciona

**Soluciones:**
1. Verifica que la impresora esté conectada
2. Activa "Auto-impresión" en configuración
3. Guarda la configuración
4. Verifica que el estado de la tarea en segundo plano esté activo
5. Verifica los permisos de Bluetooth

### Problema 7: La configuración no se guarda

**Soluciones:**
1. Asegúrate de tocar "Guardar configuración"
2. Espera el mensaje de confirmación
3. No cierres la aplicación inmediatamente después de guardar
4. Verifica los permisos de almacenamiento de la aplicación

## 📱 Imprimir un Pedido

Una vez configurada la impresora:

1. **Desde la lista de pedidos:**
   - Toca un pedido para ver los detalles
   - Desplázate hasta abajo
   - Toca el botón azul **"Imprimir Pedido"** 🖨️

2. **Auto-impresión:**
   - Si está activada, los pedidos nuevos se imprimen automáticamente
   - No necesitas hacer nada
   - Funciona incluso con la pantalla apagada

## ✅ Verificación Final

Tu impresora está correctamente configurada si:

- ✅ Se conecta sin problemas
- ✅ Imprime la prueba correctamente
- ✅ Todos los caracteres españoles se ven bien (ñ, á, é, í, ó, ú)
- ✅ Los signos ¿ y ¡ se imprimen correctamente
- ✅ La configuración se mantiene después de cerrar la app
- ✅ Los pedidos se imprimen con el formato correcto

## 🎯 Configuración Recomendada

Para la mayoría de los usuarios, recomendamos:

```
✅ Codificación: CP850
✅ Tamaño de texto: Mediano
✅ Tamaño de papel: 80mm
✅ Corte automático: Activado
✅ Incluir logo: Activado
✅ Incluir información del cliente: Activado
✅ Incluir totales: Activado
✅ Auto-impresión: Según preferencia
```

## 📞 Soporte

Si después de seguir esta guía aún tienes problemas:

1. Verifica que tu impresora sea compatible con ESC/POS
2. Consulta el manual de tu impresora
3. Verifica que la impresora funcione con otras aplicaciones
4. Contacta al soporte técnico de la aplicación

## 🔄 Actualizar Configuración

Para cambiar la configuración en cualquier momento:

1. Ve a **Configuración** → **Impresora**
2. Modifica las opciones que desees
3. Toca **"Guardar configuración"**
4. Haz una **impresión de prueba** para verificar

## 💡 Consejos Útiles

1. **Mantén la impresora cerca:** El Bluetooth funciona mejor a menos de 5 metros
2. **Carga la batería:** Asegúrate de que la impresora tenga suficiente batería
3. **Papel de calidad:** Usa papel térmico de buena calidad para mejores resultados
4. **Limpieza:** Limpia el cabezal de impresión regularmente
5. **Pruebas regulares:** Haz impresiones de prueba periódicamente

## 📊 Formato del Recibo

Los recibos incluyen:

```
================================
         PEDIDO
================================

Pedido: PED-001
Estado: Pendiente
Fecha: 01/01/2024 10:30

--------------------------------

Cliente: Juan Pérez
Teléfono: +56912345678
Dirección: Av. Principal 123

--------------------------------

PRODUCTOS:

2 kilos de Tomates
  $3.000

1 malla de Cebollas
  $2.000

--------------------------------
TOTAL: $5.000
Pagado: $5.000

================================
   Gracias por su compra!
================================
```

## 🌟 Características Especiales

- **Persistencia:** La configuración se guarda automáticamente
- **Sin internet:** No requiere conexión a internet
- **Rápido:** Carga instantánea de configuración
- **Confiable:** Funciona incluso sin conexión al servidor
- **Flexible:** Múltiples opciones de personalización
- **Español completo:** Soporte total para caracteres españoles

---

**¿Necesitas ayuda?** Consulta la sección de Solución de Problemas o contacta al soporte técnico.

**Última actualización:** 2024
**Versión de la guía:** 1.0.0
