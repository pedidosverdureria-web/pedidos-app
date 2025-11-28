
# Solución al Error de Notificaciones Push

## Problema Identificado

El error "No se pudo obtener el token de notificaciones push" ocurre porque **Firebase Cloud Messaging (FCM) no está configurado** en tu proyecto Android.

### ¿Por qué Firebase?

Expo usa Firebase Cloud Messaging (FCM) para enviar notificaciones push en dispositivos Android. Sin FCM configurado:
- ✅ Las notificaciones **locales** SÍ funcionan (cuando la app está abierta)
- ❌ Las notificaciones **push remotas** NO funcionan (cuando la app está cerrada)

## Cambios Realizados

### 1. Mejora en el Manejo de Errores

**Archivo modificado:** `utils/pushNotifications.ts`

- Ahora el error de Firebase se detecta correctamente y se lanza como `FirebaseConfigError`
- El mensaje de error es más claro y específico
- Se eliminó el Alert genérico que confundía al usuario

### 2. Configuración de google-services.json

**Archivo modificado:** `app.config.js`

- Se agregó la línea `googleServicesFile: "./google-services.json"` en la configuración de Android
- Esto le indica a Expo dónde encontrar el archivo de configuración de Firebase

### 3. Mensaje de Error Mejorado

Ahora cuando intentas activar las notificaciones push sin Firebase configurado, verás un mensaje detallado que explica:
- Por qué necesitas Firebase
- Los pasos exactos para configurarlo
- Alternativas mientras tanto (notificaciones locales)
- Un enlace a la documentación completa

## Pasos para Solucionar el Error

### Opción 1: Configurar Firebase (Recomendado para Producción)

#### Paso 1: Crear Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Haz clic en "Agregar proyecto"
3. Nombre del proyecto: "Pedidos App" (o el que prefieras)
4. Acepta los términos y continúa
5. Puedes desactivar Google Analytics si no lo necesitas
6. Haz clic en "Crear proyecto"

#### Paso 2: Agregar Aplicación Android

1. En la página principal del proyecto, haz clic en el ícono de Android
2. **Package name:** `com.pedidosapp.mobile` (DEBE coincidir exactamente)
3. Nombre de la app: "Pedidos App" (opcional)
4. Haz clic en "Registrar app"

#### Paso 3: Descargar google-services.json

1. Descarga el archivo `google-services.json`
2. **Colócalo en la raíz de tu proyecto** (mismo nivel que `package.json`)
3. Verifica que el archivo esté en: `./google-services.json`

#### Paso 4: Configurar Credenciales en EAS

```bash
# Instala EAS CLI si no lo tienes
npm install -g eas-cli

# Inicia sesión
eas login

# Configura las credenciales FCM
eas credentials
```

Selecciona:
1. Android
2. production (o development)
3. "Set up FCM"
4. Sigue las instrucciones para subir tu `google-services.json`

#### Paso 5: Rebuild la Aplicación

```bash
# Para desarrollo local
npx expo run:android

# Para producción con EAS
eas build -p android
```

### Opción 2: Usar Solo Notificaciones Locales (Temporal)

Si no quieres configurar Firebase ahora, puedes usar solo notificaciones locales:

**Ventajas:**
- ✅ No requiere configuración adicional
- ✅ Funcionan cuando la app está abierta o en segundo plano
- ✅ Muestran alertas de nuevos pedidos
- ✅ Suenan y vibran correctamente

**Limitaciones:**
- ❌ No funcionan cuando la app está completamente cerrada
- ❌ No funcionan si el dispositivo se reinicia

**Cómo usar:**
1. Simplemente NO actives el switch "Notificaciones Push" en la configuración
2. Las notificaciones locales seguirán funcionando automáticamente
3. Recibirás alertas cuando lleguen pedidos por WhatsApp (si la app está abierta)

## Verificar que Firebase Está Configurado

Después de configurar Firebase y hacer el rebuild:

1. Abre la app en un dispositivo Android físico
2. Ve a **Configuración > Notificaciones**
3. Activa el switch "Notificaciones Push"
4. Si todo está bien, verás: "✅ Notificaciones Activadas"
5. Si Firebase no está configurado, verás el mensaje de error con instrucciones

## Solución de Problemas

### Error: "FirebaseApp is not initialized"

**Causa:** El archivo `google-services.json` no está en el lugar correcto o no coincide el package name.

**Solución:**
1. Verifica que `google-services.json` esté en la raíz del proyecto
2. Verifica que el package name en Firebase sea: `com.pedidosapp.mobile`
3. Haz un rebuild completo: `npx expo run:android`

### Error: "No Expo project ID found"

**Causa:** Falta el project ID en `app.config.js`

**Solución:**
El project ID ya está configurado en tu `app.config.js`:
```javascript
extra: {
  eas: {
    projectId: "f0dd536d-f195-4a75-9cc1-60519b5f49be"
  }
}
```

### Las notificaciones no llegan

**Posibles causas:**
1. Firebase no está configurado
2. Permisos de notificaciones no otorgados
3. Dispositivo en modo "No molestar"
4. App en modo de ahorro de batería

**Solución:**
1. Verifica que Firebase esté configurado correctamente
2. Ve a Configuración del dispositivo > Aplicaciones > Pedidos > Notificaciones
3. Desactiva "No molestar" temporalmente
4. Desactiva el ahorro de batería para la app

## Notas Importantes

### Firebase es GRATIS
- ✅ No necesitas tarjeta de crédito
- ✅ El plan gratuito es suficiente para la mayoría de apps
- ✅ Incluye notificaciones push ilimitadas

### Solo Android Necesita Firebase
- ✅ iOS usa APNs (Apple Push Notification service)
- ✅ iOS no requiere configuración adicional
- ✅ Las notificaciones en iOS funcionarán automáticamente

### Notificaciones Locales vs Push

**Notificaciones Locales:**
- Se generan en el dispositivo
- Funcionan sin Firebase
- Requieren que la app esté abierta o en segundo plano

**Notificaciones Push:**
- Se envían desde un servidor
- Requieren Firebase (Android) o APNs (iOS)
- Funcionan incluso con la app cerrada

## Recursos Adicionales

- [Documentación oficial de Expo sobre FCM](https://docs.expo.dev/push-notifications/fcm-credentials/)
- [Documentación de Firebase](https://firebase.google.com/docs/cloud-messaging)
- [Guía de notificaciones push de Expo](https://docs.expo.dev/push-notifications/overview/)
- [FIREBASE_FCM_SETUP_GUIDE.md](./FIREBASE_FCM_SETUP_GUIDE.md) - Guía detallada en el proyecto

## Resumen

1. **El error es normal** si no has configurado Firebase
2. **Las notificaciones locales funcionan** sin Firebase
3. **Para notificaciones push completas** necesitas configurar Firebase
4. **La configuración es gratuita** y toma unos 15-20 minutos
5. **El mensaje de error ahora es más claro** y te guía en los pasos

## ¿Necesitas Ayuda?

Si tienes problemas configurando Firebase:
1. Consulta el archivo `FIREBASE_FCM_SETUP_GUIDE.md` en el proyecto
2. Revisa la documentación oficial de Expo
3. Verifica que el package name coincida exactamente: `com.pedidosapp.mobile`
4. Asegúrate de hacer un rebuild completo después de agregar `google-services.json`
