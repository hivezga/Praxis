import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Praxis",
  slug: "praxis",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "praxis",
  userInterfaceStyle: "dark",
  backgroundColor: "#0b0f17",
  android: {
    package: "com.hivezga.praxis",
    permissions: [],
  },
  plugins: [
    "expo-router",
    [
      "expo-build-properties",
      {
        android: {
          ndkVersion: "30.0.14904198",
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
});
