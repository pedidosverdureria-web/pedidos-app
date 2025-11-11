
import { useState } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { getSupabase } from '@/lib/supabase';
import { Order, OrderQuery } from '@/types';
import { sendQueryResponse, sendQueryConfirmation } from '@/utils/whatsappNotifications';
import { generateQueryReceiptText, PrinterConfig } from '@/utils/receiptGenerator';

export function useOrderQueries(
  order: Order | null, 
  onUpdate: () => Promise<void>,
  printReceipt: (text: string, autoCut: boolean, textSize: string, encoding: string) => Promise<void>,
  printerConfig: PrinterConfig | null,
  isConnected: boolean
) {
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<OrderQuery | null>(null);
  const [responseText, setResponseText] = useState('');
  const [sendingResponse, setSendingResponse] = useState(false);
  const [newQueryText, setNewQueryText] = useState('');
  const [sendingQuery, setSendingQuery] = useState(false);

  const openResponseModal = (query: OrderQuery) => {
    setSelectedQuery(query);
    setResponseText('');
    setShowResponseModal(true);
  };

  const handleSendResponse = async () => {
    if (!order || !selectedQuery || !responseText.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('⚠️ Atención', 'Por favor ingresa una respuesta');
      return;
    }

    try {
      setSendingResponse(true);
      
      await sendQueryResponse(
        order.id,
        order.customer_name,
        order.order_number,
        selectedQuery.query_text,
        responseText
      );

      setShowResponseModal(false);
      setSelectedQuery(null);
      setResponseText('');
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Respuesta Enviada',
        'La respuesta se envió correctamente al cliente por WhatsApp',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[useOrderQueries] Error sending response:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error',
        'No se pudo enviar la respuesta. Verifica la configuración de WhatsApp.',
        [{ text: 'OK' }]
      );
    } finally {
      setSendingResponse(false);
    }
  };

  const handleSendQuery = async () => {
    if (!order || !newQueryText.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('⚠️ Atención', 'Por favor ingresa una consulta');
      return;
    }

    if (!order.customer_phone) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('⚠️ Atención', 'Este pedido no tiene un número de teléfono asociado');
      return;
    }

    try {
      setSendingQuery(true);
      const supabase = getSupabase();

      const { data: queryData, error: queryError } = await supabase
        .from('order_queries')
        .insert({
          order_id: order.id,
          customer_phone: order.customer_phone,
          query_text: newQueryText,
          direction: 'outgoing',
        })
        .select()
        .single();

      if (queryError) throw queryError;

      await sendQueryConfirmation(
        order.customer_phone,
        order.customer_name,
        order.order_number,
        newQueryText
      );

      // Auto-print the query if auto-print is enabled
      if (printerConfig?.auto_print_enabled && isConnected) {
        console.log('[useOrderQueries] Auto-printing query');
        try {
          const receiptText = generateQueryReceiptText(order, newQueryText, printerConfig);
          const autoCut = printerConfig?.auto_cut_enabled ?? true;
          const textSize = printerConfig?.text_size || 'medium';
          const encoding = printerConfig?.encoding || 'CP850';

          await printReceipt(receiptText, autoCut, textSize, encoding);
          console.log('[useOrderQueries] Query auto-printed successfully');
        } catch (printError) {
          console.error('[useOrderQueries] Error auto-printing query:', printError);
        }
      }

      setNewQueryText('');
      await onUpdate();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Consulta Enviada',
        'La consulta se envió correctamente al cliente por WhatsApp y se imprimió automáticamente',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[useOrderQueries] Error sending query:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error',
        'No se pudo enviar la consulta. Verifica la configuración de WhatsApp.',
        [{ text: 'OK' }]
      );
    } finally {
      setSendingQuery(false);
    }
  };

  const handlePrintQuery = async (query: OrderQuery) => {
    if (!order) return;

    if (!isConnected) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        '⚠️ Impresora No Conectada',
        'Por favor conecta una impresora antes de imprimir',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      console.log('[useOrderQueries] Printing query receipt');
      
      const receiptText = generateQueryReceiptText(order, query.query_text, printerConfig || undefined);
      const autoCut = printerConfig?.auto_cut_enabled ?? true;
      const textSize = printerConfig?.text_size || 'medium';
      const encoding = printerConfig?.encoding || 'CP850';

      await printReceipt(receiptText, autoCut, textSize, encoding);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Consulta Impresa',
        'La consulta se imprimió correctamente',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[useOrderQueries] Print query error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error de Impresión',
        'No se pudo imprimir la consulta. Verifica la conexión con la impresora.',
        [{ text: 'OK' }]
      );
    }
  };

  return {
    showResponseModal,
    setShowResponseModal,
    selectedQuery,
    setSelectedQuery,
    responseText,
    setResponseText,
    sendingResponse,
    newQueryText,
    setNewQueryText,
    sendingQuery,
    openResponseModal,
    handleSendResponse,
    handleSendQuery,
    handlePrintQuery,
  };
}
