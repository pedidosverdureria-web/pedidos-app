
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Profile, UserRole } from '@/types';

export default function UserManagementScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRole, setEditRole] = useState<UserRole>('worker');
  const [editActive, setEditActive] = useState(true);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== 'admin') {
      Alert.alert('Acceso Denegado', 'Solo los administradores pueden acceder a esta pantalla');
      router.back();
      return;
    }
    loadUsers();
  }, [user?.role, loadUsers]);

  const handleEditUser = (userToEdit: Profile) => {
    setSelectedUser(userToEdit);
    setEditRole(userToEdit.role);
    setEditActive(userToEdit.is_active);
    setShowEditModal(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('profiles')
        .update({
          role: editRole,
          is_active: editActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      Alert.alert('Éxito', 'Usuario actualizado correctamente');
      setShowEditModal(false);
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'No se pudo actualizar el usuario');
    }
  };

  const handleDeleteUser = (userToDelete: Profile) => {
    if (userToDelete.id === user?.id) {
      Alert.alert('Error', 'No puedes eliminar tu propio usuario');
      return;
    }

    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de que quieres eliminar a ${userToDelete.full_name || userToDelete.email}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const supabase = getSupabase();
              const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userToDelete.id);

              if (error) throw error;

              Alert.alert('Éxito', 'Usuario eliminado correctamente');
              loadUsers();
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'No se pudo eliminar el usuario');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'User Management',
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <IconSymbol name="info.circle.fill" size={24} color={colors.info} />
          <Text style={styles.infoText}>
            Gestiona los usuarios de la aplicación, sus roles y permisos.
          </Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{users.length}</Text>
            <Text style={styles.statLabel}>Total Usuarios</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {users.filter((u) => u.role === 'admin').length}
            </Text>
            <Text style={styles.statLabel}>Admins</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {users.filter((u) => u.is_active).length}
            </Text>
            <Text style={styles.statLabel}>Activos</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usuarios</Text>
          <View style={styles.card}>
            {users.map((userItem, index) => (
              <View
                key={userItem.id}
                style={[
                  styles.userItem,
                  index < users.length - 1 && styles.userItemBorder,
                ]}
              >
                <View style={styles.userLeft}>
                  <View
                    style={[
                      styles.userAvatar,
                      { backgroundColor: userItem.role === 'admin' ? colors.primary : colors.accent },
                    ]}
                  >
                    <IconSymbol name="person.fill" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {userItem.full_name || userItem.email}
                    </Text>
                    <Text style={styles.userEmail}>{userItem.email}</Text>
                    <View style={styles.userBadges}>
                      <View
                        style={[
                          styles.roleBadge,
                          {
                            backgroundColor:
                              userItem.role === 'admin' ? colors.primary : colors.accent,
                          },
                        ]}
                      >
                        <Text style={styles.roleBadgeText}>
                          {userItem.role.toUpperCase()}
                        </Text>
                      </View>
                      {!userItem.is_active && (
                        <View style={[styles.statusBadge, { backgroundColor: colors.error }]}>
                          <Text style={styles.statusBadgeText}>INACTIVO</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                <View style={styles.userActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditUser(userItem)}
                  >
                    <IconSymbol name="pencil" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  {userItem.id !== user?.id && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteUser(userItem)}
                    >
                      <IconSymbol name="trash" size={20} color={colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Usuario</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Usuario</Text>
                  <Text style={styles.modalValue}>
                    {selectedUser.full_name || selectedUser.email}
                  </Text>
                  <Text style={styles.modalSubvalue}>{selectedUser.email}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Rol</Text>
                  <View style={styles.roleButtons}>
                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        editRole === 'admin' && styles.roleButtonActive,
                      ]}
                      onPress={() => setEditRole('admin')}
                    >
                      <IconSymbol
                        name="star.fill"
                        size={20}
                        color={editRole === 'admin' ? '#FFFFFF' : colors.primary}
                      />
                      <Text
                        style={[
                          styles.roleButtonText,
                          editRole === 'admin' && styles.roleButtonTextActive,
                        ]}
                      >
                        Admin
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        editRole === 'worker' && styles.roleButtonActive,
                      ]}
                      onPress={() => setEditRole('worker')}
                    >
                      <IconSymbol
                        name="person.fill"
                        size={20}
                        color={editRole === 'worker' ? '#FFFFFF' : colors.accent}
                      />
                      <Text
                        style={[
                          styles.roleButtonText,
                          editRole === 'worker' && styles.roleButtonTextActive,
                        ]}
                      >
                        Worker
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <View style={styles.switchRow}>
                    <View style={styles.switchLeft}>
                      <IconSymbol
                        name={editActive ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                        size={24}
                        color={editActive ? colors.success : colors.error}
                      />
                      <Text style={styles.switchLabel}>Usuario Activo</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.toggleButton,
                        editActive && styles.toggleButtonActive,
                      ]}
                      onPress={() => setEditActive(!editActive)}
                    >
                      <View
                        style={[
                          styles.toggleThumb,
                          editActive && styles.toggleThumbActive,
                        ]}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSaveUser}>
                  <IconSymbol name="checkmark.circle.fill" size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  userItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  userBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  modalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalSubvalue: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  roleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 12,
  },
  toggleButton: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: colors.success,
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    borderRadius: 12,
    padding: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
