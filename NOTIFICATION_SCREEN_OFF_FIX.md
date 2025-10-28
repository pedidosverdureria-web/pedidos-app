
# Notificaciones con Pantalla Apagada - Solución Implementada

## Problema
Las notificaciones no se mostraban cuando la pantalla del dispositivo estaba apagada o el dispositivo estaba en modo de suspensión.

## Solución Implementada

### 1. Registro de Tarea en Segundo Plano (Background Notification Task)

**Archivo: `utils/backgroundNotificationTask.ts`**

Se ha mejorado la tarea de notificaciones en segundo plano para:
- Procesar notificaciones cuando la app está en segundo plano o cerrada
- Manejar interacciones del usuario con las notificaciones
- Registrar logs detallados para debugging

**Cambios clave:**
- La tarea se define con `TaskManager.defineTask` y procesa tanto notificaciones recibidas como respuestas del usuario
- Incluye logging extensivo para facilitar el debugging
- Maneja errores de forma robusta

### 2. Registro Automático al Iniciar la App

**Archivo: `app/_layout.tsx`**

Se agregó un `useEffect` en el layout raíz que:
- Registra la tarea de notificaciones en segundo plano al iniciar la app
- Se ejecuta solo en plataformas nativas (no en web)
- Incluye manejo de errores y logging

```typescript
useEffect(() => {
  const registerNotificationTask = async () => {
    if (Platform.OS !== 'web') {
      try {
        console.log('[RootLayout] Registering background notification task...');
        await registerBackgroundNotificationTask();
        console.log('[RootLayout] Background notification task registered successfully');
      } catch (error) {
        console.error('[RootLayout] Failed to register background notification task:', error);
      }
    }
  };

  registerNotificationTask();
}, []);
```

### 3. Configuración de Canales de Notificación Android

**Archivo: `utils/pushNotifications.ts`**

Los canales de notificación Android se configuran con:
- `importance: AndroidImportance.MAX` - Máxima prioridad
- `bypassDnd: true` - Omite el modo No Molestar
- `lockscreenVisibility: PUBLIC` - Visible en pantalla de bloqueo
- `enableVibrate: true` - Habilita vibración
- `enableLights: true` - Habilita luz LED
- Patrones de vibración personalizados para llamar la atención

### 4. Configuración de Notificaciones Locales

**Archivo: `utils/pushNotifications.ts`**

Las notificaciones locales se envían con:
- `priority: MAX` - Máxima prioridad en Android
- `sticky: true` - La notificación permanece visible
- `autoDismiss: false` - No se descarta automáticamente
- `interruptionLevel: 'timeSensitive'` - Para iOS 15+
- Patrón de vibración personalizado

### 5. Permisos Android Adicionales

**Archivo: `app.json`**

Se agregaron permisos críticos para Android:
- `VIBRATE` - Permite vibración
- `USE_FULL_SCREEN_INTENT` - Permite notificaciones de pantalla completa
- `useNextNotificationsApi: true` - Usa la API moderna de notificaciones

### 6. Configuración iOS

**Archivo: `app.json`**

Se configuró `UIBackgroundModes` para iOS:
- `remote-notification` - Notificaciones remotas en segundo plano
- `fetch` - Actualización en segundo plano
- `processing` - Procesamiento en segundo plano
- `audio` - Mantiene la app activa

## Cómo Funciona

### Flujo de Notificaciones

1. **Cuando llega un nuevo pedido por WhatsApp:**
   - El webhook de Supabase crea el pedido en la base de datos
   - Se llama a `notifyAdmins()` que envía una notificación local
   - La notificación se configura con máxima prioridad

2. **Con la pantalla apagada:**
   - Android: La tarea en segundo plano procesa la notificación
   - El canal de notificación con `MAX` importance asegura que se muestre
   - El dispositivo vibra y enciende la luz LED
   - La notificación aparece en la pantalla de bloqueo

