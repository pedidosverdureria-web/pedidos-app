
# Expo Font Plugin Resolution Fix

## Problem
The EAS build was failing with the error:
```
Failed to resolve plugin for module "expo-font" relative to "C:\Users\rhenr\Documents\app_pedidos_v2\3-b9024a41d932"
```

## Solution Implemented

### 1. Converted `app.json` to `app.config.js`
- **Why**: Using `app.config.js` instead of `app.json` provides better control over plugin resolution and allows for dynamic configuration
- **What Changed**: 
  - Deleted `app.json`
  - Created `app.config.js` with the same configuration but in JavaScript format
  - Updated the `expo-font` plugin configuration to include an explicit configuration object

### 2. Updated `expo-font` Plugin Configuration
Changed from:
```javascript
"expo-font"
```

To:
```javascript
[
  "expo-font",
  {
    fonts: []
  }
]
```

This explicit configuration helps EAS properly resolve the plugin during the build process.

### 3. Updated `eas.json`
- Added `cli` configuration with version requirements
- Ensured all build profiles explicitly specify `buildType: "apk"` for Android
- Changed production build from `bundleRelease` to `assembleRelease` to generate APK instead of AAB

## How to Build Your APK Now

### Prerequisites
1. Make sure you have EAS CLI installed globally:
   ```bash
   npm install -g eas-cli
   ```

2. Make sure you're logged into your Expo account:
   ```bash
   eas login
   ```

### Building the APK

#### Option 1: Production Build (Recommended)
```bash
eas build --platform android --profile production
```

#### Option 2: Preview Build (For Testing)
```bash
eas build --platform android --profile preview
```

#### Option 3: Development Build
```bash
eas build --platform android --profile development
```

### What Happens During Build
1. EAS will upload your project to their servers
2. The build will run on EAS's cloud infrastructure
3. You'll see progress in your terminal
4. Once complete, you'll get a download link for your APK

### After Build Completes
1. You'll receive a URL to download the APK
2. Download the APK file to your computer
3. Transfer it to your Android phone via:
   - USB cable
   - Email
   - Cloud storage (Google Drive, Dropbox, etc.)
   - Direct download on phone (if you have the link)

### Installing on Your Phone
1. On your Android phone, go to Settings > Security
2. Enable "Install from Unknown Sources" or "Install Unknown Apps"
3. Navigate to where you saved the APK
4. Tap the APK file
5. Follow the installation prompts

## Verification
To verify the configuration is correct, run:
```bash
npx expo config --type public
```

This should now work without errors and show your app configuration.

## Additional Notes

### Why This Error Occurred
- Expo 54 has stricter plugin resolution requirements
- EAS CLI sometimes has issues with implicit plugin configurations
- The `app.json` format can be less flexible for complex plugin configurations

### Benefits of `app.config.js`
- Dynamic configuration based on environment variables
- Better error handling
- More explicit plugin configuration
- Easier to debug

### If You Still Have Issues
1. Clear your local cache:
   ```bash
   npx expo start -c
   ```

2. Delete node_modules and reinstall:
   ```bash
   rm -rf node_modules
   npm install
   ```

3. Make sure all dependencies are up to date:
   ```bash
   npx expo install --fix
   ```

## Build Profile Differences

### Development
- Includes development tools
- Larger file size
- Easier debugging
- Not optimized

### Preview
- Similar to production
- Good for testing before release
- Smaller than development
- More optimized

### Production
- Fully optimized
- Smallest file size
- No development tools
- Ready for distribution

## Next Steps
1. Run `eas build --platform android --profile production`
2. Wait for the build to complete (usually 10-20 minutes)
3. Download the APK from the provided link
4. Install on your Android device
5. Test all functionality

## Troubleshooting

### If build fails with memory errors:
The `eas.json` already includes memory optimization settings, but if you still have issues:
- Use the `medium` resource class (already configured)
- The Gradle settings are already optimized for memory

### If build fails with plugin errors:
- Make sure `expo-font` is installed: `npm install expo-font`
- Run `npx expo install --fix` to ensure all dependencies are compatible

### If you can't install the APK on your phone:
- Make sure "Install from Unknown Sources" is enabled
- Check that you have enough storage space
- Try restarting your phone

## Important Files Modified
1. ✅ `app.config.js` - Created (replaces app.json)
2. ✅ `eas.json` - Updated with better configuration
3. ❌ `app.json` - Deleted (replaced by app.config.js)

All changes are backward compatible and your app functionality remains unchanged.
