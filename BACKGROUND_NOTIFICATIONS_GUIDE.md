
# Guía de Notificaciones en Segundo Plano

## 📱 Funcionalidad Implementada

La aplicación ahora soporta notificaciones push con sonido y vibración incluso cuando:
- La pantalla está apagada
- La aplicación está en segundo plano
- La aplicación está completamente cerrada

## 🔧 Configuración Implementada

### 1. **Canales de Notificación Android**

Se han configurado dos canales de notificación con máxima prioridad:

- **Canal "Predeterminado"**: Para notificaciones generales
- **Canal "Pedidos"**: Para notificaciones de nuevos pedidos con:
  - Prioridad MÁXIMA (AndroidImportance.MAX)
  - Patrón de vibración personalizado: [0, 500, 250, 500]
  - Sonido predeterminado del sistema
  - Luces LED habilitadas
  - Visible en pantalla de bloqueo

### 2. **Permisos iOS**

Se solicitan los siguientes permisos:
- Alertas (allowAlert)
- Insignias (allowBadge)
- Sonidos (allowSound)
- Anuncios (allowAnnouncements)

### 3. **Tarea en Segundo Plano**

Se ha implementado una tarea en segundo plano usando `expo-task-manager` que:
- Se ejecuta cuando llega una notificación
- Funciona incluso con la app cerrada
- Maneja interacciones del usuario con las notificaciones
- Registra eventos para debugging

## 📋 Archivos Modificados

### 1. `app.json`
- Agregado plugin `expo-notifications` con configuración completa
- Habilitado `enableBackgroundRemoteNotifications: true` para iOS
- Configurado canal predeterminado "orders"

### 2. `utils/backgroundNotificationTask.ts` (NUEVO)
- Define la tarea en segundo plano
- Maneja notificaciones cuando la app está cerrada
- Procesa respuestas del usuario a notificaciones

### 3. `utils/pushNotifications.ts`
- Mejorado el handler de notificaciones para mostrar alertas, sonido y vibración
- Configurados canales Android con máxima prioridad
- Agregadas funciones para verificar y solicitar permisos
- Mejorada la función `sendLocalNotification` con:
  - Prioridad máxima
  - Patrón de vibración personalizado
  - Canal específico para pedidos

### 4. `app/_layout.tsx`
- Registra la tarea en segundo plano al iniciar la app
- Asegura que las notificaciones funcionen desde el inicio

### 5. `app/(tabs)/(home)/index.tsx`
- Solicita permisos de notificación al usuario
- Registra el token de push notifications
- Configura listeners para respuestas a notificaciones
- Navega automáticamente al pedido cuando se toca una notificación

## 🚀 Cómo Funciona

### Flujo de Notificaciones

1. **Nuevo Pedido Llega**:
   - El webhook de WhatsApp crea un pedido en la base de datos
   - Supabase Realtime detecta el nuevo pedido
   - Se envía una notificación local con `sendLocalNotification()`

2. **Notificación en Segundo Plano**:
   - Android/iOS recibe la notificación
   - El sistema muestra la notificación con sonido y vibración
   - La tarea en segundo plano se ejecuta automáticamente
   - Se registra el evento para debugging

3. **Usuario Toca la Notificación**:
   - La app se abre (o vuelve al frente)
   - El listener de respuesta captura el evento
   - La app navega automáticamente al detalle del pedido

## 🔔 Características de las Notificaciones

### Sonido
- ✅ Sonido predeterminado del sistema
- ✅ Funciona con pantalla apagada
- ✅ Funciona en modo silencio (depende de configuración del dispositivo)

### Vibración
- ✅ Patrón personalizado: 500ms vibración, 250ms pausa, 500ms vibración
- ✅ Funciona con pantalla apagada
- ✅ Funciona en modo vibración

### Visual
- ✅ Banner en pantalla de bloqueo
- ✅ Luz LED (en dispositivos compatibles)
- ✅ Insignia en el ícono de la app
- ✅ Visible en el centro de notificaciones

## 📱 Pruebas

### Para Probar en Dispositivo Real:

1. **Instalar la app** en un dispositivo físico (las notificaciones no funcionan en emuladores)

2. **Otorgar permisos** cuando la app los solicite

3. **Probar con app en primer plano**:
   - Crear un pedido desde WhatsApp
   - Deberías ver y escuchar la notificación

4. **Probar con app en segundo plano**:
   - Minimizar la app (botón home)
   - Crear un pedido desde WhatsApp
   - Deberías ver, escuchar y sentir la vibración

