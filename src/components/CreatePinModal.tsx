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

import { savePin } from "../utils/pinStorage";

type CreatePinModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function CreatePinModal({
  visible,
  onClose,
  onSuccess,
}: CreatePinModalProps) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  function cleanPin(text: string) {
    return text.replace(/[^0-9]/g, "").slice(0, 4);
  }

  function resetForm() {
    setPin("");
    setConfirmPin("");
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSavePin() {
    if (pin.length !== 4 || confirmPin.length !== 4) {
      Alert.alert("Invalid PIN", "Please enter 4 digit PIN in both fields");
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert("PIN Not Match", "Both PINs must be same");
      setConfirmPin("");
      return;
    }

    await savePin(pin);

    Alert.alert("PIN Created", "Private mode PIN saved successfully");

    resetForm();
    onSuccess();
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Ionicons name="shield-checkmark" size={34} color="#2563EB" />
          </View>

          <Text style={styles.title}>Create Private PIN</Text>

          <Text style={styles.subtitle}>
            Set a 4 digit PIN to protect your private files
          </Text>

          <TextInput
            value={pin}
            onChangeText={(text) => setPin(cleanPin(text))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            placeholder="Enter PIN"
            placeholderTextColor="#CBD5E1"
            style={styles.input}
          />

          <TextInput
            value={confirmPin}
            onChangeText={(text) => setConfirmPin(cleanPin(text))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            placeholder="Confirm PIN"
            placeholderTextColor="#CBD5E1"
            style={styles.input}
          />

          <Pressable
            onPress={handleSavePin}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>Save PIN</Text>
          </Pressable>

          <Pressable onPress={handleClose} style={styles.cancelButton}>
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
    marginTop: 18,
    width: "100%",
    height: 56,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  button: {
    marginTop: 22,
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