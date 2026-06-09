import FileGrid, { VaultItem } from "@/components/FileGrid";
import Ionicons from "@expo/vector-icons/Ionicons";
import { eq } from "drizzle-orm";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { db } from "../../../../db/database";
import {
  FileItem,
  filesTable,
  Folder,
  foldersTable,
} from "../../../../db/schema";
import migrations from "../../../../drizzle/migrations";

export default function FolderDetailsScreen() {
  const { success, error } = useMigrations(db, migrations);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [folder, setFolder] = useState<Folder | null>(null);
  const [folderFiles, setFolderFiles] = useState<VaultItem[]>([]);

  const [openEditModal, setOpenEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPrivate, setEditPrivate] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadFolderData() {
    if (!id) return;

    const folderResult = await db
      .select()
      .from(foldersTable)
      .where(eq(foldersTable.id, Number(id)))
      .limit(1);

    const currentFolder = folderResult[0] ?? null;
    setFolder(currentFolder);

    if (currentFolder) {
      setEditName(currentFolder.name);
      setEditPrivate(currentFolder.isPrivate);
    }

    const files: FileItem[] = await db
      .select()
      .from(filesTable)
      .where(eq(filesTable.folderId, Number(id)));

    const mappedItems: VaultItem[] = files.reverse().map((file) => ({
      id: file.id,
      name: file.name,
      type: file.type,
      localUri: file.localUri,
      isPrivate: file.isPrivate,
      isFavorite: file.isFavorite,
      size: file.size,
      extension: file.extension,
    }));

    setFolderFiles(mappedItems);
  }

  useFocusEffect(
    useCallback(() => {
      if (success) {
        loadFolderData();
      }
    }, [success, id]),
  );
async function updateFolder() {
  if (!folder) return;

  if (!editName.trim()) {
    Alert.alert("Invalid name", "Folder name cannot be empty");
    return;
  }

  try {
    setSaving(true);

    const now = new Date().toISOString();

    // update folder
    await db
      .update(foldersTable)
      .set({
        name: editName.trim(),
        isPrivate: editPrivate,
        updatedAt: now,
      })
      .where(eq(foldersTable.id, folder.id));

    // update all files inside this folder
    await db
      .update(filesTable)
      .set({
        isPrivate: editPrivate,
        updatedAt: now,
      })
      .where(eq(filesTable.folderId, folder.id));

    setOpenEditModal(false);
    await loadFolderData();

    Alert.alert("Updated", "Folder and files updated successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    Alert.alert("Update failed", message);
  } finally {
    setSaving(false);
  }
}
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Migration error: {error.message}</Text>
      </View>
    );
  }

  if (!success || !folder) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2563EB" />
        <Text style={styles.loadingText}>Loading folder...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.folderIconBox}>
          <Ionicons
            name={folder.isPrivate ? "lock-closed" : "folder-open"}
            size={32}
            color={folder.isPrivate ? "#10B981" : "#2563EB"}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={styles.title}>
            {folder.name}
          </Text>

          <Text style={styles.subtitle}>
            {folderFiles.length} file{folderFiles.length === 1 ? "" : "s"} •{" "}
            {folder.isPrivate ? "Private" : "Public"}
          </Text>
        </View>

        <Pressable
          onPress={() => setOpenEditModal(true)}
          style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
        >
          <Ionicons name="create-outline" size={20} color="#2563EB" />
        </Pressable>
      </View>

      <FileGrid
        items={folderFiles}
        onOpen={(item) => router.push(`/files/${item.id}`)}
      />

      <Modal
        visible={openEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <Ionicons name="folder" size={34} color="#2563EB" />
            </View>

            <Text style={styles.modalTitle}>Edit Folder</Text>
            <Text style={styles.modalSubtitle}>
              Rename folder or change visibility.
            </Text>

            <Text style={styles.label}>Folder Name</Text>

            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="Folder name"
              placeholderTextColor="#94A3B8"
              style={styles.input}
            />

            <View style={styles.privateCard}>
              <View style={styles.privateLeft}>
                <View
                  style={[
                    styles.privateIcon,
                    editPrivate && styles.privateIconActive,
                  ]}
                >
                  <Ionicons
                    name={editPrivate ? "lock-closed" : "lock-open"}
                    size={22}
                    color={editPrivate ? "#10B981" : "#2563EB"}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.privateTitle}>
                    {editPrivate ? "Private Folder" : "Public Folder"}
                  </Text>

                  <Text style={styles.privateSubtitle}>
                    {editPrivate
                      ? "Only visible after PIN unlock"
                      : "Visible in public mode"}
                  </Text>
                </View>
              </View>

              <Switch value={editPrivate} onValueChange={setEditPrivate} />
            </View>

            <Pressable
              disabled={saving}
              onPress={updateFolder}
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.pressed,
                saving && styles.disabled,
              ]}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="save" size={20} color="#FFFFFF" />
                  <Text style={styles.saveText}>Save Changes</Text>
                </>
              )}
            </Pressable>

            <Pressable
              style={styles.cancelButton}
              onPress={() => {
                setEditName(folder.name);
                setEditPrivate(folder.isPrivate);
                setOpenEditModal(false);
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  headerCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  folderIconBox: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
  },

  subtitle: {
    marginTop: 4,
    color: "#64748B",
    fontWeight: "700",
  },

  editButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  errorText: {
    color: "#EF4444",
    fontWeight: "800",
  },

  loadingText: {
    marginTop: 10,
    color: "#64748B",
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  modalCard: {
    width: "100%",
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  modalIconBox: {
    width: 72,
    height: 72,
    borderRadius: 28,
    backgroundColor: "#EFF6FF",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  modalTitle: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "900",
    color: "#111827",
  },

  modalSubtitle: {
    marginTop: 6,
    textAlign: "center",
    color: "#64748B",
    fontWeight: "600",
  },

  label: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
  },

  input: {
    height: 56,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },

  privateCard: {
    marginTop: 18,
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
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
    borderRadius: 16,
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
    color: "#111827",
  },

  privateSubtitle: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
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