3. **Cuando el usuario toca la notificación:**
   - La tarea en segundo plano captura la interacción
   - La app se abre y navega al pedido correspondiente

## Verificación

Para verificar que las notificaciones funcionan con la pantalla apagada:

1. **Verificar registro de la tarea:**
   ```
   [RootLayout] Registering background notification task...
   [RootLayout] Background notification task registered successfully
   ```

2. **Verificar canales de notificación:**
   ```
   [PushNotifications] Android notification channels created with MAX priority
   ```

3. **Verificar envío de notificación:**
   ```
   [PushNotifications] Sending local notification: { title: '...', body: '...' }
   [PushNotifications] Local notification sent successfully
   [PushNotifications] Notification configured to work with screen off
   ```

4. **Verificar procesamiento en segundo plano:**
   ```
   [BackgroundNotificationTask] Task triggered!
   [BackgroundNotificationTask] Notification received in background
   [BackgroundNotificationTask] Notification will be displayed by system
   ```

## Consideraciones Importantes

### Android

1. **Optimización de Batería:**
   - Algunos fabricantes (Samsung, Xiaomi, Huawei) tienen optimizaciones agresivas de batería
   - El usuario debe desactivar la optimización de batería para la app
   - La app incluye una pantalla de permisos que guía al usuario

2. **Modo No Molestar:**
   - Con `bypassDnd: true`, las notificaciones se muestran incluso en modo No Molestar
   - El usuario puede desactivar esto en la configuración del sistema

3. **Canales de Notificación:**
   - Una vez creado, un canal no puede cambiar su importancia
   - Si necesitas cambiar la configuración, debes crear un nuevo canal con un ID diferente

### iOS

1. **Permisos:**
   - iOS requiere que el usuario otorgue permisos explícitos
   - Se solicitan permisos para alertas críticas (`allowCriticalAlerts`)

2. **Background Modes:**
   - `remote-notification` debe estar habilitado en `UIBackgroundModes`
   - Las notificaciones deben incluir `content-available: 1` en el payload

3. **Interruption Level:**
   - `timeSensitive` requiere iOS 15+
   - Permite que las notificaciones se muestren incluso con Focus activado

## Debugging

Si las notificaciones no funcionan con la pantalla apagada:

1. **Verificar logs:**
   - Buscar mensajes de `[BackgroundNotificationTask]`
   - Verificar que la tarea se registró correctamente

2. **Verificar permisos:**
   - Ir a Configuración > Permisos en la app
   - Asegurar que todos los permisos estén otorgados

3. **Verificar optimización de batería (Android):**
   - Ir a Configuración del sistema > Batería
   - Desactivar optimización para la app

4. **Verificar canales de notificación (Android):**
   - Ir a Configuración del sistema > Apps > Order Flow > Notificaciones
   - Verificar que el canal "Pedidos" tenga importancia "Urgente"

5. **Probar con la app en primer plano:**
   - Si funciona en primer plano pero no en segundo plano, el problema es la tarea en segundo plano
   - Verificar que `registerBackgroundNotificationTask()` se llame al iniciar

## Próximos Pasos

Si aún hay problemas:

1. **Implementar un servicio en primer plano (Android):**
   - Crear un servicio nativo que mantenga la app activa
   - Mostrar una notificación persistente indicando que la app está activa

2. **Usar WorkManager (Android):**
   - Implementar un worker que verifique nuevos pedidos periódicamente
   - Más confiable que BackgroundFetch en algunos dispositivos

3. **Implementar notificaciones push remotas:**
   - Usar Firebase Cloud Messaging (FCM) para Android
   - Usar Apple Push Notification service (APNs) para iOS
   - Más confiable que notificaciones locales

## Referencias

- [Expo Notifications - Background Notifications](https://docs.expo.dev/push-notifications/what-you-need-to-know#headless-background-notifications)
- [Android Notification Channels](https://developer.android.com/develop/ui/views/notifications/channels)
- [iOS Background Modes](https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server)
