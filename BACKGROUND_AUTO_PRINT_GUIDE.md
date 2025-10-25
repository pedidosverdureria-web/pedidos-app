
# Guía de Auto-Impresión en Segundo Plano

## Descripción General

La función de auto-impresión en segundo plano permite que la aplicación imprima automáticamente los pedidos nuevos incluso cuando:
- La aplicación está en segundo plano
- La pantalla del dispositivo está apagada
- El usuario está usando otras aplicaciones

## Características Principales

### 1. **Impresión en Segundo Plano**
- Utiliza `expo-background-fetch` para ejecutar tareas periódicas
- Verifica nuevos pedidos cada 60 segundos (mínimo permitido por el sistema)
- Funciona incluso con la pantalla apagada

### 2. **Mantener Pantalla Activa**
- Utiliza `expo-keep-awake` para evitar que la pantalla se apague cuando la auto-impresión está activa
- Solo se activa cuando:
  - La auto-impresión está habilitada
  - La impresora está conectada
  - La aplicación está en primer plano

### 3. **Persistencia de Conexión Bluetooth**
- La conexión Bluetooth con la impresora se mantiene activa entre montajes de componentes
- Implementa un mecanismo de "keep-alive" que envía comandos periódicos a la impresora
- Reconexión automática si la conexión se pierde

## Configuración

### Requisitos Previos

1. **Permisos de Android** (configurados en `app.json`):
   - `WAKE_LOCK`: Mantener el dispositivo despierto
   - `RECEIVE_BOOT_COMPLETED`: Iniciar tareas al arrancar el dispositivo
   - `FOREGROUND_SERVICE`: Ejecutar servicios en primer plano

2. **Permisos de iOS** (configurados en `app.json`):
   - `UIBackgroundModes`: `fetch` y `remote-notification`

### Activar Auto-Impresión

1. Ve a **Configuración → Impresora**
2. Conecta una impresora Bluetooth
3. Activa el switch "Activar auto-impresión"
4. Guarda la configuración

La tarea en segundo plano se registrará automáticamente.

## Arquitectura Técnica

### Componentes Principales

#### 1. `backgroundAutoPrintTask.ts`
- Define la tarea en segundo plano usando `TaskManager`
- Verifica nuevos pedidos pendientes cada 60 segundos
- Almacena los IDs de pedidos que necesitan impresión

#### 2. `HomeScreen` (index.tsx)
- Registra/desregistra la tarea en segundo plano según la configuración
- Imprime pedidos en primer plano cuando la app está activa
- Procesa la cola de pedidos pendientes del segundo plano
- Usa `useKeepAwake` para mantener la pantalla activa

#### 3. `usePrinter` Hook
- Mantiene la conexión Bluetooth persistente usando variables globales
- Implementa mecanismo de keep-alive para evitar desconexiones
- Divide datos grandes en chunks para evitar overflow del buffer Bluetooth

### Flujo de Trabajo

```
1. Usuario activa auto-impresión
   ↓
2. Se registra la tarea en segundo plano
   ↓
3. Tarea se ejecuta cada 60 segundos
   ↓
4. Verifica nuevos pedidos pendientes
   ↓
5. Guarda IDs de pedidos a imprimir
   ↓
6. Cuando la app vuelve a primer plano:
   - Lee la cola de pedidos pendientes
   - Imprime cada pedido
   - Marca como impreso
```

## Limitaciones y Consideraciones

### Limitaciones del Sistema

1. **Android**:
   - La frecuencia mínima de ejecución es 60 segundos
   - El sistema puede limitar las tareas en segundo plano para ahorrar batería
   - En modo "ahorro de batería", las tareas pueden retrasarse

2. **iOS**:
   - Las tareas de background fetch son menos predecibles
   - El sistema decide cuándo ejecutar las tareas basándose en patrones de uso
   - Puede haber retrasos de varios minutos

### Limitaciones de Bluetooth

1. **Operaciones en Segundo Plano**:
   - Las operaciones Bluetooth en segundo plano son limitadas en ambas plataformas
   - La impresión real ocurre cuando la app vuelve a primer plano
   - La tarea en segundo plano solo detecta y marca pedidos para imprimir

