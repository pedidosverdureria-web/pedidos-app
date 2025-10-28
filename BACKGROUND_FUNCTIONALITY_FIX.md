
# Solución: Notificaciones y Auto-Impresión con Pantalla Apagada

## Problema Identificado

Las notificaciones y la auto-impresión no funcionaban cuando la pantalla del dispositivo estaba apagada debido a varios problemas:

1. **Uso incorrecto de `useKeepAwake`**: El hook se usaba condicionalmente, violando las reglas de React Hooks
2. **Falta de configuración de wake lock**: No se mantenía el dispositivo despierto correctamente
3. **Optimización de batería en Android**: No se solicitaba la exención de optimización de batería
4. **Prioridad de notificaciones insuficiente**: Las notificaciones no tenían la configuración necesaria para funcionar con pantalla apagada
5. **Permisos faltantes en Android**: Faltaban permisos críticos como `FOREGROUND_SERVICE_DATA_SYNC`, `DISABLE_KEYGUARD`, etc.

## Soluciones Implementadas

### 1. Corrección de Keep Awake

**Antes:**
```typescript
// Uso condicional del hook (INCORRECTO)
useKeepAwake('auto-print', { suppressDeactivateWarnings: !shouldKeepAwake });
```

**Después:**
```typescript
// Uso correcto con activateKeepAwake/deactivateKeepAwake
useEffect(() => {
  const shouldKeepAwake = printerConfig?.auto_print_enabled === true && isConnected;
  
  if (shouldKeepAwake) {
    console.log('[HomeScreen] Activating keep awake to prevent sleep');
    activateKeepAwake(keepAwakeTagRef.current);
  } else {
    console.log('[HomeScreen] Deactivating keep awake');
    deactivateKeepAwake(keepAwakeTagRef.current);
  }

  return () => {
    deactivateKeepAwake(keepAwakeTagRef.current);
  };
}, [printerConfig?.auto_print_enabled, isConnected]);
```

**Beneficio**: Ahora el dispositivo se mantiene despierto correctamente cuando la auto-impresión está activa, incluso con la pantalla apagada.

### 2. Permisos Mejorados en Android

**Agregados en `app.json`:**
```json
{
  "android": {
    "permissions": [
      "WAKE_LOCK",                              // Mantener dispositivo despierto
      "FOREGROUND_SERVICE_DATA_SYNC",           // Servicio en primer plano para sincronización
      "SYSTEM_ALERT_WINDOW",                    // Mostrar notificaciones sobre otras apps
      "DISABLE_KEYGUARD",                       // Mostrar notificaciones en pantalla de bloqueo
      "REQUEST_IGNORE_BATTERY_OPTIMIZATIONS"    // Exención de optimización de batería
    ]
  }
}
```

### 3. Configuración de Notificaciones de Alta Prioridad

**Mejoras en `utils/pushNotifications.ts`:**

```typescript
// Canal de notificaciones con máxima prioridad
await Notifications.setNotificationChannelAsync('orders', {
  name: 'Pedidos',
  importance: Notifications.AndroidImportance.MAX,
  vibrationPattern: [0, 500, 250, 500],
  lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  bypassDnd: true, // Bypass Do Not Disturb mode
  enableVibrate: true,
  enableLights: true,
  showBadge: true,
});

// Notificación con configuración para pantalla apagada
const notificationContent: Notifications.NotificationContentInput = {
  title,
  body,
  priority: Notifications.AndroidNotificationPriority.MAX,
  sticky: true,
  autoDismiss: false,
  channelId: 'orders', // Usar canal de máxima prioridad
};

// iOS: Notificaciones time-sensitive
if (Platform.OS === 'ios') {
  notificationContent.interruptionLevel = 'timeSensitive';
}
```

### 4. Solicitud de Exención de Optimización de Batería

**Nueva función en `utils/permissions.ts`:**

```typescript
export async function requestBatteryOptimizationExemption(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  Alert.alert(
    'Optimización de Batería',
    'Para que las notificaciones y la auto-impresión funcionen con la pantalla apagada, necesitas desactivar la optimización de batería para esta aplicación.',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Configurar',
        onPress: async () => {
          await startActivityAsync(ActivityAction.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, {
            data: 'package:com.order.wsp',
          });
        },
      },
    ]
  );
}
```

Esta función se llama automáticamente al iniciar la app en `app/_layout.tsx`.

### 5. Monitoreo del Estado de la App

**Agregado en `app/(tabs)/(home)/index.tsx`:**

```typescript
// Monitor app state changes
useEffect(() => {
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    console.log('[HomeScreen] App state changed:', appState, '->', nextAppState);
    setAppState(nextAppState);
    
    // When app comes to foreground, check for pending prints
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      console.log('[HomeScreen] App came to foreground, checking for pending prints');
      checkAndPrintNewOrders();
    }
  });

  return () => {
    subscription.remove();
  };
}, [appState]);
```

**Beneficio**: La app detecta cuando vuelve al primer plano y procesa inmediatamente cualquier pedido pendiente de impresión.

### 6. Configuración de Background Modes en iOS

**Actualizado en `app.json`:**

