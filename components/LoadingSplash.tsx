
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';

interface LoadingProcess {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
  error?: string;
}

interface LoadingSplashProps {
  processes: LoadingProcess[];
  onComplete?: () => void;
}

export function LoadingSplash({ processes, onComplete }: LoadingSplashProps) {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    // Check if all processes are completed
    const allCompleted = processes.every(p => p.status === 'completed' || p.status === 'error');
    if (allCompleted && onComplete) {
      // Small delay before calling onComplete
      const timer = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [processes, onComplete]);

  const getStatusIcon = (status: LoadingProcess['status']) => {
    switch (status) {
      case 'pending':
        return { name: 'circle', color: '#9E9E9E' };
      case 'loading':
        return { name: 'arrow.clockwise', color: '#2196F3' };
      case 'completed':
        return { name: 'checkmark.circle.fill', color: '#4CAF50' };
      case 'error':
        return { name: 'xmark.circle.fill', color: '#F44336' };
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        {/* App Icon */}
        <View style={styles.iconContainer}>
          <IconSymbol 
            ios_icon_name="cart.fill.badge.plus" 
            android_material_icon_name="shopping_cart"
            size={80} 
            color="#3F51B5" 
          />
        </View>

        {/* App Name */}
        <Text style={styles.appName}>Pedidos App</Text>
        <Text style={styles.subtitle}>Cargando aplicación...</Text>

        {/* Loading Processes */}
        <View style={styles.processesContainer}>
          {processes.map((process) => {
            const statusIcon = getStatusIcon(process.status);
            return (
              <View key={process.id} style={styles.processRow}>
                <View style={styles.processIcon}>
                  {process.status === 'loading' ? (
                    <ActivityIndicator size="small" color={statusIcon.color} />
                  ) : (
                    <IconSymbol 
                      ios_icon_name={statusIcon.name as any}
                      android_material_icon_name={
                        process.status === 'completed' ? 'check_circle' :
                        process.status === 'error' ? 'error' :
                        'circle'
                      }
                      size={20} 
                      color={statusIcon.color} 
                    />
                  )}
                </View>
                <View style={styles.processContent}>
                  <Text style={[
                    styles.processLabel,
                    process.status === 'completed' && styles.processLabelCompleted,
                    process.status === 'error' && styles.processLabelError,
                  ]}>
                    {process.label}
                  </Text>
                  {process.error && (
                    <Text style={styles.errorText}>{process.error}</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Overall Loading Indicator */}
        <View style={styles.loadingIndicator}>
          <ActivityIndicator size="large" color="#3F51B5" />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 40,
  },
  processesContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  processRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  processIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processContent: {
    flex: 1,
  },
  processLabel: {
    fontSize: 14,
    color: '#212121',
    fontWeight: '500',
  },
  processLabelCompleted: {
    color: '#4CAF50',
  },
  processLabelError: {
    color: '#F44336',
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  loadingIndicator: {
    marginTop: 16,
  },
});
