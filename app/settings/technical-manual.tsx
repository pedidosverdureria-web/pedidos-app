
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function TechnicalManualScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Manual Técnico',
          headerBackTitle: 'Atrás',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.mainTitle}>Manual Técnico</Text>
          <Text style={styles.subtitle}>
            Guía completa de configuración y administración del sistema
          </Text>
        </View>

        {/* Architecture */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="cpu.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>1. Arquitectura del Sistema</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Stack Tecnológico</Text>
            <Text style={styles.codeBlock}>Frontend:</Text>
            <Text style={styles.bulletPoint}>• React Native 0.81.4</Text>
            <Text style={styles.bulletPoint}>• Expo 54</Text>
            <Text style={styles.bulletPoint}>• Expo Router (file-based routing)</Text>
            <Text style={styles.bulletPoint}>• TypeScript</Text>
            
            <Text style={styles.codeBlock}>Backend:</Text>
            <Text style={styles.bulletPoint}>• Supabase (BaaS)</Text>
            <Text style={styles.bulletPoint}>• PostgreSQL (Database)</Text>
            <Text style={styles.bulletPoint}>• Supabase Auth (Authentication)</Text>
            <Text style={styles.bulletPoint}>• Edge Functions (Serverless)</Text>
            
            <Text style={styles.codeBlock}>Integraciones:</Text>
            <Text style={styles.bulletPoint}>• WhatsApp Business API</Text>
            <Text style={styles.bulletPoint}>• Bluetooth Low Energy (BLE)</Text>
            <Text style={styles.bulletPoint}>• Expo Notifications</Text>
            <Text style={styles.bulletPoint}>• Background Tasks</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Estructura de la Base de Datos</Text>
            <Text style={styles.codeBlock}>Tablas principales:</Text>
            <Text style={styles.bulletPoint}>• users - Usuarios del sistema</Text>
            <Text style={styles.bulletPoint}>• orders - Pedidos</Text>
            <Text style={styles.bulletPoint}>• order_items - Productos de pedidos</Text>
            <Text style={styles.bulletPoint}>• notifications - Notificaciones in-app</Text>
            <Text style={styles.bulletPoint}>• whatsapp_config - Configuración de WhatsApp</Text>
            <Text style={styles.bulletPoint}>• known_units - Unidades de medida conocidas</Text>
          </View>
        </View>

        {/* Supabase Setup */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="server.rack" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>2. Configuración de Supabase</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Proyecto Supabase</Text>
            <Text style={styles.paragraph}>
              ID del Proyecto: lgiqpypnhnkylzyhhtze
            </Text>
            <Text style={styles.paragraph}>
              URL: https://lgiqpypnhnkylzyhhtze.supabase.co
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Variables de Entorno</Text>
            <Text style={styles.codeBlock}>Archivo: lib/supabase.ts</Text>
            <Text style={styles.code}>SUPABASE_URL</Text>
            <Text style={styles.code}>SUPABASE_ANON_KEY</Text>
            <Text style={styles.paragraph}>
              Estas credenciales se obtienen del dashboard de Supabase en Settings → API.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Row Level Security (RLS)</Text>
            <Text style={styles.paragraph}>
              Todas las tablas implementan políticas RLS para seguridad:
            </Text>
            <Text style={styles.codeBlock}>Políticas de orders:</Text>
            <Text style={styles.bulletPoint}>• SELECT: Usuarios autenticados pueden ver todos los pedidos</Text>
            <Text style={styles.bulletPoint}>• INSERT: Usuarios autenticados pueden crear pedidos</Text>
            <Text style={styles.bulletPoint}>• UPDATE: Usuarios autenticados pueden actualizar pedidos</Text>
            <Text style={styles.bulletPoint}>• DELETE: Solo admins pueden eliminar pedidos</Text>
            
            <Text style={styles.codeBlock}>Políticas de users:</Text>
            <Text style={styles.bulletPoint}>• SELECT: Usuarios pueden ver su propio perfil</Text>
            <Text style={styles.bulletPoint}>• UPDATE: Admins pueden actualizar cualquier usuario</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Migraciones</Text>
            <Text style={styles.paragraph}>
              Las migraciones se aplican automáticamente usando la herramienta apply_migration.
            </Text>
            <Text style={styles.paragraph}>
              Para ver migraciones aplicadas, ejecuta:
            </Text>
            <Text style={styles.code}>SELECT * FROM supabase_migrations.schema_migrations;</Text>
          </View>
        </View>

        {/* WhatsApp Configuration */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="message.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>3. Configuración de WhatsApp</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>WhatsApp Business API</Text>
            <Text style={styles.paragraph}>
              Requisitos previos:
            </Text>
            <Text style={styles.bulletPoint}>• Cuenta de WhatsApp Business</Text>
            <Text style={styles.bulletPoint}>• Meta Developer Account</Text>
            <Text style={styles.bulletPoint}>• App de Facebook configurada</Text>
            <Text style={styles.bulletPoint}>• Número de teléfono verificado</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Credenciales Necesarias</Text>
            <Text style={styles.codeBlock}>En Configuración → WhatsApp:</Text>
            <Text style={styles.bulletPoint}>• verify_token: Token de verificación personalizado</Text>
            <Text style={styles.bulletPoint}>• access_token: Token de acceso de Meta</Text>
            <Text style={styles.bulletPoint}>• phone_number_id: ID del número de teléfono</Text>
            <Text style={styles.bulletPoint}>• webhook_url: URL del Edge Function</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Edge Function: whatsapp-webhook</Text>
            <Text style={styles.paragraph}>
              Ubicación: supabase/functions/whatsapp-webhook/index.ts
            </Text>
            <Text style={styles.codeBlock}>Funcionalidades:</Text>
            <Text style={styles.bulletPoint}>• Verificación del webhook (GET)</Text>
            <Text style={styles.bulletPoint}>• Recepción de mensajes (POST)</Text>
            <Text style={styles.bulletPoint}>• Parseo inteligente de pedidos</Text>
            <Text style={styles.bulletPoint}>• Creación automática de pedidos</Text>
            <Text style={styles.bulletPoint}>• Respuestas automáticas</Text>
            <Text style={styles.bulletPoint}>• Gestión de unidades desconocidas</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Parser de Mensajes</Text>
            <Text style={styles.paragraph}>
              El parser reconoce múltiples formatos:
            </Text>
            <Text style={styles.codeBlock}>Formatos soportados:</Text>
            <Text style={styles.bulletPoint}>• "2 kg tomate"</Text>
            <Text style={styles.bulletPoint}>• "1 lechuga"</Text>
            <Text style={styles.bulletPoint}>• "3 unidades cebolla"</Text>
            <Text style={styles.bulletPoint}>• "medio kilo papa"</Text>
            <Text style={styles.bulletPoint}>• "dos kilos zanahoria"</Text>
            
            <Text style={styles.codeBlock}>Unidades reconocidas:</Text>
            <Text style={styles.bulletPoint}>• kg, kilo, kilos, kilogramo</Text>
            <Text style={styles.bulletPoint}>• g, gramo, gramos</Text>
            <Text style={styles.bulletPoint}>• l, litro, litros</Text>
            <Text style={styles.bulletPoint}>• ml, mililitro</Text>
            <Text style={styles.bulletPoint}>• unidad, unidades, u</Text>
            <Text style={styles.bulletPoint}>• docena, media docena</Text>
            <Text style={styles.bulletPoint}>• caja, cajas</Text>
            <Text style={styles.bulletPoint}>• bolsa, bolsas</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Configurar Webhook en Meta</Text>
            <Text style={styles.paragraph}>
              1. Ve a Meta Developer Console
            </Text>
            <Text style={styles.paragraph}>
              2. Selecciona tu app → WhatsApp → Configuration
            </Text>
            <Text style={styles.paragraph}>
              3. En Webhook, haz clic en "Edit"
            </Text>
            <Text style={styles.paragraph}>
              4. Ingresa la URL del webhook:
            </Text>
            <Text style={styles.code}>
              https://lgiqpypnhnkylzyhhtze.supabase.co/functions/v1/whatsapp-webhook
            </Text>
            <Text style={styles.paragraph}>
              5. Ingresa el verify_token configurado en la app
            </Text>
            <Text style={styles.paragraph}>
              6. Suscríbete a "messages" webhook
            </Text>
            <Text style={styles.paragraph}>
              7. Verifica y guarda
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Probar Integración</Text>
            <Text style={styles.paragraph}>
              Usa la pantalla de prueba en Configuración → Prueba de WhatsApp Parser para:
            </Text>
            <Text style={styles.bulletPoint}>• Probar diferentes formatos de mensajes</Text>
            <Text style={styles.bulletPoint}>• Ver cómo se parsean los productos</Text>
            <Text style={styles.bulletPoint}>• Validar cantidades y unidades</Text>
            <Text style={styles.bulletPoint}>• Cargar ejemplos predefinidos</Text>
          </View>
        </View>

        {/* Printer Configuration */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="printer.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>4. Configuración de Impresora</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Impresoras Compatibles</Text>
            <Text style={styles.paragraph}>
              La app soporta impresoras térmicas de 80mm con Bluetooth genéricas.
            </Text>
            <Text style={styles.codeBlock}>Marcas probadas:</Text>
            <Text style={styles.bulletPoint}>• Epson TM-T20</Text>
            <Text style={styles.bulletPoint}>• Star Micronics TSP143III</Text>
            <Text style={styles.bulletPoint}>• Bixolon SPP-R200</Text>
            <Text style={styles.bulletPoint}>• Impresoras genéricas ESC/POS</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Conexión Bluetooth</Text>
            <Text style={styles.paragraph}>
              Proceso de conexión:
            </Text>
            <Text style={styles.bulletPoint}>1. Enciende la impresora</Text>
            <Text style={styles.bulletPoint}>2. Activa Bluetooth en el dispositivo</Text>
            <Text style={styles.bulletPoint}>3. Ve a Configuración → Impresora</Text>
            <Text style={styles.bulletPoint}>4. Toca "Escanear Dispositivos"</Text>
            <Text style={styles.bulletPoint}>5. Selecciona tu impresora de la lista</Text>
            <Text style={styles.bulletPoint}>6. Espera la confirmación de conexión</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Configuración de Impresión</Text>
            <Text style={styles.codeBlock}>Opciones disponibles:</Text>
            <Text style={styles.bulletPoint}>• Tamaño de texto: Pequeño, Normal, Grande</Text>
            <Text style={styles.bulletPoint}>• Tamaño de papel: 58mm, 80mm</Text>
            <Text style={styles.bulletPoint}>• Codificación: UTF-8, CP850, ISO-8859-1, Windows-1252</Text>
            <Text style={styles.bulletPoint}>• Auto-corte: Activado/Desactivado</Text>
            <Text style={styles.bulletPoint}>• Incluir logo: Sí/No</Text>
            <Text style={styles.bulletPoint}>• Incluir info del cliente: Sí/No</Text>
            <Text style={styles.bulletPoint}>• Incluir totales: Sí/No</Text>
            <Text style={styles.bulletPoint}>• Usar formato webhook: Sí/No</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Auto-Impresión</Text>
            <Text style={styles.paragraph}>
              Cuando está habilitada, los pedidos nuevos se imprimen automáticamente.
            </Text>
            <Text style={styles.codeBlock}>Requisitos:</Text>
            <Text style={styles.bulletPoint}>• Impresora conectada</Text>
            <Text style={styles.bulletPoint}>• Permisos de Bluetooth otorgados</Text>
            <Text style={styles.bulletPoint}>• Permisos de Background Fetch</Text>
            <Text style={styles.bulletPoint}>• Optimización de batería deshabilitada (Android)</Text>
            <Text style={styles.bulletPoint}>• App con Keep Awake activo</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Comandos ESC/POS</Text>
            <Text style={styles.paragraph}>
              La app usa comandos ESC/POS estándar:
            </Text>
            <Text style={styles.code}>ESC @ - Inicializar impresora</Text>
            <Text style={styles.code}>ESC a - Alineación (0=izq, 1=centro, 2=der)</Text>
            <Text style={styles.code}>ESC ! - Estilo de texto</Text>
            <Text style={styles.code}>GS V - Corte de papel</Text>
            <Text style={styles.code}>LF - Salto de línea</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Solución de Problemas</Text>
            <Text style={styles.codeBlock}>Impresora no se conecta:</Text>
            <Text style={styles.bulletPoint}>• Verifica que el Bluetooth esté activado</Text>
            <Text style={styles.bulletPoint}>• Asegúrate de que la impresora esté encendida</Text>
            <Text style={styles.bulletPoint}>• Desvincula y vuelve a vincular el dispositivo</Text>
            <Text style={styles.bulletPoint}>• Reinicia la impresora</Text>
            
            <Text style={styles.codeBlock}>Caracteres extraños:</Text>
            <Text style={styles.bulletPoint}>• Cambia la codificación en configuración</Text>
            <Text style={styles.bulletPoint}>• Prueba CP850 para español</Text>
            <Text style={styles.bulletPoint}>• Verifica el modelo de impresora</Text>
            
            <Text style={styles.codeBlock}>No imprime automáticamente:</Text>
            <Text style={styles.bulletPoint}>• Verifica que auto-impresión esté habilitada</Text>
            <Text style={styles.bulletPoint}>• Revisa los permisos en Configuración → Permisos</Text>
            <Text style={styles.bulletPoint}>• Deshabilita optimización de batería</Text>
            <Text style={styles.bulletPoint}>• Mantén la app en primer plano</Text>
          </View>
        </View>

        {/* Permissions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="lock.shield.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>5. Permisos del Sistema</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Permisos Requeridos</Text>
            <Text style={styles.codeBlock}>Android:</Text>
            <Text style={styles.bulletPoint}>• BLUETOOTH - Conexión con impresora</Text>
            <Text style={styles.bulletPoint}>• BLUETOOTH_ADMIN - Gestión de Bluetooth</Text>
            <Text style={styles.bulletPoint}>• BLUETOOTH_CONNECT - Conectar dispositivos</Text>
            <Text style={styles.bulletPoint}>• BLUETOOTH_SCAN - Escanear dispositivos</Text>
            <Text style={styles.bulletPoint}>• ACCESS_FINE_LOCATION - Requerido para BLE</Text>
            <Text style={styles.bulletPoint}>• POST_NOTIFICATIONS - Notificaciones push</Text>
            <Text style={styles.bulletPoint}>• WAKE_LOCK - Mantener dispositivo activo</Text>
            <Text style={styles.bulletPoint}>• REQUEST_IGNORE_BATTERY_OPTIMIZATIONS - Background tasks</Text>
            
            <Text style={styles.codeBlock}>iOS:</Text>
            <Text style={styles.bulletPoint}>• NSBluetoothAlwaysUsageDescription</Text>
            <Text style={styles.bulletPoint}>• NSBluetoothPeripheralUsageDescription</Text>
            <Text style={styles.bulletPoint}>• NSLocationWhenInUseUsageDescription</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Gestión de Permisos</Text>
            <Text style={styles.paragraph}>
              Ve a Configuración → Permisos para:
            </Text>
            <Text style={styles.bulletPoint}>• Ver estado de todos los permisos</Text>
            <Text style={styles.bulletPoint}>• Solicitar permisos faltantes</Text>
            <Text style={styles.bulletPoint}>• Abrir configuración del sistema</Text>
            <Text style={styles.bulletPoint}>• Solicitar todos los permisos a la vez</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Optimización de Batería (Android)</Text>
            <Text style={styles.paragraph}>
              Para que la auto-impresión funcione en segundo plano:
            </Text>
            <Text style={styles.bulletPoint}>1. Ve a Configuración → Permisos</Text>
            <Text style={styles.bulletPoint}>2. Toca "Optimización de Batería"</Text>
            <Text style={styles.bulletPoint}>3. Selecciona "No optimizar"</Text>
            <Text style={styles.bulletPoint}>4. Confirma el cambio</Text>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="bell.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>6. Sistema de Notificaciones</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tipos de Notificaciones</Text>
            <Text style={styles.codeBlock}>Push Notifications:</Text>
            <Text style={styles.bulletPoint}>• Nuevos pedidos por WhatsApp</Text>
            <Text style={styles.bulletPoint}>• Cambios de estado de pedidos</Text>
            <Text style={styles.bulletPoint}>• Errores de impresión</Text>
            
            <Text style={styles.codeBlock}>In-App Notifications:</Text>
            <Text style={styles.bulletPoint}>• Historial de notificaciones</Text>
            <Text style={styles.bulletPoint}>• Navegación a pedidos</Text>
            <Text style={styles.bulletPoint}>• Contador de no leídas</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Configuración de Expo Notifications</Text>
            <Text style={styles.paragraph}>
              Archivo: utils/pushNotifications.ts
            </Text>
            <Text style={styles.codeBlock}>Funciones principales:</Text>
            <Text style={styles.bulletPoint}>• registerForPushNotificationsAsync()</Text>
            <Text style={styles.bulletPoint}>• setupNotificationResponseHandler()</Text>
            <Text style={styles.bulletPoint}>• createInAppNotification()</Text>
            <Text style={styles.bulletPoint}>• sendLocalNotification()</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Background Notification Task</Text>
            <Text style={styles.paragraph}>
              Archivo: utils/backgroundNotificationTask.ts
            </Text>
            <Text style={styles.paragraph}>
              Verifica nuevos pedidos cada 15 minutos en segundo plano.
            </Text>
            <Text style={styles.codeBlock}>Configuración en app.json:</Text>
            <Text style={styles.code}>
              "ios": {"{"}
              {"\n"}  "backgroundModes": ["fetch"]
              {"\n"}
              {"}"}
            </Text>
          </View>
        </View>

        {/* User Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="person.2.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>7. Gestión de Usuarios</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Roles de Usuario</Text>
            <Text style={styles.codeBlock}>Admin:</Text>
            <Text style={styles.bulletPoint}>• Acceso completo al sistema</Text>
            <Text style={styles.bulletPoint}>• Gestión de usuarios</Text>
            <Text style={styles.bulletPoint}>• Configuración de integraciones</Text>
            <Text style={styles.bulletPoint}>• Eliminación de pedidos</Text>
            <Text style={styles.bulletPoint}>• Acceso a todas las configuraciones</Text>
            
            <Text style={styles.codeBlock}>Trabajador:</Text>
            <Text style={styles.bulletPoint}>• Gestión de pedidos</Text>
            <Text style={styles.bulletPoint}>• Impresión de tickets</Text>
            <Text style={styles.bulletPoint}>• Comunicación con clientes</Text>
            <Text style={styles.bulletPoint}>• Ver estadísticas</Text>
            <Text style={styles.bulletPoint}>• Configuración de impresora personal</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Crear Nuevo Usuario (Admin)</Text>
            <Text style={styles.paragraph}>
              1. Ve a Configuración → Usuarios
            </Text>
            <Text style={styles.paragraph}>
              2. Toca el botón "+"
            </Text>
            <Text style={styles.paragraph}>
              3. Ingresa email y contraseña
            </Text>
            <Text style={styles.paragraph}>
              4. Selecciona el rol
            </Text>
            <Text style={styles.paragraph}>
              5. El usuario recibirá un email de verificación
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Modificar Roles</Text>
            <Text style={styles.paragraph}>
              Solo los administradores pueden cambiar roles de usuarios.
            </Text>
            <Text style={styles.paragraph}>
              Los cambios se aplican inmediatamente y el usuario debe reiniciar sesión.
            </Text>
          </View>
        </View>

        {/* Background Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="clock.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>8. Tareas en Segundo Plano</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Background Auto-Print Task</Text>
            <Text style={styles.paragraph}>
              Archivo: utils/backgroundAutoPrintTask.ts
            </Text>
            <Text style={styles.codeBlock}>Funcionalidad:</Text>
            <Text style={styles.bulletPoint}>• Verifica nuevos pedidos cada 15 minutos</Text>
            <Text style={styles.bulletPoint}>• Imprime automáticamente pedidos no impresos</Text>
            <Text style={styles.bulletPoint}>• Mantiene registro de pedidos impresos</Text>
            <Text style={styles.bulletPoint}>• Funciona incluso con la app cerrada</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Keep Awake</Text>
            <Text style={styles.paragraph}>
              La app usa expo-keep-awake para mantener el dispositivo activo durante la auto-impresión.
            </Text>
            <Text style={styles.codeBlock}>Implementación:</Text>
            <Text style={styles.bulletPoint}>• Se activa cuando auto-impresión está habilitada</Text>
            <Text style={styles.bulletPoint}>• Se desactiva al cerrar la app</Text>
            <Text style={styles.bulletPoint}>• Usa tags únicos para cada pantalla</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Configuración de Background Fetch</Text>
            <Text style={styles.paragraph}>
              Archivo: app.json
            </Text>
            <Text style={styles.code}>
              "ios": {"{"}
              {"\n"}  "backgroundModes": ["fetch", "remote-notification"]
              {"\n"}
              {"}"}
            </Text>
            <Text style={styles.code}>
              "android": {"{"}
              {"\n"}  "permissions": ["WAKE_LOCK", "RECEIVE_BOOT_COMPLETED"]
              {"\n"}
              {"}"}
            </Text>
          </View>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="lock.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>9. Seguridad</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Autenticación</Text>
            <Text style={styles.paragraph}>
              La app usa Supabase Auth con email y contraseña.
            </Text>
            <Text style={styles.codeBlock}>Características:</Text>
            <Text style={styles.bulletPoint}>• Verificación de email obligatoria</Text>
            <Text style={styles.bulletPoint}>• Sesiones persistentes</Text>
            <Text style={styles.bulletPoint}>• Tokens JWT automáticos</Text>
            <Text style={styles.bulletPoint}>• Refresh tokens</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Row Level Security (RLS)</Text>
            <Text style={styles.paragraph}>
              Todas las tablas tienen políticas RLS habilitadas.
            </Text>
            <Text style={styles.paragraph}>
              Los usuarios solo pueden acceder a datos según su rol y permisos.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Almacenamiento Local</Text>
            <Text style={styles.paragraph}>
              La app usa AsyncStorage para:
            </Text>
            <Text style={styles.bulletPoint}>• Configuración de impresora</Text>
            <Text style={styles.bulletPoint}>• Registro de pedidos impresos</Text>
            <Text style={styles.bulletPoint}>• Cache de configuraciones</Text>
            <Text style={styles.paragraph}>
              Los datos sensibles nunca se almacenan localmente.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Comunicación Segura</Text>
            <Text style={styles.bulletPoint}>• Todas las peticiones usan HTTPS</Text>
            <Text style={styles.bulletPoint}>• Tokens de acceso en headers</Text>
            <Text style={styles.bulletPoint}>• Validación de webhooks con verify_token</Text>
            <Text style={styles.bulletPoint}>• Encriptación de datos en tránsito</Text>
          </View>
        </View>

        {/* Monitoring */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="chart.line.uptrend.xyaxis" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>10. Monitoreo y Logs</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Logs de Supabase</Text>
            <Text style={styles.paragraph}>
              Accede a los logs en el dashboard de Supabase:
            </Text>
            <Text style={styles.bulletPoint}>• Database logs - Consultas SQL</Text>
            <Text style={styles.bulletPoint}>• API logs - Peticiones REST</Text>
            <Text style={styles.bulletPoint}>• Edge Function logs - Ejecución de funciones</Text>
            <Text style={styles.bulletPoint}>• Auth logs - Autenticación y sesiones</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Logs de la App</Text>
            <Text style={styles.paragraph}>
              La app usa console.log extensivamente para debugging.
            </Text>
            <Text style={styles.paragraph}>
              En desarrollo, los logs aparecen en la consola de Expo.
            </Text>
            <Text style={styles.paragraph}>
              En producción, considera integrar un servicio de logging como Sentry.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Error Handling</Text>
            <Text style={styles.paragraph}>
              Archivo: utils/errorLogger.ts
            </Text>
            <Text style={styles.paragraph}>
              Registra errores en la tabla de notificaciones para revisión posterior.
            </Text>
          </View>
        </View>

        {/* Deployment */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="arrow.up.doc.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>11. Despliegue</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Build con EAS</Text>
            <Text style={styles.paragraph}>
              La app usa Expo Application Services (EAS) para builds.
            </Text>
            <Text style={styles.codeBlock}>Comandos:</Text>
            <Text style={styles.code}>eas build --platform android</Text>
            <Text style={styles.code}>eas build --platform ios</Text>
            <Text style={styles.code}>eas build --platform all</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Configuración de Build</Text>
            <Text style={styles.paragraph}>
              Archivo: eas.json
            </Text>
            <Text style={styles.paragraph}>
              Define perfiles de build para desarrollo, preview y producción.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Variables de Entorno</Text>
            <Text style={styles.paragraph}>
              Configura variables de entorno en EAS:
            </Text>
            <Text style={styles.code}>eas secret:create --name SUPABASE_URL --value ...</Text>
            <Text style={styles.code}>eas secret:create --name SUPABASE_ANON_KEY --value ...</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Publicación</Text>
            <Text style={styles.codeBlock}>Google Play Store:</Text>
            <Text style={styles.bulletPoint}>• Genera APK/AAB con EAS</Text>
            <Text style={styles.bulletPoint}>• Sube a Google Play Console</Text>
            <Text style={styles.bulletPoint}>• Configura permisos y descripciones</Text>
            <Text style={styles.bulletPoint}>• Publica en producción</Text>
            
            <Text style={styles.codeBlock}>Apple App Store:</Text>
            <Text style={styles.bulletPoint}>• Genera IPA con EAS</Text>
            <Text style={styles.bulletPoint}>• Sube a App Store Connect</Text>
            <Text style={styles.bulletPoint}>• Configura metadata y screenshots</Text>
            <Text style={styles.bulletPoint}>• Envía para revisión</Text>
          </View>
        </View>

        {/* Maintenance */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="wrench.and.screwdriver.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>12. Mantenimiento</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Actualizaciones</Text>
            <Text style={styles.paragraph}>
              Mantén las dependencias actualizadas regularmente:
            </Text>
            <Text style={styles.code}>npm update</Text>
            <Text style={styles.code}>expo upgrade</Text>
            <Text style={styles.paragraph}>
              Revisa breaking changes antes de actualizar versiones mayores.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Backup de Base de Datos</Text>
            <Text style={styles.paragraph}>
              Supabase hace backups automáticos diarios.
            </Text>
            <Text style={styles.paragraph}>
              Para backups manuales, usa el dashboard de Supabase o pg_dump.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Limpieza de Datos</Text>
            <Text style={styles.paragraph}>
              Considera implementar políticas de retención:
            </Text>
            <Text style={styles.bulletPoint}>• Archivar pedidos antiguos</Text>
            <Text style={styles.bulletPoint}>• Eliminar notificaciones viejas</Text>
            <Text style={styles.bulletPoint}>• Limpiar logs periódicamente</Text>
          </View>
        </View>

        {/* Troubleshooting */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="exclamationmark.triangle.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>13. Solución de Problemas</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Problemas Comunes</Text>
            <Text style={styles.codeBlock}>Webhook no recibe mensajes:</Text>
            <Text style={styles.bulletPoint}>• Verifica la URL del webhook en Meta</Text>
            <Text style={styles.bulletPoint}>• Revisa los logs de Edge Function</Text>
            <Text style={styles.bulletPoint}>• Confirma que el verify_token coincida</Text>
            <Text style={styles.bulletPoint}>• Verifica suscripciones de webhook</Text>
            
            <Text style={styles.codeBlock}>Auto-impresión no funciona:</Text>
            <Text style={styles.bulletPoint}>• Verifica permisos de background fetch</Text>
            <Text style={styles.bulletPoint}>• Deshabilita optimización de batería</Text>
            <Text style={styles.bulletPoint}>• Revisa conexión de impresora</Text>
            <Text style={styles.bulletPoint}>• Verifica logs de background task</Text>
            
            <Text style={styles.codeBlock}>Errores de autenticación:</Text>
            <Text style={styles.bulletPoint}>• Verifica credenciales de Supabase</Text>
            <Text style={styles.bulletPoint}>• Revisa políticas RLS</Text>
            <Text style={styles.bulletPoint}>• Confirma que el email esté verificado</Text>
            <Text style={styles.bulletPoint}>• Limpia caché de AsyncStorage</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Debugging</Text>
            <Text style={styles.paragraph}>
              Herramientas útiles:
            </Text>
            <Text style={styles.bulletPoint}>• React Native Debugger</Text>
            <Text style={styles.bulletPoint}>• Expo Dev Tools</Text>
            <Text style={styles.bulletPoint}>• Supabase Dashboard</Text>
            <Text style={styles.bulletPoint}>• Chrome DevTools (para web)</Text>
            <Text style={styles.bulletPoint}>• Android Studio Logcat</Text>
            <Text style={styles.bulletPoint}>• Xcode Console</Text>
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="questionmark.circle.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>14. Soporte Técnico</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recursos</Text>
            <Text style={styles.bulletPoint}>• Documentación de Expo: https://docs.expo.dev</Text>
            <Text style={styles.bulletPoint}>• Documentación de Supabase: https://supabase.com/docs</Text>
            <Text style={styles.bulletPoint}>• WhatsApp Business API: https://developers.facebook.com/docs/whatsapp</Text>
            <Text style={styles.bulletPoint}>• React Native: https://reactnative.dev</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Contacto</Text>
            <Text style={styles.paragraph}>
              Para soporte técnico:
            </Text>
            <Text style={styles.bulletPoint}>• Email: support@natively.dev</Text>
            <Text style={styles.bulletPoint}>• Documentación: https://docs.natively.dev</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Manual Técnico v1.0
          </Text>
          <Text style={styles.footerText}>
            © 2024 Natively
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 6,
    paddingLeft: 8,
  },
  codeBlock: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 12,
    marginBottom: 8,
  },
  code: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: colors.text,
    backgroundColor: colors.background,
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
});
