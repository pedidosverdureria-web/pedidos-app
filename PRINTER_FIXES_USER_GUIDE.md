
# Guía de Usuario - Correcciones de Impresora

## Mejoras Implementadas

Se han corregido tres problemas importantes relacionados con la impresión:

1. ✅ **Caracteres especiales se imprimen correctamente según configuración**
2. ✅ **Se eliminó la impresión duplicada**
3. ✅ **La impresión automática funciona con pantalla apagada**

---

## 1. Control de Caracteres Especiales

### ¿Qué se corrigió?
Anteriormente, aunque desactivaras la opción "Imprimir caracteres especiales", la ñ y los acentos seguían imprimiéndose. Ahora esta configuración funciona correctamente.

### ¿Cómo funciona ahora?

**Con caracteres especiales ACTIVADOS (predeterminado):**
```
Cliente: José Pérez
Producto: 2 kilos de piña
```

**Con caracteres especiales DESACTIVADOS:**
```
Cliente: Jose Perez
Producto: 2 kilos de pina
```

### ¿Cómo configurarlo?

1. Ve a **Configuración** → **Configuración de Impresora**
2. Busca la opción **"Imprimir caracteres especiales"**
3. Activa o desactiva según tu impresora:
   - ✅ **Activado**: Si tu impresora soporta ñ y acentos
   - ❌ **Desactivado**: Si tu impresora muestra símbolos raros
4. Presiona **"Guardar configuración"**

### ¿Cuándo desactivar caracteres especiales?

Desactiva esta opción si al imprimir ves:
- Símbolos extraños en lugar de ñ (como , ?, □)
- Acentos que se ven mal (á aparece como Ã¡)
- Caracteres que no se imprimen correctamente

---

## 2. Prevención de Impresión Duplicada

### ¿Qué se corrigió?
Antes, al presionar el botón de imprimir varias veces rápidamente, o cuando la auto-impresión se activaba, el mismo pedido se imprimía dos o más veces. Esto desperdiciaba papel y causaba confusión.

### ¿Cómo funciona ahora?

El sistema ahora detecta y previene impresiones duplicadas:

1. **Protección por 3 segundos**: Una vez que imprimes un pedido, no se puede volver a imprimir el mismo pedido durante 3 segundos
2. **Detección inteligente**: El sistema reconoce si ya se está imprimiendo ese pedido específico
3. **Mensaje en consola**: Si intentas imprimir un duplicado, verás: "Impresión duplicada detectada, omitiendo"

### Casos de uso:

**Antes:**
```
Usuario presiona "Imprimir" 3 veces rápido
→ Se imprimen 3 recibos ❌
```

**Ahora:**
```
Usuario presiona "Imprimir" 3 veces rápido
→ Se imprime 1 solo recibo ✅
→ Los otros 2 intentos se ignoran automáticamente
```

### ¿Qué pasa si necesito reimprimir?

Simplemente espera 3 segundos y podrás imprimir nuevamente. Este tiempo es suficiente para evitar duplicados accidentales pero lo suficientemente corto para no ser molesto.

---

## 3. Impresión Automática con Pantalla Apagada

### ¿Qué se corrigió?
La función de auto-impresión solo funcionaba cuando la pantalla estaba encendida. Ahora funciona correctamente incluso con la pantalla apagada.

### ¿Cómo funciona ahora?

**Sistema de dos pasos:**

1. **Con pantalla apagada** (Tarea en segundo plano):
   - El sistema detecta nuevos pedidos cada 60 segundos
   - Los pedidos se agregan a una cola de impresión
   - Se guardan para imprimir cuando enciendas la pantalla

2. **Al encender la pantalla** (Procesador en primer plano):
   - El sistema detecta que desbloqueaste el teléfono
   - Automáticamente imprime todos los pedidos en cola
   - Limpia la cola después de imprimir

### Flujo completo:

```
1. Activas auto-impresión ✅
2. Conectas la impresora ✅
3. Apagas la pantalla del teléfono 📱💤
4. Llega un nuevo pedido por WhatsApp 📨
5. El sistema lo detecta y lo agrega a la cola 📋
6. Enciendes la pantalla del teléfono 📱✨
7. ¡El pedido se imprime automáticamente! 🖨️✅
```

### Configuración recomendada:

1. Ve a **Configuración** → **Configuración de Impresora**
2. Activa **"Activar auto-impresión"**
3. Conecta tu impresora Bluetooth
4. Presiona **"Guardar configuración"**
5. Verifica que aparezca: **"Tarea en segundo plano activa"** ✅