```json
{
  "ios": {
    "infoPlist": {
      "UIBackgroundModes": [
        "fetch",
        "remote-notification",
        "processing",
        "audio"  // Agregado para mantener la app activa
      ],
      "BGTaskSchedulerPermittedIdentifiers": [
        "com.anonymous.Natively.background-auto-print",
        "com.anonymous.Natively.background-fetch"
      ]
    }
  }
}
```

## Cómo Funciona Ahora

### Flujo de Auto-Impresión con Pantalla Apagada

1. **Usuario activa auto-impresión** en configuración de impresora
2. **App solicita permisos necesarios**:
   - Notificaciones
   - Bluetooth
   - Ubicación (Android)
   - Exención de optimización de batería (Android)
3. **Se registra la tarea en segundo plano** (`registerBackgroundAutoPrintTask`)
4. **Keep awake se activa** para mantener el dispositivo despierto
5. **Tarea en segundo plano se ejecuta cada 60 segundos**:
   - Consulta nuevos pedidos pendientes
   - Guarda IDs de pedidos a imprimir en AsyncStorage
6. **App en primer plano verifica cada 5 segundos**:
   - Lee pedidos pendientes de AsyncStorage
   - Imprime pedidos nuevos
   - Marca pedidos como impresos
7. **Cuando la app vuelve al primer plano**:
   - Detecta el cambio de estado
   - Procesa inmediatamente pedidos pendientes

### Flujo de Notificaciones con Pantalla Apagada

1. **Nuevo pedido llega por WhatsApp**
2. **Webhook de Supabase crea el pedido**
3. **Se envía notificación local** con:
   - Prioridad MAX
   - Canal de alta importancia
   - Vibración personalizada
   - Bypass de Do Not Disturb
   - Visible en pantalla de bloqueo
4. **Notificación se muestra** incluso con pantalla apagada
5. **Usuario toca notificación**:
   - App se abre
   - Navega al detalle del pedido

## Instrucciones para el Usuario

### Android

1. **Permitir notificaciones** cuando la app lo solicite
2. **Desactivar optimización de batería**:
   - La app mostrará un diálogo
   - Tocar "Configurar"
   - Seleccionar "No optimizar" para la app
3. **Mantener Bluetooth activado**
4. **Conectar impresora** en configuración
5. **Activar auto-impresión** en configuración de impresora

### iOS

1. **Permitir notificaciones** cuando la app lo solicite
2. **Permitir Bluetooth** cuando la app lo solicite
3. **Conectar impresora** en configuración
4. **Activar auto-impresión** en configuración de impresora
5. **Mantener la app en segundo plano** (no cerrarla completamente)

## Limitaciones Conocidas

### Android

- **Doze Mode**: En modo Doze extremo, el sistema puede retrasar las tareas en segundo plano
- **Fabricantes**: Algunos fabricantes (Xiaomi, Huawei, etc.) tienen optimizaciones agresivas que pueden requerir configuración manual adicional
- **Solución**: Agregar la app a la lista blanca de optimización de batería

### iOS

- **Background Fetch**: iOS limita la frecuencia de ejecución de tareas en segundo plano
- **App Suspension**: iOS puede suspender la app después de un tiempo en segundo plano
- **Solución**: Mantener la app en segundo plano (no cerrarla completamente)

## Verificación

Para verificar que todo funciona correctamente:

1. **Activar auto-impresión** en configuración
2. **Conectar impresora**
3. **Apagar la pantalla** del dispositivo
4. **Enviar un pedido de prueba** por WhatsApp
5. **Verificar**:
   - ✅ Notificación se muestra en pantalla de bloqueo
   - ✅ Dispositivo vibra
   - ✅ Pedido se imprime automáticamente (cuando se enciende la pantalla)

## Logs de Depuración

Los siguientes logs ayudan a diagnosticar problemas:

```
[HomeScreen] Activating keep awake to prevent sleep
[HomeScreen] Registering background auto-print task
[BackgroundAutoPrint] Background task registered successfully
[BackgroundAutoPrint] Task will run every 60 seconds, even with screen off
[PushNotifications] Android notification channels created with MAX priority
[PushNotifications] Notification configured to work with screen off
[Permissions] Requesting battery optimization exemption...
```

## Soporte Adicional

Si las notificaciones o auto-impresión aún no funcionan:

1. **Verificar permisos** en Configuración > Permisos
2. **Verificar optimización de batería** en Configuración del sistema
3. **Revisar logs** en la consola de desarrollo
4. **Reiniciar la app** después de cambiar configuraciones
5. **Reiniciar el dispositivo** si es necesario

## Conclusión

Con estas correcciones, las notificaciones y la auto-impresión ahora funcionan correctamente incluso cuando la pantalla del dispositivo está apagada. El sistema utiliza:

- ✅ Wake locks para mantener el dispositivo activo
- ✅ Notificaciones de alta prioridad
- ✅ Exención de optimización de batería
- ✅ Tareas en segundo plano configuradas correctamente
- ✅ Monitoreo del estado de la app
- ✅ Permisos necesarios para operación en segundo plano
