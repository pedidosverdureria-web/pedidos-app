
# Guía de Funcionalidad en Segundo Plano

Esta guía explica cómo funciona la aplicación en segundo plano, incluyendo auto-impresión y notificaciones cuando la pantalla está apagada.

## 📋 Resumen

La aplicación está configurada para funcionar completamente en segundo plano, permitiendo:

- ✅ **Auto-impresión automática** de nuevos pedidos incluso con la pantalla apagada
- ✅ **Notificaciones push** de nuevos pedidos en cualquier momento
- ✅ **Tareas en segundo plano** que se ejecutan cada 60 segundos
- ✅ **Persistencia** de la conexión Bluetooth con la impresora

## 🔐 Permisos Necesarios

### Android

La aplicación solicita los siguientes permisos en Android:

1. **WAKE_LOCK**: Mantiene el dispositivo despierto durante la impresión
2. **RECEIVE_BOOT_COMPLETED**: Inicia tareas en segundo plano al encender el dispositivo
3. **FOREGROUND_SERVICE**: Permite servicios en primer plano
4. **BLUETOOTH / BLUETOOTH_ADMIN**: Acceso a Bluetooth (Android < 12)
5. **BLUETOOTH_CONNECT / BLUETOOTH_SCAN**: Acceso a Bluetooth (Android 12+)
6. **ACCESS_FINE_LOCATION**: Necesario para escanear dispositivos Bluetooth
7. **POST_NOTIFICATIONS**: Enviar notificaciones (Android 13+)
8. **SCHEDULE_EXACT_ALARM**: Programar alarmas exactas para tareas en segundo plano
9. **REQUEST_IGNORE_BATTERY_OPTIMIZATIONS**: Evitar que el sistema detenga la app

### iOS

La aplicación solicita los siguientes permisos en iOS:

1. **NSBluetoothAlwaysUsageDescription**: Acceso a Bluetooth
2. **UIBackgroundModes**: 
   - `fetch`: Tareas en segundo plano
   - `remote-notification`: Notificaciones remotas
   - `processing`: Procesamiento en segundo plano

## 🚀 Cómo Funciona

### 1. Auto-Impresión en Segundo Plano

#### Flujo de Trabajo

```
1. Usuario habilita auto-impresión en Configuración > Impresora
2. App registra tarea en segundo plano (BackgroundFetch)
3. Tarea se ejecuta cada 60 segundos automáticamente
4. Tarea verifica nuevos pedidos pendientes en Supabase
5. Si hay pedidos nuevos, los marca para impresión
6. App en primer plano detecta pedidos marcados
7. App imprime los pedidos automáticamente
8. Pedidos se marcan como impresos para evitar duplicados
```

#### Componentes Clave

- **`utils/backgroundAutoPrintTask.ts`**: Define y registra la tarea en segundo plano
- **`app/(tabs)/(home)/index.tsx`**: Detecta y procesa pedidos marcados para impresión
- **`hooks/usePrinter.ts`**: Maneja la conexión Bluetooth y la impresión

#### Limitaciones

- **Bluetooth en segundo plano**: En Android/iOS, las operaciones Bluetooth están restringidas en segundo plano
- **Solución**: La tarea en segundo plano solo marca los pedidos, la impresión real ocurre cuando la app está en primer plano
- **Keep-Alive**: La app mantiene la pantalla activa cuando auto-impresión está habilitada

### 2. Notificaciones en Segundo Plano

#### Flujo de Trabajo

```
1. Usuario concede permisos de notificaciones
2. App registra token de notificaciones push
3. Webhook de WhatsApp recibe nuevo pedido
4. Webhook crea pedido en base de datos
5. Webhook envía notificación push a todos los admins
6. Sistema operativo muestra notificación (incluso con pantalla apagada)
7. Usuario toca notificación
8. App abre y navega al pedido
```

#### Componentes Clave

- **`utils/pushNotifications.ts`**: Maneja registro y envío de notificaciones
- **`utils/backgroundNotificationTask.ts`**: Procesa notificaciones en segundo plano
- **`supabase/functions/whatsapp-webhook/index.ts`**: Envía notificaciones desde el servidor

#### Configuración

- **Canal de Android**: `orders` con prioridad MAX
- **Sonido**: Activado por defecto
- **Vibración**: Patrón personalizado [0, 500, 250, 500]
- **Badge**: Muestra contador de notificaciones

### 3. Gestión de Permisos

#### Pantalla de Permisos

La app incluye una pantalla dedicada en **Configuración > Permisos** que permite:

- ✅ Ver el estado de todos los permisos requeridos
- ✅ Solicitar permisos individualmente
- ✅ Solicitar todos los permisos a la vez
- ✅ Abrir configuración del sistema para permisos denegados
- ✅ Ver descripción detallada de cada permiso

#### Verificación Automática

La app verifica permisos automáticamente:

- Al iniciar la app
- Al habilitar auto-impresión
- Al conectar la impresora
- Al habilitar notificaciones

## 🔧 Configuración Recomendada

### Para Máxima Confiabilidad

