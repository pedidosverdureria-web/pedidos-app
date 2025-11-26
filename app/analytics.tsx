
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { getSupabase } from '@/lib/supabase';
import { Order, Customer, OrderItem } from '@/types';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

interface ProductStats {
  name: string;
  quantity: number;
  revenue: number;
  orders: number;
}

interface DailySales {
  date: string;
  orders: number;
  revenue: number;
}

interface CustomerStats {
  id: string;
  name: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
}

export default function AnalyticsScreen() {
  const { currentTheme } = useTheme();
  const colors = currentTheme.colors;
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  
  const [topProducts, setTopProducts] = useState<ProductStats[]>([]);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [topCustomers, setTopCustomers] = useState<CustomerStats[]>([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    totalCustomers: 0,
    growthRate: 0,
  });

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();
      
      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      if (timeRange === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (timeRange === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else {
        startDate.setFullYear(now.getFullYear() - 1);
      }

      // Fetch orders with items
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch customers
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*');

      if (customersError) throw customersError;

      // Process data
      processAnalytics(orders || [], customers || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalytics = (orders: Order[], customers: Customer[]) => {
    // Calculate summary
    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const totalOrders = orders.length;
    const averageOrderValue = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;

    // Calculate growth rate (compare with previous period)
    const midPoint = new Date();
    if (timeRange === 'week') {
      midPoint.setDate(midPoint.getDate() - 3.5);
    } else if (timeRange === 'month') {
      midPoint.setDate(midPoint.getDate() - 15);
    } else {
      midPoint.setMonth(midPoint.getMonth() - 6);
    }

    const recentOrders = orders.filter(o => new Date(o.created_at) >= midPoint);
    const oldOrders = orders.filter(o => new Date(o.created_at) < midPoint);
    const recentRevenue = recentOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total_amount, 0);
    const oldRevenue = oldOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total_amount, 0);
    const growthRate = oldRevenue > 0 ? ((recentRevenue - oldRevenue) / oldRevenue) * 100 : 0;

    setSummary({
      totalRevenue,
      totalOrders,
      averageOrderValue,
      totalCustomers: customers.length,
      growthRate,
    });

    // Process top products
    const productMap = new Map<string, ProductStats>();
    orders.forEach(order => {
      order.items?.forEach(item => {
        const existing = productMap.get(item.product_name) || {
          name: item.product_name,
          quantity: 0,
          revenue: 0,
          orders: 0,
        };
        
        const qty = typeof item.quantity === 'number' ? item.quantity : 1;
        existing.quantity += qty;
        existing.revenue += item.total_price;
        existing.orders += 1;
        productMap.set(item.product_name, existing);
      });
    });

    const sortedProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    setTopProducts(sortedProducts);

    // Process daily sales
    const salesMap = new Map<string, DailySales>();
    orders.forEach(order => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      const existing = salesMap.get(date) || { date, orders: 0, revenue: 0 };
      existing.orders += 1;
      if (order.status === 'delivered') {
        existing.revenue += order.total_amount;
      }
      salesMap.set(date, existing);
    });

    const sortedSales = Array.from(salesMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days
    setDailySales(sortedSales);

    // Process top customers
    const customerMap = new Map<string, CustomerStats>();
    orders.forEach(order => {
      if (!order.customer_id) return;
      
      const existing = customerMap.get(order.customer_id) || {
        id: order.customer_id,
        name: order.customer_name,
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
      };
      
      existing.totalOrders += 1;
      if (order.status === 'delivered') {
        existing.totalSpent += order.total_amount;
      }
      customerMap.set(order.customer_id, existing);
    });

    const sortedCustomers = Array.from(customerMap.values())
      .map(c => ({
        ...c,
        averageOrderValue: c.totalOrders > 0 ? c.totalSpent / c.totalOrders : 0,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);
    setTopCustomers(sortedCustomers);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const chartConfig = {
    backgroundColor: colors.card,
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${hexToRgb(colors.primary)}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${hexToRgb(colors.text)}, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: colors.primary,
    },
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '0, 0, 0';
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
      paddingBottom: 100,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    timeRangeContainer: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    timeRangeButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
    },
    timeRangeButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    summaryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 24,
    },
    summaryCard: {
      flex: 1,
      minWidth: '47%',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    summaryValue: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    summaryChange: {
      fontSize: 12,
      fontWeight: '600',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chartContainer: {
      alignItems: 'center',
      marginVertical: 8,
    },
    productItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    productLeft: {
      flex: 1,
      marginRight: 16,
    },
    productName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    productStats: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    productRevenue: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
    },
    customerItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    customerLeft: {
      flex: 1,
      marginRight: 16,
    },
    customerName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    customerStats: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    customerRevenue: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.success,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: 24,
    },
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen
          options={{
            title: 'Analytics',
            headerBackTitle: 'Atrás',
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#fff',
          }}
        />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Analytics',
          headerBackTitle: 'Atrás',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          <TouchableOpacity
            style={[
              styles.timeRangeButton,
              {
                backgroundColor: timeRange === 'week' ? colors.primary : colors.card,
                borderColor: timeRange === 'week' ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setTimeRange('week')}
          >
            <Text
              style={[
                styles.timeRangeButtonText,
                { color: timeRange === 'week' ? '#fff' : colors.text },
              ]}
            >
              Semana
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.timeRangeButton,
              {
                backgroundColor: timeRange === 'month' ? colors.primary : colors.card,
                borderColor: timeRange === 'month' ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setTimeRange('month')}
          >
            <Text
              style={[
                styles.timeRangeButtonText,
                { color: timeRange === 'month' ? '#fff' : colors.text },
              ]}
            >
              Mes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.timeRangeButton,
              {
                backgroundColor: timeRange === 'year' ? colors.primary : colors.card,
                borderColor: timeRange === 'year' ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setTimeRange('year')}
          >
            <Text
              style={[
                styles.timeRangeButtonText,
                { color: timeRange === 'year' ? '#fff' : colors.text },
              ]}
            >
              Año
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Ingresos Totales</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.totalRevenue)}</Text>
            <View style={styles.summaryChange}>
              <IconSymbol
                ios_icon_name={summary.growthRate >= 0 ? 'arrow.up' : 'arrow.down'}
                android_material_icon_name={summary.growthRate >= 0 ? 'arrow_upward' : 'arrow_downward'}
                size={12}
                color={summary.growthRate >= 0 ? colors.success : colors.error}
              />
              <Text style={{ color: summary.growthRate >= 0 ? colors.success : colors.error }}>
                {Math.abs(summary.growthRate).toFixed(1)}%
              </Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Pedidos</Text>
            <Text style={styles.summaryValue}>{summary.totalOrders}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Valor Promedio</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.averageOrderValue)}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Clientes</Text>
            <Text style={styles.summaryValue}>{summary.totalCustomers}</Text>
          </View>
        </View>

        {/* Sales Trend Chart */}
        {dailySales.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tendencia de Ventas</Text>
            <View style={styles.card}>
              <View style={styles.chartContainer}>
                <LineChart
                  data={{
                    labels: dailySales.slice(-7).map(d => {
                      const date = new Date(d.date);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }),
                    datasets: [
                      {
                        data: dailySales.slice(-7).map(d => d.revenue),
                      },
                    ],
                  }}
                  width={width - 64}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={{
                    borderRadius: 16,
                  }}
                />
              </View>
            </View>
          </View>
        )}

        {/* Top Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Productos Más Vendidos</Text>
          <View style={styles.card}>
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <View key={index} style={styles.productItem}>
                  <View style={styles.productLeft}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productStats}>
                      {product.quantity} unidades • {product.orders} pedidos
                    </Text>
                  </View>
                  <Text style={styles.productRevenue}>{formatCurrency(product.revenue)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No hay datos de productos</Text>
            )}
          </View>
        </View>

        {/* Top Customers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mejores Clientes</Text>
          <View style={styles.card}>
            {topCustomers.length > 0 ? (
              topCustomers.map((customer, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.customerItem}
                  onPress={() => router.push(`/customer-orders/${customer.id}` as any)}
                >
                  <View style={styles.customerLeft}>
                    <Text style={styles.customerName}>{customer.name}</Text>
                    <Text style={styles.customerStats}>
                      {customer.totalOrders} pedidos • Promedio: {formatCurrency(customer.averageOrderValue)}
                    </Text>
                  </View>
                  <Text style={styles.customerRevenue}>{formatCurrency(customer.totalSpent)}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>No hay datos de clientes</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
