
# 🚀 Backup - Guía Rápida

## Acceso Rápido

**Configuración → Backup**

## Backups Manuales

### Backup de Pedidos
- Exporta todos los pedidos con sus items
- Formato: JSON
- Descarga inmediata

### Backup Completo
- Exporta toda la base de datos
- Incluye: pedidos, usuarios, configuraciones, notificaciones
- Formato: JSON
- Descarga inmediata

## Backups Automáticos

**📧 Destino**: pedidos.verdureria@gmail.com

**⏰ Horario**: 12:00 AM (medianoche) - Chile Continental

**📅 Frecuencia**: Diario

**✅ Estado**: Activo

## Configuración Requerida

Para que funcionen los backups automáticos por correo:

1. Crear cuenta en [resend.com](https://resend.com)
2. Verificar un dominio
3. Generar API key
4. Configurar en Supabase:
   ```bash
   supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

## Probar el Sistema

### Backup Manual
1. Ir a Configuración → Backup
2. Presionar "Backup Completo"
3. Verificar descarga

### Backup por Correo (Admin)
1. Ir a Configuración → Backup
2. Presionar "Probar Backup Automático"
3. Revisar correo

## Verificar Job Programado

```sql
SELECT * FROM scheduled_backup_status;
```

## Logs

```bash
supabase functions logs scheduled-backup
```

## Soporte

- Ver `BACKUP_SYSTEM_GUIDE.md` para documentación completa
- Ver `BACKUP_SETUP_COMPLETE.md` para instrucciones de configuración
- Revisar logs en caso de problemas

---

**Estado**: ✅ Sistema activo y funcional
