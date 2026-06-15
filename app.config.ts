import { ExpoConfig } from "expo/config";
const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return "com.amie.pocketfiles.dev";
  }
  if (IS_PREVIEW) {
    return "com.amie.pocketfiles.preview";
  }

  return "com.amie.pocketfiles";
};

const getAppName = () => {
  if (IS_DEV) {
    return "PocketFiles (dev)";
  }
  if (IS_PREVIEW) {
    return "PocketFiles (preview)";
  }

  return "PocketFiles";
};

export default {
  expo: {
    name: getAppName(),
    slug: "pocketfiles",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "pocketfiles",
    userInterfaceStyle: "automatic",
    updates: {
      url: "https://u.expo.dev/8f1d9e0e-dcaa-41e5-9dbd-97d43f4dec38",
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.notfound.pocketfiles",
      icon: "./assets/images/icon.png",
    },
    android: {
      package: getUniqueIdentifier(),
      adaptiveIcon: {
        backgroundColor: "#208AEF",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#397fc1",
          image: "./assets/images/icon.png",
          imageWidth: 160,
        },
      ],
      "expo-secure-store",
      "expo-sqlite",
      "expo-sharing",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "8f1d9e0e-dcaa-41e5-9dbd-97d43f4dec38",
      },
    },
  } satisfies ExpoConfig,
};
