
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

export default function SpecialFunctionsManualScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Guía de Funciones Especiales',
          headerBackTitle: 'Atrás',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.mainTitle}>Guía de Funciones Especiales</Text>
          <Text style={styles.subtitle}>
            Descubre todas las funciones avanzadas y características especiales de la aplicación
          </Text>
        </View>

        {/* WhatsApp Parser */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="text.bubble.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>1. Parser Inteligente de WhatsApp</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Reconocimiento Automático de Productos</Text>
            <Text style={styles.paragraph}>
              El sistema puede interpretar mensajes de WhatsApp en múltiples formatos:
            </Text>
            <Text style={styles.subheading}>Formatos Soportados:</Text>
            <Text style={styles.bulletPoint}>• "2 kg tomate" - Cantidad con unidad y producto</Text>
            <Text style={styles.bulletPoint}>• "1 lechuga" - Solo cantidad y producto</Text>
            <Text style={styles.bulletPoint}>• "3 unidades cebolla" - Con palabra "unidades"</Text>
            <Text style={styles.bulletPoint}>• "medio kilo papa" - Fracciones en palabras</Text>
            <Text style={styles.bulletPoint}>• "1/2 kg zanahoria" - Fracciones numéricas</Text>
            <Text style={styles.bulletPoint}>• "dos kilos manzana" - Números en palabras</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Unidades Reconocidas</Text>
            <Text style={styles.subheading}>Peso:</Text>
            <Text style={styles.bulletPoint}>• kg, kilo, kilos, kilogramo, kilogramos</Text>
            <Text style={styles.bulletPoint}>• g, gramo, gramos</Text>
            
            <Text style={styles.subheading}>Volumen:</Text>
            <Text style={styles.bulletPoint}>• l, litro, litros</Text>
            <Text style={styles.bulletPoint}>• ml, mililitro, mililitros</Text>
            
            <Text style={styles.subheading}>Cantidad:</Text>
            <Text style={styles.bulletPoint}>• unidad, unidades, u, un, una</Text>
            <Text style={styles.bulletPoint}>• docena, media docena</Text>
            
            <Text style={styles.subheading}>Empaque:</Text>
            <Text style={styles.bulletPoint}>• caja, cajas</Text>
            <Text style={styles.bulletPoint}>• bolsa, bolsas</Text>
            <Text style={styles.bulletPoint}>• paquete, paquetes</Text>
            <Text style={styles.bulletPoint}>• atado, atados</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Números en Palabras</Text>
            <Text style={styles.paragraph}>
              El parser reconoce números escritos en español:
            </Text>
            <Text style={styles.bulletPoint}>• uno, dos, tres, cuatro, cinco...</Text>
            <Text style={styles.bulletPoint}>• diez, veinte, treinta...</Text>
            <Text style={styles.bulletPoint}>• cien, doscientos, mil...</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Fracciones</Text>
            <Text style={styles.paragraph}>
              Soporta fracciones en múltiples formatos:
            </Text>
            <Text style={styles.bulletPoint}>• medio, media - 0.5</Text>
            <Text style={styles.bulletPoint}>• cuarto - 0.25</Text>
            <Text style={styles.bulletPoint}>• tercio - 0.33</Text>
            <Text style={styles.bulletPoint}>• 1/2, 1/4, 1/3, 3/4 - Fracciones numéricas</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Aprendizaje Automático de Unidades</Text>
            <Text style={styles.paragraph}>
              Cuando el sistema encuentra una unidad desconocida:
            </Text>
            <Text style={styles.bulletPoint}>1. La registra automáticamente en la base de datos</Text>
            <Text style={styles.bulletPoint}>2. La asocia con el producto</Text>
            <Text style={styles.bulletPoint}>3. La reconocerá en futuros pedidos</Text>
            <Text style={styles.bulletPoint}>4. Los administradores pueden gestionar estas unidades</Text>
            <Text style={styles.note}>
              💡 Ejemplo: Si un cliente escribe "2 manojos cilantro", el sistema aprenderá "manojos"
            </Text>
          </View>
        </View>

        {/* Auto-Print */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="printer.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>2. Auto-Impresión Inteligente</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Impresión Automática de Pedidos</Text>
            <Text style={styles.paragraph}>
              Los pedidos nuevos se imprimen automáticamente cuando:
            </Text>
            <Text style={styles.bulletPoint}>• La función está habilitada en configuración</Text>
            <Text style={styles.bulletPoint}>• Hay una impresora conectada</Text>
            <Text style={styles.bulletPoint}>• La app tiene los permisos necesarios</Text>
            <Text style={styles.bulletPoint}>• El dispositivo no está en modo ahorro de batería</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cola de Impresión</Text>
            <Text style={styles.paragraph}>
              Sistema inteligente de gestión de impresión:
            </Text>
            <Text style={styles.bulletPoint}>• Los pedidos se agregan automáticamente a la cola</Text>
            <Text style={styles.bulletPoint}>• Se imprimen en orden de llegada</Text>
            <Text style={styles.bulletPoint}>• Los fallos se reintentan automáticamente</Text>
            <Text style={styles.bulletPoint}>• Puedes ver el estado de cada impresión</Text>
            <Text style={styles.bulletPoint}>• Reimprime pedidos manualmente si es necesario</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Background Printing</Text>
            <Text style={styles.paragraph}>
              La impresión funciona incluso con la app en segundo plano:
            </Text>
            <Text style={styles.bulletPoint}>• Usa Background Fetch de Expo</Text>
            <Text style={styles.bulletPoint}>• Verifica nuevos pedidos cada 15 minutos</Text>
            <Text style={styles.bulletPoint}>• Mantiene el dispositivo activo durante la impresión</Text>
            <Text style={styles.bulletPoint}>• Envía notificaciones de estado</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Formatos de Recibo Personalizables</Text>
            <Text style={styles.paragraph}>
              Múltiples estilos predefinidos:
            </Text>
            <Text style={styles.bulletPoint}>• Clásico - Formato tradicional</Text>
            <Text style={styles.bulletPoint}>• Moderno - Diseño limpio y minimalista</Text>
            <Text style={styles.bulletPoint}>• Compacto - Ahorra papel</Text>
            <Text style={styles.bulletPoint}>• Detallado - Información completa</Text>
            <Text style={styles.bulletPoint}>• Personalizado - Crea tu propio formato</Text>
          </View>
        </View>

        {/* Customer Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="person.crop.circle.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>3. Gestión Avanzada de Clientes</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Creación Automática de Clientes</Text>
            <Text style={styles.paragraph}>
              Los clientes se crean automáticamente cuando:
            </Text>
            <Text style={styles.bulletPoint}>• Envían su primer pedido por WhatsApp</Text>
            <Text style={styles.bulletPoint}>• Se extrae su nombre del contacto de WhatsApp</Text>
            <Text style={styles.bulletPoint}>• Se guarda su número de teléfono</Text>
            <Text style={styles.bulletPoint}>• Se puede agregar dirección posteriormente</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Clientes Recurrentes con Vales</Text>
            <Text style={styles.paragraph}>
              Sistema de crédito para clientes frecuentes:
            </Text>
            <Text style={styles.bulletPoint}>• Marca clientes como "recurrentes"</Text>
            <Text style={styles.bulletPoint}>• Permite pedidos sin pago inmediato</Text>
            <Text style={styles.bulletPoint}>• Registra deuda acumulada</Text>
            <Text style={styles.bulletPoint}>• Gestiona pagos parciales</Text>
            <Text style={styles.bulletPoint}>• Imprime estado de cuenta</Text>
            <Text style={styles.bulletPoint}>• Finaliza cuentas cuando se saldan</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bloqueo de Clientes</Text>
            <Text style={styles.paragraph}>
              Control de acceso temporal:
            </Text>
            <Text style={styles.bulletPoint}>• Bloquea clientes problemáticos</Text>
            <Text style={styles.bulletPoint}>• Los pedidos se rechazan automáticamente</Text>
            <Text style={styles.bulletPoint}>• El cliente recibe un mensaje informativo</Text>
            <Text style={styles.bulletPoint}>• Puedes desbloquear en cualquier momento</Text>
            <Text style={styles.bulletPoint}>• Útil para gestionar deudas o problemas</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Historial de Pedidos por Cliente</Text>
            <Text style={styles.paragraph}>
              Visualiza el historial completo:
            </Text>
            <Text style={styles.bulletPoint}>• Todos los pedidos del cliente</Text>
            <Text style={styles.bulletPoint}>• Total gastado</Text>
            <Text style={styles.bulletPoint}>• Frecuencia de pedidos</Text>
            <Text style={styles.bulletPoint}>• Productos más comprados</Text>
            <Text style={styles.bulletPoint}>• Estado de pagos</Text>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="bell.badge.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>4. Sistema de Notificaciones Inteligente</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notificaciones Push</Text>
            <Text style={styles.paragraph}>
              Alertas en tiempo real:
            </Text>
            <Text style={styles.bulletPoint}>• Nuevos pedidos por WhatsApp</Text>
            <Text style={styles.bulletPoint}>• Cambios de estado de pedidos</Text>
            <Text style={styles.bulletPoint}>• Errores de impresión</Text>
            <Text style={styles.bulletPoint}>• Consultas de clientes</Text>
            <Text style={styles.bulletPoint}>• Pagos registrados</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notificaciones In-App</Text>
            <Text style={styles.paragraph}>
              Bandeja de notificaciones integrada:
            </Text>
            <Text style={styles.bulletPoint}>• Historial completo de notificaciones</Text>
            <Text style={styles.bulletPoint}>• Contador de no leídas</Text>
            <Text style={styles.bulletPoint}>• Navegación directa al pedido</Text>
            <Text style={styles.bulletPoint}>• Marca como leído/no leído</Text>
            <Text style={styles.bulletPoint}>• Elimina notificaciones antiguas</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notificaciones a Clientes por WhatsApp</Text>
            <Text style={styles.paragraph}>
              Mensajes automáticos a clientes:
            </Text>
            <Text style={styles.bulletPoint}>• Confirmación de pedido recibido</Text>
            <Text style={styles.bulletPoint}>• Cambio de estado (Preparando, Listo, Entregado)</Text>
            <Text style={styles.bulletPoint}>• Productos agregados al pedido</Text>
            <Text style={styles.bulletPoint}>• Productos eliminados del pedido</Text>
            <Text style={styles.bulletPoint}>• Respuestas a consultas</Text>
            <Text style={styles.bulletPoint}>• Pedido cancelado</Text>
          </View>
        </View>

        {/* Order Queries */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="questionmark.bubble.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>5. Sistema de Consultas</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Consultas de Clientes</Text>
            <Text style={styles.paragraph}>
              Los clientes pueden hacer preguntas sobre sus pedidos:
            </Text>
            <Text style={styles.bulletPoint}>• Envían la consulta por WhatsApp</Text>
            <Text style={styles.bulletPoint}>• El sistema la registra automáticamente</Text>
            <Text style={styles.bulletPoint}>• Aparece en el detalle del pedido</Text>
            <Text style={styles.bulletPoint}>• El equipo puede responder desde la app</Text>
            <Text style={styles.bulletPoint}>• La respuesta se envía por WhatsApp</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tipos de Consultas</Text>
            <Text style={styles.paragraph}>
              El sistema reconoce diferentes tipos:
            </Text>
            <Text style={styles.bulletPoint}>• Estado del pedido</Text>
            <Text style={styles.bulletPoint}>• Tiempo de entrega</Text>
            <Text style={styles.bulletPoint}>• Modificaciones al pedido</Text>
            <Text style={styles.bulletPoint}>• Preguntas sobre productos</Text>
            <Text style={styles.bulletPoint}>• Consultas de precios</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Historial de Consultas</Text>
            <Text style={styles.paragraph}>
              Mantén un registro completo:
            </Text>
            <Text style={styles.bulletPoint}>• Todas las consultas del pedido</Text>
            <Text style={styles.bulletPoint}>• Respuestas enviadas</Text>
            <Text style={styles.bulletPoint}>• Fecha y hora de cada interacción</Text>
            <Text style={styles.bulletPoint}>• Estado de la consulta (Pendiente/Respondida)</Text>
          </View>
        </View>

        {/* Product Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="cube.box.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>6. Gestión Dinámica de Productos</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Agregar Productos con Formato WhatsApp</Text>
            <Text style={styles.paragraph}>
              Agrega productos a pedidos existentes:
            </Text>
            <Text style={styles.bulletPoint}>• Usa el mismo formato que WhatsApp</Text>
            <Text style={styles.bulletPoint}>• Escribe la lista de productos</Text>
            <Text style={styles.bulletPoint}>• El parser los interpreta automáticamente</Text>
            <Text style={styles.bulletPoint}>• Revisa y confirma antes de agregar</Text>
            <Text style={styles.bulletPoint}>• El cliente recibe notificación</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Edición Rápida de Productos</Text>
            <Text style={styles.paragraph}>
              Modifica productos fácilmente:
            </Text>
            <Text style={styles.bulletPoint}>• Toca cualquier producto para editarlo</Text>
            <Text style={styles.bulletPoint}>• Cambia cantidad, precio o notas</Text>
            <Text style={styles.bulletPoint}>• Los cambios se guardan automáticamente</Text>
            <Text style={styles.bulletPoint}>• El total se recalcula al instante</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Actualización Masiva de Precios</Text>
            <Text style={styles.paragraph}>
              Establece precios para múltiples productos:
            </Text>
            <Text style={styles.bulletPoint}>• Útil cuando los productos no tienen precio</Text>
            <Text style={styles.bulletPoint}>• Muestra todos los productos sin precio</Text>
            <Text style={styles.bulletPoint}>• Ingresa el precio para cada uno</Text>
            <Text style={styles.bulletPoint}>• Aplica todos los cambios de una vez</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Eliminación de Productos</Text>
            <Text style={styles.paragraph}>
              Elimina productos de pedidos:
            </Text>
            <Text style={styles.bulletPoint}>• Desliza el producto o usa el botón de eliminar</Text>
            <Text style={styles.bulletPoint}>• Confirma la eliminación</Text>
            <Text style={styles.bulletPoint}>• El total se actualiza automáticamente</Text>
            <Text style={styles.bulletPoint}>• El cliente recibe notificación por WhatsApp</Text>
          </View>
        </View>

        {/* Reports */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="doc.text.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>7. Generación de Reportes PDF</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tipos de Reportes</Text>
            <Text style={styles.subheading}>Resumen Ejecutivo:</Text>
            <Text style={styles.bulletPoint}>• Lista de pedidos con información básica</Text>
            <Text style={styles.bulletPoint}>• Totales por estado</Text>
            <Text style={styles.bulletPoint}>• Resumen financiero</Text>
            
            <Text style={styles.subheading}>Reporte Detallado:</Text>
            <Text style={styles.bulletPoint}>• Información completa de cada pedido</Text>
            <Text style={styles.bulletPoint}>• Lista de productos con precios</Text>
            <Text style={styles.bulletPoint}>• Información del cliente</Text>
            <Text style={styles.bulletPoint}>• Notas y observaciones</Text>
            
            <Text style={styles.subheading}>Estadísticas:</Text>
            <Text style={styles.bulletPoint}>• Gráficos de distribución</Text>
            <Text style={styles.bulletPoint}>• Análisis de tendencias</Text>
            <Text style={styles.bulletPoint}>• Productos más vendidos</Text>
            <Text style={styles.bulletPoint}>• Clientes más frecuentes</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Filtros Avanzados</Text>
            <Text style={styles.paragraph}>
              Personaliza tus reportes:
            </Text>
            <Text style={styles.bulletPoint}>• Rango de fechas personalizado</Text>
            <Text style={styles.bulletPoint}>• Filtro por estado de pedido</Text>
            <Text style={styles.bulletPoint}>• Filtro por cliente específico</Text>
            <Text style={styles.bulletPoint}>• Combinación de múltiples filtros</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Compartir Reportes</Text>
            <Text style={styles.paragraph}>
              Comparte los reportes generados:
            </Text>
            <Text style={styles.bulletPoint}>• Genera el PDF</Text>
            <Text style={styles.bulletPoint}>• Comparte por WhatsApp, Email, etc.</Text>
            <Text style={styles.bulletPoint}>• Guarda en el dispositivo</Text>
            <Text style={styles.bulletPoint}>• Imprime directamente</Text>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="chart.bar.xaxis" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>8. Estadísticas en Tiempo Real</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Dashboard de Métricas</Text>
            <Text style={styles.paragraph}>
              Visualiza métricas clave:
            </Text>
            <Text style={styles.bulletPoint}>• Total de pedidos del día/semana/mes</Text>
            <Text style={styles.bulletPoint}>• Distribución por estado</Text>
            <Text style={styles.bulletPoint}>• Ingresos totales</Text>
            <Text style={styles.bulletPoint}>• Promedio por pedido</Text>
            <Text style={styles.bulletPoint}>• Tasa de completación</Text>
            <Text style={styles.bulletPoint}>• Tiempo promedio de procesamiento</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Análisis de Productos</Text>
            <Text style={styles.paragraph}>
              Identifica tendencias:
            </Text>
            <Text style={styles.bulletPoint}>• Productos más vendidos</Text>
            <Text style={styles.bulletPoint}>• Productos menos solicitados</Text>
            <Text style={styles.bulletPoint}>• Variaciones de precio</Text>
            <Text style={styles.bulletPoint}>• Unidades más utilizadas</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Análisis de Clientes</Text>
            <Text style={styles.paragraph}>
              Conoce a tus clientes:
            </Text>
            <Text style={styles.bulletPoint}>• Clientes más frecuentes</Text>
            <Text style={styles.bulletPoint}>• Clientes con mayor gasto</Text>
            <Text style={styles.bulletPoint}>• Nuevos clientes del período</Text>
            <Text style={styles.bulletPoint}>• Clientes inactivos</Text>
          </View>
        </View>

        {/* Advanced Features */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="sparkles" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>9. Funciones Avanzadas</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Modo Impresor</Text>
            <Text style={styles.paragraph}>
              Rol especializado para impresión:
            </Text>
            <Text style={styles.bulletPoint}>• Acceso exclusivo a cola de impresión</Text>
            <Text style={styles.bulletPoint}>• Auto-impresión optimizada</Text>
            <Text style={styles.bulletPoint}>• Interfaz simplificada</Text>
            <Text style={styles.bulletPoint}>• Gestión de errores de impresión</Text>
            <Text style={styles.bulletPoint}>• Ideal para dispositivos dedicados</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sincronización en Tiempo Real</Text>
            <Text style={styles.paragraph}>
              Todos los dispositivos sincronizados:
            </Text>
            <Text style={styles.bulletPoint}>• Cambios visibles instantáneamente</Text>
            <Text style={styles.bulletPoint}>• Múltiples usuarios simultáneos</Text>
            <Text style={styles.bulletPoint}>• Sin conflictos de datos</Text>
            <Text style={styles.bulletPoint}>• Actualizaciones automáticas</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Búsqueda Avanzada</Text>
            <Text style={styles.paragraph}>
              Encuentra pedidos rápidamente:
            </Text>
            <Text style={styles.bulletPoint}>• Búsqueda por número de pedido</Text>
            <Text style={styles.bulletPoint}>• Búsqueda por nombre de cliente</Text>
            <Text style={styles.bulletPoint}>• Búsqueda por teléfono</Text>
            <Text style={styles.bulletPoint}>• Búsqueda por producto</Text>
            <Text style={styles.bulletPoint}>• Filtros combinados</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Temas Personalizables</Text>
            <Text style={styles.paragraph}>
              Personaliza la apariencia:
            </Text>
            <Text style={styles.bulletPoint}>• Modo claro</Text>
            <Text style={styles.bulletPoint}>• Modo oscuro</Text>
            <Text style={styles.bulletPoint}>• Automático según sistema</Text>
            <Text style={styles.bulletPoint}>• Colores personalizados</Text>
          </View>
        </View>

        {/* Tips and Tricks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="lightbulb.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>10. Consejos y Trucos</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Optimiza tu Flujo de Trabajo</Text>
            <Text style={styles.bulletPoint}>• Usa filtros para enfocarte en pedidos específicos</Text>
            <Text style={styles.bulletPoint}>• Configura auto-impresión para ahorrar tiempo</Text>
            <Text style={styles.bulletPoint}>• Marca clientes frecuentes como recurrentes</Text>
            <Text style={styles.bulletPoint}>• Usa el formato WhatsApp para agregar productos rápido</Text>
            <Text style={styles.bulletPoint}>• Revisa estadísticas para identificar patrones</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Mejora la Comunicación</Text>
            <Text style={styles.bulletPoint}>• Responde consultas rápidamente</Text>
            <Text style={styles.bulletPoint}>• Actualiza estados para mantener informados a los clientes</Text>
            <Text style={styles.bulletPoint}>• Usa las notificaciones automáticas</Text>
            <Text style={styles.bulletPoint}>• Personaliza mensajes cuando sea necesario</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Mantén el Sistema Organizado</Text>
            <Text style={styles.bulletPoint}>• Completa pedidos regularmente</Text>
            <Text style={styles.bulletPoint}>• Actualiza información de clientes</Text>
            <Text style={styles.bulletPoint}>• Revisa y limpia la cola de impresión</Text>
            <Text style={styles.bulletPoint}>• Genera reportes periódicos</Text>
            <Text style={styles.bulletPoint}>• Mantén actualizada la lista de unidades</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Guía de Funciones Especiales v1.0
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
