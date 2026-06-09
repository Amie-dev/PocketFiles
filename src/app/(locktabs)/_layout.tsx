import Ionicons from "@expo/vector-icons/Ionicons";
import PinModeSwitcher from "@/components/PinModeSwitcher";
import { Tabs } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function TabIcon({
  focused,
  color,
  icon,
}: {
  focused: boolean;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: focused ? "#D1FAE5" : "transparent",
      }}
    >
      <Ionicons name={icon} size={24} color={color} />
    </View>
  );
}

export default function LockTabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: "center",
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: "#FFFFFF",
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "800",
          color: "#111827",
        },
        headerRight: () => (
          <View style={{ marginRight: 14 }}>
            <PinModeSwitcher />
          </View>
        ),

        tabBarShowLabel: false,
        tabBarActiveTintColor: "#10B981",
        tabBarInactiveTintColor: "#94A3B8",

        tabBarStyle: {
          height: 45 + insets.bottom,
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#F1F5F9",
          paddingTop: 0,
          paddingBottom: insets.bottom,
        },

        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
        },

        tabBarIconStyle: {
          marginTop: 0,
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Private",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              focused={focused}
              color={color}
              icon={focused ? "lock-closed" : "lock-closed-outline"}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: () => (
            <View
              style={{
                width: 54,
                height: 54,
                borderRadius: 27,
                backgroundColor: "#10B981",
                justifyContent: "center",
                alignItems: "center",
                marginTop: -20,
              }}
            >
              <Ionicons name="add" size={30} color="#FFFFFF" />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="folder"
        options={{
          title: "Folder",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              focused={focused}
              color={color}
              icon={focused ? "folder" : "folder-outline"}
            />
          ),
        }}
      />
    </Tabs>
  );
}