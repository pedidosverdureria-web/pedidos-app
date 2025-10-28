
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const BACKUP_EMAIL = 'pedidos.verdureria@gmail.com';

interface BackupData {
  type: string;
  created_at: string;
  version: string;
  data: {
    orders: any[];
    order_items: any[];
    profiles: any[];
    notifications: any[];
    whatsapp_config: any[];
    printer_config: any[];
    known_units: any[];
  };
  metadata: {
    total_orders: number;
    total_order_items: number;
    total_profiles: number;
    total_notifications: number;
  };
}

/**
 * Create a complete database backup
 */
async function createDatabaseBackup(supabase: any): Promise<BackupData> {
  console.log('[Backup] Creating database backup...');

  // Fetch all data from all tables
  const [ordersRes, orderItemsRes, profilesRes, notificationsRes, whatsappConfigRes, printerConfigRes, knownUnitsRes] = await Promise.all([
    supabase.from('orders').select('*').order('created_at', { ascending: false }),
    supabase.from('order_items').select('*'),
    supabase.from('profiles').select('*'),
    supabase.from('notifications').select('*').order('created_at', { ascending: false }),
    supabase.from('whatsapp_config').select('*'),
    supabase.from('printer_config').select('*'),
    supabase.from('known_units').select('*'),
  ]);

  // Check for errors
  const errors = [
    ordersRes.error,
    orderItemsRes.error,
    profilesRes.error,
    notificationsRes.error,
    whatsappConfigRes.error,
    printerConfigRes.error,
    knownUnitsRes.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(`Database backup failed: ${errors.map((e: any) => e?.message).join(', ')}`);
  }

  // Create backup object
  const backup: BackupData = {
    type: 'database',
    created_at: new Date().toISOString(),
    version: '1.0.0',
    data: {
      orders: ordersRes.data || [],
      order_items: orderItemsRes.data || [],
      profiles: profilesRes.data || [],
      notifications: notificationsRes.data || [],
      whatsapp_config: whatsappConfigRes.data || [],
      printer_config: printerConfigRes.data || [],
      known_units: knownUnitsRes.data || [],
    },
    metadata: {
      total_orders: ordersRes.data?.length || 0,
      total_order_items: orderItemsRes.data?.length || 0,
      total_profiles: profilesRes.data?.length || 0,
      total_notifications: notificationsRes.data?.length || 0,
    },
  };

  console.log('[Backup] Database backup created successfully');
  console.log('[Backup] Metadata:', backup.metadata);

  return backup;
}

/**
 * Send backup via email using Resend API
 */
async function sendBackupEmail(backup: BackupData, isTest = false): Promise<void> {
  console.log('[Backup] Sending backup email...');

  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY not configured');
  }

  const jsonString = JSON.stringify(backup, null, 2);
  const base64Content = btoa(jsonString);
  const fileName = `database_backup_${new Date().toISOString().split('T')[0]}.json`;

  const emailSubject = isTest 
    ? '🧪 Backup de Prueba - Sistema de Pedidos'
    : '📦 Backup Automático Diario - Sistema de Pedidos';

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .stats { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; }
          .stat-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .stat-item:last-child { border-bottom: none; }
          .stat-label { font-weight: 600; color: #6b7280; }
          .stat-value { font-weight: 700; color: #667eea; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          .badge { display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🔒 Backup del Sistema</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">
              ${isTest ? 'Backup de Prueba' : 'Backup Automático Diario'}
            </p>
          </div>
          <div class="content">
            ${isTest ? '<div class="warning">⚠️ Este es un backup de prueba. Se ha generado manualmente para verificar el funcionamiento del sistema.</div>' : ''}
            
            <p>Se ha generado un nuevo backup completo de la base de datos del sistema de gestión de pedidos.</p>
            
            <div class="stats">
              <h3 style="margin-top: 0; color: #111827;">📊 Resumen del Backup</h3>
              <div class="stat-item">
                <span class="stat-label">Fecha y Hora:</span>
                <span class="stat-value">${new Date(backup.created_at).toLocaleString('es-CL', { timeZone: 'America/Santiago' })}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Total de Pedidos:</span>
                <span class="stat-value">${backup.metadata.total_orders}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Total de Items:</span>
                <span class="stat-value">${backup.metadata.total_order_items}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Total de Usuarios:</span>
                <span class="stat-value">${backup.metadata.total_profiles}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Total de Notificaciones:</span>
                <span class="stat-value">${backup.metadata.total_notifications}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Versión:</span>
                <span class="stat-value">${backup.version}</span>
              </div>
            </div>

            <p>El archivo adjunto contiene una copia completa de:</p>
            <ul>
              <li>✅ Todos los pedidos y sus items</li>
              <li>✅ Perfiles de usuarios</li>
              <li>✅ Configuraciones de WhatsApp e impresora</li>
              <li>✅ Notificaciones del sistema</li>
              <li>✅ Unidades conocidas para el parser</li>
            </ul>

            <div class="warning">
              <strong>⚠️ Importante:</strong> Guarda este archivo en un lugar seguro. 
              Contiene información sensible y puede ser usado para restaurar el sistema en caso de fallas.
            </div>

            <p style="margin-top: 30px;">
              <span class="badge">BACKUP AUTOMÁTICO</span>
            </p>
          </div>
          <div class="footer">
            <p>Sistema de Gestión de Pedidos - Order Management</p>
            <p style="font-size: 12px; color: #9ca3af;">
              Este es un correo automático. Por favor no responder.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  const emailPayload = {
    from: 'Sistema de Pedidos <backups@natively.dev>',
    to: BACKUP_EMAIL,
    subject: emailSubject,
    html: emailHtml,
    attachments: [
      {
        filename: fileName,
        content: base64Content,
        content_type: 'application/json',
      },
    ],
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify(emailPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send email: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('[Backup] Email sent successfully:', result);
}

/**
 * Main handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    console.log('[Backup] Scheduled backup function invoked');

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const isTest = body.test === true;

    if (isTest) {
      console.log('[Backup] Running in TEST mode');
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Create database backup
    const backup = await createDatabaseBackup(supabase);

    // Send backup via email
    await sendBackupEmail(backup, isTest);

    return new Response(
      JSON.stringify({
        success: true,
        message: isTest ? 'Test backup sent successfully' : 'Scheduled backup completed successfully',
        metadata: backup.metadata,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('[Backup] Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
