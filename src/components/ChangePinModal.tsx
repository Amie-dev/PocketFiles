import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { changePin } from "@/utils/pinStorage";

type ChangePinModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function ChangePinModal({
  visible,
  onClose,
}: ChangePinModalProps) {
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);

  function cleanPin(text: string) {
    return text.replace(/[^0-9]/g, "").slice(0, 4);
  }

  function resetForm() {
    setOldPin("");
    setNewPin("");
    setConfirmPin("");
  }

  async function handleChangePin() {
    if (oldPin.length !== 4 || newPin.length !== 4 || confirmPin.length !== 4) {
      Alert.alert("Invalid PIN", "Please enter 4 digits in all fields");
      return;
    }

    if (newPin !== confirmPin) {
      Alert.alert("PIN Not Match", "New PIN and confirm PIN must be same");
      setConfirmPin("");
      return;
    }

    try {
      setLoading(true);

      const result = await changePin(oldPin, newPin);

      if (!result.success) {
        Alert.alert("Error", result.message);
        return;
      }

      Alert.alert("Success", result.message);

      resetForm();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert("Change PIN failed", message);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Ionicons name="key" size={34} color="#2563EB" />
          </View>

          <Text style={styles.title}>Change PIN</Text>

          <Text style={styles.subtitle}>
            Enter your current PIN and create a new 4 digit PIN.
          </Text>

          <TextInput
            value={oldPin}
            onChangeText={(text) => setOldPin(cleanPin(text))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            placeholder="Current PIN"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />

          <TextInput
            value={newPin}
            onChangeText={(text) => setNewPin(cleanPin(text))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            placeholder="New PIN"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />

          <TextInput
            value={confirmPin}
            onChangeText={(text) => setConfirmPin(cleanPin(text))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            placeholder="Confirm New PIN"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />

          <Pressable
            disabled={loading}
            onPress={handleChangePin}
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.pressed,
              loading && styles.disabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="save" size={20} color="#FFFFFF" />
                <Text style={styles.saveText}>Save New PIN</Text>
              </>
            )}
          </Pressable>

          <Pressable style={styles.cancelButton} onPress={handleClose}>
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
    backgroundColor: "rgba(15,23,42,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 28,
    backgroundColor: "#EFF6FF",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },

  input: {
    marginTop: 14,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    letterSpacing: 4,
  },

  saveButton: {
    marginTop: 20,
    height: 56,
    borderRadius: 20,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  saveText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  cancelButton: {
    marginTop: 14,
    alignItems: "center",
    paddingVertical: 8,
  },

  cancelText: {
    color: "#64748B",
    fontWeight: "900",
  },

  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },

  disabled: {
    opacity: 0.7,
  },
});