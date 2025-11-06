
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

const RECEIPT_LOGO_KEY = '@receipt_logo';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  logoPreviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    minHeight: 200,
  },
  logoImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
  },
  noLogoText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonSecondary: {
    backgroundColor: colors.secondary,
  },
  buttonDanger: {
    backgroundColor: colors.error,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: colors.info + '20',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  warningBox: {
    backgroundColor: '#F59E0B20',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  warningText: {
    fontSize: 14,
    color: '#F59E0B',
    lineHeight: 20,
  },
});

export default function ReceiptLogoScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [logoUri, setLogoUri] = useState<string | null>(null);

  const loadLogo = useCallback(async () => {
    try {
      console.log('[ReceiptLogo] Loading logo from storage...');
      const savedLogo = await AsyncStorage.getItem(RECEIPT_LOGO_KEY);
      if (savedLogo) {
        setLogoUri(savedLogo);
        console.log('[ReceiptLogo] Logo loaded successfully');
      } else {
        console.log('[ReceiptLogo] No logo found');
      }
    } catch (error) {
      console.error('[ReceiptLogo] Error loading logo:', error);
    }
  }, []);

  useEffect(() => {
    loadLogo();
  }, [loadLogo]);

  const handleSelectFromGallery = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permiso Requerido',
          'Se necesita permiso para acceder a la galería de fotos',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setLoading(true);
        const uri = result.assets[0].uri;
        
        // Save to AsyncStorage
        await AsyncStorage.setItem(RECEIPT_LOGO_KEY, uri);
        setLogoUri(uri);
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Logo Guardado',
          'El logo del recibo se guardó correctamente',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[ReceiptLogo] Error selecting image:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error',
        'No se pudo seleccionar la imagen: ' + (error as Error).message,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permiso Requerido',
          'Se necesita permiso para acceder a la cámara',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setLoading(true);
        const uri = result.assets[0].uri;
        
        // Save to AsyncStorage
        await AsyncStorage.setItem(RECEIPT_LOGO_KEY, uri);
        setLogoUri(uri);
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Logo Guardado',
          'El logo del recibo se guardó correctamente',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[ReceiptLogo] Error taking photo:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error',
        'No se pudo tomar la foto: ' + (error as Error).message,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLogo = () => {
    Alert.alert(
      'Eliminar Logo',
      '¿Estás seguro que deseas eliminar el logo del recibo?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(RECEIPT_LOGO_KEY);
              setLogoUri(null);
              
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(
                'Logo Eliminado',
                'El logo del recibo se eliminó correctamente',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('[ReceiptLogo] Error removing logo:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert(
                'Error',
                'No se pudo eliminar el logo',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Logo del Recibo',
          headerShown: true,
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#fff',
        }}
      />
      <ScrollView style={styles.content}>
        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Logo del Recibo</Text>
          <Text style={styles.sectionDescription}>
            Selecciona una imagen que se mostrará como logo en todos los recibos impresos. 
            Este logo es independiente de la imagen de perfil de la aplicación.
          </Text>
        </View>

        {/* Logo Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vista Previa</Text>
          
          <View style={styles.logoPreviewContainer}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : logoUri ? (
              <Image
                source={{ uri: logoUri }}
                style={styles.logoImage}
                resizeMode="contain"
              />
            ) : (
              <>
                <IconSymbol name="photo" size={64} color={colors.textSecondary} />
                <Text style={styles.noLogoText}>No hay logo seleccionado</Text>
              </>
            )}
          </View>

          {logoUri && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                ✓ Logo configurado correctamente. Este logo se mostrará en todos los recibos cuando la opción &quot;Incluir logo&quot; esté activada en la configuración de impresora.
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones</Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={handleSelectFromGallery}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Seleccionar desde Galería</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handleTakePhoto}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Tomar Foto</Text>
          </TouchableOpacity>

          {logoUri && (
            <TouchableOpacity
              style={[styles.button, styles.buttonDanger]}
              onPress={handleRemoveLogo}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Eliminar Logo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Important Note */}
        <View style={styles.section}>
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠️ Nota Importante: Actualmente, las impresoras térmicas Bluetooth no soportan la impresión de imágenes directamente. 
              El logo se mostrará como texto &quot;[LOGO]&quot; en los recibos impresos. 
              Esta funcionalidad está preparada para futuras actualizaciones que permitan la impresión de imágenes.
            </Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instrucciones</Text>
          <Text style={styles.sectionDescription}>
            1. Selecciona una imagen desde tu galería o toma una foto nueva{'\n'}
            2. Ajusta la imagen si es necesario{'\n'}
            3. El logo se guardará automáticamente{'\n'}
            4. Asegúrate de activar &quot;Incluir logo&quot; en la configuración de impresora{'\n'}
            5. El logo aparecerá en todos los recibos: auto-impresión, impresión manual, consultas y pagos
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
