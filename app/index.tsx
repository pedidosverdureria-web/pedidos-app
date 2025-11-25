
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { LoadingSplash } from '@/components/LoadingSplash';

interface LoadingProcess {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
  error?: string;
}

export default function Index() {
  const { user, isLoading: authLoading, loadingStatus } = useAuth();
  const { currentTheme, isLoading: themeLoading } = useTheme();
  const [processes, setProcesses] = useState<LoadingProcess[]>([
    { id: 'theme', label: 'Cargando tema', status: 'loading' },
    { id: 'auth', label: 'Verificando autenticación', status: 'loading' },
    { id: 'config', label: 'Cargando configuración', status: 'loading' },
  ]);
  const [showSplash, setShowSplash] = useState(true);

  const colors = currentTheme?.colors || {
    background: '#F5F5F5',
    primary: '#3F51B5',
  };

  console.log('[Index] Rendering - authLoading:', authLoading, 'user:', user ? user.role : 'none');

  // Update theme loading status
  useEffect(() => {
    if (!themeLoading) {
      console.log('[Index] Theme loaded');
      setProcesses(prev => prev.map(p => 
        p.id === 'theme' ? { ...p, status: 'completed' } : p
      ));
    }
  }, [themeLoading]);

  // Update auth loading status
  useEffect(() => {
    if (!authLoading) {
      console.log('[Index] Auth loaded, user:', user ? user.role : 'none');
      setProcesses(prev => prev.map(p => 
        p.id === 'auth' ? { ...p, status: 'completed', label: loadingStatus } : p
      ));
    }
  }, [authLoading, user, loadingStatus]);

  // Update config loading status (simulated)
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('[Index] Config loaded');
      setProcesses(prev => prev.map(p => 
        p.id === 'config' ? { ...p, status: 'completed' } : p
      ));
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Hide splash when all processes are complete
  useEffect(() => {
    const allCompleted = processes.every(p => p.status === 'completed' || p.status === 'error');
    if (allCompleted && !authLoading) {
      console.log('[Index] All processes completed, hiding splash');
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [processes, authLoading]);

  // Show loading splash while initializing
  if (showSplash || authLoading) {
    console.log('[Index] Showing loading splash');
    return <LoadingSplash processes={processes} />;
  }

  console.log('[Index] All loaded, determining redirect');

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
