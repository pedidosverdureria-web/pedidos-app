
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { OrderStatus } from '@/types';
import { getStatusColor, getStatusLabel, getStatusIcon } from '@/utils/orderHelpers';

interface OrderStatusSectionProps {
  currentStatus: OrderStatus;
  availableTransitions: OrderStatus[];
  updatingStatus: boolean;
  isDeveloper: boolean;
  onStatusChange: (status: OrderStatus) => void;
  colors: any;
}

export function OrderStatusSection({
  currentStatus,
  availableTransitions,
  updatingStatus,
  isDeveloper,
  onStatusChange,
  colors,
}: OrderStatusSectionProps) {
  const styles = StyleSheet.create({
    developerBadge: {
      backgroundColor: '#8B5CF6',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      marginBottom: 12,
      alignSelf: 'flex-start',
    },
    developerBadgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    currentStatusContainer: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      alignItems: 'center',
    },
    currentStatusLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
      fontWeight: '600',
    },
    currentStatusBadge: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    currentStatusText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
    statusTransitionsLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
      fontWeight: '600',
    },
    statusContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    statusButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 2,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statusButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
  });

  return (
    <>
      {isDeveloper && (
        <View style={styles.developerBadge}>
          <Text style={styles.developerBadgeText}>🔧 Modo Desarrollador</Text>
        </View>
      )}
      
      <View style={styles.currentStatusContainer}>
        <Text style={styles.currentStatusLabel}>ESTADO ACTUAL</Text>
        <View style={[
          styles.currentStatusBadge,
          { backgroundColor: getStatusColor(currentStatus) }
        ]}>
          <IconSymbol 
            name={getStatusIcon(currentStatus)} 
            size={20} 
            color="#fff" 
          />
          <Text style={styles.currentStatusText}>
            {getStatusLabel(currentStatus)}
          </Text>
        </View>
      </View>
      
      {availableTransitions.length > 0 && (
        <>
          <Text style={styles.statusTransitionsLabel}>
            {isDeveloper ? 'Cambiar estado a (todos disponibles):' : 'Cambiar estado a:'}
          </Text>
          <View style={styles.statusContainer}>
            {availableTransitions.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusButton,
                  { borderColor: getStatusColor(status) },
                  updatingStatus && { opacity: 0.5 }
                ]}
                onPress={() => onStatusChange(status)}
                disabled={updatingStatus}
              >
                {updatingStatus ? (
                  <ActivityIndicator size="small" color={getStatusColor(status)} />
                ) : (
                  <>
                    <IconSymbol 
                      name={getStatusIcon(status)} 
                      size={16} 
                      color={getStatusColor(status)} 
                    />
                    <Text
                      style={[
                        styles.statusButtonText,
                        { color: getStatusColor(status) },
                      ]}
                    >
                      {getStatusLabel(status)}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </>
  );
}
