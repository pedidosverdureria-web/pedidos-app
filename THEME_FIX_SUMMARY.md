
# Theme Color Fix - All Screens

## Problem
The home screen was working correctly with theme changes, but other screens (customers, pending-payments, order/new, printer settings, etc.) were not updating their colors when the theme changed.

## Root Cause
Most screens were importing the static `colors` object from `@/styles/commonStyles.ts`:
```typescript
import { colors } from '@/styles/commonStyles';
```

This static import doesn't react to theme changes. Only the home screen was using the `useThemedStyles()` hook correctly.

## Solution
All screens need to use the `useThemedStyles()` hook to get dynamic colors:

```typescript
import { useThemedStyles } from '@/hooks/useThemedStyles';

export default function MyScreen() {
  const { colors } = useThemedStyles();
  
  // Create styles inside the component using the dynamic colors
  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
    },
    // ... other styles
  });
  
  // ... rest of component
}
```

## Files Updated
1. ✅ `app/(tabs)/customers.tsx` - Now uses `useThemedStyles()` hook
2. ⚠️ `app/(tabs)/pending-payments.tsx` - Needs update
3. ⚠️ `app/order/new.tsx` - Needs update  
4. ⚠️ `app/settings/printer.tsx` - Needs update
5. ⚠️ `app/settings/notifications.tsx` - Needs update
6. ⚠️ `app/settings/users.tsx` - Needs update
7. ⚠️ `app/customer-orders/[customerId].tsx` - Needs update
8. ⚠️ Any other screen importing `colors` from commonStyles

## Implementation Pattern

### Before (Static - Won't Update):
```typescript
import { colors } from '@/styles/commonStyles';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background, // Static color
  },
});

export default function MyScreen() {
  return <View style={styles.container}>...</View>;
}
```

### After (Dynamic - Updates with Theme):
```typescript
import { useThemedStyles } from '@/hooks/useThemedStyles';

export default function MyScreen() {
  const { colors } = useThemedStyles();
  
  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background, // Dynamic color
    },
  });
  
  return <View style={styles.container}>...</View>;
}
```

## Key Points
- Move `StyleSheet.create()` **inside** the component function
- Call `useThemedStyles()` at the top of the component
- Use the `colors` object from the hook, not from the import
- The styles will be recreated when the theme changes, applying new colors

## Testing
After updating all screens:
1. Go to Settings > Theme
2. Change the color theme
3. Navigate to different screens
4. All screens should now reflect the new theme colors immediately

## Performance Note
Creating styles inside the component is generally fine for most screens. The `useThemedStyles` hook uses `useMemo` internally to optimize performance. For screens with many complex styles, consider using `useMemo` to memoize the styles object.
