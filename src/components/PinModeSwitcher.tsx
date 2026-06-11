import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import CreatePinModal from "@/components/CreatePinModal";
import VerifyPinModal from "@/components/VerifyPinModal";
import { useLock } from "@/context/LockProvider";
import { hasPin } from "@/utils/pinStorage";

export default function PinModeSwitcher() {
  const { isLocked, goPrivate, goPublic } = useLock();

  const [isPinCreated, setIsPinCreated] = useState(false);
  const [showCreatePin, setShowCreatePin] = useState(false);
  const [showVerifyPin, setShowVerifyPin] = useState(false);

  useEffect(() => {
    checkPinStatus();
  }, []);

  async function checkPinStatus() {
    const exists = await hasPin();
    setIsPinCreated(exists);
  }

  function handlePress() {
    if (isLocked) {
      goPublic();
      router.replace("/(publictabs)");
      return;
    }

    if (isPinCreated) {
      setShowVerifyPin(true);
    } else {
      setShowCreatePin(true);
    }
  }

  function handleSuccess() {
    goPrivate();
    router.replace("/(locktabs)");
  }

  return (
    <View>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.button,
          isLocked && styles.privateButton,
          pressed && styles.buttonPressed,
        ]}
      >
        <View
          style={[
            styles.iconCircle,
            isLocked && styles.privateIconCircle,
          ]}
        >
          <Ionicons
            name={isLocked ? "lock-open" : "lock-closed"}
            size={22}
            color={isLocked ? "#10B981" : "#4b5d82"}
          />
        </View>
      </Pressable>

      <CreatePinModal
        visible={showCreatePin}
        onClose={() => setShowCreatePin(false)}
        onSuccess={() => {
          setIsPinCreated(true);
          handleSuccess();
        }}
      />

      <VerifyPinModal
        visible={showVerifyPin}
        onClose={() => setShowVerifyPin(false)}
        onSuccess={handleSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  privateButton: {
    borderColor: "#A7F3D0",
  },

  buttonPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.85,
  },

  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  privateIconCircle: {
    backgroundColor: "#ECFDF5",
  },
});