1. **Conceder todos los permisos** en Configuración > Permisos
2. **Desactivar optimización de batería** para la app (Android)
3. **Permitir ejecución en segundo plano** en configuración del sistema
4. **Mantener Bluetooth activado** siempre
5. **Conectar impresora** antes de habilitar auto-impresión
6. **Probar** con un pedido de prueba

### Configuración de Android

Para evitar que Android detenga la app:

1. Ir a **Configuración > Aplicaciones > Order Flow**
2. Seleccionar **Batería**
3. Elegir **Sin restricciones** o **Optimizado**
4. Activar **Permitir actividad en segundo plano**
5. Activar **Inicio automático** (si está disponible)

### Configuración de iOS

Para permitir tareas en segundo plano:

1. Ir a **Configuración > General > Actualización en segundo plano**
2. Activar **Actualización en segundo plano**
3. Buscar **Order Flow** y activarlo
4. Conceder permisos de Bluetooth y Notificaciones

## 🐛 Solución de Problemas

### Auto-Impresión No Funciona

**Problema**: Los pedidos no se imprimen automáticamente

**Soluciones**:
1. Verificar que auto-impresión esté habilitada en Configuración > Impresora
2. Verificar que la impresora esté conectada (luz verde en pantalla principal)
3. Verificar permisos en Configuración > Permisos
4. Verificar que el estado de la tarea en segundo plano sea "Disponible"
5. Reiniciar la app y reconectar la impresora
6. Verificar que la optimización de batería esté desactivada (Android)

### Notificaciones No Llegan

**Problema**: No se reciben notificaciones de nuevos pedidos

**Soluciones**:
1. Verificar permisos de notificaciones en Configuración > Permisos
2. Verificar que las notificaciones estén habilitadas en Configuración > Notificaciones
3. Verificar que el webhook de WhatsApp esté configurado correctamente
4. Verificar que el token de notificaciones esté registrado
5. Probar con una notificación de prueba
6. Verificar configuración de notificaciones en el sistema operativo

### Impresora Se Desconecta

**Problema**: La impresora se desconecta frecuentemente

**Soluciones**:
1. Mantener la impresora cerca del dispositivo
2. Verificar que la batería de la impresora esté cargada
3. Verificar que no haya interferencias Bluetooth
4. Reconectar la impresora en Configuración > Impresora
5. Reiniciar la impresora y el dispositivo
6. Verificar que el keep-alive esté funcionando (se envía ping cada 30 segundos)

### Tarea en Segundo Plano Denegada

**Problema**: El estado de la tarea en segundo plano es "Denegado"

**Soluciones**:
1. Ir a Configuración > Permisos
2. Tocar "Abrir Configuración del Sistema"
3. Buscar "Ejecutar en segundo plano" o "Background execution"
4. Habilitar el permiso
5. Reiniciar la app
6. Verificar el estado nuevamente

## 📊 Monitoreo

### Logs

La app genera logs detallados para depuración:

```javascript
// Ver logs en consola
[BackgroundAutoPrint] Task triggered at 2024-01-15T10:30:00.000Z
[BackgroundAutoPrint] Found 2 pending orders
[BackgroundAutoPrint] Queued orders for foreground printing
[HomeScreen] Auto-printing order: #1234
[HomeScreen] Order auto-printed successfully: #1234
```

### Indicadores Visuales

- **Banner verde**: Auto-impresión activa y funcionando
- **Banner naranja**: Auto-impresión habilitada pero impresora no conectada
- **Badge en pedido**: Indica si el pedido fue impreso

## 🔒 Seguridad y Privacidad

- Los permisos solo se solicitan cuando son necesarios
- La app explica claramente por qué necesita cada permiso
- Los permisos se pueden revocar en cualquier momento
- La app funciona con permisos limitados (sin auto-impresión)
- No se recopilan datos de ubicación (solo se usa para Bluetooth)

## 📱 Compatibilidad

### Android
- **Mínimo**: Android 5.0 (API 21)
- **Recomendado**: Android 8.0+ (API 26+)
- **Óptimo**: Android 12+ (API 31+) con nuevos permisos de Bluetooth

### iOS
- **Mínimo**: iOS 13.0
- **Recomendado**: iOS 14.0+
- **Óptimo**: iOS 15.0+ con mejoras en tareas en segundo plano

## 🎯 Mejores Prácticas

1. **Solicitar permisos en contexto**: La app solicita permisos cuando el usuario intenta usar una función
2. **Explicar claramente**: Cada permiso tiene una descripción clara de por qué es necesario
3. **Permitir re-solicitud**: Los usuarios pueden volver a solicitar permisos en cualquier momento
4. **Guiar a configuración**: Si un permiso es denegado, la app guía al usuario a la configuración del sistema
5. **Funcionar sin permisos**: La app funciona (con limitaciones) incluso sin todos los permisos

## 📚 Referencias

- [Expo Background Fetch](https://docs.expo.dev/versions/latest/sdk/background-fetch/)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Task Manager](https://docs.expo.dev/versions/latest/sdk/task-manager/)
- [React Native Permissions](https://reactnative.dev/docs/permissionsandroid)
- [Android Background Execution Limits](https://developer.android.com/about/versions/oreo/background)
- [iOS Background Execution](https://developer.apple.com/documentation/uikit/app_and_environment/scenes/preparing_your_ui_to_run_in_the_background)
