
import { useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { WidgetProvider } from '@/contexts/WidgetContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePrinter } from '@/hooks/usePrinter';
import { getSupabase } from '@/lib/supabase';
import { generateReceiptText, PrinterConfig } from '@/utils/receiptGenerator';
import { Order } from '@/types';
import { AppState, AppStateStatus } from 'react-native';

const PRINTER_CONFIG_KEY = '@printer_config';
const PRINTED_ORDERS_KEY = '@printed_orders';

/**
 * Background Print Processor Component
 * This component runs in the foreground and processes print jobs queued by the background task
 * FIXED: This enables printing with screen off by processing queued jobs when app comes to foreground
 */
function BackgroundPrintProcessor() {
  const { printReceipt, isConnected } = usePrinter();

  const processQueuedPrints = useCallback(async () => {
    try {
      // Check if there are orders queued for printing
      const queuedOrdersStr = await AsyncStorage.getItem('@orders_to_print');
      if (!queuedOrdersStr) {
        return;
      }

      const queuedOrderIds: string[] = JSON.parse(queuedOrdersStr);
      if (queuedOrderIds.length === 0) {
        return;
      }

      console.log('[BackgroundPrintProcessor] Found queued orders to print:', queuedOrderIds.length);

      // Check if printer is connected
      if (!isConnected) {
        console.log('[BackgroundPrintProcessor] Printer not connected, cannot process queue');
        return;
      }

      // Load printer config
      const configStr = await AsyncStorage.getItem(PRINTER_CONFIG_KEY);
      if (!configStr) {
        console.log('[BackgroundPrintProcessor] No printer config found');
        return;
      }

      const printerConfig: PrinterConfig = JSON.parse(configStr);

      // Check if auto-print is enabled
      if (!printerConfig.auto_print_enabled) {
        console.log('[BackgroundPrintProcessor] Auto-print is disabled');
        // Clear the queue since auto-print is disabled
        await AsyncStorage.removeItem('@orders_to_print');
        return;
      }

      // Get already printed orders
      const printedOrdersStr = await AsyncStorage.getItem(PRINTED_ORDERS_KEY);
      const printedOrders: string[] = printedOrdersStr ? JSON.parse(printedOrdersStr) : [];

      // Fetch order details from Supabase
      const supabase = getSupabase();
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .in('id', queuedOrderIds);

      if (error) {
        console.error('[BackgroundPrintProcessor] Error fetching orders:', error);
        return;
      }

      if (!orders || orders.length === 0) {
        console.log('[BackgroundPrintProcessor] No orders found');
        // Clear the queue
        await AsyncStorage.removeItem('@orders_to_print');
        return;
      }

      console.log('[BackgroundPrintProcessor] Processing', orders.length, 'orders');

      // Print each order
      for (const order of orders) {
        // Skip if already printed
        if (printedOrders.includes(order.id)) {
          console.log('[BackgroundPrintProcessor] Order already printed, skipping:', order.order_number);
          continue;
        }

        try {
          console.log('[BackgroundPrintProcessor] Printing order:', order.order_number);

          // Generate receipt text with auto_print context
          const receiptText = generateReceiptText(order as Order, printerConfig, 'auto_print');

          // Print the receipt with order ID to prevent duplicates
          await printReceipt(
            receiptText,
            printerConfig.auto_cut_enabled ?? true,
            printerConfig.text_size || 'small',
            order.id
          );

          // Mark as printed
          printedOrders.push(order.id);
          await AsyncStorage.setItem(PRINTED_ORDERS_KEY, JSON.stringify(printedOrders));

          console.log('[BackgroundPrintProcessor] Order printed successfully:', order.order_number);

          // Small delay between prints
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error('[BackgroundPrintProcessor] Error printing order:', order.order_number, error);
          // Continue with next order even if this one fails
        }
      }

      // Clear the queue after processing
      await AsyncStorage.removeItem('@orders_to_print');
      console.log('[BackgroundPrintProcessor] Queue processed successfully');
    } catch (error) {
      console.error('[BackgroundPrintProcessor] Error processing queue:', error);
    }
  }, [printReceipt, isConnected]);

  // Process queue when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('[BackgroundPrintProcessor] App became active, checking for queued prints');
        processQueuedPrints();
      }
    };

    // Process queue on mount
    processQueuedPrints();

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [processQueuedPrints]);

  // Also check periodically while app is in foreground
  useEffect(() => {
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') {
        processQueuedPrints();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [processQueuedPrints]);

  return null;
}

function RootLayoutContent() {
  const { user } = useAuth();

  return (
    <>
      {user && <BackgroundPrintProcessor />}
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="formsheet"
          options={{
            presentation: 'formSheet',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="transparent-modal"
          options={{
            presentation: 'transparentModal',
            headerShown: false,
            animation: 'fade',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WidgetProvider>
          <RootLayoutContent />
        </WidgetProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
