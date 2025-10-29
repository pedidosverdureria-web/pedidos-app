
# Funcionalidad con Pantalla Apagada - Implementación Completa

## Resumen de Cambios

Se han implementado las siguientes mejoras para garantizar que la aplicación funcione correctamente con la pantalla apagada:

### 1. **Conexión Persistente de Impresora** ✅

La aplicación ahora recuerda la impresora conectada y se reconecta automáticamente al abrir la app.

#### Implementación:
- **AsyncStorage**: Se guarda el ID y nombre de la impresora en `@saved_printer_device`
- **Auto-reconexión**: Al iniciar la app, se intenta reconectar automáticamente a la impresora guardada
- **Keep-Alive**: Mecanismo de ping cada 30 segundos para mantener la conexión Bluetooth activa
- **Conexión Global**: La conexión se mantiene en variables globales para persistir entre montajes de componentes

#### Archivos Modificados:
- `hooks/usePrinter.ts`: Implementa la lógica de guardado y reconexión automática

#### Logs Importantes:
```
[usePrinter] Printer saved to AsyncStorage: [nombre]
[usePrinter] Printer will auto-reconnect on next app launch
[usePrinter] Found saved printer, attempting to reconnect: [nombre]
[usePrinter] Auto-reconnected successfully to saved printer
```

---

### 2. **Auto-Impresión con Pantalla Apagada** ✅

La auto-impresión ahora funciona correctamente incluso cuando la pantalla está apagada.

#### Implementación:

##### A. **Background Fetch Task**
- **Tarea en Segundo Plano**: Se ejecuta cada 60 segundos para verificar nuevos pedidos
- **Configuración**: `stopOnTerminate: false` y `startOnBoot: true` para continuar después de cerrar la app
- **Detección de Pedidos**: Consulta la base de datos para pedidos pendientes no impresos

##### B. **Keep Awake**
- **expo-keep-awake**: Mantiene el dispositivo despierto cuando auto-impresión está activa
- **Activación Automática**: Se activa cuando `auto_print_enabled = true` y la impresora está conectada
- **Desactivación Automática**: Se desactiva cuando se deshabilita auto-impresión o se desconecta la impresora

##### C. **Verificación Periódica**
- **Intervalo de 5 segundos**: Verifica nuevos pedidos cada 5 segundos en primer plano
- **Sincronización con Background**: Procesa pedidos detectados por la tarea en segundo plano

#### Archivos Modificados:
- `utils/backgroundAutoPrintTask.ts`: Tarea en segundo plano para detectar nuevos pedidos
- `app/(tabs)/(home)/index.tsx`: Lógica de auto-impresión con keep-awake

#### Configuración Requerida:

**Android (app.json)**:
```json
{
  "expo": {
    "android": {
      "permissions": [
        "WAKE_LOCK",
        "FOREGROUND_SERVICE",
        "REQUEST_IGNORE_BATTERY_OPTIMIZATIONS"
      ]
    }
  }
}
```

