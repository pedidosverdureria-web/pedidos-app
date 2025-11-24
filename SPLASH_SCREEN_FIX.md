
# Splash Screen Fix - App Getting Stuck on Startup

## Problem
The app was getting stuck on the splash screen when launching the compiled APK. The app would not progress past the splash screen, making it unusable.

## Root Causes

### 1. **Blocking Bluetooth Initialization**
The `usePrinter` hook was attempting to reconnect to a saved printer immediately on mount with a 5-second timeout. This blocked the main thread during app startup.

### 2. **Blocking Push Notification Registration**
Push notification registration was happening too early in the app lifecycle, before the UI was fully rendered.

### 3. **Theme Loading Blocking**
The `ThemeContext` was setting `isLoading` to `true` by default, which could block rendering until the theme was loaded from AsyncStorage.

### 4. **Auth Loading Dependency**
The `RootLayoutContent` component was waiting for `isLoading` from `AuthContext` to become `false` before marking the app as ready. This created a dependency chain that could block the splash screen from hiding.

## Solutions Implemented

### 1. **Deferred Bluetooth Initialization**
- **File**: `hooks/usePrinter.ts`
- **Changes**:
  - Increased initialization delay from 1 second to 5 seconds
  - Reduced reconnection timeout from 5 seconds to 3 seconds
  - Added `initializationStartedRef` to prevent multiple initialization attempts
  - Wrapped initialization in try-catch to prevent errors from blocking startup
  - Made all initialization non-blocking with proper error handling

```typescript
// Defer initialization significantly to prevent blocking splash screen
const initTimer = setTimeout(() => {
  console.log('[usePrinter] Starting deferred initialization');
  requestPermissions().catch(err => {
    console.error('[usePrinter] Error requesting permissions:', err);
  });
  loadAndReconnectSavedPrinter().catch(err => {
    console.error('[usePrinter] Error loading saved printer:', err);
  });
}, 5000); // Wait 5 seconds before initializing
```

### 2. **Deferred Push Notification Registration**
- **File**: `contexts/AuthContext.tsx`
- **Changes**:
  - Increased push notification registration delay from 2 seconds to 5 seconds
  - Increased notification handler setup delay from 1.5 seconds to 3 seconds
  - Made `isLoading` resolve immediately after loading user from AsyncStorage
  - Wrapped all push notification code in try-catch blocks

```typescript
// Defer push notification registration significantly
const pushTimer = setTimeout(async () => {
  console.log('[Auth] Registering for push notifications (deferred)...');
  try {
    await registerForPushNotificationsAsync(user.role);
    console.log('[Auth] Push notifications registered successfully');
    
    // Update device activity
    await updateDeviceActivity();
  } catch (error) {
    console.error('[Auth] Error registering push notifications:', error);
    // Don't throw - this is not critical for app startup
  }
}, 5000); // Wait 5 seconds after user is loaded
```

### 3. **Non-Blocking Theme Loading**
- **File**: `contexts/ThemeContext.tsx`
- **Changes**:
  - Changed `isLoading` default from `true` to `false`
  - Made theme loading completely asynchronous and non-blocking
  - Theme loads in background without blocking UI rendering

```typescript
const [isLoading, setIsLoading] = useState(false); // Changed to false by default
```

### 4. **Simplified App Ready Logic**
- **File**: `app/_layout.tsx`
- **Changes**:
  - Removed dependency on `isLoading` and `user` from auth
  - App marks itself as ready after a minimal 100ms delay
  - Auth, theme, and printer initialization all happen in background
  - Added small delay before hiding splash screen to ensure UI is rendered

```typescript
useEffect(() => {
  async function prepare() {
    try {
      console.log('[RootLayout] Preparing app...');
      
      // Don't wait for auth to load - just mark as ready immediately
      // Auth will load in the background
      console.log('[RootLayout] Auth loading state:', isLoading);
      
      // Small delay to ensure providers are initialized
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('[RootLayout] App is ready');
      setAppIsReady(true);
    } catch (e) {
      console.error('[RootLayout] Error preparing app:', e);
      // Still mark as ready to prevent infinite loading
      setAppIsReady(true);
    }
  }

  prepare();
}, []); // Remove isLoading and user dependencies
```

### 5. **Increased Background Print Processor Delay**
- **File**: `app/_layout.tsx`
- **Changes**:
  - Increased initialization delay from 2 seconds to 3 seconds
  - This component only initializes after user is authenticated

## Timeline of Initialization

Here's the new initialization timeline:

1. **0ms**: App starts, splash screen shows
2. **100ms**: App marks itself as ready, splash screen hides
3. **100ms**: UI renders (login screen or home screen)
4. **3000ms**: Notification handlers initialize
5. **5000ms**: Bluetooth initialization starts
6. **5000ms**: Push notification registration starts (if user is logged in)
7. **Background**: Theme loads asynchronously
8. **Background**: Auth loads asynchronously

## Key Principles Applied

1. **Non-Blocking Initialization**: All heavy initialization tasks are deferred and run in the background
2. **Fail-Safe**: All initialization code is wrapped in try-catch blocks to prevent errors from blocking startup
3. **Progressive Enhancement**: The app becomes functional immediately, with features enabling progressively as they initialize
4. **User Experience First**: The splash screen hides as soon as possible, showing the UI to the user
5. **Graceful Degradation**: If any initialization fails, the app continues to work with reduced functionality

## Testing Recommendations

1. **Test on Physical Device**: Always test the compiled APK on a physical device
2. **Test Cold Start**: Close the app completely and reopen it
3. **Test with Bluetooth Off**: Ensure the app doesn't hang if Bluetooth is disabled
4. **Test with No Permissions**: Ensure the app doesn't hang if permissions are denied
5. **Test with Saved Printer**: Ensure auto-reconnection doesn't block startup
6. **Monitor Logs**: Check console logs to verify initialization timing

## Expected Behavior

- **Splash screen should hide within 200-300ms**
- **Login screen or home screen should appear immediately**
- **Bluetooth reconnection happens in background (5 seconds after startup)**
- **Push notifications register in background (5 seconds after login)**
- **App remains responsive during all initialization**

## Troubleshooting

If the app still gets stuck on the splash screen:

1. Check console logs for errors during initialization
2. Verify that `SplashScreen.hideAsync()` is being called
3. Check if any Context provider is throwing an error
4. Verify that all async operations have proper error handling
5. Test with a clean install (clear app data)

## Related Files

- `app/_layout.tsx` - Main app layout and splash screen management
- `contexts/AuthContext.tsx` - Authentication and push notifications
- `contexts/ThemeContext.tsx` - Theme management
- `hooks/usePrinter.ts` - Bluetooth printer initialization
- `utils/pushNotifications.ts` - Push notification utilities

## Notes

- All initialization delays are configurable and can be adjusted if needed
- The app prioritizes showing the UI quickly over having all features ready immediately
- Background initialization ensures features become available progressively
- Error handling ensures the app never gets stuck, even if initialization fails
