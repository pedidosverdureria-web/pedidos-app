
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

export default function UserManualScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Manual de Usuario',
          headerBackTitle: 'Atrás',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.mainTitle}>Manual de Usuario</Text>
          <Text style={styles.subtitle}>
            Guía completa para usar la aplicación de gestión de pedidos
          </Text>
        </View>

        {/* Getting Started */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="play.circle.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>1. Primeros Pasos</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Inicio de Sesión</Text>
            <Text style={styles.paragraph}>
              - Ingresa tu correo electrónico y contraseña proporcionados por el administrador
            </Text>
            <Text style={styles.paragraph}>
              - Si es tu primer acceso, verifica tu correo electrónico
            </Text>
            <Text style={styles.paragraph}>
              - La sesión se mantiene activa automáticamente
            </Text>
          </View>
        </View>

        {/* Home Screen */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="house.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>2. Pantalla Principal</Text>
          </View>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Vista de Pedidos</Text>
            <Text style={styles.paragraph}>
              La pantalla principal muestra todos los pedidos ordenados por fecha de creación.
            </Text>
            
            <Text style={styles.subheading}>Información de cada pedido:</Text>
            <Text style={styles.bulletPoint}>• Número de pedido corto (ej: #1234)</Text>
            <Text style={styles.bulletPoint}>• Nombre del cliente</Text>
            <Text style={styles.bulletPoint}>• Estado actual (con color distintivo)</Text>
            <Text style={styles.bulletPoint}>• Total del pedido en CLP</Text>
            <Text style={styles.bulletPoint}>• Fecha y hora de creación</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Filtros de Estado</Text>
            <Text style={styles.paragraph}>
              Usa los botones de filtro en la parte superior para ver pedidos por estado:
            </Text>
            <Text style={styles.bulletPoint}>🟡 Pendiente - Pedidos nuevos sin procesar</Text>
            <Text style={styles.bulletPoint}>🔵 Preparando - Pedidos en preparación</Text>
            <Text style={styles.bulletPoint}>🟢 Listo - Pedidos listos para entrega</Text>
            <Text style={styles.bulletPoint}>⚪ Entregado - Pedidos completados</Text>
            <Text style={styles.bulletPoint}>🔴 Cancelado - Pedidos cancelados</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Búsqueda</Text>
            <Text style={styles.paragraph}>
              Usa la barra de búsqueda para encontrar pedidos por:
            </Text>
            <Text style={styles.bulletPoint}>• Número de pedido</Text>
            <Text style={styles.bulletPoint}>• Nombre del cliente</Text>
            <Text style={styles.bulletPoint}>• Teléfono del cliente</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Actualizar Lista</Text>
            <Text style={styles.paragraph}>
              Desliza hacia abajo (pull-to-refresh) para actualizar la lista de pedidos y ver los más recientes.
            </Text>
          </View>
        </View>

        {/* Order Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="doc.text.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>3. Detalle de Pedido</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ver Información Completa</Text>
            <Text style={styles.paragraph}>
              Toca cualquier pedido para ver todos sus detalles:
            </Text>
            <Text style={styles.bulletPoint}>• Información del cliente (nombre, teléfono, dirección)</Text>
            <Text style={styles.bulletPoint}>• Lista completa de productos</Text>
            <Text style={styles.bulletPoint}>• Cantidades y unidades</Text>
            <Text style={styles.bulletPoint}>• Precios individuales y totales</Text>
            <Text style={styles.bulletPoint}>• Notas adicionales</Text>
            <Text style={styles.bulletPoint}>• Estado actual del pedido</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Editar Información del Cliente</Text>
            <Text style={styles.paragraph}>
              Toca el botón "Editar Cliente" para modificar:
            </Text>
            <Text style={styles.bulletPoint}>• Nombre del cliente</Text>
            <Text style={styles.bulletPoint}>• Número de teléfono</Text>
            <Text style={styles.bulletPoint}>• Dirección de entrega</Text>
            <Text style={styles.paragraph}>
              Los cambios se guardan automáticamente al presionar "Guardar".
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cambiar Estado del Pedido</Text>
            <Text style={styles.paragraph}>
              Usa el selector de estado para actualizar el progreso del pedido:
            </Text>
            <Text style={styles.bulletPoint}>1. Toca el estado actual</Text>
            <Text style={styles.bulletPoint}>2. Selecciona el nuevo estado</Text>
            <Text style={styles.bulletPoint}>3. El cliente recibirá una notificación por WhatsApp (si está configurado)</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Agregar Productos</Text>
            <Text style={styles.paragraph}>
              Toca el botón "+" para agregar productos al pedido:
            </Text>
            <Text style={styles.bulletPoint}>• Escribe los productos en formato WhatsApp</Text>
            <Text style={styles.bulletPoint}>• Ejemplo: "2 kg tomate, 1 lechuga, 3 unidades cebolla"</Text>
            <Text style={styles.bulletPoint}>• Los productos se parsean automáticamente</Text>
            <Text style={styles.bulletPoint}>• Revisa y confirma antes de agregar</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Editar Productos</Text>
            <Text style={styles.paragraph}>
              Toca cualquier producto para editarlo:
            </Text>
            <Text style={styles.bulletPoint}>• Modificar cantidad</Text>
            <Text style={styles.bulletPoint}>• Cambiar precio unitario</Text>
            <Text style={styles.bulletPoint}>• Actualizar notas</Text>
            <Text style={styles.bulletPoint}>• Eliminar el producto</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Actualizar Precios Masivamente</Text>
            <Text style={styles.paragraph}>
              Usa el botón "Actualizar Precios" para:
            </Text>
            <Text style={styles.bulletPoint}>• Establecer precios para múltiples productos a la vez</Text>
            <Text style={styles.bulletPoint}>• Útil cuando los productos no tienen precio asignado</Text>
            <Text style={styles.bulletPoint}>• Ingresa el precio para cada producto</Text>
            <Text style={styles.bulletPoint}>• Aplica todos los cambios de una vez</Text>
          </View>
        </View>

        {/* Printing */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="printer.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>4. Impresión de Tickets</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Imprimir Pedido</Text>
            <Text style={styles.paragraph}>
              Toca el botón de impresora en el detalle del pedido para imprimir un ticket.
            </Text>
            <Text style={styles.subheading}>El ticket incluye:</Text>
            <Text style={styles.bulletPoint}>• Número de pedido</Text>
            <Text style={styles.bulletPoint}>• Información del cliente</Text>
            <Text style={styles.bulletPoint}>• Lista de productos con cantidades</Text>
            <Text style={styles.bulletPoint}>• Totales y montos pagados</Text>
            <Text style={styles.bulletPoint}>• Fecha y hora</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Auto-Impresión</Text>
            <Text style={styles.paragraph}>
              Si está habilitada en la configuración, los pedidos nuevos se imprimen automáticamente al llegar por WhatsApp.
            </Text>
            <Text style={styles.paragraph}>
              Nota: La impresora debe estar conectada y la app debe tener los permisos necesarios.
            </Text>
          </View>
        </View>

        {/* WhatsApp */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="message.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>5. Comunicación por WhatsApp</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Enviar Mensaje al Cliente</Text>
            <Text style={styles.paragraph}>
              Toca el botón de WhatsApp en el detalle del pedido para:
            </Text>
            <Text style={styles.bulletPoint}>• Abrir una conversación con el cliente</Text>
            <Text style={styles.bulletPoint}>• El mensaje incluye el resumen del pedido</Text>
            <Text style={styles.bulletPoint}>• Puedes modificar el mensaje antes de enviar</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notificaciones Automáticas</Text>
            <Text style={styles.paragraph}>
              El sistema envía notificaciones automáticas al cliente cuando:
            </Text>
            <Text style={styles.bulletPoint}>• Se recibe un nuevo pedido (confirmación)</Text>
            <Text style={styles.bulletPoint}>• Cambia el estado del pedido</Text>
            <Text style={styles.bulletPoint}>• Se agregan productos al pedido</Text>
            <Text style={styles.bulletPoint}>• Se eliminan productos del pedido</Text>
          </View>
        </View>

        {/* New Order */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="plus.circle.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>6. Crear Pedido Manual</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Nuevo Pedido</Text>
            <Text style={styles.paragraph}>
              Toca el botón "+" en la pantalla principal para crear un pedido manualmente:
            </Text>
            <Text style={styles.subheading}>Paso 1: Información del Cliente</Text>
            <Text style={styles.bulletPoint}>• Nombre completo</Text>
            <Text style={styles.bulletPoint}>• Teléfono (opcional)</Text>
            <Text style={styles.bulletPoint}>• Dirección de entrega (opcional)</Text>
            
            <Text style={styles.subheading}>Paso 2: Agregar Productos</Text>
            <Text style={styles.bulletPoint}>• Toca "Agregar Producto"</Text>
            <Text style={styles.bulletPoint}>• Ingresa nombre del producto</Text>
            <Text style={styles.bulletPoint}>• Especifica cantidad</Text>
            <Text style={styles.bulletPoint}>• Define precio unitario</Text>
            <Text style={styles.bulletPoint}>• Agrega notas si es necesario</Text>
            
            <Text style={styles.subheading}>Paso 3: Revisar y Crear</Text>
            <Text style={styles.bulletPoint}>• Verifica el total calculado</Text>
            <Text style={styles.bulletPoint}>• Toca "Crear Pedido"</Text>
            <Text style={styles.bulletPoint}>• El pedido aparecerá en la lista principal</Text>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="bell.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>7. Notificaciones</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recibir Alertas</Text>
            <Text style={styles.paragraph}>
              La app te notifica cuando:
            </Text>
            <Text style={styles.bulletPoint}>• Llega un nuevo pedido por WhatsApp</Text>
            <Text style={styles.bulletPoint}>• Un pedido cambia de estado</Text>
            <Text style={styles.bulletPoint}>• Hay errores de impresión</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ver Notificaciones</Text>
            <Text style={styles.paragraph}>
              Accede a Configuración → Notificaciones para:
            </Text>
            <Text style={styles.bulletPoint}>• Ver historial de notificaciones</Text>
            <Text style={styles.bulletPoint}>• Marcar como leídas</Text>
            <Text style={styles.bulletPoint}>• Eliminar notificaciones antiguas</Text>
            <Text style={styles.bulletPoint}>• Navegar al pedido relacionado</Text>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="chart.bar.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>8. Estadísticas</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ver Métricas</Text>
            <Text style={styles.paragraph}>
              Accede a la pestaña de Estadísticas para ver:
            </Text>
            <Text style={styles.bulletPoint}>• Total de pedidos</Text>
            <Text style={styles.bulletPoint}>• Distribución por estado</Text>
            <Text style={styles.bulletPoint}>• Ingresos totales</Text>
            <Text style={styles.bulletPoint}>• Promedio por pedido</Text>
            <Text style={styles.bulletPoint}>• Gráficos visuales</Text>
          </View>
        </View>

        {/* Profile */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="person.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>9. Perfil y Configuración</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tu Perfil</Text>
            <Text style={styles.paragraph}>
              En la pestaña de Perfil puedes:
            </Text>
            <Text style={styles.bulletPoint}>• Ver tu información de usuario</Text>
            <Text style={styles.bulletPoint}>• Revisar tu rol (Admin o Trabajador)</Text>
            <Text style={styles.bulletPoint}>• Acceder a configuraciones</Text>
            <Text style={styles.bulletPoint}>• Cerrar sesión</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Configuraciones Disponibles</Text>
            <Text style={styles.bulletPoint}>• Permisos de la aplicación</Text>
            <Text style={styles.bulletPoint}>• Configuración de notificaciones</Text>
            <Text style={styles.bulletPoint}>• Configuración de impresora</Text>
            <Text style={styles.bulletPoint}>• Integración con WhatsApp</Text>
            <Text style={styles.bulletPoint}>• Gestión de usuarios (solo Admin)</Text>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="lightbulb.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>10. Consejos y Mejores Prácticas</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Optimiza tu Flujo de Trabajo</Text>
            <Text style={styles.bulletPoint}>• Mantén la app abierta para recibir notificaciones en tiempo real</Text>
            <Text style={styles.bulletPoint}>• Actualiza los estados de pedidos regularmente</Text>
            <Text style={styles.bulletPoint}>• Verifica la conexión de la impresora antes de iniciar el día</Text>
            <Text style={styles.bulletPoint}>• Usa los filtros para enfocarte en pedidos específicos</Text>
            <Text style={styles.bulletPoint}>• Revisa las estadísticas para identificar patrones</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Solución de Problemas Comunes</Text>
            <Text style={styles.subheading}>No llegan pedidos por WhatsApp:</Text>
            <Text style={styles.bulletPoint}>• Verifica la configuración de WhatsApp en ajustes</Text>
            <Text style={styles.bulletPoint}>• Asegúrate de que el webhook esté activo</Text>
            <Text style={styles.bulletPoint}>• Contacta al administrador</Text>
            
            <Text style={styles.subheading}>La impresora no funciona:</Text>
            <Text style={styles.bulletPoint}>• Verifica que el Bluetooth esté activado</Text>
            <Text style={styles.bulletPoint}>• Reconecta la impresora en configuración</Text>
            <Text style={styles.bulletPoint}>• Revisa los permisos de Bluetooth</Text>
            <Text style={styles.bulletPoint}>• Asegúrate de que la impresora tenga papel y batería</Text>
            
            <Text style={styles.subheading}>No recibo notificaciones:</Text>
            <Text style={styles.bulletPoint}>• Verifica los permisos de notificaciones</Text>
            <Text style={styles.bulletPoint}>• Revisa la configuración de notificaciones en ajustes</Text>
            <Text style={styles.bulletPoint}>• Asegúrate de que las notificaciones push estén habilitadas</Text>
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="questionmark.circle.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>11. Soporte</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>¿Necesitas Ayuda?</Text>
            <Text style={styles.paragraph}>
              Si tienes problemas o preguntas:
            </Text>
            <Text style={styles.bulletPoint}>• Consulta este manual primero</Text>
            <Text style={styles.bulletPoint}>• Revisa el manual técnico para configuraciones avanzadas</Text>
            <Text style={styles.bulletPoint}>• Contacta a tu administrador</Text>
            <Text style={styles.bulletPoint}>• Envía un correo a support@natively.dev</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Manual de Usuario v1.0
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
