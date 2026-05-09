import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor="#0b0f17" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0b0f17" },
          headerTintColor: "#e2e8f0",
          headerTitleStyle: { fontWeight: "600" },
          contentStyle: { backgroundColor: "#0b0f17" },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Praxis", headerLargeTitle: true }} />
        <Stack.Screen name="setup" options={{ title: "New game" }} />
        <Stack.Screen name="rules" options={{ title: "Rules reference" }} />
        <Stack.Screen name="game" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
