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
        backgroundColor: focused
          ? "#DBEAFE"
          : "transparent",
      }}
    >
      <Ionicons
        name={icon}
        size={24}
        color={color}
      />
    </View>
  );
}

export default function PublicTabsLayout() {
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

        headerRight: () => <PinModeSwitcher />,

        headerRightContainerStyle: {
          paddingRight: 14,
        },

        tabBarShowLabel: false,

        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#94A3B8",

        tabBarStyle: {
          height: 45 + insets.bottom,

          backgroundColor: "#FFFFFF",

          borderTopWidth: 1,
          borderTopColor: "#F1F5F9",

          paddingBottom: insets.bottom,
          // paddingTop: 8,
        },

        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              focused={focused}
              color={color}
              icon={
                focused
                  ? "home"
                  : "home-outline"
              }
            />
          ),
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: "Import",
          tabBarIcon: ({ focused, color }) => (
            <View
              style={{
                width: 54,
                height: 54,
                borderRadius: 27,
                backgroundColor: "#2563EB",
                justifyContent: "center",
                alignItems: "center",
                marginTop: -20,
              }}
            >
              <Ionicons
                name="add"
                size={30}
                color="#FFFFFF"
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="folder"
        options={{
          title: "Folders",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              focused={focused}
              color={color}
              icon={
                focused
                  ? "folder"
                  : "folder-outline"
              }
            />
          ),
        }}
      />
    </Tabs>
  );
}