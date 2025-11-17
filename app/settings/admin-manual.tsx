
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

export default function AdminManualScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Manual de Administrador',
          headerBackTitle: 'Atrás',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.mainTitle}>Manual de Administrador</Text>
          <Text style={styles.subtitle}>
            Guía completa para administradores del sistema
          </Text>
        </View>

        {/* User Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="person.2.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>1. Gestión de Usuarios</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Crear Nuevos Usuarios</Text>
            <Text style={styles.paragraph}>
              Como administrador, puedes crear cuentas para trabajadores e impresores:
            </Text>
            <Text style={styles.bulletPoint}>1. Ve a Perfil → Gestión de Usuarios</Text>
            <Text style={styles.bulletPoint}>2. Toca el botón "+" en la esquina superior</Text>
            <Text style={styles.bulletPoint}>3. Completa el formulario:</Text>
            <Text style={styles.subBullet}>- Email del usuario</Text>
            <Text style={styles.subBullet}>- Contraseña temporal</Text>
            <Text style={styles.subBullet}>- Nombre completo</Text>
            <Text style={styles.subBullet}>- Rol (Admin, Trabajador, Impresor, Desarrollador)</Text>
            <Text style={styles.bulletPoint}>4. El usuario recibirá un email de verificación</Text>
            <Text style={styles.note}>
              💡 Nota: El usuario debe verificar su email antes de poder iniciar sesión
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Roles y Permisos</Text>
            <Text style={styles.subheading}>Admin:</Text>
            <Text style={styles.bulletPoint}>• Acceso completo al sistema</Text>
            <Text style={styles.bulletPoint}>• Gestión de usuarios</Text>
            <Text style={styles.bulletPoint}>• Configuración de WhatsApp</Text>
            <Text style={styles.bulletPoint}>• Gestión de números autorizados</Text>
            <Text style={styles.bulletPoint}>• Eliminación de pedidos</Text>
            <Text style={styles.bulletPoint}>• Acceso a todas las configuraciones</Text>
            
            <Text style={styles.subheading}>Trabajador:</Text>
            <Text style={styles.bulletPoint}>• Gestión de pedidos</Text>
            <Text style={styles.bulletPoint}>• Impresión de tickets</Text>
            <Text style={styles.bulletPoint}>• Comunicación con clientes</Text>
            <Text style={styles.bulletPoint}>• Ver estadísticas</Text>
            <Text style={styles.bulletPoint}>• Configuración de impresora personal</Text>
            
            <Text style={styles.subheading}>Impresor:</Text>
            <Text style={styles.bulletPoint}>• Acceso a cola de impresión</Text>
            <Text style={styles.bulletPoint}>• Impresión de pedidos</Text>
            <Text style={styles.bulletPoint}>• Configuración de impresora</Text>
            <Text style={styles.bulletPoint}>• Auto-impresión de pedidos nuevos</Text>
            
            <Text style={styles.subheading}>Desarrollador:</Text>
            <Text style={styles.bulletPoint}>• Todos los permisos de Admin</Text>
            <Text style={styles.bulletPoint}>• Acceso a configuraciones avanzadas</Text>
            <Text style={styles.bulletPoint}>• Gestión de unidades de medida</Text>
            <Text style={styles.bulletPoint}>• Configuración de webhooks</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Modificar Usuarios</Text>
            <Text style={styles.paragraph}>
              Para editar un usuario existente:
            </Text>
            <Text style={styles.bulletPoint}>1. Ve a Gestión de Usuarios</Text>
            <Text style={styles.bulletPoint}>2. Toca el usuario que deseas editar</Text>
            <Text style={styles.bulletPoint}>3. Modifica los campos necesarios:</Text>
            <Text style={styles.subBullet}>- Nombre completo</Text>
            <Text style={styles.subBullet}>- Rol</Text>
            <Text style={styles.subBullet}>- Estado (Activo/Inactivo)</Text>
            <Text style={styles.bulletPoint}>4. Guarda los cambios</Text>
            <Text style={styles.note}>
              💡 Nota: Los cambios de rol requieren que el usuario cierre sesión y vuelva a iniciar
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Desactivar Usuarios</Text>
            <Text style={styles.paragraph}>
              Para desactivar temporalmente un usuario sin eliminarlo:
            </Text>
            <Text style={styles.bulletPoint}>1. Edita el usuario</Text>
            <Text style={styles.bulletPoint}>2. Cambia el estado a "Inactivo"</Text>
            <Text style={styles.bulletPoint}>3. El usuario no podrá iniciar sesión</Text>
            <Text style={styles.bulletPoint}>4. Puedes reactivarlo en cualquier momento</Text>
          </View>
        </View>

        {/* WhatsApp Configuration */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="message.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>2. Configuración de WhatsApp</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Configurar Integración</Text>
            <Text style={styles.paragraph}>
              Para configurar la integración con WhatsApp Business API:
            </Text>
            <Text style={styles.bulletPoint}>1. Ve a Perfil → WhatsApp</Text>
            <Text style={styles.bulletPoint}>2. Completa los campos requeridos:</Text>
            <Text style={styles.subBullet}>- Verify Token: Token personalizado para verificación</Text>
            <Text style={styles.subBullet}>- Access Token: Token de acceso de Meta</Text>
            <Text style={styles.subBullet}>- Phone Number ID: ID del número de WhatsApp</Text>
            <Text style={styles.subBullet}>- Webhook URL: URL del Edge Function</Text>
            <Text style={styles.bulletPoint}>3. Activa la integración</Text>
            <Text style={styles.bulletPoint}>4. Prueba la conexión</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Obtener Credenciales de Meta</Text>
            <Text style={styles.paragraph}>
              Pasos para obtener las credenciales necesarias:
            </Text>
            <Text style={styles.subheading}>1. Crear App en Meta Developer:</Text>
            <Text style={styles.bulletPoint}>• Ve a developers.facebook.com</Text>
            <Text style={styles.bulletPoint}>• Crea una nueva app de tipo "Business"</Text>
            <Text style={styles.bulletPoint}>• Agrega el producto "WhatsApp"</Text>
            
            <Text style={styles.subheading}>2. Configurar WhatsApp:</Text>
            <Text style={styles.bulletPoint}>• Selecciona o crea un número de teléfono</Text>
            <Text style={styles.bulletPoint}>• Verifica el número</Text>
            <Text style={styles.bulletPoint}>• Copia el Phone Number ID</Text>
            
            <Text style={styles.subheading}>3. Obtener Access Token:</Text>
            <Text style={styles.bulletPoint}>• Ve a WhatsApp → Configuration</Text>
            <Text style={styles.bulletPoint}>• Genera un token de acceso permanente</Text>
            <Text style={styles.bulletPoint}>• Copia el token (guárdalo de forma segura)</Text>
            
            <Text style={styles.subheading}>4. Configurar Webhook:</Text>
            <Text style={styles.bulletPoint}>• Ve a WhatsApp → Configuration → Webhook</Text>
            <Text style={styles.bulletPoint}>• Ingresa la URL del webhook</Text>
            <Text style={styles.bulletPoint}>• Ingresa el verify token</Text>
            <Text style={styles.bulletPoint}>• Suscríbete a "messages"</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Gestionar Números Autorizados</Text>
            <Text style={styles.paragraph}>
              Control de qué números pueden enviar pedidos:
            </Text>
            <Text style={styles.bulletPoint}>1. Ve a Gestión de Usuarios</Text>
            <Text style={styles.bulletPoint}>2. Sección "Números Autorizados"</Text>
            <Text style={styles.bulletPoint}>3. Agrega números con formato internacional (+56...)</Text>
            <Text style={styles.bulletPoint}>4. Opcionalmente agrega nombre y notas</Text>
            <Text style={styles.bulletPoint}>5. Los números no autorizados recibirán un mensaje de rechazo</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bloquear Clientes</Text>
            <Text style={styles.paragraph}>
              Para bloquear temporalmente a un cliente:
            </Text>
            <Text style={styles.bulletPoint}>1. Ve al detalle del pedido del cliente</Text>
            <Text style={styles.bulletPoint}>2. Toca "Bloquear Cliente"</Text>
            <Text style={styles.bulletPoint}>3. Confirma la acción</Text>
            <Text style={styles.bulletPoint}>4. El cliente no podrá enviar nuevos pedidos</Text>
            <Text style={styles.bulletPoint}>5. Puedes desbloquearlo en cualquier momento</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Probar Parser de WhatsApp</Text>
            <Text style={styles.paragraph}>
              Usa la pantalla de prueba para validar el parser:
            </Text>
            <Text style={styles.bulletPoint}>1. Ve a Configuración → Prueba de WhatsApp Parser</Text>
            <Text style={styles.bulletPoint}>2. Ingresa un mensaje de prueba</Text>
            <Text style={styles.bulletPoint}>3. Revisa cómo se parsean los productos</Text>
            <Text style={styles.bulletPoint}>4. Verifica cantidades y unidades</Text>
            <Text style={styles.bulletPoint}>5. Carga ejemplos predefinidos para probar</Text>
          </View>
        </View>

        {/* Printer Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="printer.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>3. Gestión de Impresoras</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Configurar Impresora del Sistema</Text>
            <Text style={styles.paragraph}>
              Como administrador, puedes configurar una impresora central:
            </Text>
            <Text style={styles.bulletPoint}>1. Ve a Configuración → Impresora</Text>
            <Text style={styles.bulletPoint}>2. Escanea dispositivos Bluetooth</Text>
            <Text style={styles.bulletPoint}>3. Conecta la impresora</Text>
            <Text style={styles.bulletPoint}>4. Configura las opciones de impresión</Text>
            <Text style={styles.bulletPoint}>5. Habilita auto-impresión si es necesario</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Configuración Avanzada de Recibos</Text>
            <Text style={styles.paragraph}>
              Personaliza el formato de los tickets:
            </Text>
            <Text style={styles.bulletPoint}>1. Ve a Configuración → Editor de Recibos</Text>
            <Text style={styles.bulletPoint}>2. Selecciona un estilo predefinido o personaliza:</Text>
            <Text style={styles.subBullet}>- Tamaño de texto (Pequeño, Normal, Grande)</Text>
            <Text style={styles.subBullet}>- Tamaño de papel (58mm, 80mm)</Text>
            <Text style={styles.subBullet}>- Codificación de caracteres</Text>
            <Text style={styles.subBullet}>- Incluir/excluir logo</Text>
            <Text style={styles.subBullet}>- Incluir/excluir información del cliente</Text>
            <Text style={styles.subBullet}>- Incluir/excluir totales</Text>
            <Text style={styles.bulletPoint}>3. Vista previa del recibo</Text>
            <Text style={styles.bulletPoint}>4. Guarda la configuración</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cola de Impresión</Text>
            <Text style={styles.paragraph}>
              Gestiona la cola de impresión del sistema:
            </Text>
            <Text style={styles.bulletPoint}>1. Ve a Cola de Impresión</Text>
            <Text style={styles.bulletPoint}>2. Visualiza todos los pedidos pendientes de impresión</Text>
            <Text style={styles.bulletPoint}>3. Reimprime pedidos fallidos</Text>
            <Text style={styles.bulletPoint}>4. Elimina elementos de la cola</Text>
            <Text style={styles.bulletPoint}>5. Limpia elementos ya impresos</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Solución de Problemas de Impresión</Text>
            <Text style={styles.subheading}>Impresora no se conecta:</Text>
            <Text style={styles.bulletPoint}>• Verifica que el Bluetooth esté activado</Text>
            <Text style={styles.bulletPoint}>• Asegúrate de que la impresora esté encendida</Text>
            <Text style={styles.bulletPoint}>• Desvincula y vuelve a vincular el dispositivo</Text>
            <Text style={styles.bulletPoint}>• Reinicia la impresora</Text>
            <Text style={styles.bulletPoint}>• Verifica los permisos de Bluetooth</Text>
            
            <Text style={styles.subheading}>Caracteres extraños en el ticket:</Text>
            <Text style={styles.bulletPoint}>• Cambia la codificación en configuración</Text>
            <Text style={styles.bulletPoint}>• Prueba CP850 para español</Text>
            <Text style={styles.bulletPoint}>• Verifica el modelo de impresora</Text>
            
            <Text style={styles.subheading}>Auto-impresión no funciona:</Text>
            <Text style={styles.bulletPoint}>• Verifica que esté habilitada en configuración</Text>
            <Text style={styles.bulletPoint}>• Revisa los permisos de background fetch</Text>
            <Text style={styles.bulletPoint}>• Deshabilita optimización de batería</Text>
            <Text style={styles.bulletPoint}>• Mantén la app en primer plano</Text>
          </View>
        </View>

        {/* Order Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="cart.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>4. Gestión Avanzada de Pedidos</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Eliminar Pedidos</Text>
            <Text style={styles.paragraph}>
              Solo los administradores pueden eliminar pedidos:
            </Text>
            <Text style={styles.bulletPoint}>1. Abre el detalle del pedido</Text>
            <Text style={styles.bulletPoint}>2. Toca el botón de eliminar (icono de basura)</Text>
            <Text style={styles.bulletPoint}>3. Confirma la eliminación</Text>
            <Text style={styles.bulletPoint}>4. El cliente recibirá una notificación (si está configurado)</Text>
            <Text style={styles.warning}>
              ⚠️ Advertencia: Esta acción no se puede deshacer
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Gestionar Consultas de Clientes</Text>
            <Text style={styles.paragraph}>
              Responde a las consultas de los clientes:
            </Text>
            <Text style={styles.bulletPoint}>1. Las consultas aparecen en el detalle del pedido</Text>
            <Text style={styles.bulletPoint}>2. Revisa la pregunta del cliente</Text>
            <Text style={styles.bulletPoint}>3. Escribe tu respuesta</Text>
            <Text style={styles.bulletPoint}>4. Envía la respuesta</Text>
            <Text style={styles.bulletPoint}>5. El cliente recibirá la respuesta por WhatsApp</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Pedidos Completados</Text>
            <Text style={styles.paragraph}>
              Accede al historial de pedidos completados:
            </Text>
            <Text style={styles.bulletPoint}>1. Ve a Perfil → Pedidos Completados</Text>
            <Text style={styles.bulletPoint}>2. Filtra por fecha</Text>
            <Text style={styles.bulletPoint}>3. Busca pedidos específicos</Text>
            <Text style={styles.bulletPoint}>4. Exporta reportes</Text>
            <Text style={styles.bulletPoint}>5. Reimprime tickets antiguos</Text>
          </View>
        </View>

        {/* Customer Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="person.3.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>5. Gestión de Clientes</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Base de Datos de Clientes</Text>
            <Text style={styles.paragraph}>
              Gestiona la información de tus clientes:
            </Text>
            <Text style={styles.bulletPoint}>1. Ve a la pestaña Clientes</Text>
            <Text style={styles.bulletPoint}>2. Visualiza todos los clientes registrados</Text>
            <Text style={styles.bulletPoint}>3. Busca clientes por nombre o teléfono</Text>
            <Text style={styles.bulletPoint}>4. Edita información de contacto</Text>
            <Text style={styles.bulletPoint}>5. Ve el historial de pedidos por cliente</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Clientes Recurrentes</Text>
            <Text style={styles.paragraph}>
              Gestiona clientes con vales pendientes:
            </Text>
            <Text style={styles.bulletPoint}>1. Ve a la pestaña Vales Pendientes</Text>
            <Text style={styles.bulletPoint}>2. Visualiza clientes con deuda</Text>
            <Text style={styles.bulletPoint}>3. Registra pagos</Text>
            <Text style={styles.bulletPoint}>4. Imprime estado de cuenta</Text>
            <Text style={styles.bulletPoint}>5. Finaliza cuentas saldadas</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Eliminar Clientes</Text>
            <Text style={styles.paragraph}>
              Para eliminar un cliente del sistema:
            </Text>
            <Text style={styles.bulletPoint}>1. Ve a Clientes</Text>
            <Text style={styles.bulletPoint}>2. Selecciona el cliente</Text>
            <Text style={styles.bulletPoint}>3. Toca "Eliminar Cliente"</Text>
            <Text style={styles.bulletPoint}>4. Elige una opción:</Text>
            <Text style={styles.subBullet}>- Solo cliente (mantiene pedidos)</Text>
            <Text style={styles.subBullet}>- Cliente y pedidos (elimina todo)</Text>
            <Text style={styles.warning}>
              ⚠️ Advertencia: La eliminación de pedidos no se puede deshacer
            </Text>
          </View>
        </View>

        {/* Reports and Analytics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="chart.bar.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>6. Reportes y Análisis</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Estadísticas del Sistema</Text>
            <Text style={styles.paragraph}>
              Accede a métricas detalladas:
            </Text>
            <Text style={styles.bulletPoint}>1. Ve a la pestaña Estadísticas</Text>
            <Text style={styles.bulletPoint}>2. Visualiza:</Text>
            <Text style={styles.subBullet}>- Total de pedidos por período</Text>
            <Text style={styles.subBullet}>- Distribución por estado</Text>
            <Text style={styles.subBullet}>- Ingresos totales</Text>
            <Text style={styles.subBullet}>- Promedio por pedido</Text>
            <Text style={styles.subBullet}>- Productos más vendidos</Text>
            <Text style={styles.subBullet}>- Clientes más frecuentes</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Generar Reportes PDF</Text>
            <Text style={styles.paragraph}>
              Crea reportes personalizados en PDF:
            </Text>
            <Text style={styles.bulletPoint}>1. Ve a Perfil → Gestor PDF Pedidos</Text>
            <Text style={styles.bulletPoint}>2. Configura filtros:</Text>
            <Text style={styles.subBullet}>- Rango de fechas</Text>
            <Text style={styles.subBullet}>- Estado de pedidos</Text>
            <Text style={styles.subBullet}>- Cliente específico</Text>
            <Text style={styles.bulletPoint}>3. Selecciona tipo de reporte:</Text>
            <Text style={styles.subBullet}>- Resumen ejecutivo</Text>
            <Text style={styles.subBullet}>- Detallado con productos</Text>
            <Text style={styles.subBullet}>- Estadísticas y gráficos</Text>
            <Text style={styles.bulletPoint}>4. Genera y comparte el PDF</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Actividad del Sistema</Text>
            <Text style={styles.paragraph}>
              Monitorea la actividad reciente:
            </Text>
            <Text style={styles.bulletPoint}>1. Ve a Perfil → Actividad</Text>
            <Text style={styles.bulletPoint}>2. Revisa:</Text>
            <Text style={styles.subBullet}>- Pedidos recientes</Text>
            <Text style={styles.subBullet}>- Cambios de estado</Text>
            <Text style={styles.subBullet}>- Acciones de usuarios</Text>
            <Text style={styles.subBullet}>- Errores del sistema</Text>
          </View>
        </View>

        {/* System Configuration */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="gearshape.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>7. Configuración del Sistema</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Unidades de Medida</Text>
            <Text style={styles.paragraph}>
              Gestiona las unidades reconocidas por el parser:
            </Text>
            <Text style={styles.bulletPoint}>1. Ve a Configuración → Unidades de Medida</Text>
            <Text style={styles.bulletPoint}>2. Visualiza unidades existentes</Text>
            <Text style={styles.bulletPoint}>3. Agrega nuevas unidades con variaciones</Text>
            <Text style={styles.bulletPoint}>4. Edita variaciones de unidades existentes</Text>
            <Text style={styles.bulletPoint}>5. Elimina unidades no utilizadas</Text>
            <Text style={styles.note}>
              💡 Nota: Las unidades del sistema no se pueden eliminar
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Permisos del Sistema</Text>
            <Text style={styles.paragraph}>
              Verifica y gestiona permisos de la aplicación:
            </Text>
            <Text style={styles.bulletPoint}>1. Ve a Configuración → Permisos</Text>
            <Text style={styles.bulletPoint}>2. Revisa el estado de todos los permisos</Text>
            <Text style={styles.bulletPoint}>3. Solicita permisos faltantes</Text>
            <Text style={styles.bulletPoint}>4. Abre configuración del sistema si es necesario</Text>
            <Text style={styles.bulletPoint}>5. Gestiona optimización de batería (Android)</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notificaciones</Text>
            <Text style={styles.paragraph}>
              Configura las notificaciones del sistema:
            </Text>
            <Text style={styles.bulletPoint}>1. Ve a Configuración → Notificaciones</Text>
            <Text style={styles.bulletPoint}>2. Habilita/deshabilita notificaciones push</Text>
            <Text style={styles.bulletPoint}>3. Configura sonidos y vibración</Text>
            <Text style={styles.bulletPoint}>4. Gestiona notificaciones in-app</Text>
            <Text style={styles.bulletPoint}>5. Limpia notificaciones antiguas</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tema de la Aplicación</Text>
            <Text style={styles.paragraph}>
              Personaliza la apariencia de la app:
            </Text>
            <Text style={styles.bulletPoint}>1. Ve a Configuración → Tema</Text>
            <Text style={styles.bulletPoint}>2. Selecciona modo:</Text>
            <Text style={styles.subBullet}>- Claro</Text>
            <Text style={styles.subBullet}>- Oscuro</Text>
            <Text style={styles.subBullet}>- Automático (según sistema)</Text>
            <Text style={styles.bulletPoint}>3. Los cambios se aplican inmediatamente</Text>
          </View>
        </View>

        {/* Best Practices */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="star.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>8. Mejores Prácticas</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Seguridad</Text>
            <Text style={styles.bulletPoint}>• Cambia las contraseñas predeterminadas inmediatamente</Text>
            <Text style={styles.bulletPoint}>• Usa contraseñas fuertes y únicas</Text>
            <Text style={styles.bulletPoint}>• No compartas credenciales de administrador</Text>
            <Text style={styles.bulletPoint}>• Revisa regularmente los usuarios activos</Text>
            <Text style={styles.bulletPoint}>• Desactiva usuarios que ya no necesitan acceso</Text>
            <Text style={styles.bulletPoint}>• Mantén actualizada la lista de números autorizados</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Mantenimiento</Text>
            <Text style={styles.bulletPoint}>• Revisa diariamente la cola de impresión</Text>
            <Text style={styles.bulletPoint}>• Limpia pedidos completados periódicamente</Text>
            <Text style={styles.bulletPoint}>• Verifica la conexión de WhatsApp semanalmente</Text>
            <Text style={styles.bulletPoint}>• Prueba la impresora antes de iniciar operaciones</Text>
            <Text style={styles.bulletPoint}>• Mantén actualizada la app</Text>
            <Text style={styles.bulletPoint}>• Realiza backups regulares de la base de datos</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Capacitación de Usuarios</Text>
            <Text style={styles.bulletPoint}>• Proporciona el Manual de Usuario a nuevos trabajadores</Text>
            <Text style={styles.bulletPoint}>• Realiza sesiones de capacitación inicial</Text>
            <Text style={styles.bulletPoint}>• Documenta procesos específicos de tu negocio</Text>
            <Text style={styles.bulletPoint}>• Mantén un canal de comunicación para dudas</Text>
            <Text style={styles.bulletPoint}>• Actualiza la capacitación cuando agregues funciones</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Monitoreo</Text>
            <Text style={styles.bulletPoint}>• Revisa estadísticas diariamente</Text>
            <Text style={styles.bulletPoint}>• Identifica patrones en pedidos</Text>
            <Text style={styles.bulletPoint}>• Monitorea tiempos de respuesta</Text>
            <Text style={styles.bulletPoint}>• Analiza productos más solicitados</Text>
            <Text style={styles.bulletPoint}>• Identifica clientes frecuentes</Text>
            <Text style={styles.bulletPoint}>• Detecta y resuelve problemas rápidamente</Text>
          </View>
        </View>

        {/* Troubleshooting */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="exclamationmark.triangle.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>9. Solución de Problemas</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Problemas Comunes</Text>
            <Text style={styles.subheading}>Webhook no recibe mensajes:</Text>
            <Text style={styles.bulletPoint}>• Verifica la URL del webhook en Meta</Text>
            <Text style={styles.bulletPoint}>• Confirma que el verify_token coincida</Text>
            <Text style={styles.bulletPoint}>• Revisa las suscripciones del webhook</Text>
            <Text style={styles.bulletPoint}>• Verifica que el número esté autorizado</Text>
            <Text style={styles.bulletPoint}>• Revisa los logs de Edge Function en Supabase</Text>
            
            <Text style={styles.subheading}>Usuarios no pueden iniciar sesión:</Text>
            <Text style={styles.bulletPoint}>• Verifica que el email esté verificado</Text>
            <Text style={styles.bulletPoint}>• Confirma que el usuario esté activo</Text>
            <Text style={styles.bulletPoint}>• Revisa las credenciales de Supabase</Text>
            <Text style={styles.bulletPoint}>• Verifica las políticas RLS</Text>
            
            <Text style={styles.subheading}>Notificaciones no llegan:</Text>
            <Text style={styles.bulletPoint}>• Verifica permisos de notificaciones</Text>
            <Text style={styles.bulletPoint}>• Confirma configuración en Supabase</Text>
            <Text style={styles.bulletPoint}>• Revisa que el dispositivo tenga conexión</Text>
            <Text style={styles.bulletPoint}>• Verifica que las notificaciones estén habilitadas</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Contacto de Soporte</Text>
            <Text style={styles.paragraph}>
              Si no puedes resolver un problema:
            </Text>
            <Text style={styles.bulletPoint}>• Consulta el Manual Técnico</Text>
            <Text style={styles.bulletPoint}>• Revisa los logs del sistema</Text>
            <Text style={styles.bulletPoint}>• Documenta el problema con capturas</Text>
            <Text style={styles.bulletPoint}>• Contacta a support@natively.dev</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Manual de Administrador v1.0
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
  subheading: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
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
  subBullet: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 4,
    paddingLeft: 24,
  },
  note: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: 8,
    fontStyle: 'italic',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
  },
  warning: {
    fontSize: 14,
    color: colors.error,
    lineHeight: 20,
    marginTop: 8,
    fontWeight: '600',
    backgroundColor: colors.error + '10',
    padding: 12,
    borderRadius: 8,
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
