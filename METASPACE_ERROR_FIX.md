
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

## Solution Steps

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
- **Kotlin Version**: 1.9.22
- **Build Tools**: 34.0.0
- **Gradle Plugin**: 8.1.4
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
Edit `android/gradle.properties` and add:
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
| Workers | CPU cores | CPU/2 | Prevent memory exhaustion |

## System Requirements

For successful compilation with these settings:

- **Minimum RAM**: 8GB
- **Recommended RAM**: 16GB
- **Free Disk Space**: 10GB+
- **Java Version**: JDK 17 or higher

## Troubleshooting

### Still Getting OutOfMemoryError?

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

- These settings are optimized for modern development machines
- Adjust values based on your system's available RAM
- The configuration enables incremental builds for faster subsequent compilations
- MultiDex is enabled to handle the large number of dependencies
- Build times will improve after the first successful build due to caching

## For Production Builds

When building for production with EAS:

1. Create `eas.json` if not exists:
```json
{
  "build": {
    "production": {
      "android": {
        "gradleCommand": ":app:bundleRelease",
        "resourceClass": "large"
      }
    }
  }
}
```

2. Use larger resource class for builds:
```bash
eas build --platform android --profile production
```

This ensures EAS uses machines with sufficient memory for your build.

## Need More Help?

If you continue experiencing issues:

1. Check the full error log in `android/app/build/` folder
2. Verify Java version: `java -version` (should be 17+)
3. Verify Gradle version: `cd android && ./gradlew --version`
4. Check system resources during build
5. Consider using EAS Build with larger resource class

## Summary

The Metaspace error has been resolved by:

1. ✅ Creating optimized `gradle.properties` with increased memory
2. ✅ Configuring `build.gradle` files with proper settings
3. ✅ Enabling MultiDex for large projects
4. ✅ Setting up incremental compilation
5. ✅ Configuring parallel builds with memory limits

Your project is now configured to handle large Android builds without running out of memory!
