
# Implementación de Selección de Color de la App

## Resumen

Se ha implementado exitosamente una funcionalidad para cambiar el color principal de la aplicación. Los usuarios ahora pueden elegir entre 8 temas de color diferentes desde la pantalla de configuración.

## Características Implementadas

### 1. Context de Tema (`contexts/ThemeContext.tsx`)
- **ThemeProvider**: Proveedor de contexto que gestiona el tema actual
- **useTheme**: Hook personalizado para acceder al tema en cualquier componente
- **Almacenamiento persistente**: El tema seleccionado se guarda en AsyncStorage
- **8 temas de color predefinidos**:
  - Azul (Predeterminado)
  - Verde
  - Morado
  - Naranja
  - Turquesa
  - Rojo
  - Índigo
  - Café

### 2. Pantalla de Selección de Tema (`app/settings/theme.tsx`)
- Lista visual de todos los temas disponibles
- Vista previa de colores para cada tema
- Indicador visual del tema actualmente seleccionado
- Cambio inmediato al seleccionar un nuevo tema
- Feedback háptico al cambiar de tema

### 3. Actualización de Configuración (`app/settings.tsx`)
- Nueva opción "Color de la App" en la sección de Aplicación
- Icono de pincel para identificar fácilmente la opción
- Integración con el sistema de navegación existente

### 4. Hook de Estilos Temáticos (`hooks/useThemedStyles.ts`)
- Hook que genera estilos dinámicos basados en el tema actual
- Memoización para optimizar el rendimiento
- Proporciona `colors`, `buttonStyles` y `commonStyles` temáticos

### 5. Integración en el Layout Principal (`app/_layout.tsx`)
- ThemeProvider envuelve toda la aplicación
- Carga del tema guardado al iniciar la app
- Compatibilidad con el sistema de navegación existente

## Estructura de un Tema

Cada tema incluye los siguientes colores:

```typescript
{
  background: string;        // Color de fondo principal
  text: string;             // Color de texto principal
  textSecondary: string;    // Color de texto secundario
  primary: string;          // Color primario de la app
  secondary: string;        // Color secundario
  accent: string;           // Color de acento
  card: string;             // Color de tarjetas
  highlight: string;        // Color de resaltado
  statusPending: string;    // Color para estado "Pendiente"
  statusPreparing: string;  // Color para estado "Preparando"
  statusReady: string;      // Color para estado "Listo"
  statusDelivered: string;  // Color para estado "Entregado"
  statusCancelled: string;  // Color para estado "Cancelado"
  border: string;           // Color de bordes
  success: string;          // Color de éxito
  error: string;            // Color de error
  warning: string;          // Color de advertencia
  info: string;             // Color de información
}
```

## Cómo Usar el Tema en Componentes

### Opción 1: Usar el hook useTheme directamente

```typescript
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { currentTheme } = useTheme();
  
  return (
    <View style={{ backgroundColor: currentTheme.colors.background }}>
      <Text style={{ color: currentTheme.colors.text }}>
        Hola Mundo
      </Text>
    </View>
  );
}
```

### Opción 2: Usar el hook useThemedStyles

```typescript
import { useThemedStyles } from '@/hooks/useThemedStyles';

function MyComponent() {
  const { colors, commonStyles } = useThemedStyles();
  
  return (
    <View style={commonStyles.container}>
      <Text style={commonStyles.text}>
        Hola Mundo
      </Text>
    </View>
  );
}
```

### Opción 3: Crear estilos dinámicos con StyleSheet

```typescript
import { useTheme } from '@/contexts/ThemeContext';
import { StyleSheet } from 'react-native';

function MyComponent() {
  const { currentTheme } = useTheme();
  
  const styles = StyleSheet.create({
    container: {
      backgroundColor: currentTheme.colors.background,
      padding: 16,
    },
    title: {
      color: currentTheme.colors.text,
      fontSize: 24,
    },
  });
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hola Mundo</Text>
    </View>
  );
}
```

## Compatibilidad con Código Existente

El código existente que usa `colors` de `@/styles/commonStyles` seguirá funcionando sin cambios, ya que se mantiene la exportación por defecto con el tema azul.

Para aprovechar los temas dinámicos, los componentes deben actualizarse gradualmente para usar el hook `useTheme` o `useThemedStyles`.

## Próximos Pasos Recomendados

1. **Actualizar componentes principales**: Migrar gradualmente los componentes más importantes para usar el tema dinámico
2. **Agregar más temas**: Se pueden agregar fácilmente más temas al array `COLOR_THEMES`
3. **Tema oscuro**: Implementar variantes oscuras de cada tema
4. **Personalización avanzada**: Permitir a los usuarios crear temas personalizados
5. **Sincronización en la nube**: Guardar la preferencia de tema en Supabase para sincronizar entre dispositivos

## Archivos Modificados

- ✅ `contexts/ThemeContext.tsx` (nuevo)
- ✅ `app/settings/theme.tsx` (nuevo)
- ✅ `app/settings.tsx` (actualizado)
- ✅ `hooks/useThemedStyles.ts` (nuevo)
- ✅ `app/_layout.tsx` (actualizado)
- ✅ `styles/commonStyles.ts` (actualizado para compatibilidad)

## Notas Técnicas

- El tema se guarda en AsyncStorage con la clave `@app_color_theme`
- El cambio de tema es inmediato y no requiere reiniciar la app
- Se usa memoización para optimizar el rendimiento
- Feedback háptico mejora la experiencia de usuario
- Los estilos se regeneran automáticamente cuando cambia el tema
