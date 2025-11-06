
# Android Build Memory Fix

## Problem
The application was experiencing `OutOfMemoryError: Metaspace` errors during Android compilation, specifically:

- `java.lang.OutOfMemoryError: Metaspace`
- `Task :expo-updates:kspReleaseKotlin FAILED`
- `Task :app:configureCMakeRelWithDebInfo[arm64-v8a] FAILED`
- `Task :react-native-gesture-handler:configureCMakeRelWithDebInfo[arm64-v8a] FAILED`

## Solution

### 1. gradle.properties Configuration
Created/updated `android/gradle.properties` with increased memory allocation:

**Key Changes:**
- **JVM Heap Size**: Increased from default 512MB to 4096MB (`-Xmx4096m`)
- **Metaspace Size**: Increased from default 256MB to 1024MB (`-XX:MaxMetaspaceSize=1024m`)
- **Parallel Builds**: Enabled parallel execution (`org.gradle.parallel=true`)
- **Gradle Caching**: Enabled build caching (`org.gradle.caching=true`)
- **KSP Incremental**: Enabled incremental Kotlin Symbol Processing
- **Connection Timeouts**: Increased to 180 seconds for slow connections

### 2. build.gradle Optimizations
Updated `android/app/build.gradle` with:

**Key Changes:**
- **MultiDex**: Enabled to handle large number of methods
- **Dex Options**: Set `javaMaxHeapSize` to 4GB
- **Java/Kotlin**: Updated to version 17 for better performance
- **Packaging Options**: Added conflict resolution for native libraries

### 3. Root build.gradle Configuration
Updated `android/build.gradle` with:

**Key Changes:**
- **Kotlin Version**: Updated to 1.9.22
- **Build Tools**: Updated to 34.0.0
- **Gradle Plugin**: Updated to 8.1.4
- **JavaCompile Tasks**: Configured to use 2GB heap per task

### 4. settings.gradle Optimization
Updated `android/settings.gradle` with:

**Key Changes:**
- **Worker Count**: Limited to half of available processors to prevent memory exhaustion

## How to Apply

1. **Clean Build Cache** (recommended):
   ```bash
   cd android
   ./gradlew clean
   cd ..
   ```

2. **Rebuild the App**:
   ```bash
   npx expo prebuild -p android --clean
   npx expo run:android
   ```

3. **For EAS Build**:
   ```bash
   eas build --platform android
   ```

## Memory Allocation Breakdown

| Component | Before | After | Reason |
|-----------|--------|-------|--------|
| JVM Heap | 512MB | 4096MB | Handle large project compilation |
| Metaspace | 256MB | 1024MB | Store class metadata for Kotlin/Java |
| Dex Heap | Default | 4GB | Process large number of methods |
| JavaCompile | Default | 2GB | Compile Java sources efficiently |

## Additional Optimizations

### If Still Experiencing Issues:

1. **Reduce Parallel Workers**:
   In `gradle.properties`, add:
   ```properties
   org.gradle.workers.max=2
   ```

2. **Disable Parallel Builds** (last resort):
   In `gradle.properties`, change:
   ```properties
   org.gradle.parallel=false
   ```

3. **Build Single Architecture**:
   ```bash
   npx expo run:android --variant release -- -PreactNativeArchitectures=arm64-v8a
   ```

4. **Increase System Swap** (Linux/Mac):
   Ensure your system has adequate swap space for large builds.

## Verification

After applying these changes, you should see:

✅ No `OutOfMemoryError: Metaspace` errors
✅ Successful KSP (Kotlin Symbol Processing) tasks
✅ Successful CMake configuration tasks
✅ Faster build times due to caching and parallel execution

## Troubleshooting

### Build Still Fails?

1. **Check Available RAM**: Ensure your system has at least 8GB RAM
2. **Close Other Applications**: Free up system memory
3. **Check Gradle Daemon**: Kill existing daemons with `./gradlew --stop`
4. **Clear Gradle Cache**: Delete `~/.gradle/caches/`

### Performance Issues?

If builds are slow but successful:
- Reduce `org.gradle.jvmargs` to `-Xmx3072m`
- Reduce `javaMaxHeapSize` to `"3g"`
- Enable only essential architectures in `reactNativeArchitectures`

## Notes

- These settings are optimized for modern development machines (8GB+ RAM)
- Adjust memory values based on your system's available RAM
- The configuration enables incremental builds for faster subsequent compilations
- MultiDex is enabled to handle the large number of dependencies in the project
