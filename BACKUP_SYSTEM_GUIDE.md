
# Sistema de Backup Automático

## Descripción General

El sistema de backup automático permite crear copias de seguridad de los datos de la aplicación de gestión de pedidos. Incluye funcionalidades para backups manuales y automáticos programados.

## Características

### 1. Backups Manuales

Los usuarios pueden crear y descargar backups manualmente desde la aplicación:

- **Backup de Pedidos**: Exporta todos los pedidos con sus items en formato JSON
- **Backup Completo**: Exporta toda la base de datos incluyendo:
  - Pedidos y items
  - Perfiles de usuarios
  - Configuraciones de WhatsApp e impresora
  - Notificaciones
  - Unidades conocidas para el parser

### 2. Backups Automáticos Programados

El sistema crea automáticamente un backup completo todos los días a las **12:00 AM (medianoche)** hora de Chile Continental y lo envía por correo electrónico a:

**📧 pedidos.verdureria@gmail.com**

#### Configuración del Horario

- **Horario Chile**: 12:00 AM (medianoche)
- **Horario UTC**: 3:00 AM (Chile Continental es UTC-3)
- **Frecuencia**: Diario
- **Formato**: Cron expression: `0 3 * * *`

> **Nota**: Durante el horario de verano en Chile (UTC-4), el backup se ejecutará a las 4:00 AM UTC, que sigue siendo medianoche en Chile.

## Arquitectura Técnica

### Componentes

1. **Frontend (React Native)**
   - Pantalla de backup: `app/settings/backup.tsx`
   - Funciones para crear y descargar backups manuales
   - Interfaz para probar el backup automático

2. **Backend (Supabase Edge Function)**
   - Función: `scheduled-backup`
   - Ubicación: `supabase/functions/scheduled-backup/index.ts`
   - Responsabilidades:
     - Crear backup completo de la base de datos
     - Enviar backup por correo electrónico usando Resend API
     - Manejar errores y logging

3. **Programación (pg_cron)**
   - Extensión de PostgreSQL para tareas programadas
   - Job: `daily-backup-midnight-chile`
   - Invoca la Edge Function automáticamente

4. **Email (Resend API)**
   - Servicio de envío de correos
   - Envía el backup como archivo adjunto JSON
   - Email HTML formateado con estadísticas del backup

### Flujo de Datos

```
┌─────────────────┐
│   pg_cron       │
│  (Scheduler)    │
└────────┬────────┘
         │ Trigger daily at 3 AM UTC
         ▼
┌─────────────────┐
│  Edge Function  │
│scheduled-backup │
└────────┬────────┘
         │
         ├─► Fetch data from Supabase tables
         │
         ├─► Create JSON backup
         │
         └─► Send email via Resend API
                    │
                    ▼
            ┌───────────────┐
            │  Email Inbox  │
            │ pedidos.ver.. │
            └───────────────┘
```

## Configuración

### Variables de Entorno Requeridas

Las siguientes variables deben estar configuradas en Supabase Edge Functions:

1. **SUPABASE_URL**: URL del proyecto de Supabase
2. **SUPABASE_SERVICE_ROLE_KEY**: Clave de servicio para acceso completo
3. **RESEND_API_KEY**: Clave API de Resend para envío de correos

### Configurar Resend API

