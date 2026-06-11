import ChangePinModal from "@/components/ChangePinModal";
import Ionicons from "@expo/vector-icons/Ionicons";
import { eq } from "drizzle-orm";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { File } from "expo-file-system";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { db } from "../../../db/database";
import { FileItem, filesTable, Folder, foldersTable } from "../../../db/schema";
import migrations from "../../../drizzle/migrations";

export default function PrivateFolderScreen() {
  const { success, error } = useMigrations(db, migrations);

  const [folders, setFolders] = useState<Folder[]>([]);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [isPrivateFolder, setIsPrivateFolder] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isChangePin, setIsChangePin] = useState(false);

  // Load private folders
  async function loadFolders() {
    const result = await db
      .select()
      .from(foldersTable)
      .where(eq(foldersTable.isPrivate, true));

    setFolders(result.reverse());
  }

  useFocusEffect(
    useCallback(() => {
      if (success) {
        loadFolders();
      }
    }, [success])
  );

  // Create private/public folder
  async function createFolder() {
    if (!folderName.trim()) {
      Alert.alert("Folder name required", "Please enter folder name");
      return;
    }

    try {
      setLoading(true);

      const now = new Date().toISOString();

      await db.insert(foldersTable).values({
        name: folderName.trim(),
        parentId: null,
        isPrivate: isPrivateFolder,
        createdAt: now,
        updatedAt: now,
      });

      setFolderName("");
      setIsPrivateFolder(true);
      setOpenCreateModal(false);
      await loadFolders();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert("Create failed", message);
    } finally {
      setLoading(false);
    }
  }

  // Delete folder and all files inside
  async function deleteFolder(folder: Folder) {
    Alert.alert(
      "Delete Folder",
      `Delete "${folder.name}" and all files inside it?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              const folderFiles: FileItem[] = await db
                .select()
                .from(filesTable)
                .where(eq(filesTable.folderId, folder.id));

              for (const item of folderFiles) {
                if (item.localUri) {
                  const localFile = new File(item.localUri);

                  if (localFile.exists) {
                    await localFile.delete();
                  }
                }
              }

              await db
                .delete(filesTable)
                .where(eq(filesTable.folderId, folder.id));

              await db
                .delete(foldersTable)
                .where(eq(foldersTable.id, folder.id));

              await loadFolders();
            } catch (error) {
              const message =
                error instanceof Error ? error.message : String(error);

              Alert.alert("Delete failed", message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }

  // Error UI
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Migration error: {error.message}</Text>
      </View>
    );
  }

  // Loading UI
  if (!success) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#10B981" />
        <Text style={styles.loadingText}>Migration is in progress...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Private Folders</Text>

          <Text style={styles.subtitle}>
            {folders.length} private folder{folders.length === 1 ? "" : "s"}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            disabled={loading}
            onPress={() => setOpenCreateModal(true)}
            style={({ pressed }) => [
              styles.headerAddButton,
              pressed && styles.pressed,
              loading && styles.disabled,
            ]}
          >
            <Ionicons name="add" size={26} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* Folder list */}
      <FlatList
        data={folders}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.infoCard}>
            <View style={styles.infoIconBox}>
              <Ionicons name="lock-closed" size={26} color="#10B981" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Secure private folders</Text>

              <Text style={styles.infoSubtitle}>
                Files inside private folders are protected by your PIN.
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="folder-open-outline" size={46} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No private folders yet</Text>
            <Text style={styles.emptyText}>
              Tap the + button to create your first private folder.
            </Text>
          </View>
        }
        ListFooterComponent={
          <Pressable
            onPress={() => setIsChangePin(true)}
            style={({ pressed }) => [
              styles.changePinButton,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.changePinIconBox}>
              <Ionicons name="key-outline" size={22} color="#10B981" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.changePinTitle}>Change PIN</Text>
              <Text style={styles.changePinSubtitle}>
                Update your private vault security PIN
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </Pressable>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/folders/${item.id}`)}
            style={({ pressed }) => [
              styles.folderCard,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.folderIcon}>
              <Ionicons name="folder" size={30} color="#10B981" />
            </View>

            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={styles.folderName}>
                {item.name}
              </Text>

              <Text style={styles.folderMeta}>Private folder</Text>
            </View>

            <Pressable
              onPress={() => deleteFolder(item)}
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </Pressable>
          </Pressable>
        )}
      />

      {/* Change PIN modal */}
      <ChangePinModal
        visible={isChangePin}
        onClose={() => setIsChangePin(false)}
      />

      {/* Create folder modal */}
      <Modal
        visible={openCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <Ionicons name="folder" size={34} color="#10B981" />
            </View>

            <Text style={styles.modalTitle}>Create Folder</Text>

            <Text style={styles.modalSubtitle}>
              Create a folder for private files.
            </Text>

            <TextInput
              value={folderName}
              onChangeText={setFolderName}
              placeholder="Folder name"
              placeholderTextColor="#94A3B8"
              style={styles.modalInput}
              autoFocus
            />

            {/* Privacy switch */}
            <View style={styles.privateCard}>
              <View style={styles.privateLeft}>
                <View
                  style={[
                    styles.privateIcon,
                    isPrivateFolder && styles.privateIconActive,
                  ]}
                >
                  <Ionicons
                    name={isPrivateFolder ? "lock-closed" : "lock-open"}
                    size={22}
                    color={isPrivateFolder ? "#10B981" : "#2563EB"}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.privateTitle}>
                    {isPrivateFolder ? "Private Folder" : "Public Folder"}
                  </Text>

                  <Text style={styles.privateSubtitle}>
                    {isPrivateFolder
                      ? "Only visible after PIN unlock"
                      : "Visible in public mode"}
                  </Text>
                </View>
              </View>

              <Switch
                value={isPrivateFolder}
                onValueChange={setIsPrivateFolder}
              />
            </View>

            {/* Modal buttons */}
            <Pressable
              disabled={loading}
              onPress={createFolder}
              style={({ pressed }) => [
                styles.createButton,
                pressed && styles.pressed,
                loading && styles.disabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="add" size={22} color="#FFFFFF" />
                  <Text style={styles.createText}>Create Folder</Text>
                </>
              )}
            </Pressable>

            <Pressable
              style={styles.cancelButton}
              onPress={() => {
                setFolderName("");
                setIsPrivateFolder(true);
                setOpenCreateModal(false);
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },

  subtitle: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
  },

  headerActions: {
    flexDirection: "row",
    gap: 10,
  },

  headerAddButton: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",

    elevation: 8,
    shadowColor: "#10B981",
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 130,
  },

  infoCard: {
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,

    elevation: 2,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  infoIconBox: {
    width: 58,
    height: 58,
    borderRadius: 22,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },

  infoTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },

  infoSubtitle: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },

  folderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,

    elevation: 2,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  folderIcon: {
    width: 56,
    height: 56,
    borderRadius: 22,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },

  folderName: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },

  folderMeta: {
    marginTop: 3,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
  },

  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },

  changePinButton: {
    marginTop: 8,
    minHeight: 72,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1FAE5",
    flexDirection: "row",
    gap: 12,
    padding: 14,

    elevation: 2,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  changePinIconBox: {
    width: 46,
    height: 46,
    borderRadius: 17,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },

  changePinTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },

  changePinSubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },

  emptyBox: {
    marginTop: 32,
    padding: 34,
    borderRadius: 28,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
  },

  emptyText: {
    marginTop: 5,
    color: "#64748B",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.58)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  modalCard: {
    width: "100%",
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",

    elevation: 12,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
  },

  modalIconBox: {
    width: 74,
    height: 74,
    borderRadius: 30,
    backgroundColor: "#ECFDF5",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  modalTitle: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.3,
  },

  modalSubtitle: {
    marginTop: 6,
    textAlign: "center",
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 20,
  },

  modalInput: {
    marginTop: 20,
    height: 56,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },

  privateCard: {
    marginTop: 18,
    backgroundColor: "#F8FAFC",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  privateLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },

  privateIcon: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  privateIconActive: {
    backgroundColor: "#ECFDF5",
  },

  privateTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0F172A",
  },

  privateSubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },

  createButton: {
    marginTop: 18,
    height: 56,
    borderRadius: 22,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,

    elevation: 6,
    shadowColor: "#10B981",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },

  createText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  cancelButton: {
    marginTop: 14,
    height: 52,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  cancelText: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "900",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  errorText: {
    color: "#EF4444",
    fontWeight: "800",
    textAlign: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "#64748B",
    fontWeight: "700",
  },

  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },

  disabled: {
    opacity: 0.7,
  },
});