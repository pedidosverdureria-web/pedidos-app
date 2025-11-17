
# Push Notifications Fix - Guía Completa

## Problema Identificado

Las notificaciones push no funcionaban debido a varios problemas:

1. **Expo Project ID no configurado**: El código tenía un placeholder `'your-project-id'` en lugar del ID real del proyecto
2. **Registro de notificaciones no automático**: No se registraban las notificaciones al iniciar sesión
3. **Falta de manejo de respuestas**: No había handlers configurados para cuando el usuario toca una notificación

## Solución Implementada

### 1. Configuración del Expo Project ID

**Archivo modificado**: `utils/pushNotifications.ts`

Ahora el código obtiene automáticamente el Project ID desde `app.config.js`:

```typescript
import Constants from 'expo-constants';

// Get the project ID from expo-constants
const projectId = Constants.expoConfig?.extra?.eas?.projectId;

const pushToken = await Notifications.getExpoPushTokenAsync({
  projectId, // f0dd536d-f195-4a75-9cc1-60519b5f49be
});
```

### 2. Registro Automático al Iniciar Sesión

**Archivo modificado**: `contexts/AuthContext.tsx`

Ahora cuando un usuario inicia sesión, automáticamente:
- Se registra para recibir notificaciones push
- Se solicitan los permisos necesarios
- Se guarda el token en la base de datos

```typescript
// Register for push notifications after successful login
if (Platform.OS !== 'web') {
  console.log('[Auth] Registering for push notifications...');
  const token = await registerForPushNotificationsAsync(userProfile.user_id);
  if (token) {
    console.log('[Auth] Push notifications registered successfully');
  }
}
```

### 3. Handlers de Notificaciones

**Archivo modificado**: `contexts/AuthContext.tsx`

Se configuraron handlers para:
- **Notificaciones tocadas**: Navega automáticamente al pedido relacionado
- **Notificaciones recibidas**: Muestra la notificación incluso con la app en primer plano

```typescript
// Handle notification taps
const responseSubscription = setupNotificationResponseHandler((response) => {
  const data = response.notification.request.content.data;
  if (data?.orderId) {
    router.push(`/order/${data.orderId}`);
  }
});

// Handle notifications received in foreground
const receivedSubscription = setupNotificationReceivedHandler((notification) => {
  console.log('[Auth] Notification received in foreground:', notification);
});
```

### 4. Mejoras en la Pantalla de Configuración

**Archivo modificado**: `app/settings/notifications.tsx`

- Banner de advertencia cuando los permisos no están otorgados
- Mejor feedback al usuario sobre el estado de las notificaciones
- Botón para abrir la configuración del sistema si los permisos están desactivados
- Indicadores visuales del estado de las notificaciones

## Cómo Probar las Notificaciones

### Paso 1: Verificar Permisos

1. Abre la app
2. Inicia sesión con cualquier PIN
3. Ve a **Perfil** → **Notificaciones**
4. Activa el switch de "Notificaciones Push"
5. Acepta los permisos cuando se soliciten

### Paso 2: Verificar Configuración de Android

En Android, asegúrate de que:
- Los permisos de notificaciones estén otorgados
- La app no esté en modo "No molestar"
- Las notificaciones de la app estén habilitadas en Configuración del sistema

### Paso 3: Probar con un Pedido de WhatsApp

1. Envía un pedido por WhatsApp al webhook
2. Deberías recibir una notificación push inmediatamente
3. Al tocar la notificación, deberías ser llevado al detalle del pedido

### Paso 4: Verificar en la Pantalla de Notificaciones

1. Ve a **Perfil** → **Notificaciones**
2. Deberías ver todas las notificaciones recibidas
3. Las notificaciones no leídas aparecen con fondo azul claro

## Configuración de Canales de Android

La app crea dos canales de notificaciones en Android:

### Canal "Predeterminado"
- Importancia: MAX
- Vibración: [0, 250, 250, 250]
- Sonido: Predeterminado
- Bypass DND: Sí

### Canal "Pedidos"
- Importancia: MAX
- Vibración: [0, 500, 250, 500] (más larga)
- Sonido: Predeterminado
- Bypass DND: Sí
- Color: Azul (#3B82F6)

Estos canales están configurados para:
- Funcionar con la pantalla apagada
- Despertar el dispositivo
- Mostrar en la pantalla de bloqueo
- Bypass del modo "No molestar"

## Configuración de iOS

Para iOS, las notificaciones están configuradas con:
- `allowAlert`: true
- `allowBadge`: true
- `allowSound`: true
- `allowAnnouncements`: true
- `allowCriticalAlerts`: true
- `interruptionLevel`: 'timeSensitive'

## Logs de Depuración

Para verificar que todo funciona correctamente, busca estos logs en la consola:

```
[PushNotifications] Notification handler configured
[Auth] Registering for push notifications...
[PushNotifications] Using project ID: f0dd536d-f195-4a75-9cc1-60519b5f49be
[PushNotifications] Push token obtained: ExponentPushToken[...]
[PushNotifications] Push token saved to database
[Auth] Push notifications registered successfully
```

## Solución de Problemas

### Las notificaciones no llegan

1. **Verifica los permisos**: Ve a Configuración del sistema → Aplicaciones → Pedidos → Notificaciones
2. **Verifica el token**: Busca en los logs si se obtuvo el token correctamente
3. **Verifica la base de datos**: Asegúrate de que el token se guardó en la tabla `profiles`
4. **Verifica el webhook**: Asegúrate de que el webhook de WhatsApp está llamando a `notifyAdmins()`

### Las notificaciones no despiertan el dispositivo

1. **Android**: Verifica que la app tenga permiso `WAKE_LOCK` (ya está en `app.config.js`)
2. **Android**: Verifica que la optimización de batería esté desactivada para la app
3. **iOS**: Verifica que las notificaciones críticas estén habilitadas

### Las notificaciones no suenan

1. Verifica que el switch de "Sonido" esté activado en la pantalla de notificaciones
2. Verifica que el volumen del dispositivo no esté en silencio
3. En Android, verifica la configuración del canal de notificaciones en el sistema

## Archivos Modificados

- ✅ `utils/pushNotifications.ts` - Configuración del Project ID
- ✅ `contexts/AuthContext.tsx` - Registro automático y handlers
- ✅ `app/settings/notifications.tsx` - Mejoras en la UI y feedback
- ✅ `app/_layout.tsx` - Ya tenía el registro de background task

## Próximos Pasos

Para mejorar aún más las notificaciones:

1. **Notificaciones programadas**: Implementar recordatorios para pedidos pendientes
2. **Notificaciones agrupadas**: Agrupar múltiples notificaciones de pedidos
3. **Acciones rápidas**: Agregar botones de acción en las notificaciones (Aceptar, Rechazar, etc.)
4. **Notificaciones personalizadas**: Diferentes sonidos para diferentes tipos de notificaciones

## Notas Importantes

- Las notificaciones push **NO funcionan en Expo Go**. Debes hacer un build de desarrollo o producción.
- Las notificaciones push **NO funcionan en web**. Solo funcionan en iOS y Android nativos.
- El token de push se guarda en la tabla `profiles` en el campo `push_token`.
- Los permisos de notificaciones deben ser otorgados por el usuario en el primer uso.
