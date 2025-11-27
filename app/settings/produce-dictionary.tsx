
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';

interface ProduceItem {
  id: string;
  name: string;
  category: 'fruta' | 'verdura' | 'hortaliza' | 'otro';
  variations: string[];
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

const CATEGORY_LABELS = {
  fruta: '🍎 Frutas',
  verdura: '🥕 Verduras',
  hortaliza: '🌿 Hortalizas',
  otro: '📦 Otros',
};

const CATEGORY_COLORS = {
  fruta: '#EF4444',
  verdura: '#10B981',
  hortaliza: '#8B5CF6',
  otro: '#6B7280',
};

export default function ProduceDictionaryScreen() {
  const { currentTheme } = useTheme();
  const [produceItems, setProduceItems] = useState<ProduceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'fruta' | 'verdura' | 'hortaliza' | 'otro'>('verdura');
  const [newItemVariations, setNewItemVariations] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProduceItems();
  }, []);

  const loadProduceItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('produce_dictionary')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      setProduceItems(data || []);
    } catch (error) {
      console.error('Error loading produce items:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert('Error', 'El nombre del producto es requerido');
      return;
    }

    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const variations = newItemVariations
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length > 0);

      const { error } = await supabase
        .from('produce_dictionary')
        .insert({
          name: newItemName.trim().toLowerCase(),
          category: newItemCategory,
          variations: variations,
          is_custom: true,
        });

      if (error) throw error;

      Alert.alert('Éxito', 'Producto agregado correctamente');
      setNewItemName('');
      setNewItemVariations('');
      setShowAddForm(false);
      loadProduceItems();
    } catch (error) {
      console.error('Error adding produce item:', error);
      Alert.alert('Error', 'No se pudo agregar el producto');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (item: ProduceItem) => {
    if (!item.is_custom) {
      Alert.alert('Error', 'No se pueden eliminar productos predefinidos');
      return;
    }

    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de eliminar "${item.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              const { error } = await supabase
                .from('produce_dictionary')
                .delete()
                .eq('id', item.id);

              if (error) throw error;

              Alert.alert('Éxito', 'Producto eliminado correctamente');
              loadProduceItems();
            } catch (error) {
              console.error('Error deleting produce item:', error);
              Alert.alert('Error', 'No se pudo eliminar el producto');
            }
          },
        },
      ]
    );
  };

  const filteredItems = produceItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.variations.some(v => v.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ProduceItem[]>);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.colors.background,
    },
    header: {
      padding: 16,
      backgroundColor: currentTheme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.colors.border,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: currentTheme.colors.text,
      marginBottom: 8,
    },
    headerDescription: {
      fontSize: 14,
      color: currentTheme.colors.textSecondary,
      lineHeight: 20,
    },
    searchContainer: {
      padding: 16,
      backgroundColor: currentTheme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.colors.border,
    },
    searchInput: {
      backgroundColor: currentTheme.colors.background,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: currentTheme.colors.text,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
    },
    categoryFilters: {
      flexDirection: 'row',
      padding: 16,
      gap: 8,
      backgroundColor: currentTheme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.colors.border,
    },
    categoryFilter: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: currentTheme.colors.background,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
    },
    categoryFilterActive: {
      backgroundColor: currentTheme.colors.primary,
      borderColor: currentTheme.colors.primary,
    },
    categoryFilterText: {
      fontSize: 14,
      color: currentTheme.colors.text,
      fontWeight: '500',
    },
    categoryFilterTextActive: {
      color: '#FFFFFF',
    },
    content: {
      flex: 1,
    },
    section: {
      marginBottom: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: currentTheme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.colors.border,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: currentTheme.colors.text,
      marginLeft: 8,
    },
    sectionCount: {
      fontSize: 14,
      color: currentTheme.colors.textSecondary,
      marginLeft: 8,
    },
    itemCard: {
      backgroundColor: currentTheme.colors.card,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.colors.border,
    },
    itemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    itemName: {
      fontSize: 16,
      fontWeight: '600',
      color: currentTheme.colors.text,
      flex: 1,
    },
    customBadge: {
      backgroundColor: currentTheme.colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      marginLeft: 8,
    },
    customBadgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    deleteButton: {
      padding: 8,
      marginLeft: 8,
    },
    variationsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    variationChip: {
      backgroundColor: currentTheme.colors.background,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
    },
    variationText: {
      fontSize: 12,
      color: currentTheme.colors.textSecondary,
    },
    addButton: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: currentTheme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    addFormContainer: {
      padding: 16,
      backgroundColor: currentTheme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.colors.border,
    },
    addFormTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: currentTheme.colors.text,
      marginBottom: 16,
    },
    formGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: currentTheme.colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: currentTheme.colors.background,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: currentTheme.colors.text,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
    },
    categorySelector: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    categoryOption: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: currentTheme.colors.background,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
    },
    categoryOptionActive: {
      backgroundColor: currentTheme.colors.primary,
      borderColor: currentTheme.colors.primary,
    },
    categoryOptionText: {
      fontSize: 14,
      color: currentTheme.colors.text,
      fontWeight: '500',
    },
    categoryOptionTextActive: {
      color: '#FFFFFF',
    },
    formActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    formButton: {
      flex: 1,
      padding: 14,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: currentTheme.colors.background,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
    },
    saveButton: {
      backgroundColor: currentTheme.colors.primary,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: currentTheme.colors.text,
    },
    saveButtonText: {
      color: '#FFFFFF',
    },
    emptyState: {
      padding: 32,
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: 16,
      color: currentTheme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={currentTheme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Diccionario de Productos</Text>
        <Text style={styles.headerDescription}>
          Gestiona el diccionario de frutas, verduras y hortalizas para mejorar el reconocimiento de productos en los pedidos de WhatsApp.
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar producto..."
          placeholderTextColor={currentTheme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilters}>
        <TouchableOpacity
          style={[styles.categoryFilter, !selectedCategory && styles.categoryFilterActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedCategory(null);
          }}
        >
          <Text style={[styles.categoryFilterText, !selectedCategory && styles.categoryFilterTextActive]}>
            Todos
          </Text>
        </TouchableOpacity>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.categoryFilter, selectedCategory === key && styles.categoryFilterActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedCategory(key);
            }}
          >
            <Text style={[styles.categoryFilterText, selectedCategory === key && styles.categoryFilterTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {showAddForm && (
        <View style={styles.addFormContainer}>
          <Text style={styles.addFormTitle}>Agregar Nuevo Producto</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nombre del Producto</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: tomate cherry"
              placeholderTextColor={currentTheme.colors.textSecondary}
              value={newItemName}
              onChangeText={setNewItemName}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Categoría</Text>
            <View style={styles.categorySelector}>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.categoryOption,
                    newItemCategory === key && styles.categoryOptionActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setNewItemCategory(key as any);
                  }}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      newItemCategory === key && styles.categoryOptionTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Variaciones (separadas por comas)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: tomates cherry, cherry, tomate cereza"
              placeholderTextColor={currentTheme.colors.textSecondary}
              value={newItemVariations}
              onChangeText={setNewItemVariations}
              autoCapitalize="none"
              multiline
            />
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity
              style={[styles.formButton, styles.cancelButton]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowAddForm(false);
                setNewItemName('');
                setNewItemVariations('');
              }}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.formButton, styles.saveButton]}
              onPress={handleAddItem}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[styles.buttonText, styles.saveButtonText]}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView style={styles.content}>
        {Object.keys(groupedItems).length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="magnifyingglass"
              android_material_icon_name="search"
              size={48}
              color={currentTheme.colors.textSecondary}
            />
            <Text style={styles.emptyStateText}>
              No se encontraron productos
            </Text>
          </View>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => (
            <View key={category} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS],
                  }}
                />
                <Text style={styles.sectionTitle}>
                  {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                </Text>
                <Text style={styles.sectionCount}>({items.length})</Text>
              </View>
              {items.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.is_custom && (
                      <View style={styles.customBadge}>
                        <Text style={styles.customBadgeText}>CUSTOM</Text>
                      </View>
                    )}
                    {item.is_custom && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteItem(item)}
                      >
                        <IconSymbol
                          ios_icon_name="trash.fill"
                          android_material_icon_name="delete"
                          size={20}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                  {item.variations.length > 0 && (
                    <View style={styles.variationsContainer}>
                      {item.variations.map((variation, index) => (
                        <View key={index} style={styles.variationChip}>
                          <Text style={styles.variationText}>{variation}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {!showAddForm && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowAddForm(true);
          }}
        >
          <IconSymbol
            ios_icon_name="plus"
            android_material_icon_name="add"
            size={28}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      )}
    </View>
  );
}
