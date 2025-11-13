
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabase } from '@/lib/supabase';
import { CustomDialog, DialogButton } from '@/components/CustomDialog';
import * as Haptics from 'expo-haptics';

interface AuthorizedPhone {
  id: string;
  phone_number: string;
  customer_name: string | null;
  notes: string | null;
  created_at: string;
}

interface DialogState {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  buttons?: DialogButton[];
}

export default function UserManagementScreen() {
  const { user } = useAuth();
  const [authorizedPhones, setAuthorizedPhones] = useState<AuthorizedPhone[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showDialog = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    buttons?: DialogButton[]
  ) => {
    setDialog({ visible: true, type, title, message, buttons });
  };

  const closeDialog = () => {
    setDialog({ ...dialog, visible: false });
  };

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'desarrollador') {
      showDialog(
        'error',
        'Acceso Denegado',
        'Solo los administradores y desarrolladores pueden acceder a esta pantalla',
        [
          {
            text: 'Volver',
            style: 'primary',
            onPress: () => {
              closeDialog();
              router.back();
            },
          },
        ]
      );
    }
  }, [user?.role]);

  const loadAuthorizedPhones = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      
      const { data, error } = await supabase
        .from('authorized_phones')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading authorized phones:', error);
        showDialog('error', 'Error', 'No se pudieron cargar los números autorizados');
        return;
      }

      setAuthorizedPhones(data || []);
    } catch (error) {
      console.error('Exception loading authorized phones:', error);
      showDialog('error', 'Error', 'Ocurrió un error al cargar los números autorizados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuthorizedPhones();
  }, [loadAuthorizedPhones]);

  const handleAddPhone = async () => {
    if (!newPhoneNumber.trim()) {
      showDialog('error', 'Error', 'Por favor ingresa un número de teléfono');
      return;
    }

    // Validate phone format (should start with +)
    const phoneRegex = /^\+\d{10,15}$/;
    if (!phoneRegex.test(newPhoneNumber.trim())) {
      showDialog(
        'error',
        'Formato Inválido',
        'El número debe estar en formato internacional (ej: +56912345678)'
      );
      return;
    }

    try {
      setSaving(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const supabase = getSupabase();
      
      const { error } = await supabase
        .from('authorized_phones')
        .insert({
          phone_number: newPhoneNumber.trim(),
          customer_name: newCustomerName.trim() || null,
          notes: newNotes.trim() || null,
        });

      if (error) {
        if (error.code === '23505') {
          showDialog('error', 'Error', 'Este número ya está autorizado');
        } else {
          console.error('Error adding authorized phone:', error);
          showDialog('error', 'Error', 'No se pudo agregar el número autorizado');
        }
        return;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showDialog('success', 'Éxito', 'Número autorizado agregado correctamente');
      
      setNewPhoneNumber('');
      setNewCustomerName('');
      setNewNotes('');
      setAddModalVisible(false);
      
      loadAuthorizedPhones();
    } catch (error) {
      console.error('Exception adding authorized phone:', error);
      showDialog('error', 'Error', 'Ocurrió un error al agregar el número');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePhone = async (phone: AuthorizedPhone) => {
    showDialog(
      'warning',
      'Confirmar Eliminación',
      `¿Estás seguro de que deseas eliminar el número ${phone.phone_number}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: closeDialog,
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            closeDialog();
            try {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              
              const supabase = getSupabase();
              
              const { error } = await supabase
                .from('authorized_phones')
                .delete()
                .eq('id', phone.id);

              if (error) {
                console.error('Error deleting authorized phone:', error);
                showDialog('error', 'Error', 'No se pudo eliminar el número autorizado');
                return;
              }

              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              showDialog('success', 'Éxito', 'Número autorizado eliminado correctamente');
              
              loadAuthorizedPhones();
            } catch (error) {
              console.error('Exception deleting authorized phone:', error);
              showDialog('error', 'Error', 'Ocurrió un error al eliminar el número');
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Gestión de Usuarios',
          headerBackTitle: 'Atrás',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <IconSymbol name="info.circle.fill" size={48} color={colors.info} />
          <Text style={styles.infoTitle}>Sistema de Autenticación Simplificado</Text>
          <Text style={styles.infoText}>
            La aplicación ahora utiliza un sistema de autenticación basado en PIN para facilitar el acceso.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="person.badge.shield.checkmark.fill" size={32} color={colors.success} />
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Administrador</Text>
              <Text style={styles.cardSubtitle}>Acceso completo al sistema</Text>
            </View>
          </View>
          <View style={styles.pinContainer}>
            <Text style={styles.pinLabel}>PIN de Acceso:</Text>
            <View style={styles.pinBadge}>
              <Text style={styles.pinText}>5050</Text>
            </View>
          </View>
          <View style={styles.permissionsList}>
            <View style={styles.permissionItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
              <Text style={styles.permissionText}>Gestión completa de pedidos</Text>
            </View>
            <View style={styles.permissionItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
              <Text style={styles.permissionText}>Configuración de WhatsApp</Text>
            </View>
            <View style={styles.permissionItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
              <Text style={styles.permissionText}>Configuración de impresora</Text>
            </View>
            <View style={styles.permissionItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
              <Text style={styles.permissionText}>Acceso a estadísticas</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="person.fill" size={32} color={colors.info} />
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Trabajador</Text>
              <Text style={styles.cardSubtitle}>Gestión de pedidos</Text>
            </View>
          </View>
          <View style={styles.pinContainer}>
            <Text style={styles.pinLabel}>PIN de Acceso:</Text>
            <View style={styles.pinBadge}>
              <Text style={styles.pinText}>5030</Text>
            </View>
          </View>
          <View style={styles.permissionsList}>
            <View style={styles.permissionItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
              <Text style={styles.permissionText}>Ver y gestionar pedidos</Text>
            </View>
            <View style={styles.permissionItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
              <Text style={styles.permissionText}>Crear nuevos pedidos</Text>
            </View>
            <View style={styles.permissionItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
              <Text style={styles.permissionText}>Imprimir tickets</Text>
            </View>
            <View style={styles.permissionItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
              <Text style={styles.permissionText}>Actualizar estados</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <IconSymbol name="hammer.fill" size={32} color="#F59E0B" />
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Desarrollador</Text>
              <Text style={styles.cardSubtitle}>Acceso completo al sistema</Text>
            </View>
          </View>
          <View style={styles.pinContainer}>
            <Text style={styles.pinLabel}>PIN de Acceso:</Text>
            <View style={[styles.pinBadge, { backgroundColor: '#F59E0B' }]}>
              <Text style={styles.pinText}>9032</Text>
            </View>
          </View>
          <View style={styles.permissionsList}>
            <View style={styles.permissionItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
              <Text style={styles.permissionText}>Gestión completa de pedidos</Text>
            </View>
            <View style={styles.permissionItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
              <Text style={styles.permissionText}>Configuración de WhatsApp</Text>
            </View>
            <View style={styles.permissionItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
              <Text style={styles.permissionText}>Configuración de impresora</Text>
            </View>
            <View style={styles.permissionItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
              <Text style={styles.permissionText}>Acceso a estadísticas</Text>
            </View>
            <View style={styles.permissionItem}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
              <Text style={styles.permissionText}>Gestión de usuarios</Text>
            </View>
          </View>
        </View>

        <View style={styles.noteCard}>
          <IconSymbol name="lock.shield.fill" size={24} color={colors.textSecondary} />
          <Text style={styles.noteText}>
            Esta es una aplicación de uso privado. Los PINs proporcionan acceso rápido sin necesidad de gestión de usuarios en base de datos.
          </Text>
        </View>

        {/* Authorized Phone Numbers Section */}
        <View style={styles.sectionHeader}>
          <IconSymbol name="phone.badge.checkmark.fill" size={28} color={colors.primary} />
          <Text style={styles.sectionTitle}>Números Autorizados</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.authorizedPhonesHeader}>
            <Text style={styles.authorizedPhonesDescription}>
              Los números autorizados pueden enviar pedidos sin consulta previa. Siempre crearán nuevos pedidos, incluso si tienen pedidos activos.
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Cargando números autorizados...</Text>
            </View>
          ) : (
            <>
              {authorizedPhones.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <IconSymbol name="phone.slash.fill" size={48} color={colors.textSecondary} />
                  <Text style={styles.emptyText}>No hay números autorizados</Text>
                  <Text style={styles.emptySubtext}>
                    Agrega números para permitir pedidos sin consulta
                  </Text>
                </View>
              ) : (
                <View style={styles.phonesList}>
                  {authorizedPhones.map((phone) => (
                    <View key={phone.id} style={styles.phoneCard}>
                      <View style={styles.phoneCardContent}>
                        <View style={styles.phoneCardLeft}>
                          <IconSymbol name="phone.fill" size={24} color={colors.primary} />
                          <View style={styles.phoneCardInfo}>
                            <Text style={styles.phoneNumber}>{phone.phone_number}</Text>
                            {phone.customer_name && (
                              <Text style={styles.phoneCustomerName}>{phone.customer_name}</Text>
                            )}
                            {phone.notes && (
                              <Text style={styles.phoneNotes}>{phone.notes}</Text>
                            )}
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeletePhone(phone)}
                        >
                          <IconSymbol name="trash.fill" size={20} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setAddModalVisible(true);
                }}
              >
                <IconSymbol name="plus.circle.fill" size={24} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Agregar Número Autorizado</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Add Phone Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Agregar Número Autorizado</Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setAddModalVisible(false);
                }}
                style={styles.modalCloseButton}
              >
                <IconSymbol name="xmark.circle.fill" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Número de Teléfono *</Text>
                <TextInput
                  style={styles.input}
                  value={newPhoneNumber}
                  onChangeText={setNewPhoneNumber}
                  placeholder="+56912345678"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                />
                <Text style={styles.inputHint}>
                  Formato internacional (ej: +56912345678)
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre del Cliente (opcional)</Text>
                <TextInput
                  style={styles.input}
                  value={newCustomerName}
                  onChangeText={setNewCustomerName}
                  placeholder="Juan Pérez"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notas (opcional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newNotes}
                  onChangeText={setNewNotes}
                  placeholder="Información adicional sobre este número"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setAddModalVisible(false);
                }}
                disabled={saving}
              >
                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleAddPhone}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <IconSymbol name="checkmark.circle.fill" size={20} color="#FFFFFF" />
                    <Text style={styles.modalButtonTextSave}>Agregar</Text>
                  </>
                )}
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
        onClose={closeDialog}
      />
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
  infoCard: {
    backgroundColor: colors.card,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  pinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  pinLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  pinBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  pinText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  permissionsList: {
    gap: 12,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  permissionText: {
    fontSize: 15,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  noteCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
    marginBottom: 24,
  },
  noteText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 12,
  },
  authorizedPhonesHeader: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  authorizedPhonesDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  phonesList: {
    gap: 12,
    marginBottom: 16,
  },
  phoneCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  phoneCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phoneCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  phoneCardInfo: {
    marginLeft: 12,
    flex: 1,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  phoneCustomerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
  },
  phoneNotes: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  modalButtonCancel: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonSave: {
    backgroundColor: colors.primary,
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalButtonTextSave: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
