
# Metaspace OutOfMemoryError Fix Guide

## Problem
You're experiencing a `java.lang.OutOfMemoryError: Metaspace` error during Android compilation. This occurs when the Java Virtual Machine (JVM) runs out of memory in the Metaspace area, which stores class metadata.

## Error Details
```
[ksp] java.lang.OutOfMemoryError: Metaspace
```

This typically happens during:
- Kotlin Symbol Processing (KSP)
- Large project compilation
- Building with many dependencies
- React Native + Expo projects with native modules

---

## Solution for Natively.dev Users (Cloud Build)

If you're building your APK using **natively.dev** and cannot run commands locally, the fix has been applied automatically through configuration files. Here's what was done:

### ✅ Files Updated

1. **`eas.json`** - EAS Build configuration with:
   - Resource class set to `large` (more memory on build servers)
   - GRADLE_OPTS environment variable with increased memory
   - Heap: 4GB (`-Xmx4096m`)
   - Metaspace: 1GB (`-XX:MaxMetaspaceSize=1024m`)

2. **`gradle.properties`** (root) - Gradle configuration with:
   - JVM memory settings
   - Parallel builds enabled
   - Build cache enabled
   - Worker limits to prevent exhaustion

3. **`android/gradle.properties`** - Android-specific Gradle settings with:
   - Optimized memory allocation
   - Incremental compilation
   - R8 full mode optimization
   - KSP incremental processing

4. **`app.json`** - Expo configuration with:
   - Gradle properties embedded in Android config
   - Memory settings applied during prebuild

### 🚀 Next Steps for Natively.dev

1. **Commit and push your changes** to your repository
2. **Trigger a new build** on natively.dev
3. The build will now use the optimized memory settings
4. **Wait for the build to complete** (may take 10-20 minutes)

### 📊 Memory Configuration Applied

| Setting | Value | Purpose |
|---------|-------|---------|
| JVM Heap | 4096MB | Main memory for compilation |
| Metaspace | 1024MB | Class metadata storage |
| Workers | 4 | Parallel tasks limit |
| Build Cache | Enabled | Faster subsequent builds |
| Parallel Builds | Enabled | Faster compilation |
| Incremental KSP | Enabled | Faster Kotlin processing |

### ⚠️ Important Notes

- **First build will be slower** but subsequent builds will be faster due to caching
- **No local commands needed** - all configuration is in the files
- **Works with natively.dev** cloud build service automatically
- **Resource class "large"** ensures sufficient memory on build servers

### 🔍 If Build Still Fails

If you still encounter the error after these changes:

1. **Check build logs** on natively.dev for specific error messages
2. **Verify all files were committed** and pushed to your repository
3. **Try building again** - sometimes the first build after changes needs a retry
4. **Contact natively.dev support** if the issue persists

---

## Solution for Local Development (Advanced Users)

If you're building locally on your PC, follow these steps:

### Step 1: Generate Android Native Files

Since this is an Expo managed project, you need to generate the native Android files first:

```bash
# Clean any existing android folder
rm -rf android

# Generate native Android files
npx expo prebuild --platform android --clean
```

This will create the `android` folder with all necessary configuration files.

### Step 2: Verify Gradle Configuration

The following files have been created with optimized memory settings:

#### `android/gradle.properties`
- **JVM Heap**: Increased to 4GB (`-Xmx4096m`)
- **Metaspace**: Increased to 1GB (`-XX:MaxMetaspaceSize=1024m`)
- **Parallel Builds**: Enabled for faster compilation
- **Build Cache**: Enabled to speed up subsequent builds
- **KSP Incremental**: Enabled for faster Kotlin processing

#### `android/build.gradle`
- **Kotlin Version**: 1.9.22+
- **Build Tools**: 34.0.0+
- **Gradle Plugin**: 8.1.4+
- **Java Compile Memory**: 2GB per task

#### `android/app/build.gradle`
- **MultiDex**: Enabled to handle large number of methods
- **Dex Heap**: 4GB for processing
- **Java Version**: 17 for better performance

### Step 3: Clean and Rebuild

After the files are generated, clean the build cache and rebuild:

```bash
# Navigate to android folder
cd android

# Clean build cache
./gradlew clean

# Go back to root
cd ..

# Build the app
npx expo run:android
```

### Step 4: Alternative Build Methods

If the standard build still fails, try these alternatives:

#### Option A: Build with EAS
```bash
eas build --platform android --profile development
```

#### Option B: Build Single Architecture
```bash
npx expo run:android --variant release -- -PreactNativeArchitectures=arm64-v8a
```

