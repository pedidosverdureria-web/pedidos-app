
module.exports = {
  expo: {
    name: "pedidos-app",
    slug: "pedidos-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/64897504-f76f-4cb3-a1f3-a82b594f1121.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/64897504-f76f-4cb3-a1f3-a82b594f1121.png",
      resizeMode: "contain",
      backgroundColor: "#FFFFFF"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.anonymous.Natively",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        UIBackgroundModes: [
          "fetch",
          "remote-notification",
          "processing",
          "audio"
        ],
        NSBluetoothAlwaysUsageDescription: "Esta aplicación necesita acceso a Bluetooth para conectarse a la impresora térmica y poder imprimir pedidos automáticamente.",
        NSBluetoothPeripheralUsageDescription: "Esta aplicación necesita acceso a Bluetooth para conectarse a la impresora térmica.",
        BGTaskSchedulerPermittedIdentifiers: [
          "com.anonymous.Natively.background-auto-print",
          "com.anonymous.Natively.background-fetch"
        ]
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/64897504-f76f-4cb3-a1f3-a82b594f1121.png",
        backgroundColor: "#FFFFFF"
      },
      edgeToEdgeEnabled: true,
      package: "com.order.wsp",
      permissions: [
        "WAKE_LOCK",
        "RECEIVE_BOOT_COMPLETED",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_DATA_SYNC",
        "BLUETOOTH",
        "BLUETOOTH_ADMIN",
        "BLUETOOTH_CONNECT",
        "BLUETOOTH_SCAN",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "POST_NOTIFICATIONS",
        "SCHEDULE_EXACT_ALARM",
        "USE_EXACT_ALARM",
        "REQUEST_IGNORE_BATTERY_OPTIMIZATIONS",
        "SYSTEM_ALERT_WINDOW",
        "DISABLE_KEYGUARD",
        "VIBRATE",
        "USE_FULL_SCREEN_INTENT"
      ],
      useNextNotificationsApi: true,
      gradleProperties: {
        "org.gradle.jvmargs": "-Xmx6144m -XX:MaxMetaspaceSize=2048m -XX:MetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8 -XX:+UseG1GC",
        "org.gradle.parallel": "false",
        "org.gradle.caching": "true",
        "org.gradle.daemon": "true",
        "org.gradle.workers.max": "2",
        "android.enableR8.fullMode": "true",
        "kotlin.incremental": "true",
        "ksp.incremental": "true",
        "org.gradle.vfs.watch": "false",
        "android.lint.checkReleaseBuilds": "false",
        "android.lint.abortOnError": "false",
        "android.lint.ignoreWarnings": "true",
        "android.lint.checkAllWarnings": "false",
        "android.lint.warningsAsErrors": "false",
        "android.lint.disable": "all",
        "android.lintOptions.checkReleaseBuilds": "false",
        "android.lintOptions.abortOnError": "false",
        "android.lintOptions.ignoreWarnings": "true"
      }
    },
    web: {
      favicon: "./assets/images/64897504-f76f-4cb3-a1f3-a82b594f1121.png",
      bundler: "metro"
    },
    plugins: [
      [
        "expo-font",
        {
          fonts: []
        }
      ],
      "expo-router",
      "expo-web-browser",
      [
        "expo-notifications",
        {
          icon: "./assets/images/64897504-f76f-4cb3-a1f3-a82b594f1121.png",
          color: "#6B9F3E",
          defaultChannel: "orders",
          sounds: [],
          enableBackgroundRemoteNotifications: true,
          androidMode: "default",
          androidCollapsedTitle: "Nuevo Pedido"
        }
      ],
      [
        "expo-background-fetch",
        {
          android: {
            minimumInterval: 1
          }
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {},
      eas: {
        projectId: "f0dd536d-f195-4a75-9cc1-60519b5f49be"
      }
    },
    owner: "pedidosverdureria",
    scheme: "Pedidos"
  }
};
