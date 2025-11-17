
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Stack } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function DeveloperManualScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Guía de Desarrollador',
          headerBackTitle: 'Atrás',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.mainTitle}>Guía de Desarrollador</Text>
          <Text style={styles.subtitle}>
            Documentación técnica para desarrolladores que trabajan con el código fuente
          </Text>
        </View>

        {/* Project Structure */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="folder.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>1. Estructura del Proyecto</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Arquitectura General</Text>
            <Text style={styles.code}>
              app/                    # Pantallas y rutas{'\n'}
              ├── (tabs)/            # Navegación por pestañas{'\n'}
              ├── order/             # Pantallas de pedidos{'\n'}
              ├── settings/          # Configuraciones{'\n'}
              └── ...{'\n'}
              {'\n'}
              components/            # Componentes reutilizables{'\n'}
              contexts/              # Context API{'\n'}
              hooks/                 # Custom hooks{'\n'}
              utils/                 # Utilidades{'\n'}
              types/                 # TypeScript types{'\n'}
              styles/                # Estilos globales{'\n'}
              lib/                   # Configuración de librerías{'\n'}
              supabase/              # Edge Functions
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Convenciones de Código</Text>
            <Text style={styles.bulletPoint}>• TypeScript para type safety</Text>
            <Text style={styles.bulletPoint}>• Functional components con hooks</Text>
            <Text style={styles.bulletPoint}>• StyleSheet para estilos</Text>
            <Text style={styles.bulletPoint}>• Async/await para operaciones asíncronas</Text>
            <Text style={styles.bulletPoint}>• Console.log para debugging</Text>
            <Text style={styles.bulletPoint}>• Comentarios en español</Text>
          </View>
        </View>

        {/* Tech Stack */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="cpu.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>2. Stack Tecnológico</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Frontend</Text>
            <Text style={styles.code}>
              React Native: 0.81.4{'\n'}
              Expo: 54{'\n'}
              TypeScript: 5.8.3{'\n'}
              Expo Router: 6.0.0{'\n'}
              React: 19.1.0
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Backend</Text>
            <Text style={styles.code}>
              Supabase: 2.76.1{'\n'}
              PostgreSQL: Latest{'\n'}
              Edge Functions: Deno Runtime
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Librerías Principales</Text>
            <Text style={styles.code}>
              @react-native-async-storage/async-storage{'\n'}
              @supabase/supabase-js{'\n'}
              react-native-ble-plx{'\n'}
              expo-notifications{'\n'}
              expo-print{'\n'}
              expo-background-fetch{'\n'}
              expo-task-manager
            </Text>
          </View>
        </View>

        {/* Development Setup */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="hammer.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>3. Configuración de Desarrollo</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Requisitos Previos</Text>
            <Text style={styles.bulletPoint}>• Node.js 18+ instalado</Text>
            <Text style={styles.bulletPoint}>• npm o yarn</Text>
            <Text style={styles.bulletPoint}>• Expo CLI</Text>
            <Text style={styles.bulletPoint}>• Android Studio (para Android)</Text>
            <Text style={styles.bulletPoint}>• Xcode (para iOS, solo macOS)</Text>
            <Text style={styles.bulletPoint}>• Cuenta de Supabase</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Instalación</Text>
            <Text style={styles.code}>
              # Clonar repositorio{'\n'}
              git clone [repo-url]{'\n'}
              {'\n'}
              # Instalar dependencias{'\n'}
              npm install{'\n'}
              {'\n'}
              # Configurar variables de entorno{'\n'}
              # Editar lib/supabase.ts con tus credenciales{'\n'}
              {'\n'}
              # Iniciar servidor de desarrollo{'\n'}
              npm run dev
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Scripts Disponibles</Text>
            <Text style={styles.code}>
              npm run dev          # Inicia Expo con túnel{'\n'}
              npm run android      # Inicia en Android{'\n'}
              npm run ios          # Inicia en iOS{'\n'}
              npm run web          # Inicia en web{'\n'}
              npm run lint         # Ejecuta ESLint
            </Text>
          </View>
        </View>

        {/* Database */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="cylinder.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>4. Base de Datos</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Esquema Principal</Text>
            <Text style={styles.code}>
              users{'\n'}
              ├── id (uuid, PK){'\n'}
              ├── email (text){'\n'}
              ├── full_name (text){'\n'}
              ├── role (text){'\n'}
              └── created_at (timestamp){'\n'}
              {'\n'}
              orders{'\n'}
              ├── id (uuid, PK){'\n'}
              ├── order_number (text){'\n'}
              ├── customer_name (text){'\n'}
              ├── customer_phone (text){'\n'}
              ├── status (text){'\n'}
              ├── total (numeric){'\n'}
              └── created_at (timestamp){'\n'}
              {'\n'}
              order_items{'\n'}
              ├── id (uuid, PK){'\n'}
              ├── order_id (uuid, FK){'\n'}
              ├── product_name (text){'\n'}
              ├── quantity (numeric){'\n'}
              ├── unit_price (numeric){'\n'}
              └── notes (text)
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Row Level Security (RLS)</Text>
            <Text style={styles.paragraph}>
              Todas las tablas tienen RLS habilitado. Ejemplo:
            </Text>
            <Text style={styles.code}>
              -- Política de SELECT para orders{'\n'}
              CREATE POLICY "Users can view all orders"{'\n'}
              ON orders FOR SELECT{'\n'}
              USING (auth.uid() IS NOT NULL);{'\n'}
              {'\n'}
              -- Política de INSERT{'\n'}
              CREATE POLICY "Users can create orders"{'\n'}
              ON orders FOR INSERT{'\n'}
              WITH CHECK (auth.uid() IS NOT NULL);
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Migraciones</Text>
            <Text style={styles.paragraph}>
              Las migraciones se aplican usando la herramienta apply_migration:
            </Text>
            <Text style={styles.code}>
              // Ejemplo de uso{'\n'}
              await apply_migration({'{'}
              {'\n'}  project_id: 'lgiqpypnhnkylzyhhtze',{'\n'}
              {'\n'}  name: 'add_customer_blocked_field',{'\n'}
              {'\n'}  query: `{'\n'}
              {'\n'}    ALTER TABLE customers{'\n'}
              {'\n'}    ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE;{'\n'}
              {'\n'}  `{'\n'}
              {'}'});
            </Text>
          </View>
        </View>

        {/* API Integration */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="network" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>5. Integración con APIs</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Supabase Client</Text>
            <Text style={styles.code}>
              // lib/supabase.ts{'\n'}
              import {'{'} createClient {'}'} from '@supabase/supabase-js';{'\n'}
              {'\n'}
              const supabaseUrl = 'YOUR_URL';{'\n'}
              const supabaseAnonKey = 'YOUR_KEY';{'\n'}
              {'\n'}
              export const supabase = createClient({'\n'}
              {'\n'}  supabaseUrl,{'\n'}
              {'\n'}  supabaseAnonKey{'\n'}
              );
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Operaciones CRUD</Text>
            <Text style={styles.code}>
              // SELECT{'\n'}
              const {'{'} data, error {'}'} = await supabase{'\n'}
              {'\n'}  .from('orders'){'\n'}
              {'\n'}  .select('*'){'\n'}
              {'\n'}  .eq('status', 'pending');{'\n'}
              {'\n'}
              // INSERT{'\n'}
              const {'{'} data, error {'}'} = await supabase{'\n'}
              {'\n'}  .from('orders'){'\n'}
              {'\n'}  .insert([{'{'} customer_name: 'Juan' {'}'}]);{'\n'}
              {'\n'}
              // UPDATE{'\n'}
              const {'{'} data, error {'}'} = await supabase{'\n'}
              {'\n'}  .from('orders'){'\n'}
              {'\n'}  .update({'{'} status: 'completed' {'}'}){'\n'}
              {'\n'}  .eq('id', orderId);{'\n'}
              {'\n'}
              // DELETE{'\n'}
              const {'{'} data, error {'}'} = await supabase{'\n'}
              {'\n'}  .from('orders'){'\n'}
              {'\n'}  .delete(){'\n'}
              {'\n'}  .eq('id', orderId);
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Realtime Subscriptions</Text>
            <Text style={styles.code}>
              const subscription = supabase{'\n'}
              {'\n'}  .channel('orders'){'\n'}
              {'\n'}  .on({'\n'}
              {'\n'}    'postgres_changes',{'\n'}
              {'\n'}    {'{'} event: 'INSERT', schema: 'public', table: 'orders' {'}'},
              {'\n'}    (payload) => {'{'}
              {'\n'}      console.log('New order:', payload);{'\n'}
              {'\n'}    {'}'}{'\n'}
              {'\n'}  ){'\n'}
              {'\n'}  .subscribe();
            </Text>
          </View>
        </View>

        {/* Edge Functions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="bolt.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>6. Edge Functions</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Estructura de Edge Function</Text>
            <Text style={styles.code}>
              // supabase/functions/whatsapp-webhook/index.ts{'\n'}
              import {'{'} serve {'}'} from 'https://deno.land/std@0.168.0/http/server.ts';{'\n'}
              {'\n'}
              serve(async (req) => {'{'}
              {'\n'}  // Manejar GET para verificación{'\n'}
              {'\n'}  if (req.method === 'GET') {'{'}
              {'\n'}    // Lógica de verificación{'\n'}
              {'\n'}  {'}'}{'\n'}
              {'\n'}  {'\n'}
              {'\n'}  // Manejar POST para mensajes{'\n'}
              {'\n'}  if (req.method === 'POST') {'{'}
              {'\n'}    // Lógica de procesamiento{'\n'}
              {'\n'}  {'}'}{'\n'}
              {'}'});
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Desplegar Edge Function</Text>
            <Text style={styles.code}>
              # Instalar Supabase CLI{'\n'}
              npm install -g supabase{'\n'}
              {'\n'}
              # Login{'\n'}
              supabase login{'\n'}
              {'\n'}
              # Desplegar función{'\n'}
              supabase functions deploy whatsapp-webhook{'\n'}
              {'\n'}
              # Ver logs{'\n'}
              supabase functions logs whatsapp-webhook
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Variables de Entorno</Text>
            <Text style={styles.code}>
              # Configurar secretos{'\n'}
              supabase secrets set WHATSAPP_TOKEN=your_token{'\n'}
              {'\n'}
              # Usar en la función{'\n'}
              const token = Deno.env.get('WHATSAPP_TOKEN');
            </Text>
          </View>
        </View>

        {/* Custom Hooks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="link.circle.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>7. Custom Hooks</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>useOrders</Text>
            <Text style={styles.code}>
              // hooks/useOrders.ts{'\n'}
              export function useOrders() {'{'}
              {'\n'}  const [orders, setOrders] = useState([]);{'\n'}
              {'\n'}  const [loading, setLoading] = useState(true);{'\n'}
              {'\n'}  {'\n'}
              {'\n'}  const loadOrders = async () => {'{'}
              {'\n'}    // Lógica de carga{'\n'}
              {'\n'}  {'}'};{'\n'}
              {'\n'}  {'\n'}
              {'\n'}  return {'{'} orders, loading, loadOrders {'}'};{'\n'}
              {'}'}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>useAuth</Text>
            <Text style={styles.code}>
              // contexts/AuthContext.tsx{'\n'}
              export function useAuth() {'{'}
              {'\n'}  const context = useContext(AuthContext);{'\n'}
              {'\n'}  if (!context) {'{'}
              {'\n'}    throw new Error('useAuth must be used within AuthProvider');{'\n'}
              {'\n'}  {'}'}{'\n'}
              {'\n'}  return context;{'\n'}
              {'}'}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>usePrinter</Text>
            <Text style={styles.code}>
              // hooks/usePrinter.ts{'\n'}
              export function usePrinter() {'{'}
              {'\n'}  const [isConnected, setIsConnected] = useState(false);{'\n'}
              {'\n'}  const [devices, setDevices] = useState([]);{'\n'}
              {'\n'}  {'\n'}
              {'\n'}  const scanDevices = async () => {'{'}
              {'\n'}    // Lógica de escaneo BLE{'\n'}
              {'\n'}  {'}'};{'\n'}
              {'\n'}  {'\n'}
              {'\n'}  const printReceipt = async (text: string) => {'{'}
              {'\n'}    // Lógica de impresión{'\n'}
              {'\n'}  {'}'};{'\n'}
              {'\n'}  {'\n'}
              {'\n'}  return {'{'} isConnected, devices, scanDevices, printReceipt {'}'};{'\n'}
              {'}'}
            </Text>
          </View>
        </View>

        {/* Components */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="square.stack.3d.up.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>8. Componentes Reutilizables</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>CustomDialog</Text>
            <Text style={styles.code}>
              // components/CustomDialog.tsx{'\n'}
              <CustomDialog{'\n'}
              {'\n'}  visible={'{'}dialog.visible{'}'}{'\n'}
              {'\n'}  type={'{'}dialog.type{'}'}{'\n'}
              {'\n'}  title={'{'}dialog.title{'}'}{'\n'}
              {'\n'}  message={'{'}dialog.message{'}'}{'\n'}
              {'\n'}  buttons={'{'}dialog.buttons{'}'}{'\n'}
              {'\n'}  onClose={'{'}closeDialog{'}'}{'\n'}
              />
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>IconSymbol</Text>
            <Text style={styles.code}>
              // components/IconSymbol.tsx{'\n'}
              <IconSymbol{'\n'}
              {'\n'}  ios_icon_name="cart.fill"{'\n'}
              {'\n'}  android_material_icon_name="shopping_cart"{'\n'}
              {'\n'}  size={'{'}24{'}'}{'\n'}
              {'\n'}  color={'{'}colors.primary{'}'}{'\n'}
              />
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>FloatingTabBar</Text>
            <Text style={styles.code}>
              // components/FloatingTabBar.tsx{'\n'}
              // Barra de navegación flotante{'\n'}
              // Se usa automáticamente en (tabs)/_layout.tsx
            </Text>
          </View>
        </View>

        {/* State Management */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="arrow.triangle.branch" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>9. Gestión de Estado</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Context API</Text>
            <Text style={styles.code}>
              // contexts/AuthContext.tsx{'\n'}
              const AuthContext = createContext<AuthContextType | undefined>(undefined);{'\n'}
              {'\n'}
              export function AuthProvider({'{'} children {'}'}): JSX.Element {'{'}
              {'\n'}  const [user, setUser] = useState<User | null>(null);{'\n'}
              {'\n'}  const [loading, setLoading] = useState(true);{'\n'}
              {'\n'}  {'\n'}
              {'\n'}  // Lógica de autenticación{'\n'}
              {'\n'}  {'\n'}
              {'\n'}  return ({'\n'}
              {'\n'}    <AuthContext.Provider value={'{'}{'{'} user, loading, signIn, signOut {'}'}{'}'}>
              {'\n'}      {'{'}children{'}'}
              {'\n'}    </AuthContext.Provider>{'\n'}
              {'\n'}  );{'\n'}
              {'}'}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Local Storage</Text>
            <Text style={styles.code}>
              // Usar AsyncStorage{'\n'}
              import AsyncStorage from '@react-native-async-storage/async-storage';{'\n'}
              {'\n'}
              // Guardar{'\n'}
              await AsyncStorage.setItem('key', JSON.stringify(data));{'\n'}
              {'\n'}
              // Leer{'\n'}
              const data = await AsyncStorage.getItem('key');{'\n'}
              const parsed = JSON.parse(data);{'\n'}
              {'\n'}
              // Eliminar{'\n'}
              await AsyncStorage.removeItem('key');
            </Text>
          </View>
        </View>

        {/* Testing */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="checkmark.seal.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>10. Testing y Debugging</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Debugging</Text>
            <Text style={styles.bulletPoint}>• Usa console.log extensivamente</Text>
            <Text style={styles.bulletPoint}>• React Native Debugger para inspección</Text>
            <Text style={styles.bulletPoint}>• Expo Dev Tools para logs</Text>
            <Text style={styles.bulletPoint}>• Chrome DevTools para web</Text>
            <Text style={styles.bulletPoint}>• Android Studio Logcat para Android</Text>
            <Text style={styles.bulletPoint}>• Xcode Console para iOS</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Error Handling</Text>
            <Text style={styles.code}>
              try {'{'}
              {'\n'}  const {'{'} data, error {'}'} = await supabase{'\n'}
              {'\n'}    .from('orders'){'\n'}
              {'\n'}    .select('*');{'\n'}
              {'\n'}  {'\n'}
              {'\n'}  if (error) throw error;{'\n'}
              {'\n'}  {'\n'}
              {'\n'}  return data;{'\n'}
              {'}'} catch (error) {'{'}
              {'\n'}  console.error('[Component] Error:', error);{'\n'}
              {'\n'}  // Mostrar error al usuario{'\n'}
              {'\n'}  showDialog('error', 'Error', error.message);{'\n'}
              {'}'}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Logs de Supabase</Text>
            <Text style={styles.paragraph}>
              Accede a los logs en el dashboard de Supabase:
            </Text>
            <Text style={styles.bulletPoint}>• Database logs - Consultas SQL</Text>
            <Text style={styles.bulletPoint}>• API logs - Peticiones REST</Text>
            <Text style={styles.bulletPoint}>• Edge Function logs - Ejecución de funciones</Text>
            <Text style={styles.bulletPoint}>• Auth logs - Autenticación</Text>
          </View>
        </View>

        {/* Best Practices */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="star.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>11. Mejores Prácticas</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Código Limpio</Text>
            <Text style={styles.bulletPoint}>• Usa nombres descriptivos para variables y funciones</Text>
            <Text style={styles.bulletPoint}>• Mantén funciones pequeñas y enfocadas</Text>
            <Text style={styles.bulletPoint}>• Extrae lógica compleja a custom hooks</Text>
            <Text style={styles.bulletPoint}>• Comenta código complejo</Text>
            <Text style={styles.bulletPoint}>• Usa TypeScript para type safety</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Performance</Text>
            <Text style={styles.bulletPoint}>• Usa useCallback para funciones en dependencias</Text>
            <Text style={styles.bulletPoint}>• Usa useMemo para cálculos costosos</Text>
            <Text style={styles.bulletPoint}>• Evita re-renders innecesarios</Text>
            <Text style={styles.bulletPoint}>• Optimiza imágenes</Text>
            <Text style={styles.bulletPoint}>• Usa FlatList para listas largas</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Seguridad</Text>
            <Text style={styles.bulletPoint}>• Nunca expongas credenciales en el código</Text>
            <Text style={styles.bulletPoint}>• Usa variables de entorno</Text>
            <Text style={styles.bulletPoint}>• Valida datos del usuario</Text>
            <Text style={styles.bulletPoint}>• Implementa RLS en todas las tablas</Text>
            <Text style={styles.bulletPoint}>• Sanitiza inputs</Text>
          </View>
        </View>

        {/* Deployment */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="arrow.up.doc.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>12. Despliegue</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Build con EAS</Text>
            <Text style={styles.code}>
              # Instalar EAS CLI{'\n'}
              npm install -g eas-cli{'\n'}
              {'\n'}
              # Login{'\n'}
              eas login{'\n'}
              {'\n'}
              # Configurar proyecto{'\n'}
              eas build:configure{'\n'}
              {'\n'}
              # Build para Android{'\n'}
              eas build --platform android{'\n'}
              {'\n'}
              # Build para iOS{'\n'}
              eas build --platform ios{'\n'}
              {'\n'}
              # Build para ambos{'\n'}
              eas build --platform all
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Configuración de Build</Text>
            <Text style={styles.code}>
              // eas.json{'\n'}
              {'{'}
              {'\n'}  "build": {'{'}
              {'\n'}    "development": {'{'}
              {'\n'}      "developmentClient": true,{'\n'}
              {'\n'}      "distribution": "internal"{'\n'}
              {'\n'}    {'}'},
              {'\n'}    "preview": {'{'}
              {'\n'}      "distribution": "internal"{'\n'}
              {'\n'}    {'}'},
              {'\n'}    "production": {'{'}
              {'\n'}      "autoIncrement": true{'\n'}
              {'\n'}    {'}'}{'\n'}
              {'\n'}  {'}'}{'\n'}
              {'}'}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Updates OTA</Text>
            <Text style={styles.code}>
              # Publicar update{'\n'}
              eas update --branch production{'\n'}
              {'\n'}
              # Ver updates{'\n'}
              eas update:list
            </Text>
          </View>
        </View>

        {/* Resources */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="book.fill" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>13. Recursos</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Documentación Oficial</Text>
            <Text style={styles.bulletPoint}>• Expo: https://docs.expo.dev</Text>
            <Text style={styles.bulletPoint}>• React Native: https://reactnative.dev</Text>
            <Text style={styles.bulletPoint}>• Supabase: https://supabase.com/docs</Text>
            <Text style={styles.bulletPoint}>• TypeScript: https://www.typescriptlang.org/docs</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Comunidad</Text>
            <Text style={styles.bulletPoint}>• Expo Discord</Text>
            <Text style={styles.bulletPoint}>• React Native Community</Text>
            <Text style={styles.bulletPoint}>• Supabase Discord</Text>
            <Text style={styles.bulletPoint}>• Stack Overflow</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Guía de Desarrollador v1.0
          </Text>
          <Text style={styles.footerText}>
            © 2024 Natively
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 6,
    paddingLeft: 8,
  },
  code: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: colors.text,
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
});
