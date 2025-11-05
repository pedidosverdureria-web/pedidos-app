
import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { user, isLoading } = useAuth();

  // Wait for auth to load
  if (isLoading) {
    return null;
  }

  // If user is authenticated, redirect based on role
  if (user) {
    if (user.role === 'printer') {
      return <Redirect href="/printer-queue" />;
    }
    return <Redirect href="/(tabs)/(home)/" />;
  }

  // Not authenticated, redirect to login
  return <Redirect href="/login" />;
}