2. **Conexión**:
   - La conexión Bluetooth puede perderse si el dispositivo está muy lejos
   - El mecanismo de keep-alive ayuda pero no garantiza conexión permanente
   - Se recomienda mantener el dispositivo cerca de la impresora

## Solución de Problemas

### La auto-impresión no funciona

1. **Verificar conexión**:
   - Asegúrate de que la impresora está conectada (banner verde en la pantalla principal)
   - Verifica que el Bluetooth está activado

2. **Verificar configuración**:
   - Ve a Configuración → Impresora
   - Verifica que "Activar auto-impresión" está activado
   - Verifica el estado de la tarea en segundo plano

3. **Verificar permisos**:
   - Android: Verifica que la app tiene permisos de Bluetooth y ubicación
   - iOS: Verifica que la app tiene permisos de Bluetooth

4. **Reiniciar la app**:
   - Cierra completamente la app
   - Vuelve a abrirla
   - Verifica que la conexión se restablece

### Los pedidos se imprimen con retraso

Esto es normal debido a las limitaciones del sistema:
- En Android, el retraso mínimo es de 60 segundos
- En iOS, puede ser mayor dependiendo del sistema
- Cuando la app está en primer plano, la impresión es inmediata

### La impresora se desconecta

1. **Mantener dispositivos cerca**:
   - Asegúrate de que el teléfono/tablet está cerca de la impresora
   - Evita obstáculos entre los dispositivos

2. **Verificar batería de la impresora**:
   - Asegúrate de que la impresora tiene suficiente batería
   - Algunas impresoras se apagan automáticamente para ahorrar batería

3. **Reconectar manualmente**:
   - Ve a Configuración → Impresora
   - Desconecta y vuelve a conectar la impresora

## Mejores Prácticas

1. **Mantener la app en primer plano cuando sea posible**:
   - La impresión es más rápida y confiable
   - No hay limitaciones del sistema

2. **Verificar regularmente la conexión**:
   - Observa el banner de estado en la pantalla principal
   - Verde = todo funcionando correctamente
   - Naranja = hay un problema

3. **Probar la configuración**:
   - Usa el botón "Imprimir prueba" después de cambiar la configuración
   - Verifica que los caracteres especiales (ñ, á, é, etc.) se imprimen correctamente

4. **Mantener el dispositivo cargado**:
   - La auto-impresión consume más batería
   - Se recomienda mantener el dispositivo conectado a la corriente

## Configuración Avanzada

### Ajustar la frecuencia de verificación

Por defecto, la tarea verifica cada 60 segundos. Para cambiar esto:

```typescript
// En backgroundAutoPrintTask.ts
await BackgroundFetch.registerTaskAsync(BACKGROUND_AUTO_PRINT_TASK, {
  minimumInterval: 60, // Cambiar este valor (mínimo 60)
  stopOnTerminate: false,
  startOnBoot: true,
});
```

### Personalizar el formato de impresión

Ajusta la configuración en Configuración → Impresora:
- **Tamaño de texto**: Pequeño, Mediano, Grande
- **Tamaño de papel**: 58mm o 80mm
- **Codificación**: CP850 (recomendado), UTF-8, ISO-8859-1, Windows-1252
- **Incluir logo**: Sí/No
- **Incluir info del cliente**: Sí/No
- **Incluir totales**: Sí/No

## Monitoreo y Depuración

### Logs de Consola

La aplicación genera logs detallados:
- `[BackgroundAutoPrint]`: Logs de la tarea en segundo plano
- `[HomeScreen]`: Logs de impresión en primer plano
- `[usePrinter]`: Logs de operaciones Bluetooth

### Estado de la Tarea

En Configuración → Impresora, verás:
- **✓ Tarea en segundo plano activa**: Todo funcionando correctamente
- **⚠ Tarea en segundo plano no registrada**: Hay un problema con el registro

## Soporte

Si tienes problemas:
1. Revisa los logs de la consola
2. Verifica la configuración y permisos
3. Intenta reiniciar la app y reconectar la impresora
4. Contacta al soporte técnico con los logs de error