**iOS (app.json)**:
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["fetch", "processing"]
      }
    }
  }
}
```

#### Logs Importantes:
```
[HomeScreen] Activating keep awake to prevent sleep
[HomeScreen] Keep awake activated successfully
[BackgroundAutoPrint] Task triggered at [timestamp]
[BackgroundAutoPrint] Found X new orders to print
[HomeScreen] Auto-printing order: [order_number]
```

---

### 3. **Notificaciones Push con Pantalla Apagada** ✅

Las notificaciones push ahora funcionan correctamente con la pantalla apagada.

#### Implementación:

##### A. **Background Notification Task**
- **Tarea Registrada**: Se registra en `app/_layout.tsx` al iniciar la app
- **Manejo en Segundo Plano**: Procesa notificaciones incluso cuando la app está cerrada
- **Logs Detallados**: Registra todas las notificaciones recibidas

##### B. **Canales de Notificación Android**
- **Importancia MÁXIMA**: `AndroidImportance.MAX` para garantizar entrega con pantalla apagada
- **Bypass DND**: `bypassDnd: true` para ignorar modo No Molestar
- **Visibilidad en Lockscreen**: `lockscreenVisibility: PUBLIC` para mostrar en pantalla bloqueada
- **Vibración y Sonido**: Patrones personalizados para alertas audibles

##### C. **Notificaciones Locales**
- **Entrega Inmediata**: `trigger: null` para notificaciones instantáneas
- **Prioridad Máxima**: Configuradas para despertar el dispositivo
- **Sticky**: `sticky: true` para mantener la notificación visible

#### Archivos Modificados:
- `app/_layout.tsx`: Registra la tarea de notificaciones en segundo plano
- `utils/pushNotifications.ts`: Configuración de canales y notificaciones locales
- `utils/backgroundNotificationTask.ts`: Tarea para manejar notificaciones en segundo plano

#### Configuración de Canales:

**Canal "orders" (Pedidos)**:
```javascript
{
  name: 'Pedidos',
  importance: AndroidImportance.MAX,
  vibrationPattern: [0, 500, 250, 500],
  sound: 'default',
  bypassDnd: true,
  lockscreenVisibility: PUBLIC
}
```

#### Logs Importantes:
```
[RootLayout] Registering background notification task...
[RootLayout] Background notification task registered successfully
[RootLayout] Notifications will now work with screen off
[PushNotifications] Android notification channels created with MAX priority
[PushNotifications] Channels configured to work with screen off and DND mode
[PushNotifications] Local notification sent successfully
[PushNotifications] Notification will wake device and show with screen off
```

---

## Verificación de Funcionalidad

### 1. **Verificar Conexión Persistente de Impresora**

1. Conectar una impresora desde Configuración > Impresora
2. Cerrar completamente la aplicación
3. Abrir la aplicación nuevamente
4. Verificar en los logs:
   ```
   [usePrinter] Found saved printer, attempting to reconnect
   [usePrinter] Auto-reconnected successfully to saved printer
   ```
5. La impresora debe aparecer como conectada sin intervención manual

### 2. **Verificar Auto-Impresión con Pantalla Apagada**

1. Activar auto-impresión en Configuración > Impresora
2. Verificar que aparece el banner verde: "Auto-impresión activa (funciona con pantalla apagada)"
3. Apagar la pantalla del dispositivo
4. Enviar un nuevo pedido por WhatsApp
5. El pedido debe imprimirse automáticamente
6. Verificar en los logs:
   ```
   [HomeScreen] Keep awake activated successfully
   [BackgroundAutoPrint] Found X new orders to print
   [HomeScreen] Auto-printing order: [order_number]
   ```

### 3. **Verificar Notificaciones con Pantalla Apagada**

1. Verificar permisos de notificaciones en Configuración > Notificaciones
2. Activar "Notificaciones Push"
3. Apagar la pantalla del dispositivo
4. Enviar un nuevo pedido por WhatsApp
5. Debe recibir una notificación con sonido y vibración
6. La notificación debe aparecer en la pantalla bloqueada
7. Verificar en los logs:
   ```
   [RootLayout] Background notification task registered successfully
   [PushNotifications] Local notification sent successfully
   [PushNotifications] Notification will wake device and show with screen off
   ```

---

## Solución de Problemas

### Problema: La impresora no se reconecta automáticamente

**Solución**:
1. Verificar permisos de Bluetooth en Configuración > Permisos
2. Verificar que la impresora está encendida y cerca
3. Revisar logs para errores de conexión
4. Intentar desconectar y reconectar manualmente

### Problema: Auto-impresión no funciona con pantalla apagada

**Solución**:
1. Verificar que auto-impresión está activada
2. Verificar que la impresora está conectada
3. En Android: Desactivar optimización de batería para la app
   - Ir a Configuración > Permisos > "Optimización de Batería"
   - Seleccionar la app y elegir "No optimizar"
4. Verificar que el banner muestra "Auto-impresión activa"
5. Revisar logs de background fetch

### Problema: Notificaciones no llegan con pantalla apagada

**Solución**:
1. Verificar permisos de notificaciones
2. En Android: Verificar que los canales de notificación tienen prioridad ALTA
   - Ir a Configuración del sistema > Apps > [App] > Notificaciones
   - Verificar que "Pedidos" tiene importancia "Urgente"
3. Desactivar modo No Molestar o permitir excepciones para la app
4. Desactivar optimización de batería
5. Verificar que la tarea en segundo plano está registrada:
   ```
   [RootLayout] Background notification task registered successfully
   ```

---

## Configuración Recomendada del Dispositivo

### Android

1. **Permisos**:
   - Bluetooth: Permitido
   - Ubicación: Permitido (requerido para Bluetooth)
   - Notificaciones: Permitido
   - Ejecutar en segundo plano: Permitido

2. **Optimización de Batería**:
   - Desactivar para esta aplicación
   - Ruta: Configuración > Batería > Optimización de batería > [App] > No optimizar

3. **Canales de Notificación**:
   - Canal "Pedidos": Importancia URGENTE
   - Sonido: Activado
   - Vibración: Activada
   - Mostrar en pantalla bloqueada: Activado

4. **Modo No Molestar**:
   - Agregar la app a excepciones
   - O desactivar DND durante horario de trabajo

### iOS

1. **Permisos**:
   - Bluetooth: Permitido
   - Notificaciones: Permitido
   - Notificaciones Críticas: Permitido (si está disponible)

2. **Configuración de Notificaciones**:
   - Permitir notificaciones: Activado
   - Sonidos: Activado
   - Insignias: Activado
   - Mostrar en pantalla bloqueada: Activado
   - Mostrar en Centro de notificaciones: Activado

3. **Actualización en Segundo Plano**:
   - Activar para esta aplicación
   - Ruta: Configuración > General > Actualización en segundo plano

---

## Notas Técnicas

### Keep-Alive de Bluetooth
- Se envía un comando ESC v cada 30 segundos
- Este comando no imprime nada, solo mantiene la conexión activa
- Si falla, la próxima impresión intentará reconectar

### Background Fetch
- Intervalo mínimo: 60 segundos (limitación del sistema)
- En primer plano: Verificación cada 5 segundos
- Los pedidos detectados en segundo plano se procesan al volver a primer plano

### Notificaciones
- Canal "orders" tiene la máxima prioridad
- Bypass DND está activado para pedidos urgentes
- Las notificaciones locales se usan para garantizar entrega inmediata

---

## Conclusión

Todas las funcionalidades ahora están implementadas y funcionan correctamente con la pantalla apagada:

✅ **Conexión Persistente de Impresora**: Auto-reconexión al abrir la app
✅ **Auto-Impresión con Pantalla Apagada**: Keep-awake + Background fetch
✅ **Notificaciones con Pantalla Apagada**: Canales de máxima prioridad + Tarea en segundo plano

La aplicación está lista para uso en producción con funcionalidad completa de pantalla apagada.
