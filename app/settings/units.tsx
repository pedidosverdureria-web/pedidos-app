
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { CustomDialog, DialogButton } from '@/components/CustomDialog';
import * as Haptics from 'expo-haptics';
import { getSupabase } from '@/lib/supabase';

interface KnownUnit {
  id: string;
  unit_name: string;
  variations: string[];
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

interface DialogState {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  buttons?: DialogButton[];
}

export default function UnitsManagementScreen() {
  const { user } = useAuth();
  const { currentTheme } = useTheme();
  const [units, setUnits] = useState<KnownUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<KnownUnit | null>(null);
  const [newUnitName, setNewUnitName] = useState('');
  const [newVariations, setNewVariations] = useState('');
  const [dialog, setDialog] = useState<DialogState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const loadUnits = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      
      const { data, error } = await supabase
        .from('known_units')
        .select('*')
        .order('unit_name', { ascending: true });

      if (error) throw error;

      setUnits(data || []);
    } catch (error) {
      console.error('[UnitsManagement] Error loading units:', error);
      setDialog({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar las unidades de medida',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  const handleAddUnit = async () => {
    if (!newUnitName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setDialog({
        visible: true,
        type: 'warning',
        title: 'Atención',
        message: 'Por favor ingresa el nombre de la unidad',
      });
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const supabase = getSupabase();

      // Parse variations from comma-separated string
      const variationsArray = newVariations
        .split(',')
        .map(v => v.trim().toLowerCase())
        .filter(v => v.length > 0);

      // Always include the unit name itself as a variation
      const unitNameLower = newUnitName.trim().toLowerCase();
      if (!variationsArray.includes(unitNameLower)) {
        variationsArray.unshift(unitNameLower);
      }

      const { error } = await supabase
        .from('known_units')
        .insert({
          unit_name: unitNameLower,
          variations: variationsArray,
          is_custom: true,
        });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDialog({
        visible: true,
        type: 'success',
        title: 'Unidad Agregada',
        message: `La unidad "${newUnitName}" se agregó correctamente`,
      });

      setShowAddModal(false);
      setNewUnitName('');
      setNewVariations('');
      await loadUnits();
    } catch (error: any) {
      console.error('[UnitsManagement] Error adding unit:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setDialog({
        visible: true,
        type: 'error',
        title: 'Error',
        message: `No se pudo agregar la unidad: ${error.message}`,
      });
    }
  };

  const handleEditUnit = (unit: KnownUnit) => {
    setEditingUnit(unit);
    setNewUnitName(unit.unit_name);
    setNewVariations(unit.variations.join(', '));
    setShowEditModal(true);
  };

  const handleUpdateUnit = async () => {
    if (!editingUnit || !newUnitName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setDialog({
        visible: true,
        type: 'warning',
        title: 'Atención',
        message: 'Por favor ingresa el nombre de la unidad',
      });
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const supabase = getSupabase();

      // Parse variations from comma-separated string
      const variationsArray = newVariations
        .split(',')
        .map(v => v.trim().toLowerCase())
        .filter(v => v.length > 0);

      // Always include the unit name itself as a variation
      const unitNameLower = newUnitName.trim().toLowerCase();
      if (!variationsArray.includes(unitNameLower)) {
        variationsArray.unshift(unitNameLower);
      }

      const { error } = await supabase
        .from('known_units')
        .update({
          unit_name: unitNameLower,
          variations: variationsArray,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingUnit.id);

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDialog({
        visible: true,
        type: 'success',
        title: 'Unidad Actualizada',
        message: `La unidad "${newUnitName}" se actualizó correctamente`,
      });

      setShowEditModal(false);
      setEditingUnit(null);
      setNewUnitName('');
      setNewVariations('');
      await loadUnits();
    } catch (error: any) {
      console.error('[UnitsManagement] Error updating unit:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setDialog({
        visible: true,
        type: 'error',
        title: 'Error',
        message: `No se pudo actualizar la unidad: ${error.message}`,
      });
    }
  };

  const handleDeleteUnit = (unit: KnownUnit) => {
    if (!unit.is_custom) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setDialog({
        visible: true,
        type: 'warning',
        title: 'No Permitido',
        message: 'No se pueden eliminar las unidades predeterminadas del sistema',
      });
      return;
    }

    setDialog({
      visible: true,
      type: 'warning',
      title: 'Eliminar Unidad',
      message: `¿Estás seguro de que deseas eliminar la unidad "${unit.unit_name}"?\n\nEsta acción no se puede deshacer.`,
      buttons: [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setDialog({ ...dialog, visible: false });
          },
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          icon: 'trash.fill',
          onPress: async () => {
            setDialog({ ...dialog, visible: false });
            await performDeleteUnit(unit);
          },
        },
      ],
    });
  };

  const performDeleteUnit = async (unit: KnownUnit) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const supabase = getSupabase();

      const { error } = await supabase
        .from('known_units')
        .delete()
        .eq('id', unit.id);

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDialog({
        visible: true,
        type: 'success',
        title: 'Unidad Eliminada',
        message: `La unidad "${unit.unit_name}" se eliminó correctamente`,
      });

      await loadUnits();
    } catch (error: any) {
      console.error('[UnitsManagement] Error deleting unit:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setDialog({
        visible: true,
        type: 'error',
        title: 'Error',
        message: `No se pudo eliminar la unidad: ${error.message}`,
      });
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.colors.background,
    },
    content: {
      padding: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      marginBottom: 16,
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
    addButton: {
      backgroundColor: currentTheme.colors.primary,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      gap: 8,
    },
    addButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    unitCard: {
      backgroundColor: currentTheme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
    },
    unitHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    unitName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentTheme.colors.text,
      flex: 1,
    },
    unitBadge: {
      backgroundColor: currentTheme.colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginLeft: 8,
    },
    unitBadgeText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    systemBadge: {
      backgroundColor: '#6B7280',
    },
    variationsContainer: {
      marginBottom: 12,
    },
    variationsLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: currentTheme.colors.textSecondary,
      marginBottom: 6,
      textTransform: 'uppercase',
    },
    variationsChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    variationChip: {
      backgroundColor: currentTheme.colors.background,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
    },
    variationChipText: {
      fontSize: 13,
      color: currentTheme.colors.text,
    },
    unitActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 10,
      borderRadius: 8,
      gap: 6,
    },
    editButton: {
      backgroundColor: currentTheme.colors.primary,
    },
    deleteButton: {
      backgroundColor: '#EF4444',
    },
    disabledButton: {
      backgroundColor: '#9CA3AF',
      opacity: 0.5,
    },
    actionButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    emptyText: {
      fontSize: 16,
      color: currentTheme.colors.textSecondary,
      marginTop: 16,
      textAlign: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: currentTheme.colors.card,
      borderRadius: 12,
      padding: 24,
      width: '90%',
      maxWidth: 500,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: currentTheme.colors.text,
      marginBottom: 16,
    },
    modalDescription: {
      fontSize: 14,
      color: currentTheme.colors.textSecondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    input: {
      backgroundColor: currentTheme.colors.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      fontSize: 16,
      color: currentTheme.colors.text,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: currentTheme.colors.text,
      marginBottom: 6,
    },
    inputHint: {
      fontSize: 12,
      color: currentTheme.colors.textSecondary,
      marginTop: -8,
      marginBottom: 12,
      fontStyle: 'italic',
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    modalButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    modalButtonCancel: {
      backgroundColor: currentTheme.colors.border,
    },
    modalButtonConfirm: {
      backgroundColor: currentTheme.colors.primary,
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Unidades de Medida',
            headerBackTitle: 'Atrás',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={currentTheme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Unidades de Medida',
          headerBackTitle: 'Atrás',
        }}
      />
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Unidades de Medida</Text>
          <Text style={styles.headerDescription}>
            Gestiona las unidades de medida utilizadas en los pedidos. Puedes agregar nuevas unidades y definir sus variaciones (abreviaturas y sinónimos).
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setNewUnitName('');
            setNewVariations('');
            setShowAddModal(true);
          }}
        >
          <IconSymbol
            ios_icon_name="plus.circle.fill"
            android_material_icon_name="add_circle"
            size={22}
            color="#fff"
          />
          <Text style={styles.addButtonText}>Agregar Unidad</Text>
        </TouchableOpacity>

        {units.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="ruler.fill"
              android_material_icon_name="straighten"
              size={64}
              color={currentTheme.colors.textSecondary}
            />
            <Text style={styles.emptyText}>
              No hay unidades de medida registradas
            </Text>
          </View>
        ) : (
          units.map((unit) => (
            <View key={unit.id} style={styles.unitCard}>
              <View style={styles.unitHeader}>
                <Text style={styles.unitName}>{unit.unit_name}</Text>
                <View style={[styles.unitBadge, !unit.is_custom && styles.systemBadge]}>
                  <Text style={styles.unitBadgeText}>
                    {unit.is_custom ? 'Personalizada' : 'Sistema'}
                  </Text>
                </View>
              </View>

              <View style={styles.variationsContainer}>
                <Text style={styles.variationsLabel}>Variaciones:</Text>
                <View style={styles.variationsChips}>
                  {unit.variations.map((variation, index) => (
                    <View key={index} style={styles.variationChip}>
                      <Text style={styles.variationChipText}>{variation}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.unitActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => handleEditUnit(unit)}
                >
                  <IconSymbol
                    ios_icon_name="pencil"
                    android_material_icon_name="edit"
                    size={16}
                    color="#fff"
                  />
                  <Text style={styles.actionButtonText}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    unit.is_custom ? styles.deleteButton : styles.disabledButton,
                  ]}
                  onPress={() => handleDeleteUnit(unit)}
                  disabled={!unit.is_custom}
                >
                  <IconSymbol
                    ios_icon_name="trash"
                    android_material_icon_name="delete"
                    size={16}
                    color="#fff"
                  />
                  <Text style={styles.actionButtonText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Unit Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar Unidad de Medida</Text>
            <Text style={styles.modalDescription}>
              Define una nueva unidad de medida y sus variaciones (abreviaturas y sinónimos).
            </Text>

            <Text style={styles.inputLabel}>Nombre de la Unidad</Text>
            <TextInput
              style={styles.input}
              placeholder="Ejemplo: paquete"
              placeholderTextColor={currentTheme.colors.textSecondary}
              value={newUnitName}
              onChangeText={setNewUnitName}
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Variaciones (separadas por comas)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ejemplo: paquete, paquetes, paq, pqt"
              placeholderTextColor={currentTheme.colors.textSecondary}
              value={newVariations}
              onChangeText={setNewVariations}
              autoCapitalize="none"
              multiline
            />
            <Text style={styles.inputHint}>
              Ingresa todas las formas en que los clientes pueden escribir esta unidad
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: currentTheme.colors.text }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleAddUnit}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                  Agregar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Unit Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Unidad de Medida</Text>
            <Text style={styles.modalDescription}>
              Modifica el nombre de la unidad y sus variaciones.
            </Text>

            <Text style={styles.inputLabel}>Nombre de la Unidad</Text>
            <TextInput
              style={styles.input}
              placeholder="Ejemplo: paquete"
              placeholderTextColor={currentTheme.colors.textSecondary}
              value={newUnitName}
              onChangeText={setNewUnitName}
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Variaciones (separadas por comas)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ejemplo: paquete, paquetes, paq, pqt"
              placeholderTextColor={currentTheme.colors.textSecondary}
              value={newVariations}
              onChangeText={setNewVariations}
              autoCapitalize="none"
              multiline
            />
            <Text style={styles.inputHint}>
              Ingresa todas las formas en que los clientes pueden escribir esta unidad
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowEditModal(false);
                  setEditingUnit(null);
                }}
              >
                <Text style={[styles.modalButtonText, { color: currentTheme.colors.text }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleUpdateUnit}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                  Guardar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Dialog */}
      <CustomDialog
        visible={dialog.visible}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        buttons={dialog.buttons}
        onClose={() => setDialog({ ...dialog, visible: false })}
      />
    </View>
  );
}