1. Crear una cuenta en [Resend](https://resend.com)
2. Verificar el dominio de envío
3. Generar una API key
4. Agregar la API key a las variables de entorno de Supabase:
   ```bash
   supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

### Verificar el Job Programado

Para verificar que el job está configurado correctamente:

```sql
-- Ver el estado del job programado
SELECT * FROM scheduled_backup_status;

-- Ver todos los jobs de cron
SELECT * FROM cron.job;

-- Ver el historial de ejecuciones
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-backup-midnight-chile')
ORDER BY start_time DESC
LIMIT 10;
```

## Uso

### Crear Backup Manual

1. Ir a **Configuración** → **Backup**
2. Seleccionar el tipo de backup:
   - **Backup de Pedidos**: Solo pedidos e items
   - **Backup Completo**: Toda la base de datos
3. El archivo se descargará automáticamente (web) o se compartirá (móvil)

### Probar Backup Automático

Solo disponible para administradores:

1. Ir a **Configuración** → **Backup**
2. En la sección "Pruebas", presionar **Probar Backup Automático**
3. Se enviará un backup de prueba al correo configurado
4. Verificar la bandeja de entrada

### Restaurar un Backup

⚠️ **Importante**: La restauración debe realizarse con precaución.

Para restaurar un backup:

1. Contactar al administrador del sistema
2. Proporcionar el archivo de backup JSON
3. El administrador ejecutará scripts de restauración en la base de datos

> **Nota**: La restauración sobrescribirá los datos existentes. Se recomienda crear un backup antes de restaurar.

## Formato del Backup

El archivo de backup es un JSON con la siguiente estructura:

```json
{
  "type": "database",
  "created_at": "2024-01-15T03:00:00.000Z",
  "version": "1.0.0",
  "data": {
    "orders": [...],
    "order_items": [...],
    "profiles": [...],
    "notifications": [...],
    "whatsapp_config": [...],
    "printer_config": [...],
    "known_units": [...]
  },
  "metadata": {
    "total_orders": 150,
    "total_order_items": 450,
    "total_profiles": 5,
    "total_notifications": 200
  }
}
```

## Contenido del Email

El correo de backup incluye:

- **Asunto**: 📦 Backup Automático Diario - Sistema de Pedidos
- **Contenido HTML**: 
  - Resumen del backup con estadísticas
  - Fecha y hora de creación
  - Totales de registros por tabla
  - Advertencias de seguridad
- **Archivo Adjunto**: JSON con el backup completo

## Seguridad

### Consideraciones de Seguridad

1. **Datos Sensibles**: Los backups contienen información sensible (tokens, configuraciones)
2. **Almacenamiento**: Guardar los backups en un lugar seguro
3. **Acceso**: Solo administradores pueden probar backups manuales
4. **Encriptación**: Los correos se envían a través de conexiones seguras (TLS)

### Recomendaciones

- Cambiar las contraseñas y tokens después de restaurar un backup
- No compartir archivos de backup públicamente
- Mantener múltiples versiones de backups
- Verificar regularmente que los backups se están enviando correctamente

## Troubleshooting

### El backup no se envía por correo

1. Verificar que RESEND_API_KEY está configurado
2. Verificar que el dominio está verificado en Resend
3. Revisar los logs de la Edge Function:
   ```bash
   supabase functions logs scheduled-backup
   ```

### El job programado no se ejecuta

1. Verificar que pg_cron está habilitado:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. Verificar el estado del job:
   ```sql
   SELECT * FROM scheduled_backup_status;
   ```

3. Revisar errores en el historial:
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-backup-midnight-chile')
   AND status = 'failed'
   ORDER BY start_time DESC;
   ```

### Error al crear backup manual

1. Verificar conexión a internet
2. Verificar permisos de la aplicación para acceder al almacenamiento
3. Revisar los logs de la consola del navegador/app

## Mantenimiento

### Actualizar el Horario del Backup

Para cambiar el horario del backup:

```sql
-- Eliminar el job existente
SELECT cron.unschedule('daily-backup-midnight-chile');

-- Crear nuevo job con diferente horario
-- Ejemplo: 2 AM Chile (5 AM UTC)
SELECT cron.schedule(
  'daily-backup-midnight-chile',
  '0 5 * * *',
  $$
  SELECT net.http_post(
    url := 'https://lgiqpypnhnkylzyhhtze.supabase.co/functions/v1/scheduled-backup',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_KEY"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
  );
  $$
);
```

### Cambiar el Email de Destino

Editar el archivo `supabase/functions/scheduled-backup/index.ts`:

```typescript
const BACKUP_EMAIL = 'nuevo-email@example.com';
```

Luego redesplegar la función:

```bash
supabase functions deploy scheduled-backup
```

## Monitoreo

### Verificar Backups Recientes

Revisar la bandeja de entrada del correo configurado para verificar que los backups se están recibiendo diariamente.

### Logs de la Edge Function

```bash
# Ver logs en tiempo real
supabase functions logs scheduled-backup --follow

# Ver logs de las últimas 24 horas
supabase functions logs scheduled-backup
```

### Historial de Ejecuciones de Cron

```sql
SELECT 
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-backup-midnight-chile')
ORDER BY start_time DESC
LIMIT 30;
```

## Soporte

Para problemas o preguntas sobre el sistema de backup:

1. Revisar esta documentación
2. Verificar los logs de la aplicación y Edge Functions
3. Contactar al equipo de desarrollo
4. Revisar la documentación de Supabase sobre pg_cron y Edge Functions

## Referencias

- [Supabase pg_cron Documentation](https://supabase.com/docs/guides/database/extensions/pgcron)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Resend API Documentation](https://resend.com/docs)
- [pg_net Extension](https://supabase.com/docs/guides/database/extensions/pg_net)
