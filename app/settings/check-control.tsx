
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
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
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
  const { currentTheme } = useTheme();
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAmountToWordsDialog, setShowAmountToWordsDialog] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<Check | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<CheckStatus | 'all'>('all');
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
        .order('check_date', { ascending: true });

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

  const handleFilterPress = (filterStatus: CheckStatus | 'all') => {
    setSelectedFilter(filterStatus);
  };

  const getStatusColor = (checkStatus: CheckStatus) => {
    switch (checkStatus) {
      case 'pendiente':
        return currentTheme.colors.warning;
      case 'pagado':
        return currentTheme.colors.success;
      case 'movido':
        return currentTheme.colors.info;
      case 'pausado':
        return '#8B5CF6';
      case 'anulado':
        return currentTheme.colors.error;
      default:
        return currentTheme.colors.textSecondary;
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

  const getStatusIcon = (checkStatus: CheckStatus) => {
    switch (checkStatus) {
      case 'pendiente':
        return { ios: 'clock.fill', android: 'schedule' };
      case 'pagado':
        return { ios: 'checkmark.circle.fill', android: 'check_circle' };
      case 'movido':
        return { ios: 'arrow.right.circle.fill', android: 'arrow_circle_right' };
      case 'pausado':
        return { ios: 'pause.circle.fill', android: 'pause_circle' };
      case 'anulado':
        return { ios: 'xmark.circle.fill', android: 'cancel' };
      default:
        return { ios: 'doc.text.fill', android: 'description' };
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

  // Sort checks by date in ascending order (oldest first)
  const sortChecksByDate = (checksArray: Check[]) => {
    return [...checksArray].sort((a, b) => {
      const dateA = new Date(a.check_date + 'T00:00:00').getTime();
      const dateB = new Date(b.check_date + 'T00:00:00').getTime();
      return dateA - dateB; // Ascending order
    });
  };

  // Group checks by status
  const pendingChecks = sortChecksByDate(checks.filter(c => c.status === 'pendiente'));
  const paidChecks = sortChecksByDate(checks.filter(c => c.status === 'pagado'));
  const movedChecks = sortChecksByDate(checks.filter(c => c.status === 'movido'));
  const pausedChecks = sortChecksByDate(checks.filter(c => c.status === 'pausado'));
  const canceledChecks = sortChecksByDate(checks.filter(c => c.status === 'anulado'));

  const totalDebt = pendingChecks.reduce((sum, check) => sum + check.amount, 0);

  // Get filtered checks based on selected filter
  const getFilteredChecks = () => {
    if (selectedFilter === 'all') {
      return sortChecksByDate(checks);
    }
    return sortChecksByDate(checks.filter(c => c.status === selectedFilter));
  };

  const filteredChecks = getFilteredChecks();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: currentTheme.colors.textSecondary,
    },
    stickyHeader: {
      backgroundColor: currentTheme.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    summaryContainer: {
      flexDirection: 'row',
      padding: 10,
      gap: 8,
      flexWrap: 'wrap',
    },
    summaryCard: {
      flex: 1,
      minWidth: '30%',
      padding: 10,
      borderRadius: 12,
      alignItems: 'center',
      gap: 4,
    },
    summaryCardActive: {
      borderWidth: 2,
      borderColor: currentTheme.colors.primary,
    },
    summaryValue: {
      fontSize: 20,
      fontWeight: '700',
      color: currentTheme.colors.text,
    },
    summaryLabel: {
      fontSize: 10,
      color: currentTheme.colors.textSecondary,
      fontWeight: '500',
      textAlign: 'center',
    },
    debtCard: {
      marginHorizontal: 10,
      marginBottom: 10,
      padding: 14,
      backgroundColor: currentTheme.colors.card,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: currentTheme.colors.error + '40',
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
    },
    debtLabel: {
      fontSize: 13,
      color: currentTheme.colors.textSecondary,
      fontWeight: '600',
    },
    debtAmount: {
      fontSize: 22,
      fontWeight: '700',
      color: currentTheme.colors.error,
    },
    scrollView: {
      flex: 1,
    },
    section: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: currentTheme.colors.text,
      marginBottom: 12,
    },
    checkItem: {
      backgroundColor: currentTheme.colors.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
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
      color: currentTheme.colors.text,
      marginBottom: 4,
    },
    checkPayableTo: {
      fontSize: 14,
      color: currentTheme.colors.textSecondary,
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
      color: currentTheme.colors.primary,
    },
    checkDate: {
      fontSize: 14,
      color: currentTheme.colors.textSecondary,
    },
    emptyState: {
      padding: 40,
      alignItems: 'center',
      gap: 12,
    },
    emptyStateText: {
      fontSize: 16,
      color: currentTheme.colors.textSecondary,
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
      backgroundColor: currentTheme.colors.background,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
      borderRadius: 10,
      padding: 14,
      fontSize: 16,
      color: currentTheme.colors.text,
    },
    notesInput: {
      height: 80,
      textAlignVertical: 'top',
    },
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: currentTheme.colors.background,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
      borderRadius: 10,
      padding: 14,
    },
    dateButtonText: {
      fontSize: 16,
      color: currentTheme.colors.text,
    },
    statusSelector: {
      gap: 8,
    },
    statusSelectorLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: currentTheme.colors.text,
    },
    statusOption: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: currentTheme.colors.background,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
      marginRight: 8,
    },
    statusOptionText: {
      fontSize: 14,
      color: currentTheme.colors.textSecondary,
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: currentTheme.colors.primary,
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
      backgroundColor: currentTheme.colors.info,
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
      backgroundColor: currentTheme.colors.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
    },
    resultLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: currentTheme.colors.textSecondary,
      marginBottom: 8,
    },
    resultText: {
      fontSize: 16,
      color: currentTheme.colors.text,
      lineHeight: 24,
    },
  });

  const renderCheckItem = (check: Check) => (
    <TouchableOpacity
      key={check.id}
      style={styles.checkItem}
      onPress={() => handleCheckPress(check)}
    >
      <View style={styles.checkItemHeader}>
        <View style={styles.checkItemLeft}>
          <IconSymbol ios_icon_name="doc.text.fill" android_material_icon_name="description" size={24} color={currentTheme.colors.primary} />
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
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={currentTheme.colors.primary} />
          <Text style={styles.loadingText}>Cargando cheques...</Text>
        </View>
      ) : (
        <>
          {/* Sticky Header with Summary and Debt */}
          <View style={styles.stickyHeader}>
            {/* Summary Cards - Now acting as filters */}
            <View style={styles.summaryContainer}>
              <TouchableOpacity
                style={[
                  styles.summaryCard,
                  { backgroundColor: currentTheme.colors.warning + '20' },
                  selectedFilter === 'pendiente' && styles.summaryCardActive,
                ]}
                onPress={() => handleFilterPress('pendiente')}
              >
                <IconSymbol ios_icon_name="clock.fill" android_material_icon_name="schedule" size={20} color={currentTheme.colors.warning} />
                <Text style={styles.summaryValue}>{pendingChecks.length}</Text>
                <Text style={styles.summaryLabel}>Pendientes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.summaryCard,
                  { backgroundColor: currentTheme.colors.success + '20' },
                  selectedFilter === 'pagado' && styles.summaryCardActive,
                ]}
                onPress={() => handleFilterPress('pagado')}
              >
                <IconSymbol ios_icon_name="checkmark.circle.fill" android_material_icon_name="check_circle" size={20} color={currentTheme.colors.success} />
                <Text style={styles.summaryValue}>{paidChecks.length}</Text>
                <Text style={styles.summaryLabel}>Pagados</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.summaryCard,
                  { backgroundColor: currentTheme.colors.info + '20' },
                  selectedFilter === 'movido' && styles.summaryCardActive,
                ]}
                onPress={() => handleFilterPress('movido')}
              >
                <IconSymbol ios_icon_name="arrow.right.circle.fill" android_material_icon_name="arrow_circle_right" size={20} color={currentTheme.colors.info} />
                <Text style={styles.summaryValue}>{movedChecks.length}</Text>
                <Text style={styles.summaryLabel}>Movidos</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.summaryCard,
                  { backgroundColor: '#8B5CF6' + '20' },
                  selectedFilter === 'pausado' && styles.summaryCardActive,
                ]}
                onPress={() => handleFilterPress('pausado')}
              >
                <IconSymbol ios_icon_name="pause.circle.fill" android_material_icon_name="pause_circle" size={20} color="#8B5CF6" />
                <Text style={styles.summaryValue}>{pausedChecks.length}</Text>
                <Text style={styles.summaryLabel}>Pausados</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.summaryCard,
                  { backgroundColor: currentTheme.colors.error + '20' },
                  selectedFilter === 'anulado' && styles.summaryCardActive,
                ]}
                onPress={() => handleFilterPress('anulado')}
              >
                <IconSymbol ios_icon_name="xmark.circle.fill" android_material_icon_name="cancel" size={20} color={currentTheme.colors.error} />
                <Text style={styles.summaryValue}>{canceledChecks.length}</Text>
                <Text style={styles.summaryLabel}>Anulados</Text>
              </TouchableOpacity>
            </View>

            {/* Total Debt Card */}
            <TouchableOpacity
              style={styles.debtCard}
              onPress={() => handleFilterPress('all')}
            >
              <Text style={styles.debtLabel}>Deuda Total:</Text>
              <Text style={styles.debtAmount}>{formatCurrency(totalDebt)}</Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable Content - Now showing filtered checks */}
          <ScrollView
            style={styles.scrollView}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {selectedFilter === 'all' 
                  ? 'Todos los Cheques' 
                  : `Cheques ${getStatusLabel(selectedFilter as CheckStatus)}`}
              </Text>
              {filteredChecks.length === 0 ? (
                <View style={styles.emptyState}>
                  <IconSymbol 
                    ios_icon_name={selectedFilter === 'all' ? 'doc.text.fill' : getStatusIcon(selectedFilter as CheckStatus).ios} 
                    android_material_icon_name={selectedFilter === 'all' ? 'description' : getStatusIcon(selectedFilter as CheckStatus).android} 
                    size={48} 
                    color={currentTheme.colors.textSecondary} 
                  />
                  <Text style={styles.emptyStateText}>
                    {selectedFilter === 'all' 
                      ? 'No hay cheques registrados' 
                      : `No hay cheques ${getStatusLabel(selectedFilter as CheckStatus).toLowerCase()}`}
                  </Text>
                </View>
              ) : (
                filteredChecks.map(renderCheckItem)
              )}
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        </>
      )}

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: currentTheme.colors.info }]}
          onPress={() => setShowAmountToWordsDialog(true)}
        >
          <IconSymbol ios_icon_name="textformat.abc" android_material_icon_name="text_fields" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: currentTheme.colors.primary }]}
          onPress={() => setShowAddDialog(true)}
        >
          <IconSymbol ios_icon_name="plus" android_material_icon_name="add" size={28} color="#FFFFFF" />
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
            placeholderTextColor={currentTheme.colors.textSecondary}
            value={checkNumber}
            onChangeText={setCheckNumber}
          />

          <TextInput
            style={styles.input}
            placeholder="Monto"
            placeholderTextColor={currentTheme.colors.textSecondary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <IconSymbol ios_icon_name="calendar" android_material_icon_name="calendar_today" size={20} color={currentTheme.colors.primary} />
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
            placeholderTextColor={currentTheme.colors.textSecondary}
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
            placeholderTextColor={currentTheme.colors.textSecondary}
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
                <IconSymbol ios_icon_name="checkmark" android_material_icon_name="check" size={20} color="#FFFFFF" />
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
            placeholderTextColor={currentTheme.colors.textSecondary}
            value={amountInput}
            onChangeText={setAmountInput}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={styles.convertButton}
            onPress={handleConvertAmount}
          >
            <IconSymbol ios_icon_name="arrow.right.circle.fill" android_material_icon_name="arrow_circle_right" size={20} color="#FFFFFF" />
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
  );
}
