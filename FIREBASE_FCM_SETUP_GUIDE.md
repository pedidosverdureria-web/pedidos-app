
# Guía de Configuración de Firebase Cloud Messaging (FCM)

## ¿Por qué necesitas Firebase?

El error "Default FirebaseApp is not initialized" ocurre porque **Expo usa Firebase Cloud Messaging (FCM) para enviar notificaciones push en Android**. Sin FCM configurado, las notificaciones push no funcionarán en dispositivos Android.

## Pasos para Configurar Firebase

### 1. Crear un Proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Haz clic en "Agregar proyecto" o "Add project"
3. Ingresa un nombre para tu proyecto (por ejemplo: "Pedidos App")
4. Acepta los términos y haz clic en "Continuar"
5. Puedes desactivar Google Analytics si no lo necesitas
6. Haz clic en "Crear proyecto"

### 2. Agregar una Aplicación Android

1. En la página principal de tu proyecto, haz clic en el ícono de Android
2. Ingresa el **package name**: `com.pedidosapp.mobile`
   - **IMPORTANTE**: Este debe coincidir exactamente con el package name en tu `app.config.js`
3. Ingresa un nombre para la app (opcional): "Pedidos App"
4. Haz clic en "Registrar app"

### 3. Descargar google-services.json

1. Después de registrar la app, descarga el archivo `google-services.json`
2. **Coloca este archivo en la raíz de tu proyecto** (al mismo nivel que `package.json`)
3. **NO** lo agregues a `.gitignore` si quieres que funcione en todos los entornos

### 4. Configurar Credenciales FCM en EAS

Para que las notificaciones funcionen en builds de producción, necesitas configurar las credenciales FCM en EAS:

#### Opción A: Usando EAS CLI (Recomendado)

```bash
# Instala EAS CLI si no lo tienes
npm install -g eas-cli

# Inicia sesión en tu cuenta de Expo
eas login

# Configura las credenciales FCM
eas credentials
```

Luego selecciona:
1. Android
2. production (o development según tu build)
3. "Set up FCM"
4. Sigue las instrucciones para subir tu `google-services.json`

#### Opción B: Manualmente en Expo Dashboard

1. Ve a [expo.dev](https://expo.dev)
2. Selecciona tu proyecto
3. Ve a "Credentials" en el menú lateral
4. Selecciona "Android"
5. Haz clic en "Add FCM Server Key"
6. Sube tu archivo `google-services.json`

### 5. Actualizar app.config.js

Asegúrate de que tu `app.config.js` tenga la configuración correcta:

```javascript
module.exports = {
  expo: {
    // ... otras configuraciones
    android: {
      package: "com.pedidosapp.mobile", // Debe coincidir con Firebase
      googleServicesFile: "./google-services.json", // Ruta al archivo
      // ... otras configuraciones
    },
    plugins: [
      [
        "expo-notifications",
        {
          icon: "./assets/images/64897504-f76f-4cb3-a1f3-a82b594f1121.png",
          color: "#6B9F3E",
          defaultChannel: "orders"
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "f0dd536d-f195-4a75-9cc1-60519b5f49be" // Tu project ID
      }
    }
  }
};
```

### 6. Rebuild tu Aplicación

Después de configurar Firebase, necesitas hacer un nuevo build:

```bash
# Para desarrollo
npx expo run:android

# Para producción con EAS
eas build -p android
```

## Verificar la Configuración

Para verificar que Firebase está configurado correctamente:

1. Abre tu app en un dispositivo Android físico (no emulador)
2. Ve a Configuración > Notificaciones
3. Intenta activar las notificaciones push
4. Si todo está bien, deberías ver el mensaje "Notificaciones push activadas correctamente"

## Solución de Problemas

### Error: "FirebaseApp is not initialized"

**Causa**: Firebase no está configurado o el archivo `google-services.json` no está en el lugar correcto.

**Solución**:
1. Verifica que `google-services.json` esté en la raíz del proyecto
2. Verifica que el package name en Firebase coincida con el de tu app
3. Haz un rebuild completo de la app

### Error: "No Expo project ID found"

**Causa**: Falta el project ID en `app.config.js`

**Solución**:
Agrega el project ID en `app.config.js`:
```javascript
extra: {
  eas: {
    projectId: "tu-project-id-aqui"
  }
}
```

### Las notificaciones no llegan

**Posibles causas**:
1. Firebase no está configurado correctamente
2. Los permisos de notificaciones no están otorgados
3. El dispositivo está en modo "No molestar"
4. La app está en modo de ahorro de batería

**Solución**:
1. Verifica que Firebase esté configurado
2. Verifica los permisos en Configuración del dispositivo
3. Desactiva "No molestar"
4. Desactiva el ahorro de batería para la app

## Recursos Adicionales

- [Documentación oficial de Expo sobre FCM](https://docs.expo.dev/push-notifications/fcm-credentials/)
- [Documentación de Firebase](https://firebase.google.com/docs/cloud-messaging)
- [Guía de notificaciones push de Expo](https://docs.expo.dev/push-notifications/overview/)

## Notas Importantes

1. **Firebase es GRATIS** para el uso básico de notificaciones push
2. **No necesitas una tarjeta de crédito** para usar Firebase
3. **Las notificaciones locales funcionan sin Firebase**, solo las push notifications remotas lo requieren
4. **En iOS no necesitas Firebase**, solo en Android

## Alternativa: Usar Solo Notificaciones Locales

Si no quieres configurar Firebase ahora, puedes usar solo notificaciones locales:

1. Las notificaciones locales funcionan sin Firebase
2. La app puede mostrar notificaciones cuando recibe pedidos por WhatsApp
3. No necesitas configurar nada adicional
4. Las notificaciones solo funcionarán cuando la app esté abierta o en segundo plano

Para usar solo notificaciones locales, simplemente no actives las "Notificaciones Push" en la configuración de la app.
