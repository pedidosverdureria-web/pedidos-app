
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
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

export default function CheckControlScreen() {
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAmountToWordsDialog, setShowAmountToWordsDialog] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<Check | null>(null);
  const [dialog, setDialog] = useState<DialogState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  // Form state
  const [checkNumber, setCheckNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [checkDate, setCheckDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [payableTo, setPayableTo] = useState('');
  const [status, setStatus] = useState<CheckStatus>('pendiente');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Amount to words state
  const [amountInput, setAmountInput] = useState('');
  const [amountInWords, setAmountInWords] = useState('');

  const supabase = getSupabase();

  useEffect(() => {
    loadChecks();
  }, []);

  const loadChecks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('checks')
        .select('*')
        .order('check_date', { ascending: false });

      if (error) throw error;

      setChecks(data || []);
    } catch (error) {
      console.error('[CheckControl] Error loading checks:', error);
      showDialog('error', 'Error', 'No se pudieron cargar los cheques');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadChecks();
    setRefreshing(false);
  }, []);

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

  const resetForm = () => {
    setCheckNumber('');
    setAmount('');
    setCheckDate(new Date());
    setPayableTo('');
    setStatus('pendiente');
    setNotes('');
  };

  const handleAddCheck = async () => {
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

      const checkData = {
        check_number: checkNumber.trim(),
        amount: parseFloat(amount),
        check_date: checkDate.toISOString().split('T')[0],
        payable_to: payableTo.trim(),
        status,
        notes: notes.trim() || null,
      };

      const { error } = await supabase
        .from('checks')
        .insert([checkData]);

      if (error) throw error;

      showDialog('success', 'Éxito', 'Cheque agregado correctamente');
      setShowAddDialog(false);
      resetForm();
      await loadChecks();
    } catch (error) {
      console.error('[CheckControl] Error adding check:', error);
      showDialog('error', 'Error', 'No se pudo agregar el cheque');
    } finally {
      setSaving(false);
    }
  };

  const handleCheckPress = (check: Check) => {
    setSelectedCheck(check);
    router.push(`/settings/check-detail/${check.id}`);
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

  const convertAmountToWords = (value: number): string => {
    const units = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    const twenties = ['veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
    const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

    if (value === 0) return 'cero pesos';

    const convertLessThanThousand = (n: number): string => {
      if (n === 0) return '';
      if (n === 100) return 'cien';
      
      let result = '';
      
      const h = Math.floor(n / 100);
      const remainder = n % 100;
      const t = Math.floor(remainder / 10);
      const u = remainder % 10;
      
      // Handle hundreds
      if (h > 0) {
        result += hundreds[h];
        if (remainder > 0) result += ' ';
      }
      
      // Handle tens and units
      if (remainder >= 10 && remainder <= 19) {
        // 10-19
        result += teens[u];
      } else if (remainder >= 20 && remainder <= 29) {
        // 20-29 (special case)
        result += twenties[remainder - 20];
      } else {
        // 30-99 or 1-9
        if (t > 0) {
          result += tens[t];
          if (u > 0) {
            result += ' y ' + units[u];
          }
        } else if (u > 0) {
          result += units[u];
        }
      }
      
      return result;
    };

    let integerPart = Math.floor(value);
    const decimalPart = Math.round((value - integerPart) * 100);

    let result = '';

    // Handle millions
    if (integerPart >= 1000000) {
      const millions = Math.floor(integerPart / 1000000);
      if (millions === 1) {
        result += 'un millón';
      } else {
        result += convertLessThanThousand(millions) + ' millones';
      }
      integerPart %= 1000000;
      if (integerPart > 0) result += ' ';
    }

    // Handle thousands
    if (integerPart >= 1000) {
      const thousands = Math.floor(integerPart / 1000);
      if (thousands === 1) {
        result += 'mil';
      } else {
        result += convertLessThanThousand(thousands) + ' mil';
      }
      integerPart %= 1000;
      if (integerPart > 0) result += ' ';
    }

    // Handle remaining hundreds, tens, and units
    if (integerPart > 0) {
      result += convertLessThanThousand(integerPart);
    }

    // Add "pesos" at the end
    result += ' pesos';

    // Handle decimal part (centavos)
    if (decimalPart > 0) {
      result += ' con ' + decimalPart + ' centavos';
    }

    return result.trim();
  };

  const handleConvertAmount = () => {
    const value = parseFloat(amountInput.replace(/\./g, '').replace(/,/g, '.'));
    if (isNaN(value) || value <= 0) {
      setAmountInWords('Por favor ingrese un monto válido');
      return;
    }
    setAmountInWords(convertAmountToWords(value));
  };

  const pendingChecks = checks.filter(c => c.status === 'pendiente');
  const paidChecks = checks.filter(c => c.status === 'pagado');
  const totalDebt = pendingChecks.reduce((sum, check) => sum + check.amount, 0);

  const renderCheckItem = (check: Check) => (
    <TouchableOpacity
      key={check.id}
      style={styles.checkItem}
      onPress={() => handleCheckPress(check)}
    >
      <View style={styles.checkItemHeader}>
        <View style={styles.checkItemLeft}>
          <IconSymbol name="doc.text.fill" size={24} color={colors.primary} />
          <View style={styles.checkItemInfo}>
            <Text style={styles.checkNumber}>Cheque #{check.check_number}</Text>
            <Text style={styles.checkPayableTo}>A la orden de: {check.payable_to}</Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(check.status) + '20' },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor(check.status) }]}>
            {getStatusLabel(check.status)}
          </Text>
        </View>
      </View>
      <View style={styles.checkItemFooter}>
        <Text style={styles.checkAmount}>{formatCurrency(check.amount)}</Text>
        <Text style={styles.checkDate}>{formatDate(check.check_date)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Control de Cheques',
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: '#FFFFFF',
        }}
      />
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando cheques...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
              <View style={[styles.summaryCard, { backgroundColor: colors.warning + '20' }]}>
                <IconSymbol name="clock.fill" size={32} color={colors.warning} />
                <Text style={styles.summaryValue}>{pendingChecks.length}</Text>
                <Text style={styles.summaryLabel}>Pendientes</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: colors.success + '20' }]}>
                <IconSymbol name="checkmark.circle.fill" size={32} color={colors.success} />
                <Text style={styles.summaryValue}>{paidChecks.length}</Text>
                <Text style={styles.summaryLabel}>Pagados</Text>
              </View>
            </View>

            {/* Total Debt Card */}
            <View style={styles.debtCard}>
              <Text style={styles.debtLabel}>Deuda Total de Cheques</Text>
              <Text style={styles.debtAmount}>{formatCurrency(totalDebt)}</Text>
            </View>

            {/* Pending Checks Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cheques Pendientes</Text>
              {pendingChecks.length === 0 ? (
                <View style={styles.emptyState}>
                  <IconSymbol name="checkmark.circle" size={48} color={colors.textSecondary} />
                  <Text style={styles.emptyStateText}>No hay cheques pendientes</Text>
                </View>
              ) : (
                pendingChecks.map(renderCheckItem)
              )}
            </View>

            {/* Paid Checks Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cheques Pagados</Text>
              {paidChecks.length === 0 ? (
                <View style={styles.emptyState}>
                  <IconSymbol name="doc.text" size={48} color={colors.textSecondary} />
                  <Text style={styles.emptyStateText}>No hay cheques pagados</Text>
                </View>
              ) : (
                paidChecks.map(renderCheckItem)
              )}
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        {/* Floating Action Buttons */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: colors.info }]}
            onPress={() => setShowAmountToWordsDialog(true)}
          >
            <IconSymbol name="textformat.abc" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddDialog(true)}
          >
            <IconSymbol name="plus" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Add Check Dialog */}
        <CustomDialog
          visible={showAddDialog}
          title="Agregar Cheque"
          message="Complete los datos del cheque"
          type="info"
          onClose={() => {
            setShowAddDialog(false);
            resetForm();
          }}
        >
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Número de Cheque"
              placeholderTextColor={colors.textSecondary}
              value={checkNumber}
              onChangeText={setCheckNumber}
            />

            <TextInput
              style={styles.input}
              placeholder="Monto"
              placeholderTextColor={colors.textSecondary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

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

            <TextInput
              style={styles.input}
              placeholder="A la orden de"
              placeholderTextColor={colors.textSecondary}
              value={payableTo}
              onChangeText={setPayableTo}
            />

            <View style={styles.statusSelector}>
              <Text style={styles.statusSelectorLabel}>Estado:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
              </ScrollView>
            </View>

            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Notas (opcional)"
              placeholderTextColor={colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleAddCheck}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <IconSymbol name="checkmark" size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Guardar Cheque</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </CustomDialog>

        {/* Amount to Words Dialog */}
        <CustomDialog
          visible={showAmountToWordsDialog}
          title="Convertir Monto a Palabras"
          message="Ingrese el monto del cheque (puede usar puntos como separadores de miles)"
          type="info"
          onClose={() => {
            setShowAmountToWordsDialog(false);
            setAmountInput('');
            setAmountInWords('');
          }}
        >
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ej: 1.000.000 o 2.295.000"
              placeholderTextColor={colors.textSecondary}
              value={amountInput}
              onChangeText={setAmountInput}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={styles.convertButton}
              onPress={handleConvertAmount}
            >
              <IconSymbol name="arrow.right.circle.fill" size={20} color="#FFFFFF" />
              <Text style={styles.convertButtonText}>Convertir</Text>
            </TouchableOpacity>

            {amountInWords !== '' && (
              <View style={styles.resultContainer}>
                <Text style={styles.resultLabel}>Monto en palabras:</Text>
                <Text style={styles.resultText}>{amountInWords}</Text>
              </View>
            )}
          </View>
        </CustomDialog>

        <CustomDialog
          visible={dialog.visible}
          type={dialog.type}
          title={dialog.title}
          message={dialog.message}
          buttons={dialog.buttons}
          onClose={closeDialog}
        />
      </View>
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  debtCard: {
    margin: 16,
    marginTop: 0,
    padding: 24,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.error + '40',
    alignItems: 'center',
  },
  debtLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  debtAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.error,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  checkItem: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checkItemLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  checkItemInfo: {
    flex: 1,
  },
  checkNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  checkPayableTo: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  checkItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  checkDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    gap: 12,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  formContainer: {
    marginTop: 16,
    gap: 12,
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
    height: 80,
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
    gap: 8,
  },
  statusSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  statusOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  statusOptionText: {
    fontSize: 14,
    color: colors.textSecondary,
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
  convertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.info,
    padding: 16,
    borderRadius: 10,
  },
  convertButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
});