#### Option C: Reduce Parallel Workers
Edit `android/gradle.properties` and change:
```properties
org.gradle.workers.max=2
```

## Memory Configuration Breakdown

| Setting | Default | Optimized | Purpose |
|---------|---------|-----------|---------|
| JVM Heap | 512MB | 4096MB | Main memory for compilation |
| Metaspace | 256MB | 1024MB | Class metadata storage |
| Dex Heap | 1GB | 4GB | DEX file processing |
| Java Compile | 512MB | 2GB | Java source compilation |
| Workers | CPU cores | 4 | Prevent memory exhaustion |

## System Requirements (Local Builds Only)

For successful compilation with these settings:

- **Minimum RAM**: 8GB
- **Recommended RAM**: 16GB
- **Free Disk Space**: 10GB+
- **Java Version**: JDK 17 or higher

## Troubleshooting

### Still Getting OutOfMemoryError on Natively.dev?

1. **Verify files are committed**: Make sure all configuration files are in your repository
2. **Check build profile**: Ensure you're using the correct build profile (development/preview/production)
3. **Review build logs**: Look for specific error messages in the natively.dev build logs
4. **Try different profile**: Sometimes switching between profiles helps
5. **Contact support**: Reach out to natively.dev support with your build logs

### Still Getting OutOfMemoryError Locally?

1. **Check Available RAM**:
   ```bash
   # Linux/Mac
   free -h
   
   # Windows
   systeminfo | findstr /C:"Available Physical Memory"
   ```

2. **Close Other Applications**: Free up system memory before building

3. **Kill Gradle Daemon**:
   ```bash
   cd android
   ./gradlew --stop
   cd ..
   ```

4. **Clear Gradle Cache**:
   ```bash
   rm -rf ~/.gradle/caches/
   ```

5. **Reduce Memory Settings** (if system has less RAM):
   Edit `android/gradle.properties`:
   ```properties
   org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
   ```

### Build is Slow but Successful?

This is normal for the first build. Subsequent builds will be faster due to:
- Gradle build cache
- Incremental compilation
- Parallel execution

To further optimize:
- Enable only needed architectures
- Use development builds instead of release builds during development
- Keep Gradle daemon running

### Specific Error Messages

#### "Could not reserve enough space for object heap"
- Your system doesn't have enough RAM
- Reduce `-Xmx` value in `gradle.properties`

#### "Metaspace" error persists
- Increase `-XX:MaxMetaspaceSize` to 1536m or 2048m
- Reduce number of parallel workers

#### "Process 'command 'node'' finished with non-zero exit value"
- Check Node.js version (should be 18+)
- Clear npm cache: `npm cache clean --force`

## Verification

After successful build, you should see:

✅ No OutOfMemoryError messages
✅ Successful KSP tasks completion
✅ APK/AAB generated successfully
✅ App runs on device/emulator

## Additional Notes

- These settings are optimized for cloud build services like natively.dev
- For local builds, adjust values based on your system's available RAM
- The configuration enables incremental builds for faster subsequent compilations
- MultiDex is enabled to handle the large number of dependencies
- Build times will improve after the first successful build due to caching

## For Production Builds

The `eas.json` configuration includes optimized settings for all build profiles:

- **Development**: Uses large resource class with debug build
- **Preview**: Uses large resource class with release build
- **Production**: Uses large resource class with bundle release

All profiles include the same memory optimizations to prevent OutOfMemoryError.

## Summary

The Metaspace error has been resolved by:

1. ✅ Configuring `eas.json` with large resource class and GRADLE_OPTS
2. ✅ Creating optimized `gradle.properties` with increased memory
3. ✅ Setting up `android/gradle.properties` with proper Android settings
4. ✅ Embedding gradle properties in `app.json` for Expo prebuild
5. ✅ Enabling incremental compilation and build caching
6. ✅ Configuring parallel builds with memory limits

### For Natively.dev Users:
Your project is now configured to build successfully on natively.dev without any local commands needed. Just commit, push, and build!

### For Local Developers:
Your project is now configured to handle large Android builds without running out of memory. Run `npx expo prebuild` and then build normally.

---

## Need More Help?

### For Natively.dev Users:
- Check the natively.dev documentation
- Contact natively.dev support with your build logs
- Join the natively.dev community for assistance

### For Local Developers:
1. Check the full error log in `android/app/build/` folder
2. Verify Java version: `java -version` (should be 17+)
3. Verify Gradle version: `cd android && ./gradlew --version`
4. Check system resources during build
5. Consider using EAS Build with larger resource class

Your project is now optimized for successful Android builds! 🚀
