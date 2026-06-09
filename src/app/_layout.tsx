import { Stack } from "expo-router";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { LockWatcher } from "@/components/LockWatcher";
import { LockProvider } from "@/context/LockProvider";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LockProvider>
        <LockWatcher />

        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(publictabs)" />
            <Stack.Screen name="(locktabs)" />

            <Stack.Screen
              name="files/[id]/index"
              options={{
                headerShown: true,
                title: "File Details",
              }}
            />
            <Stack.Screen
              name="files/[id]/edit"
              options={{
                headerShown: true,
                title: "File Edit",
              }}
            />
            <Stack.Screen
              name="folders/[id]/index"
              options={{
                headerShown: true,
                title: "Folder ",
              }}
            />
          </Stack>
        </View>
      </LockProvider>
    </SafeAreaProvider>
  );
}