### Consejos importantes:

- ✅ **Mantén la impresora encendida** todo el tiempo
- ✅ **No cierres la app completamente** (minimizar está bien)
- ✅ **Mantén el Bluetooth activado**
- ✅ **Desbloquea el teléfono periódicamente** para procesar la cola

### ¿Cada cuánto debo desbloquear el teléfono?

No hay un tiempo específico, pero recomendamos:
- **Cada 5-10 minutos** si esperas muchos pedidos
- **Cuando recibas una notificación** de nuevo pedido
- **Antes de atender a un cliente** para asegurar que todo esté impreso

---

## Verificación de Funcionamiento

### Test 1: Caracteres Especiales

1. Desactiva "Imprimir caracteres especiales"
2. Crea un pedido de prueba:
   - Cliente: "José Pérez"
   - Producto: "2 kilos de piña"
3. Imprime el pedido
4. **Resultado esperado**: Debe aparecer "Jose Perez" y "pina" (sin ñ ni acentos)

### Test 2: Prevención de Duplicados

1. Abre cualquier pedido
2. Presiona "Imprimir Pedido" 3 veces rápidamente
3. **Resultado esperado**: Solo se imprime 1 recibo

### Test 3: Impresión con Pantalla Apagada

1. Activa auto-impresión
2. Conecta la impresora
3. Apaga la pantalla del teléfono
4. Envía un pedido de prueba por WhatsApp
5. Espera 1-2 minutos
6. Enciende la pantalla
7. **Resultado esperado**: El pedido se imprime automáticamente en 5-10 segundos

---

## Solución de Problemas

### Los caracteres especiales siguen imprimiéndose

**Solución:**
1. Ve a Configuración → Impresora
2. Desactiva "Imprimir caracteres especiales"
3. Presiona "Guardar configuración"
4. Cierra y vuelve a abrir la app
5. Intenta imprimir nuevamente

### Todavía se imprimen duplicados

**Posibles causas:**
- Estás presionando el botón muy rápido (espera 3 segundos entre impresiones)
- Hay múltiples dispositivos conectados a la misma impresora

**Solución:**
- Espera 3 segundos entre cada impresión
- Verifica que solo un dispositivo esté conectado a la impresora

### La auto-impresión no funciona con pantalla apagada

**Verifica:**
1. ✅ Auto-impresión está activada
2. ✅ Impresora está conectada
3. ✅ Aparece "Tarea en segundo plano activa"
4. ✅ La app no está cerrada completamente
5. ✅ Bluetooth está activado

**Solución:**
1. Ve a Configuración → Impresora
2. Desactiva y vuelve a activar auto-impresión
3. Presiona "Guardar configuración"
4. Reconecta la impresora
5. Verifica el estado de la tarea en segundo plano

---

## Preguntas Frecuentes

### ¿Puedo cambiar el tiempo de espera para duplicados?

Actualmente está fijado en 3 segundos, que es el tiempo óptimo para prevenir duplicados sin ser molesto. En futuras versiones se podrá configurar.

### ¿Qué pasa si la impresora se desconecta con la pantalla apagada?

Los pedidos se quedarán en la cola y se intentarán imprimir cuando:
1. Enciendas la pantalla
2. La impresora esté conectada nuevamente

### ¿Se pierden pedidos si cierro la app?

Si cierras la app completamente (deslizando hacia arriba en el selector de apps), la tarea en segundo plano se detendrá. Recomendamos solo minimizar la app.

### ¿Cuántos pedidos puede guardar en cola?

No hay límite específico, pero recomendamos desbloquear el teléfono cada 10-15 minutos para procesar la cola y evitar acumulación.

### ¿Funciona con cualquier impresora térmica?

Sí, estas correcciones funcionan con cualquier impresora térmica Bluetooth de 58mm u 80mm que sea compatible con la app.

---

## Resumen de Mejoras

| Problema | Estado | Beneficio |
|----------|--------|-----------|
| Caracteres especiales | ✅ Corregido | Control total sobre cómo se imprimen ñ y acentos |
| Impresión duplicada | ✅ Corregido | Ahorro de papel y menos confusión |
| Pantalla apagada | ✅ Corregido | Auto-impresión verdaderamente automática |

---

## Soporte

Si encuentras algún problema con estas correcciones:

1. Verifica que estés usando la última versión de la app
2. Revisa la sección "Solución de Problemas" arriba
3. Consulta los logs en la consola para más detalles
4. Contacta al soporte técnico con capturas de pantalla

---

**Última actualización:** Enero 2025
**Versión de la app:** 1.0.0+
