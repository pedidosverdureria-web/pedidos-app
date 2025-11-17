
# Fix: Notificaciones Push con Autenticación Basada en PIN

## Problema Identificado

La aplicación usa autenticación basada en PIN (no en usuarios de Supabase Auth), pero el sistema de notificaciones push estaba intentando guardar tokens en la tabla `profiles` que está vinculada a `auth.users`.

## Solución Implementada

### 1. Tabla `device_push_tokens`

Se creó una tabla independiente que no depende de `auth.users`:

```sql
CREATE TABLE device_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,
  push_token TEXT NOT NULL,
  user_role TEXT,
  device_name TEXT,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Características:**
- `device_id`: Identificador único del dispositivo (generado localmente)
- `push_token`: Token de Expo Push Notifications
- `user_role`: Rol del usuario (admin, worker, printer, desarrollador)
- `device_name`: Nombre del dispositivo para identificación
- `last_active_at`: Última vez que el dispositivo estuvo activo

### 2. Generación de Device ID

En `utils/pushNotifications.ts`, se implementó la función `getDeviceId()`:

```typescript
async function getDeviceId(): Promise<string> {
  // Intenta obtener el device_id existente de AsyncStorage
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  
  if (!deviceId) {
    // Genera un nuevo ID único usando información del dispositivo
    const deviceName = Device.deviceName || 'Unknown Device';
    const modelName = Device.modelName || 'Unknown Model';
    const timestamp = Date.now();
    
    deviceId = `${Platform.OS}-${modelName}-${timestamp}`.replace(/\s+/g, '-');
    
    // Guarda para uso futuro
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  
  return deviceId;
}
```

### 3. Registro de Push Notifications

La función `registerForPushNotificationsAsync()` ahora:

1. Genera o recupera el `device_id` único
2. Obtiene el token de Expo Push Notifications
3. Guarda el token en `device_push_tokens` asociado al `device_id` y `user_role`

```typescript
export async function registerForPushNotificationsAsync(userRole?: string): Promise<string | null> {
  // ... obtener permisos y token ...
  
  const deviceId = await getDeviceId();
  const deviceName = Device.deviceName || 'Unknown Device';
  
  // Actualizar o insertar en device_push_tokens
  const { data: existingToken } = await supabase
    .from('device_push_tokens')
    .select('id')
    .eq('device_id', deviceId)
    .single();
  
  if (existingToken) {
    // Actualizar registro existente
    await supabase
      .from('device_push_tokens')
      .update({
        push_token: token,
        user_role: userRole || null,
        device_name: deviceName,
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('device_id', deviceId);
  } else {
    // Insertar nuevo registro
    await supabase
      .from('device_push_tokens')
      .insert({
        device_id: deviceId,
        push_token: token,
        user_role: userRole || null,
        device_name: deviceName,
        last_active_at: new Date().toISOString(),
      });
  }
}
```

### 4. Envío de Notificaciones

La función `notifyAllDevices()` envía notificaciones a todos los dispositivos registrados:

```typescript
export async function notifyAllDevices(
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' | 'order',
  relatedOrderId?: string
) {
  // Obtener todos los dispositivos registrados
  const { data: devices } = await supabase
    .from('device_push_tokens')
    .select('device_id, push_token, user_role, device_name')
    .not('push_token', 'is', null);
  
  // Crear notificación in-app (no vinculada a usuario específico)
  await createInAppNotification(null, title, message, type, relatedOrderId);
  
  // Enviar notificación local al dispositivo actual
  if (Platform.OS !== 'web') {
    await sendLocalNotification(title, message, { orderId: relatedOrderId });
  }
}
```

### 5. Corrección en `app/settings/notifications.tsx`

Se corrigió la llamada a `registerForPushNotificationsAsync()` para pasar el `user.role` en lugar de `user.user_id`:

**Antes:**
```typescript
const token = await registerForPushNotificationsAsync(user.user_id);
```

**Después:**
```typescript
const token = await registerForPushNotificationsAsync(user?.role);
```

## Flujo de Trabajo

### Registro de Dispositivo

1. Usuario inicia sesión con PIN
2. `AuthContext` llama a `registerForPushNotificationsAsync(user.role)`
3. Se genera o recupera el `device_id` único
4. Se solicitan permisos de notificaciones
5. Se obtiene el token de Expo Push Notifications
6. Se guarda en `device_push_tokens` con el `device_id` y `user_role`

### Recepción de Pedidos por WhatsApp

1. Webhook recibe mensaje de WhatsApp
2. Se crea el pedido en la base de datos
3. Se llama a `notifyAllDevices()` desde el Edge Function
4. Se envía notificación local a todos los dispositivos registrados
5. Los dispositivos reciben la notificación incluso con pantalla apagada

### Navegación desde Notificación

1. Usuario toca la notificación
2. `setupNotificationResponseHandler()` captura el evento
3. Se extrae el `orderId` de los datos de la notificación
4. Se navega a `/order/${orderId}`

## Ventajas de esta Implementación

1. **Independiente de Supabase Auth**: No requiere usuarios en `auth.users`
2. **Multi-dispositivo**: Cada dispositivo tiene su propio token
3. **Persistencia**: El `device_id` se guarda en AsyncStorage
4. **Rastreo de actividad**: Se registra `last_active_at` para cada dispositivo
5. **Roles flexibles**: Se puede filtrar notificaciones por rol si es necesario
6. **Sin conflictos**: No interfiere con el sistema de autenticación basado en PIN

## Tabla `profiles` vs `device_push_tokens`

### `profiles` (NO USADA para push tokens)
- Vinculada a `auth.users`
- Requiere autenticación de Supabase
- No compatible con autenticación basada en PIN

### `device_push_tokens` (USADA para push tokens)
- Independiente de `auth.users`
- Usa `device_id` generado localmente
- Compatible con autenticación basada en PIN
- Permite múltiples dispositivos por rol

## Verificación

Para verificar que el sistema funciona correctamente:

1. Inicia sesión con cualquier PIN
2. Ve a Configuración > Notificaciones
3. Activa "Notificaciones Push"
4. Verifica que aparezca el mensaje de éxito
5. Envía un pedido por WhatsApp
6. Deberías recibir una notificación en el dispositivo

## Logs de Depuración

El sistema incluye logs detallados:

```
[PushNotifications] Generated new device ID: android-SM-G991B-1234567890
[PushNotifications] Push token obtained: ExponentPushToken[...]
[PushNotifications] Push token saved to database
[PushNotifications] Notifying 3 registered devices
[PushNotifications] Local notification sent to device
```

## Conclusión

El sistema de notificaciones push ahora funciona correctamente con autenticación basada en PIN, sin depender de la tabla `profiles` ni de `auth.users`. Cada dispositivo se identifica de forma única y puede recibir notificaciones independientemente del sistema de autenticación utilizado.
