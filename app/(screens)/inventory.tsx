
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { getSupabase } from '@/lib/supabase';

interface Product {
  id: string;
  name: string;
  category?: string;
  stock_quantity: number;
  min_stock_level: number;
  unit_price: number;
  unit_of_measure?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function InventoryScreen() {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    stock_quantity: '0',
    min_stock_level: '5',
    unit_price: '0',
    unit_of_measure: '',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: '',
      stock_quantity: '0',
      min_stock_level: '5',
      unit_price: '0',
      unit_of_measure: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category || '',
      stock_quantity: product.stock_quantity.toString(),
      min_stock_level: product.min_stock_level.toString(),
      unit_price: product.unit_price.toString(),
      unit_of_measure: product.unit_of_measure || '',
    });
    setModalVisible(true);
  };

  const saveProduct = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre del producto es requerido');
      return;
    }

    try {
      const supabase = getSupabase();
      const productData = {
        name: formData.name.trim(),
        category: formData.category.trim() || null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        min_stock_level: parseInt(formData.min_stock_level) || 0,
        unit_price: parseFloat(formData.unit_price) || 0,
        unit_of_measure: formData.unit_of_measure.trim() || null,
        is_active: true,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        Alert.alert('Éxito', 'Producto actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;
        Alert.alert('Éxito', 'Producto creado correctamente');
      }

      setModalVisible(false);
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', 'No se pudo guardar el producto');
    }
  };

  const deleteProduct = async (product: Product) => {
    Alert.alert(
      'Confirmar',
      `¿Estás seguro de eliminar "${product.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const supabase = getSupabase();
              const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', product.id);

              if (error) throw error;
              Alert.alert('Éxito', 'Producto eliminado');
              loadProducts();
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'No se pudo eliminar el producto');
            }
          },
        },
      ]
    );
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLowStock = !filterLowStock || product.stock_quantity <= product.min_stock_level;
    return matchesSearch && matchesLowStock;
  });

  const lowStockCount = products.filter(p => p.stock_quantity <= p.min_stock_level).length;

  const renderProduct = ({ item }: { item: Product }) => {
    const isLowStock = item.stock_quantity <= item.min_stock_level;
    const stockPercentage = item.min_stock_level > 0 
      ? (item.stock_quantity / item.min_stock_level) * 100 
      : 100;

    return (
      <TouchableOpacity
        style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => openEditModal(item)}
      >
        <View style={styles.productHeader}>
          <View style={styles.productInfo}>
            <Text style={[styles.productName, { color: colors.text }]}>{item.name}</Text>
            {item.category && (
              <Text style={[styles.productCategory, { color: colors.textSecondary }]}>
                {item.category}
              </Text>
            )}
          </View>
          {isLowStock && (
            <View style={[styles.alertBadge, { backgroundColor: colors.error }]}>
              <IconSymbol ios_icon_name="exclamationmark.triangle.fill" android_material_icon_name="warning" size={16} color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.stockContainer}>
          <View style={styles.stockInfo}>
            <Text style={[styles.stockLabel, { color: colors.textSecondary }]}>Stock Actual</Text>
            <Text style={[styles.stockValue, { color: isLowStock ? colors.error : colors.success }]}>
              {item.stock_quantity} {item.unit_of_measure || 'unidades'}
            </Text>
          </View>
          <View style={styles.stockInfo}>
            <Text style={[styles.stockLabel, { color: colors.textSecondary }]}>Stock Mínimo</Text>
            <Text style={[styles.stockValue, { color: colors.text }]}>
              {item.min_stock_level} {item.unit_of_measure || 'unidades'}
            </Text>
          </View>
        </View>

        <View style={[styles.progressBar, { backgroundColor: colors.background }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(stockPercentage, 100)}%`,
                backgroundColor: isLowStock ? colors.error : colors.success,
              },
            ]}
          />
        </View>

        <View style={styles.productFooter}>
          <Text style={[styles.priceText, { color: colors.primary }]}>
            ${item.unit_price.toFixed(0)}
          </Text>
          <TouchableOpacity
            onPress={() => deleteProduct(item)}
            style={styles.deleteButton}
          >
            <IconSymbol ios_icon_name="trash.fill" android_material_icon_name="delete" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    header: {
      padding: 16,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 12,
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      fontSize: 16,
      color: colors.text,
    },
    filterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
    },
    filterButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    alertCount: {
      backgroundColor: colors.error,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    alertCountText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '700',
    },
    listContent: {
      padding: 16,
      paddingBottom: 100,
    },
    productCard: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
    },
    productHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    productInfo: {
      flex: 1,
    },
    productName: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 4,
    },
    productCategory: {
      fontSize: 14,
    },
    alertBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stockContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    stockInfo: {
      flex: 1,
    },
    stockLabel: {
      fontSize: 12,
      marginBottom: 4,
    },
    stockValue: {
      fontSize: 16,
      fontWeight: '700',
    },
    progressBar: {
      height: 8,
      borderRadius: 4,
      marginBottom: 12,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    productFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    priceText: {
      fontSize: 20,
      fontWeight: '700',
    },
    deleteButton: {
      padding: 8,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 16,
    },
    fab: {
      position: 'absolute',
      right: 16,
      bottom: 100,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      padding: 16,
    },
    modalContent: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 24,
    },
    formGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    formRow: {
      flexDirection: 'row',
      gap: 12,
    },
    formColumn: {
      flex: 1,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <IconSymbol ios_icon_name="magnifyingglass" android_material_icon_name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar productos..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor: filterLowStock ? colors.error : 'transparent',
                borderColor: filterLowStock ? colors.error : colors.border,
              },
            ]}
            onPress={() => setFilterLowStock(!filterLowStock)}
          >
            <IconSymbol 
              ios_icon_name="exclamationmark.triangle.fill" 
              android_material_icon_name="warning" 
              size={16} 
              color={filterLowStock ? '#fff' : colors.textSecondary} 
            />
            <Text style={[styles.filterButtonText, { color: filterLowStock ? '#fff' : colors.textSecondary }]}>
              Stock Bajo
            </Text>
          </TouchableOpacity>
          {lowStockCount > 0 && (
            <View style={styles.alertCount}>
              <Text style={styles.alertCountText}>{lowStockCount} alertas</Text>
            </View>
          )}
        </View>
      </View>

      {filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol ios_icon_name="cube.box.fill" android_material_icon_name="inventory_2" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No se encontraron productos' : 'No hay productos en el inventario'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <IconSymbol ios_icon_name="plus" android_material_icon_name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Ej: Pan Amasado"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Categoría</Text>
              <TextInput
                style={styles.input}
                value={formData.category}
                onChangeText={(text) => setFormData({ ...formData, category: text })}
                placeholder="Ej: Panadería"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formColumn}>
                <Text style={styles.label}>Stock Actual</Text>
                <TextInput
                  style={styles.input}
                  value={formData.stock_quantity}
                  onChangeText={(text) => setFormData({ ...formData, stock_quantity: text })}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={styles.formColumn}>
                <Text style={styles.label}>Stock Mínimo</Text>
                <TextInput
                  style={styles.input}
                  value={formData.min_stock_level}
                  onChangeText={(text) => setFormData({ ...formData, min_stock_level: text })}
                  keyboardType="numeric"
                  placeholder="5"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formColumn}>
                <Text style={styles.label}>Precio Unitario</Text>
                <TextInput
                  style={styles.input}
                  value={formData.unit_price}
                  onChangeText={(text) => setFormData({ ...formData, unit_price: text })}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={styles.formColumn}>
                <Text style={styles.label}>Unidad de Medida</Text>
                <TextInput
                  style={styles.input}
                  value={formData.unit_of_measure}
                  onChangeText={(text) => setFormData({ ...formData, unit_of_measure: text })}
                  placeholder="Ej: kg, unidades"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={saveProduct}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
