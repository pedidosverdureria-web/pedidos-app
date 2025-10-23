
import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect directly to login screen
  return <Redirect href="/login" />;
}
