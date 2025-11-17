
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

export default function TroubleshootingManualScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Guía para Resolver Problemas',
          headerBackTitle: 'Atrás',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.mainTitle}>Guía para Resolver Problemas</Text>
          <Text style={styles.subtitle}>
            Soluciones a los problemas más comunes de la aplicación
          </Text>
        </View>

        {/* WhatsApp Issues */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="message.fill" size={24} color={colors.error} />
            <Text style={styles.sectionTitle}>1. Problemas con WhatsApp</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>No llegan pedidos por WhatsApp</Text>
            <Text style={styles.subheading}>Posibles causas:</Text>
            <Text style={styles.bulletPoint}>• Webhook no configurado correctamente</Text>
            <Text style={styles.bulletPoint}>• Número no autorizado</Text>
            <Text style={styles.bulletPoint}>• Credenciales incorrectas</Text>
            <Text style={styles.bulletPoint}>• Suscripción de webhook inactiva</Text>
            
            <Text style={styles.subheading}>Soluciones:</Text>
            <Text style={styles.bulletPoint}>1. Verifica la configuración en Perfil → WhatsApp</Text>
            <Text style={styles.bulletPoint}>2. Confirma que el verify_token coincida con Meta</Text>
            <Text style={styles.bulletPoint}>3. Revisa que el access_token sea válido</Text>
            <Text style={styles.bulletPoint}>4. Verifica la URL del webhook en Meta Developer Console</Text>
            <Text style={styles.bulletPoint}>5. Asegúrate de estar suscrito a "messages"</Text>
            <Text style={styles.bulletPoint}>6. Revisa los logs de Edge Function en Supabase</Text>
            <Text style={styles.bulletPoint}>7. Prueba enviando un mensaje de prueba</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Mensajes no se parsean correctamente</Text>
            <Text style={styles.subheading}>Posibles causas:</Text>
            <Text style={styles.bulletPoint}>• Formato de mensaje incorrecto</Text>
            <Text style={styles.bulletPoint}>• Unidad desconocida</Text>
            <Text style={styles.bulletPoint}>• Caracteres especiales</Text>
            
            <Text style={styles.subheading}>Soluciones:</Text>
            <Text style={styles.bulletPoint}>1. Usa el formato correcto: "cantidad unidad producto"</Text>
            <Text style={styles.bulletPoint}>2. Ejemplo: "2 kg tomate, 1 lechuga"</Text>
            <Text style={styles.bulletPoint}>3. Evita saludos y texto adicional</Text>
            <Text style={styles.bulletPoint}>4. Usa la pantalla de prueba para validar formatos</Text>
            <Text style={styles.bulletPoint}>5. Agrega unidades desconocidas en Configuración → Unidades</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cliente no recibe notificaciones</Text>
            <Text style={styles.subheading}>Posibles causas:</Text>
            <Text style={styles.bulletPoint}>• Número de teléfono incorrecto</Text>
            <Text style={styles.bulletPoint}>• WhatsApp no configurado</Text>
            <Text style={styles.bulletPoint}>• Límite de mensajes alcanzado</Text>
            
            <Text style={styles.subheading}>Soluciones:</Text>
            <Text style={styles.bulletPoint}>1. Verifica el número del cliente (formato +56...)</Text>
            <Text style={styles.bulletPoint}>2. Confirma que WhatsApp esté activo</Text>
            <Text style={styles.bulletPoint}>3. Revisa los logs de Edge Function</Text>
            <Text style={styles.bulletPoint}>4. Verifica límites de mensajes en Meta</Text>
            <Text style={styles.bulletPoint}>5. Prueba enviando un mensaje manual</Text>
          </View>
        </View>

        {/* Printer Issues */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="printer.fill" size={24} color={colors.error} />
            <Text style={styles.sectionTitle}>2. Problemas con la Impresora</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Impresora no se conecta</Text>
            <Text style={styles.subheading}>Posibles causas:</Text>
            <Text style={styles.bulletPoint}>• Bluetooth desactivado</Text>
            <Text style={styles.bulletPoint}>• Impresora apagada</Text>
            <Text style={styles.bulletPoint}>• Permisos no otorgados</Text>
            <Text style={styles.bulletPoint}>• Dispositivo ya vinculado a otro</Text>
            
            <Text style={styles.subheading}>Soluciones:</Text>
            <Text style={styles.bulletPoint}>1. Activa Bluetooth en el dispositivo</Text>
            <Text style={styles.bulletPoint}>2. Enciende la impresora</Text>
            <Text style={styles.bulletPoint}>3. Ve a Configuración → Permisos</Text>
            <Text style={styles.bulletPoint}>4. Otorga todos los permisos de Bluetooth</Text>
            <Text style={styles.bulletPoint}>5. Desvincula la impresora de otros dispositivos</Text>
            <Text style={styles.bulletPoint}>6. Reinicia la impresora</Text>
            <Text style={styles.bulletPoint}>7. Reinicia el Bluetooth del dispositivo</Text>
            <Text style={styles.bulletPoint}>8. Intenta escanear nuevamente</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Impresora imprime caracteres extraños</Text>
            <Text style={styles.subheading}>Posibles causas:</Text>
            <Text style={styles.bulletPoint}>• Codificación incorrecta</Text>
            <Text style={styles.bulletPoint}>• Modelo de impresora incompatible</Text>
            <Text style={styles.bulletPoint}>• Comandos ESC/POS no soportados</Text>
            
            <Text style={styles.subheading}>Soluciones:</Text>
            <Text style={styles.bulletPoint}>1. Ve a Configuración → Impresora → Edición Avanzada</Text>
            <Text style={styles.bulletPoint}>2. Cambia la codificación a CP850</Text>
            <Text style={styles.bulletPoint}>3. Si persiste, prueba ISO-8859-1</Text>
            <Text style={styles.bulletPoint}>4. Verifica que tu impresora soporte ESC/POS</Text>
            <Text style={styles.bulletPoint}>5. Consulta el manual de tu impresora</Text>
            <Text style={styles.bulletPoint}>6. Prueba con diferentes tamaños de texto</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Auto-impresión no funciona</Text>
            <Text style={styles.subheading}>Posibles causas:</Text>
            <Text style={styles.bulletPoint}>• Función deshabilitada</Text>
            <Text style={styles.bulletPoint}>• Permisos de background no otorgados</Text>
            <Text style={styles.bulletPoint}>• Optimización de batería activa</Text>
            <Text style={styles.bulletPoint}>• App en segundo plano cerrada por el sistema</Text>
            
            <Text style={styles.subheading}>Soluciones:</Text>
            <Text style={styles.bulletPoint}>1. Ve a Configuración → Impresora</Text>
            <Text style={styles.bulletPoint}>2. Activa "Auto-impresión"</Text>
            <Text style={styles.bulletPoint}>3. Ve a Configuración → Permisos</Text>
            <Text style={styles.bulletPoint}>4. Otorga permiso de "Background Fetch"</Text>
            <Text style={styles.bulletPoint}>5. Deshabilita optimización de batería para la app</Text>
            <Text style={styles.bulletPoint}>6. Mantén la app en primer plano si es posible</Text>
            <Text style={styles.bulletPoint}>7. Verifica que la impresora esté conectada</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Impresora se desconecta constantemente</Text>
            <Text style={styles.subheading}>Posibles causas:</Text>
            <Text style={styles.bulletPoint}>• Batería baja de la impresora</Text>
            <Text style={styles.bulletPoint}>• Distancia excesiva</Text>
            <Text style={styles.bulletPoint}>• Interferencia Bluetooth</Text>
            
            <Text style={styles.subheading}>Soluciones:</Text>
            <Text style={styles.bulletPoint}>1. Carga la batería de la impresora</Text>
            <Text style={styles.bulletPoint}>2. Mantén el dispositivo cerca de la impresora</Text>
            <Text style={styles.bulletPoint}>3. Aleja otros dispositivos Bluetooth</Text>
            <Text style={styles.bulletPoint}>4. Reinicia ambos dispositivos</Text>
            <Text style={styles.bulletPoint}>5. Reconecta la impresora</Text>
          </View>
        </View>

        {/* Authentication Issues */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="lock.fill" size={24} color={colors.error} />
            <Text style={styles.sectionTitle}>3. Problemas de Autenticación</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>No puedo iniciar sesión</Text>
            <Text style={styles.subheading}>Posibles causas:</Text>
            <Text style={styles.bulletPoint}>• Email no verificado</Text>
            <Text style={styles.bulletPoint}>• Contraseña incorrecta</Text>
            <Text style={styles.bulletPoint}>• Usuario desactivado</Text>
            <Text style={styles.bulletPoint}>• Problemas de conexión</Text>
            
            <Text style={styles.subheading}>Soluciones:</Text>
            <Text style={styles.bulletPoint}>1. Verifica tu email (revisa spam)</Text>
            <Text style={styles.bulletPoint}>2. Confirma que la contraseña sea correcta</Text>
            <Text style={styles.bulletPoint}>3. Contacta al administrador para verificar tu cuenta</Text>
            <Text style={styles.bulletPoint}>4. Verifica tu conexión a internet</Text>
            <Text style={styles.bulletPoint}>5. Intenta restablecer la contraseña</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sesión se cierra automáticamente</Text>
            <Text style={styles.subheading}>Posibles causas:</Text>
            <Text style={styles.bulletPoint}>• Token expirado</Text>
            <Text style={styles.bulletPoint}>• Problemas de red</Text>
            <Text style={styles.bulletPoint}>• Caché corrupto</Text>
            
            <Text style={styles.subheading}>Soluciones:</Text>
            <Text style={styles.bulletPoint}>1. Cierra sesión manualmente</Text>
            <Text style={styles.bulletPoint}>2. Limpia el caché de la app</Text>
            <Text style={styles.bulletPoint}>3. Vuelve a iniciar sesión</Text>
            <Text style={styles.bulletPoint}>4. Verifica tu conexión a internet</Text>
            <Text style={styles.bulletPoint}>5. Actualiza la app si hay una nueva versión</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>No recibo email de verificación</Text>
            <Text style={styles.subheading}>Posibles causas:</Text>
            <Text style={styles.bulletPoint}>• Email en spam</Text>
            <Text style={styles.bulletPoint}>• Email incorrecto</Text>
            <Text style={styles.bulletPoint}>• Problemas del servidor de email</Text>
            
            <Text style={styles.subheading}>Soluciones:</Text>
            <Text style={styles.bulletPoint}>1. Revisa la carpeta de spam</Text>
            <Text style={styles.bulletPoint}>2. Verifica que el email sea correcto</Text>
            <Text style={styles.bulletPoint}>3. Solicita reenvío del email</Text>
            <Text style={styles.bulletPoint}>4. Espera unos minutos y revisa nuevamente</Text>
            <Text style={styles.bulletPoint}>5. Contacta al administrador</Text>
          </View>
        </View>

        {/* Notification Issues */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="bell.fill" size={24} color={colors.error} />
            <Text style={styles.sectionTitle}>4. Problemas con Notificaciones</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>No recibo notificaciones push</Text>
            <Text style={styles.subheading}>Posibles causas:</Text>
            <Text style={styles.bulletPoint}>• Permisos no otorgados</Text>
            <Text style={styles.bulletPoint}>• Notificaciones deshabilitadas</Text>
            <Text style={styles.bulletPoint}>• Modo No Molestar activo</Text>
            <Text style={styles.bulletPoint}>• Problemas de red</Text>
            
            <Text style={styles.subheading}>Soluciones:</Text>
            <Text style={styles.bulletPoint}>1. Ve a Configuración → Permisos</Text>
            <Text style={styles.bulletPoint}>2. Otorga permiso de notificaciones</Text>
            <Text style={styles.bulletPoint}>3. Ve a Configuración → Notificaciones</Text>
            <Text style={styles.bulletPoint}>4. Activa notificaciones push</Text>
            <Text style={styles.bulletPoint}>5. Desactiva Modo No Molestar</Text>
            <Text style={styles.bulletPoint}>6. Verifica tu conexión a internet</Text>
            <Text style={styles.bulletPoint}>7. Reinicia la app</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notificaciones no hacen sonido</Text>
            <Text style={styles.subheading}>Posibles causas:</Text>
            <Text style={styles.bulletPoint}>• Sonido deshabilitado</Text>
            <Text style={styles.bulletPoint}>• Volumen bajo</Text>
            <Text style={styles.bulletPoint}>• Modo silencioso activo</Text>
            
            <Text style={styles.subheading}>Soluciones:</Text>
            <Text style={styles.bulletPoint}>1. Ve a Configuración → Notificaciones</Text>
            <Text style={styles.bulletPoint}>2. Activa sonido de notificaciones</Text>
            <Text style={styles.bulletPoint}>3. Sube el volumen del dispositivo</Text>
            <Text style={styles.bulletPoint}>4. Desactiva modo silencioso</Text>
            <Text style={styles.bulletPoint}>5. Verifica configuración del sistema</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notificaciones llegan con retraso</Text>
            <Text style={styles.subheading}>Posibles causas:</Text>
            <Text style={styles.bulletPoint}>• Optimización de batería activa</Text>
            <Text style={styles.bulletPoint}>• Conexión inestable</Text>
            <Text style={styles.bulletPoint}>• App en segundo plano restringida</Text>
            
            <Text style={styles.subheading}>Soluciones:</Text>
            <Text style={styles.bulletPoint}>1. Deshabilita optimización de batería</Text>
            <Text style={styles.bulletPoint}>2. Mantén la app en primer plano</Text>
            <Text style={styles.bulletPoint}>3. Verifica tu conexión a internet</Text>
            <Text style={styles.bulletPoint}>4. Permite ejecución en segundo plano</Text>
          </View>
        </View>

        {/* App Performance */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="speedometer" size={24} color={colors.error} />
            <Text style={styles.sectionTitle}>5. Problemas de Rendimiento</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>App lenta o se congela</Text>
            <Text style={styles.subheading}>Posibles causas:</Text>
            <Text style={styles.bulletPoint}>• Muchos pedidos en memoria</Text>
            <Text style={styles.bulletPoint}>• Caché lleno</Text>
            <Text style={styles.bulletPoint}>• Dispositivo con poca memoria</Text>
            <Text style={styles.bulletPoint}>• Conexión lenta</Text>
            
            <Text style={styles.subheading}>Soluciones:</Text>
            <Text style={styles.bulletPoint}>1. Cierra y vuelve a abrir la app</Text>
            <Text style={styles.bulletPoint}>2. Limpia pedidos completados antiguos</Text>
            <Text style={styles.bulletPoint}>3. Limpia el caché de la app</Text>
            <Text style={styles.bulletPoint}>4. Libera memoria del dispositivo</Text>
            <Text style={styles.bulletPoint}>5. Verifica tu conexión a internet</Text>
            <Text style={styles.bulletPoint}>6. Actualiza la app</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>App se cierra inesperadamente</Text>
            <Text style={styles.subheading}>Posibles causas:</Text>
            <Text style={styles.bulletPoint}>• Error en el código</Text>
            <Text style={styles.bulletPoint}>• Memoria insuficiente</Text>
            <Text style={styles.bulletPoint}>• Versión desactualizada</Text>
            
            <Text style={styles.subheading}>Soluciones:</Text>
            <Text style={styles.bulletPoint}>1. Reinicia el dispositivo</Text>
            <Text style={styles.bulletPoint}>2. Actualiza la app</Text>
            <Text style={styles.bulletPoint}>3. Libera memoria del dispositivo</Text>
            <Text style={styles.bulletPoint}>4. Reinstala la app si persiste</Text>
            <Text style={styles.bulletPoint}>5. Reporta el error al soporte</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Datos no se sincronizan</Text>
            <Text style={styles.subheading}>Posibles causas:</Text>
            <Text style={styles.bulletPoint}>• Sin conexión a internet</Text>
            <Text style={styles.bulletPoint}>• Problemas con Supabase</Text>
            <Text style={styles.bulletPoint}>• Sesión expirada</Text>
            
            <Text style={styles.subheading}>Soluciones:</Text>
            <Text style={styles.bulletPoint}>1. Verifica tu conexión a internet</Text>
            <Text style={styles.bulletPoint}>2. Desliza para actualizar (pull-to-refresh)</Text>
            <Text style={styles.bulletPoint}>3. Cierra sesión y vuelve a iniciar</Text>
            <Text style={styles.bulletPoint}>4. Verifica el estado de Supabase</Text>
            <Text style={styles.bulletPoint}>5. Contacta al administrador</Text>
          </View>
        </View>

        {/* Data Issues */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="exclamationmark.triangle.fill" size={24} color={colors.error} />
            <Text style={styles.sectionTitle}>6. Problemas con Datos</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Pedido no aparece en la lista</Text>
            <Text style={styles.subheading}>Posibles causas:</Text>
            <Text style={styles.bulletPoint}>• Filtro activo</Text>
            <Text style={styles.bulletPoint}>• Búsqueda activa</Text>
            <Text style={styles.bulletPoint}>• No sincronizado</Text>
            
            <Text style={styles.subheading}>Soluciones:</Text>
            <Text style={styles.bulletPoint}>1. Limpia los filtros</Text>
            <Text style={styles.bulletPoint}>2. Borra el texto de búsqueda</Text>
            <Text style={styles.bulletPoint}>3. Desliza para actualizar</Text>
            <Text style={styles.bulletPoint}>4. Verifica que el pedido exista en la base de datos</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Precios incorrectos en pedidos</Text>
            <Text style={styles.subheading}>Posibles causas:</Text>
            <Text style={styles.bulletPoint}>• Productos sin precio asignado</Text>
            <Text style={styles.bulletPoint}>• Error al parsear mensaje</Text>
            <Text style={styles.bulletPoint}>• Edición manual incorrecta</Text>
            
            <Text style={styles.subheading}>Soluciones:</Text>
            <Text style={styles.bulletPoint}>1. Edita el pedido</Text>
            <Text style={styles.bulletPoint}>2. Usa "Actualizar Precios" para asignar precios</Text>
            <Text style={styles.bulletPoint}>3. Edita productos individuales si es necesario</Text>
            <Text style={styles.bulletPoint}>4. Verifica el total calculado</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cliente duplicado</Text>
            <Text style={styles.subheading}>Posibles causas:</Text>
            <Text style={styles.bulletPoint}>• Mismo cliente con números diferentes</Text>
            <Text style={styles.bulletPoint}>• Variaciones en el nombre</Text>
            
            <Text style={styles.subheading}>Soluciones:</Text>
            <Text style={styles.bulletPoint}>1. Edita la información del cliente</Text>
            <Text style={styles.bulletPoint}>2. Unifica el nombre y número</Text>
            <Text style={styles.bulletPoint}>3. Elimina el cliente duplicado si es necesario</Text>
            <Text style={styles.bulletPoint}>4. Contacta al administrador para fusionar clientes</Text>
          </View>
        </View>

        {/* General Tips */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="lightbulb.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>7. Consejos Generales</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Antes de Reportar un Problema</Text>
            <Text style={styles.bulletPoint}>1. Reinicia la app</Text>
            <Text style={styles.bulletPoint}>2. Verifica tu conexión a internet</Text>
            <Text style={styles.bulletPoint}>3. Actualiza la app si hay una nueva versión</Text>
            <Text style={styles.bulletPoint}>4. Revisa los permisos de la app</Text>
            <Text style={styles.bulletPoint}>5. Intenta reproducir el problema</Text>
            <Text style={styles.bulletPoint}>6. Toma capturas de pantalla del error</Text>
            <Text style={styles.bulletPoint}>7. Anota los pasos que causaron el problema</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Mantenimiento Preventivo</Text>
            <Text style={styles.bulletPoint}>• Actualiza la app regularmente</Text>
            <Text style={styles.bulletPoint}>• Limpia pedidos completados antiguos</Text>
            <Text style={styles.bulletPoint}>• Verifica la conexión de la impresora diariamente</Text>
            <Text style={styles.bulletPoint}>• Revisa los permisos periódicamente</Text>
            <Text style={styles.bulletPoint}>• Mantén el dispositivo con suficiente espacio</Text>
            <Text style={styles.bulletPoint}>• Reinicia la app ocasionalmente</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cuándo Contactar Soporte</Text>
            <Text style={styles.paragraph}>
              Contacta al soporte si:
            </Text>
            <Text style={styles.bulletPoint}>• El problema persiste después de intentar las soluciones</Text>
            <Text style={styles.bulletPoint}>• Encuentras un error crítico</Text>
            <Text style={styles.bulletPoint}>• Pierdes datos importantes</Text>
            <Text style={styles.bulletPoint}>• Necesitas ayuda con configuración avanzada</Text>
            <Text style={styles.bulletPoint}>• Tienes sugerencias de mejora</Text>
            
            <Text style={styles.paragraph}>
              Email: support@natively.dev
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Guía para Resolver Problemas v1.0
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
