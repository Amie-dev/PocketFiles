import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { checkPin } from "../utils/pinStorage";

type VerifyPinModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function VerifyPinModal({
  visible,
  onClose,
  onSuccess,
}: VerifyPinModalProps) {
  const [pin, setPin] = useState("");

  function resetAndClose() {
    setPin("");
    onClose();
  }

  function cleanPin(text: string) {
    return text.replace(/[^0-9]/g, "").slice(0, 4);
  }

  async function handleVerifyPin() {
    if (pin.length !== 4) {
      Alert.alert("Invalid PIN", "Please enter 4 digit PIN");
      return;
    }

    const isCorrect = await checkPin(pin);

    if (!isCorrect) {
      Alert.alert("Wrong PIN", "Please enter correct PIN");
      setPin("");
      return;
    }

    setPin("");
    onSuccess();
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Ionicons name="lock-closed" size={34} color="#2563EB" />
          </View>

          <Text style={styles.title}>Unlock Private Mode</Text>

          <Text style={styles.subtitle}>
            Enter your 4 digit PIN to access private files
          </Text>

          <TextInput
            value={pin}
            onChangeText={(text) => setPin(cleanPin(text))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            placeholder="••••"
            placeholderTextColor="#CBD5E1"
            style={styles.input}
          />

          <Pressable
            onPress={handleVerifyPin}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>Unlock</Text>
          </Pressable>

          <Pressable onPress={resetAndClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },

  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
  },

  iconBox: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
  },

  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#64748B",
    textAlign: "center",
  },

  input: {
    marginTop: 24,
    width: "100%",
    height: 58,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    textAlign: "center",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 12,
    color: "#111827",
  },

  button: {
    marginTop: 20,
    width: "100%",
    height: 54,
    borderRadius: 18,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  cancelButton: {
    marginTop: 16,
    paddingVertical: 6,
  },

  cancelText: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "700",
  },
});