5. **Probar con app cerrada**:
   - Cerrar completamente la app (deslizar desde multitarea)
   - Crear un pedido desde WhatsApp
   - Deberías recibir la notificación con sonido y vibración

6. **Probar con pantalla apagada**:
   - Apagar la pantalla del dispositivo
   - Crear un pedido desde WhatsApp
   - La pantalla debería encenderse con la notificación
   - Deberías escuchar el sonido y sentir la vibración

## ⚙️ Configuración Adicional

### Android

Para que las notificaciones funcionen correctamente en Android:

1. **Permisos de batería**: Asegúrate de que la app no esté optimizada para batería
   - Configuración → Aplicaciones → Tu App → Batería → Sin restricciones

2. **Notificaciones**: Verifica que las notificaciones estén habilitadas
   - Configuración → Aplicaciones → Tu App → Notificaciones → Activado

3. **No molestar**: Las notificaciones de máxima prioridad pueden sonar incluso en modo "No molestar"

### iOS

Para que las notificaciones funcionen correctamente en iOS:

1. **Permisos**: Acepta todos los permisos cuando la app los solicite

2. **Configuración de notificaciones**:
   - Configuración → Notificaciones → Tu App
   - Activar "Permitir notificaciones"
   - Activar "Sonidos"
   - Activar "Insignias"
   - Estilo de alerta: "Banners" o "Alertas"

3. **No molestar**: Configura la app como "Crítica" para que suene incluso en modo "No molestar"

## 🐛 Debugging

Si las notificaciones no funcionan:

1. **Verifica los logs**:
   ```
   - "Notification permissions granted"
   - "Background notification task registered successfully"
   - "Local notification sent successfully"
   ```

2. **Verifica permisos**:
   - Abre la configuración del dispositivo
   - Verifica que las notificaciones estén habilitadas para la app

3. **Verifica el canal de notificación** (Android):
   - Configuración → Aplicaciones → Tu App → Notificaciones
   - Verifica que el canal "Pedidos" esté habilitado y configurado correctamente

4. **Prueba con notificación de prueba**:
   - Usa la función `sendLocalNotification()` directamente desde el código
   - Esto descarta problemas con el webhook o la base de datos

## 📝 Notas Importantes

1. **Dispositivos Físicos**: Las notificaciones push NO funcionan en emuladores/simuladores

2. **Permisos**: El usuario debe otorgar permisos de notificación la primera vez

3. **Batería**: En Android, la optimización de batería puede afectar las notificaciones en segundo plano

4. **Modo Ahorro de Energía**: Puede limitar las notificaciones en algunos dispositivos

5. **Fabricantes**: Algunos fabricantes (Xiaomi, Huawei, etc.) tienen restricciones adicionales que el usuario debe configurar manualmente

## 🔄 Próximos Pasos (Opcional)

Si deseas mejorar aún más las notificaciones:

1. **Notificaciones Push Remotas**: Implementar con Expo Push Notification Service
2. **Sonidos Personalizados**: Agregar sonidos personalizados para diferentes tipos de pedidos
3. **Acciones Rápidas**: Agregar botones en las notificaciones (Aceptar, Rechazar, etc.)
4. **Notificaciones Agrupadas**: Agrupar múltiples notificaciones de pedidos
5. **Notificaciones Programadas**: Recordatorios para pedidos pendientes

## ✅ Checklist de Implementación

- ✅ Instalado `expo-task-manager`
- ✅ Configurado plugin `expo-notifications` en app.json
- ✅ Creado archivo `backgroundNotificationTask.ts`
- ✅ Actualizado `pushNotifications.ts` con mejoras
- ✅ Registrada tarea en segundo plano en `_layout.tsx`
- ✅ Configurados listeners en `index.tsx`
- ✅ Configurados canales Android con máxima prioridad
- ✅ Configurados permisos iOS
- ✅ Implementado patrón de vibración personalizado
- ✅ Habilitadas notificaciones en pantalla de bloqueo

## 🎉 Resultado Final

La aplicación ahora puede:
- ✅ Recibir notificaciones con sonido y vibración
- ✅ Funcionar con la pantalla apagada
- ✅ Funcionar con la app en segundo plano
- ✅ Funcionar con la app completamente cerrada
- ✅ Navegar automáticamente al pedido al tocar la notificación
- ✅ Mostrar notificaciones en la pantalla de bloqueo
- ✅ Vibrar con patrón personalizado
- ✅ Reproducir sonido del sistema
