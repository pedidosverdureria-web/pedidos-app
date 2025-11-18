
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { CustomDialog, DialogButton } from '@/components/CustomDialog';
import { getSupabase } from '@/lib/supabase';
import { Check, CheckStatus } from '@/types';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DialogState {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  buttons?: DialogButton[];
}

export default function CheckDetailScreen() {
  const { checkId } = useLocalSearchParams<{ checkId: string }>();
  const [check, setCheck] = useState<Check | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  // Edit form state
  const [checkNumber, setCheckNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [checkDate, setCheckDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [payableTo, setPayableTo] = useState('');
  const [status, setStatus] = useState<CheckStatus>('pendiente');
  const [notes, setNotes] = useState('');

  const supabase = getSupabase();

  useEffect(() => {
    loadCheck();
  }, [checkId]);

  const loadCheck = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('checks')
        .select('*')
        .eq('id', checkId)
        .single();

      if (error) throw error;

      setCheck(data);
      setCheckNumber(data.check_number);
      setAmount(data.amount.toString());
      setCheckDate(new Date(data.check_date + 'T00:00:00'));
      setPayableTo(data.payable_to);
      setStatus(data.status);
      setNotes(data.notes || '');
    } catch (error) {
      console.error('[CheckDetail] Error loading check:', error);
      showDialog('error', 'Error', 'No se pudo cargar el cheque');
    } finally {
      setLoading(false);
    }
  };

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

  const handleSave = async () => {
    if (!checkNumber.trim()) {
      showDialog('warning', 'Campo Requerido', 'Por favor ingrese el número de cheque');
      return;
    }

    if (!amount.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      showDialog('warning', 'Monto Inválido', 'Por favor ingrese un monto válido');
      return;
    }

    if (!payableTo.trim()) {
      showDialog('warning', 'Campo Requerido', 'Por favor ingrese a la orden de quién es el cheque');
      return;
    }

    try {
      setSaving(true);

      const updateData = {
        check_number: checkNumber.trim(),
        amount: parseFloat(amount),
        check_date: checkDate.toISOString().split('T')[0],
        payable_to: payableTo.trim(),
        status,
        notes: notes.trim() || null,
      };

      const { error } = await supabase
        .from('checks')
        .update(updateData)
        .eq('id', checkId);

      if (error) throw error;

      showDialog('success', 'Éxito', 'Cheque actualizado correctamente');
      setEditing(false);
      await loadCheck();
    } catch (error) {
      console.error('[CheckDetail] Error updating check:', error);
      showDialog('error', 'Error', 'No se pudo actualizar el cheque');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    showDialog(
      'warning',
      'Eliminar Cheque',
      '¿Está seguro que desea eliminar este cheque? Esta acción no se puede deshacer.',
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
              const { error } = await supabase
                .from('checks')
                .delete()
                .eq('id', checkId);

              if (error) throw error;

              showDialog('success', 'Éxito', 'Cheque eliminado correctamente', [
                {
                  text: 'OK',
                  onPress: () => {
                    closeDialog();
                    router.back();
                  },
                },
              ]);
            } catch (error) {
              console.error('[CheckDetail] Error deleting check:', error);
              showDialog('error', 'Error', 'No se pudo eliminar el cheque');
            }
          },
        },
      ]
    );
  };

  const handleStatusChange = async (newStatus: CheckStatus) => {
    try {
      const { error } = await supabase
        .from('checks')
        .update({ status: newStatus })
        .eq('id', checkId);

      if (error) throw error;

      setStatus(newStatus);
      await loadCheck();
      showDialog('success', 'Éxito', 'Estado actualizado correctamente');
    } catch (error) {
      console.error('[CheckDetail] Error updating status:', error);
      showDialog('error', 'Error', 'No se pudo actualizar el estado');
    }
  };

  const getStatusColor = (checkStatus: CheckStatus) => {
    switch (checkStatus) {
      case 'pendiente':
        return colors.warning;
      case 'pagado':
        return colors.success;
      case 'movido':
        return colors.info;
      case 'pausado':
        return '#8B5CF6';
      case 'anulado':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusLabel = (checkStatus: CheckStatus) => {
    switch (checkStatus) {
      case 'pendiente':
        return 'Pendiente';
      case 'pagado':
        return 'Pagado';
      case 'movido':
        return 'Movido';
      case 'pausado':
        return 'Pausado';
      case 'anulado':
        return 'Anulado';
      default:
        return checkStatus;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Detalle de Cheque',
            headerStyle: {
              backgroundColor: colors.primary,
            },
            headerTintColor: '#FFFFFF',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando cheque...</Text>
        </View>
      </>
    );
  }

  if (!check) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Detalle de Cheque',
            headerStyle: {
              backgroundColor: colors.primary,
            },
            headerTintColor: '#FFFFFF',
          }}
        />
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={64} color={colors.error} />
          <Text style={styles.errorText}>No se pudo cargar el cheque</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `Cheque #${check.check_number}`,
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setEditing(!editing)}
              style={{ marginRight: 16 }}
            >
              <IconSymbol
                name={editing ? 'xmark' : 'pencil'}
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container}>
        {editing ? (
          <View style={styles.editContainer}>
            <View style={styles.formContainer}>
              <Text style={styles.formLabel}>Número de Cheque</Text>
              <TextInput
                style={styles.input}
                placeholder="Número de Cheque"
                placeholderTextColor={colors.textSecondary}
                value={checkNumber}
                onChangeText={setCheckNumber}
              />

              <Text style={styles.formLabel}>Monto</Text>
              <TextInput
                style={styles.input}
                placeholder="Monto"
                placeholderTextColor={colors.textSecondary}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />

              <Text style={styles.formLabel}>Fecha del Cheque</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <IconSymbol name="calendar" size={20} color={colors.primary} />
                <Text style={styles.dateButtonText}>
                  {checkDate.toLocaleDateString('es-CL')}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={checkDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setCheckDate(selectedDate);
                    }
                  }}
                />
              )}

              <Text style={styles.formLabel}>A la orden de</Text>
              <TextInput
                style={styles.input}
                placeholder="A la orden de"
                placeholderTextColor={colors.textSecondary}
                value={payableTo}
                onChangeText={setPayableTo}
              />

              <Text style={styles.formLabel}>Estado</Text>
              <View style={styles.statusSelector}>
                {(['pendiente', 'pagado', 'movido', 'pausado', 'anulado'] as CheckStatus[]).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.statusOption,
                      status === s && { backgroundColor: getStatusColor(s) + '40' },
                    ]}
                    onPress={() => setStatus(s)}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        status === s && { color: getStatusColor(s), fontWeight: '600' },
                      ]}
                    >
                      {getStatusLabel(s)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Notas</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Notas (opcional)"
                placeholderTextColor={colors.textSecondary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <IconSymbol name="checkmark" size={20} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
              >
                <IconSymbol name="trash" size={20} color="#FFFFFF" />
                <Text style={styles.deleteButtonText}>Eliminar Cheque</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.detailContainer}>
            {/* Status Card */}
            <View style={styles.statusCard}>
              <View
                style={[
                  styles.statusBadgeLarge,
                  { backgroundColor: getStatusColor(check.status) + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.statusTextLarge,
                    { color: getStatusColor(check.status) },
                  ]}
                >
                  {getStatusLabel(check.status)}
                </Text>
              </View>
            </View>

            {/* Amount Card */}
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>Monto del Cheque</Text>
              <Text style={styles.amountValue}>{formatCurrency(check.amount)}</Text>
            </View>

            {/* Details Card */}
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <IconSymbol name="number" size={20} color={colors.primary} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Número de Cheque</Text>
                  <Text style={styles.detailValue}>{check.check_number}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <IconSymbol name="calendar" size={20} color={colors.primary} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Fecha del Cheque</Text>
                  <Text style={styles.detailValue}>{formatDate(check.check_date)}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <IconSymbol name="person.fill" size={20} color={colors.primary} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>A la orden de</Text>
                  <Text style={styles.detailValue}>{check.payable_to}</Text>
                </View>
              </View>

              {check.notes && (
                <View style={styles.detailRow}>
                  <IconSymbol name="note.text" size={20} color={colors.primary} />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Notas</Text>
                    <Text style={styles.detailValue}>{check.notes}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Change Status Section */}
            <View style={styles.changeStatusSection}>
              <Text style={styles.changeStatusTitle}>Cambiar Estado</Text>
              <View style={styles.statusButtons}>
                {(['pendiente', 'pagado', 'movido', 'pausado', 'anulado'] as CheckStatus[]).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.statusButton,
                      { backgroundColor: getStatusColor(s) + '20' },
                      check.status === s && styles.statusButtonActive,
                    ]}
                    onPress={() => handleStatusChange(s)}
                    disabled={check.status === s}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        { color: getStatusColor(s) },
                      ]}
                    >
                      {getStatusLabel(s)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Metadata */}
            <View style={styles.metadataCard}>
              <Text style={styles.metadataLabel}>Creado el</Text>
              <Text style={styles.metadataValue}>
                {new Date(check.created_at).toLocaleString('es-CL')}
              </Text>
              {check.updated_at !== check.created_at && (
                <>
                  <Text style={[styles.metadataLabel, { marginTop: 8 }]}>
                    Última actualización
                  </Text>
                  <Text style={styles.metadataValue}>
                    {new Date(check.updated_at).toLocaleString('es-CL')}
                  </Text>
                </>
              )}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: colors.text,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detailContainer: {
    padding: 16,
  },
  editContainer: {
    padding: 16,
  },
  statusCard: {
    backgroundColor: colors.card,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusBadgeLarge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  statusTextLarge: {
    fontSize: 20,
    fontWeight: '700',
  },
  amountCard: {
    backgroundColor: colors.card,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  amountLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
  },
  detailsCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 20,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  changeStatusSection: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  changeStatusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  statusButtons: {
    gap: 10,
  },
  statusButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusButtonActive: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  statusButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  metadataCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metadataLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  metadataValue: {
    fontSize: 14,
    color: colors.text,
  },
  formContainer: {
    gap: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: -8,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  statusSelector: {
    gap: 10,
  },
  statusOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusOptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 10,
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.error,
    padding: 16,
    borderRadius: 10,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
