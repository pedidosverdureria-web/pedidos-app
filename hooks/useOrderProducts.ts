
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { getSupabase } from '@/lib/supabase';
import { Order, OrderItem } from '@/types';
import { ParsedOrderItem } from '@/utils/whatsappParser';
import { sendProductRemovedNotification } from '@/utils/whatsappNotifications';

export function useOrderProducts(order: Order | null, onUpdate: () => Promise<void>) {
  const [editingProduct, setEditingProduct] = useState<OrderItem | null>(null);
  const [productName, setProductName] = useState('');
  const [productQuantity, setProductQuantity] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productNotes, setProductNotes] = useState('');
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [bulkPrices, setBulkPrices] = useState<{ [key: string]: string }>({});

  const startEditingProduct = (item: OrderItem) => {
    setEditingProduct(item);
    setProductName(item.product_name);
    setProductQuantity(item.quantity.toString());
    setProductPrice(item.unit_price.toString());
    setProductNotes(item.notes || '');
  };

  const updateProduct = async (itemId: string) => {
    if (!productName || !productQuantity) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('⚠️ Atención', 'Por favor completa el nombre y la cantidad del producto');
      return;
    }

    try {
      const supabase = getSupabase();
      
      let quantityValue: string | number;
      if (productQuantity.trim() === '#') {
        quantityValue = '#';
      } else {
        const parsed = parseFloat(productQuantity);
        if (isNaN(parsed) || parsed <= 0) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Alert.alert('⚠️ Atención', 'La cantidad debe ser un número válido mayor a 0 o "#"');
          return;
        }
        quantityValue = parsed;
      }

      const priceValue = parseFloat(productPrice) || 0;
      
      const { error } = await supabase
        .from('order_items')
        .update({
          product_name: productName,
          quantity: quantityValue,
          unit_price: priceValue,
          notes: productNotes,
        })
        .eq('id', itemId);

      if (error) throw error;

      setEditingProduct(null);
      await onUpdate();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Producto Actualizado',
        'Los cambios se guardaron correctamente',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[useOrderProducts] Error updating product:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error',
        'No se pudo actualizar el producto. Por favor intenta nuevamente.',
        [{ text: 'OK' }]
      );
    }
  };

  const deleteProduct = async (itemId: string) => {
    if (!order) return;

    const item = order.items?.find(i => i.id === itemId);
    if (!item) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const supabase = getSupabase();
      const { error } = await supabase
        .from('order_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      await sendProductRemovedNotification(order.id, item);
      await onUpdate();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Producto Eliminado',
        `${item.product_name} se eliminó del pedido`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[useOrderProducts] Error deleting product:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error',
        'No se pudo eliminar el producto. Por favor intenta nuevamente.',
        [{ text: 'OK' }]
      );
    }
  };

  const addProductsFromWhatsApp = async (parsedProducts: ParsedOrderItem[]) => {
    if (!order || parsedProducts.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('⚠️ Atención', 'Por favor ingresa al menos un producto válido');
      return false;
    }

    try {
      const supabase = getSupabase();
      
      for (const parsedItem of parsedProducts) {
        // FIXED: Use lowercase "unidad:" for consistency
        const notes = `unidad: ${parsedItem.unit}`;
        
        await supabase
          .from('order_items')
          .insert({
            order_id: order.id,
            product_name: parsedItem.product,
            quantity: parsedItem.quantity,
            unit_price: 0,
            notes: notes,
          });
      }

      await onUpdate();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Productos Agregados',
        `Se agregaron ${parsedProducts.length} producto(s) al pedido`,
        [{ text: 'OK' }]
      );
      return true;
    } catch (error) {
      console.error('[useOrderProducts] Error adding products:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error',
        'No se pudieron agregar los productos. Por favor intenta nuevamente.',
        [{ text: 'OK' }]
      );
      return false;
    }
  };

  const openPriceModal = () => {
    const initialPrices: { [key: string]: string } = {};
    order?.items?.forEach(item => {
      initialPrices[item.id] = item.unit_price.toString();
    });
    setBulkPrices(initialPrices);
    setShowPriceModal(true);
  };

  const updateBulkPrice = (itemId: string, price: string) => {
    setBulkPrices(prev => ({
      ...prev,
      [itemId]: price,
    }));
  };

  const applyBulkPrices = async () => {
    if (!order) return;

    try {
      const supabase = getSupabase();

      for (const item of order.items || []) {
        const priceStr = bulkPrices[item.id];
        if (priceStr) {
          const price = parseFloat(priceStr);
          if (!isNaN(price) && price > 0) {
            await supabase
              .from('order_items')
              .update({ unit_price: price })
              .eq('id', item.id);
          }
        }
      }

      setShowPriceModal(false);
      await onUpdate();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✅ Precios Actualizados',
        'Los precios de los productos se actualizaron correctamente',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[useOrderProducts] Error applying prices:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        '❌ Error',
        'No se pudieron actualizar los precios. Por favor intenta nuevamente.',
        [{ text: 'OK' }]
      );
    }
  };

  return {
    editingProduct,
    setEditingProduct,
    productName,
    setProductName,
    productQuantity,
    setProductQuantity,
    productPrice,
    setProductPrice,
    productNotes,
    setProductNotes,
    showPriceModal,
    setShowPriceModal,
    bulkPrices,
    startEditingProduct,
    updateProduct,
    deleteProduct,
    addProductsFromWhatsApp,
    openPriceModal,
    updateBulkPrice,
    applyBulkPrices,
  };
}
