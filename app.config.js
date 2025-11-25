
module.exports = {
  expo: {
    name: "Pedidos App",
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
      bundleIdentifier: "com.pedidosapp.mobile",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        UIBackgroundModes: [
          "fetch",
          "remote-notification"
        ],
        NSBluetoothAlwaysUsageDescription: "Esta aplicación necesita acceso a Bluetooth para conectarse a la impresora térmica y poder imprimir pedidos automáticamente.",
        NSBluetoothPeripheralUsageDescription: "Esta aplicación necesita acceso a Bluetooth para conectarse a la impresora térmica."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/64897504-f76f-4cb3-a1f3-a82b594f1121.png",
        backgroundColor: "#FFFFFF"
      },
      package: "com.pedidosapp.mobile",
      permissions: [
        "WAKE_LOCK",
        "RECEIVE_BOOT_COMPLETED",
        "FOREGROUND_SERVICE",
        "BLUETOOTH",
        "BLUETOOTH_ADMIN",
        "BLUETOOTH_CONNECT",
        "BLUETOOTH_SCAN",
        "ACCESS_FINE_LOCATION",
        "POST_NOTIFICATIONS",
        "VIBRATE"
      ],
      useNextNotificationsApi: true
    },
    web: {
      favicon: "./assets/images/64897504-f76f-4cb3-a1f3-a82b594f1121.png",
      bundler: "metro"
    },
    plugins: [
      "expo-router",
      [
        "expo-font",
        {
          fonts: []
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/64897504-f76f-4cb3-a1f3-a82b594f1121.png",
          color: "#6B9F3E",
          defaultChannel: "orders"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {
        origin: false
      },
      eas: {
        projectId: "f0dd536d-f195-4a75-9cc1-60519b5f49be"
      }
    },
    owner: "pedidosverdureria",
    scheme: "pedidos-app"
  }
};
