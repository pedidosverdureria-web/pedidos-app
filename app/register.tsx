
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/styles/commonStyles';

export default function RegisterScreen() {
  useEffect(() => {
    // Registration is no longer needed with PIN-based authentication
    // Redirect to login
    console.log('[Register] Redirecting to login (PIN-based auth)');
    router.replace('/login');
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>Redirigiendo...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  text: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
