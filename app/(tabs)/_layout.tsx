
import React from 'react';
import { Platform } from 'react-native';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'house.fill',
      label: 'Pedidos',
    },
    {
      name: 'pending-payments',
      route: '/(tabs)/pending-payments',
      icon: 'doc.text.fill',
      label: 'Vales Pendientes',
    },
    {
      name: 'customers',
      route: '/(tabs)/customers',
      icon: 'person.2.fill',
      label: 'Clientes',
    },
    {
      name: 'profile',
      route: '/(tabs)/profile',
      icon: 'person.fill',
      label: 'Perfil',
    },
  ];

  if (Platform.OS === 'ios') {
    return (
      <NativeTabs>
        <NativeTabs.Trigger name="(home)">
          <Icon sf="house.fill" drawable="ic_home" />
          <Label>Pedidos</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="pending-payments">
          <Icon sf="doc.text.fill" drawable="ic_pending_payments" />
          <Label>Vales Pendientes</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="customers">
          <Icon sf="person.2.fill" drawable="ic_customers" />
          <Label>Clientes</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <Icon sf="person.fill" drawable="ic_profile" />
          <Label>Perfil</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen name="(home)" />
        <Stack.Screen name="pending-payments" />
        <Stack.Screen name="customers" />
        <Stack.Screen name="profile" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
