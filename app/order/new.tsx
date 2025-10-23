
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  notes: string;
}

export default function NewOrderScreen() {
  const { user, session } = useAuth();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [items, setItems] = useState<OrderItem[]>([
    { product_name: '', quantity: 1, unit_price: 0, notes: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    customerName?: string;
    items?: { [key: number]: { product_name?: string; unit_price?: string } };
  }>({});

  const addItem = () => {
    setItems([...items, { product_name: '', quantity: 1, unit_price: 0, notes: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      Alert.alert('Error', 'Debe haber al menos un producto en el pedido');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
    // Clear errors for this item
    if (errors.items) {
      const newItemErrors = { ...errors.items };
      delete newItemErrors[index];
      setErrors({ ...errors, items: newItemErrors });
    }
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    
    if (field === 'quantity') {
      const numValue = parseInt(value) || 0;
      newItems[index] = { ...newItems[index], [field]: numValue > 0 ? numValue : 1 };
    } else if (field === 'unit_price') {
      const numValue = parseFloat(value) || 0;
      newItems[index] = { ...newItems[index], [field]: numValue >= 0 ? numValue : 0 };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    
    setItems(newItems);
    
    // Clear error for this field
    if (errors.items?.[index]?.[field as 'product_name' | 'unit_price']) {
      const newItemErrors = { ...errors.items };
      if (newItemErrors[index]) {
        delete newItemErrors[index][field as 'product_name' | 'unit_price'];
        if (Object.keys(newItemErrors[index]).length === 0) {
          delete newItemErrors[index];
        }
      }
      setErrors({ ...errors, items: newItemErrors });
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Validate customer name
    if (!customerName.trim()) {
      newErrors.customerName = 'El nombre del cliente es obligatorio';
    }

    // Validate items
    const itemErrors: { [key: number]: { product_name?: string; unit_price?: string } } = {};
    let hasValidItem = false;

    items.forEach((item, index) => {
      const itemError: { product_name?: string; unit_price?: string } = {};
      
      if (!item.product_name.trim()) {
        itemError.product_name = 'El nombre del producto es obligatorio';
      }
      
      if (item.unit_price <= 0) {
        itemError.unit_price = 'El precio debe ser mayor a 0';
      }

      if (Object.keys(itemError).length > 0) {
        itemErrors[index] = itemError;
      } else {
        hasValidItem = true;
      }
    });

    if (!hasValidItem) {
      Alert.alert('Error', 'Debe agregar al menos un producto válido con nombre y precio');
      newErrors.items = itemErrors;
      setErrors(newErrors);
      return false;
    }

    if (Object.keys(itemErrors).length > 0) {
      newErrors.items = itemErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    console.log('=== Starting order creation ===');
    console.log('User authenticated:', !!user);
    console.log('User ID:', user?.id);
    console.log('Session exists:', !!session);
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabase();
      if (!supabase) {
        throw new Error('Supabase no inicializado. Por favor configura la conexión primero.');
      }

      // Filter valid items
      const validItems = items.filter(
        (item) => item.product_name.trim() && item.unit_price > 0
      );

      console.log('Creating order with', validItems.length, 'valid items');

      // Prepare order data
      const orderData: any = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || null,
        customer_address: customerAddress.trim() || null,
        status: 'pending',
        source: 'manual',
        is_read: true,
      };

      // Only add created_by if user is authenticated and has a valid ID
      // This prevents the foreign key constraint error
      if (user?.id && session) {
        console.log('Adding created_by field with user ID:', user.id);
        orderData.created_by = user.id;
      } else {
        console.log('User not authenticated or no valid ID, creating order without created_by');
        // Explicitly set to null to be clear about the intent
        orderData.created_by = null;
      }

      console.log('Order data prepared:', {
        ...orderData,
        created_by: orderData.created_by ? 'SET' : 'NULL'
      });

      // Create order (order_number will be auto-generated by trigger)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', {
          code: orderError.code,
          message: orderError.message,
          details: orderError.details,
          hint: orderError.hint
        });
        
        // Provide more specific error messages
        if (orderError.code === '23503') {
          throw new Error('Error de autenticación. Por favor cierra sesión y vuelve a iniciar sesión.');
        }
        
        throw orderError;
      }

      console.log('Order created successfully:', order.id, 'Order number:', order.order_number);

      // Create order items
      const orderItems = validItems.map((item) => ({
        order_id: order.id,
        product_name: item.product_name.trim(),
        quantity: item.quantity,
        unit_price: item.unit_price,
        notes: item.notes.trim() || null,
      }));

      console.log('Creating', orderItems.length, 'order items');

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Order items creation error:', itemsError);
        throw itemsError;
      }

      console.log('Order items created successfully');

      // Calculate and update total amount
      const totalAmount = calculateTotal();
      console.log('Updating order total amount:', totalAmount);
      
      const { error: updateError } = await supabase
        .from('orders')
        .update({ total_amount: totalAmount })
        .eq('id', order.id);

      if (updateError) {
        console.error('Order total update error:', updateError);
        // Don't throw here, order is already created
      }

      console.log('=== Order creation completed successfully ===');

      Alert.alert(
        'Éxito',
        `Pedido #${order.order_number} creado exitosamente`,
        [
          {
            text: 'Ver Pedido',
            onPress: () => {
              router.replace(`/order/${order.id}`);
            },
          },
          {
            text: 'Crear Otro',
            onPress: () => {
              // Reset form
              setCustomerName('');
              setCustomerPhone('');
              setCustomerAddress('');
              setItems([{ product_name: '', quantity: 1, unit_price: 0, notes: '' }]);
              setErrors({});
            },
          },
          {
            text: 'Volver',
            onPress: () => router.back(),
            style: 'cancel',
          },
        ]
      );
    } catch (error: any) {
      console.error('=== Error creating order ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error details:', error);
      
      Alert.alert(
        'Error',
        error.message || 'No se pudo crear el pedido. Por favor intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen
        options={{
          title: 'Nuevo Pedido',
          headerBackTitle: 'Atrás',
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Customer Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <IconSymbol name="person.fill" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Información del Cliente</Text>
          </View>

          <Text style={styles.label}>
            Nombre <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.customerName && styles.inputError]}
            placeholder="Nombre del cliente"
            placeholderTextColor={colors.textSecondary}
            value={customerName}
            onChangeText={(text) => {
              setCustomerName(text);
              if (errors.customerName) {
                setErrors({ ...errors, customerName: undefined });
              }
            }}
          />
          {errors.customerName && (
            <Text style={styles.errorText}>{errors.customerName}</Text>
          )}

          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            placeholder="Número de teléfono (opcional)"
            placeholderTextColor={colors.textSecondary}
            value={customerPhone}
            onChangeText={setCustomerPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Dirección</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Dirección de entrega (opcional)"
            placeholderTextColor={colors.textSecondary}
            value={customerAddress}
            onChangeText={setCustomerAddress}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Products Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderRow}>
              <IconSymbol name="cart.fill" size={24} color={colors.primary} />
              <Text style={styles.cardTitle}>Productos</Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={addItem}>
              <IconSymbol name="plus.circle.fill" size={32} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {items.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemNumber}>Producto {index + 1}</Text>
                {items.length > 1 && (
                  <TouchableOpacity onPress={() => removeItem(index)}>
                    <IconSymbol name="trash.fill" size={22} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.label}>
                Nombre <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  errors.items?.[index]?.product_name && styles.inputError,
                ]}
                placeholder="Ej: Pizza Margarita"
                placeholderTextColor={colors.textSecondary}
                value={item.product_name}
                onChangeText={(value) => updateItem(index, 'product_name', value)}
              />
              {errors.items?.[index]?.product_name && (
                <Text style={styles.errorText}>
                  {errors.items[index].product_name}
                </Text>
              )}

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Cantidad</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1"
                    placeholderTextColor={colors.textSecondary}
                    value={item.quantity.toString()}
                    onChangeText={(value) => updateItem(index, 'quantity', value)}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={styles.halfInput}>
                  <Text style={styles.label}>
                    Precio <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      errors.items?.[index]?.unit_price && styles.inputError,
                    ]}
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary}
                    value={item.unit_price > 0 ? item.unit_price.toString() : ''}
                    onChangeText={(value) => updateItem(index, 'unit_price', value)}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              {errors.items?.[index]?.unit_price && (
                <Text style={styles.errorText}>{errors.items[index].unit_price}</Text>
              )}

              <Text style={styles.label}>Notas</Text>
              <TextInput
                style={styles.input}
                placeholder="Instrucciones especiales (opcional)"
                placeholderTextColor={colors.textSecondary}
                value={item.notes}
                onChangeText={(value) => updateItem(index, 'notes', value)}
              />

              {item.quantity > 0 && item.unit_price > 0 && (
                <View style={styles.itemTotal}>
                  <Text style={styles.itemTotalLabel}>Subtotal:</Text>
                  <Text style={styles.itemTotalValue}>
                    ${(item.quantity * item.unit_price).toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Total Card */}
        <View style={styles.totalCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total del Pedido</Text>
            <Text style={styles.totalValue}>${calculateTotal().toFixed(2)}</Text>
          </View>
          <Text style={styles.totalSubtext}>
            {items.filter((i) => i.product_name && i.unit_price > 0).length} producto(s)
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <IconSymbol name="checkmark.circle.fill" size={24} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Crear Pedido</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  required: {
    color: colors.error,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addButton: {
    padding: 4,
  },
  itemCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  itemTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  itemTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  totalCard: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  totalValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  totalSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  submitButton: {
    backgroundColor: colors.success,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
