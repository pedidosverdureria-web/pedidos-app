
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function Index() {
  const { user, isLoading } = useAuth();
  const { currentTheme } = useTheme();
  const colors = currentTheme?.colors || {
    background: '#F5F5F5',
    primary: '#3F51B5',
  };

  console.log('[Index] Rendering - isLoading:', isLoading, 'user:', user ? user.role : 'none');

  // Show loading indicator while auth is loading
  if (isLoading) {
    console.log('[Index] Auth is loading, showing loading indicator');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  console.log('[Index] Auth loaded, user:', user ? user.role : 'none');

  // If user is authenticated, redirect based on role
  if (user) {
    if (user.role === 'printer') {
      console.log('[Index] Redirecting to printer queue');
      return <Redirect href="/printer-queue" />;
    }
    // Admin, worker, and desarrollador all go to home
    console.log('[Index] Redirecting to home');
    return <Redirect href="/(tabs)/(home)/" />;
  }

  // Not authenticated, redirect to login
  console.log('[Index] Not authenticated, redirecting to login');
  return <Redirect href="/login" />;
}
