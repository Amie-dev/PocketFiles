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

export default function FolderScreen() {
  const { success, error } = useMigrations(db, migrations);

  const [folders, setFolders] = useState<Folder[]>([]);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [isPrivateFolder, setIsPrivateFolder] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  async function loadFolders() {
    const result = await db
      .select()
      .from(foldersTable)
      .where(eq(foldersTable.isPrivate, false));

    setFolders(result.reverse());
  }

  useFocusEffect(
    useCallback(() => {
      if (success) {
        loadFolders();
      }
    }, [success]),
  );

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
      setIsPrivateFolder(false);
      setOpenCreateModal(false);
      await loadFolders();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert("Create failed", message);
    } finally {
      setLoading(false);
    }
  }

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
                    localFile.delete();
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
      ],
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Migration error: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#4a67a3" />
        <Text style={styles.loadingText}>Migration is in progress...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Folders</Text>
          <Text style={styles.subtitle}>
            {folders.length} public folder{folders.length === 1 ? "" : "s"}
          </Text>
        </View>

        <Pressable
          disabled={loading}
          onPress={() => setOpenCreateModal(true)}
          style={({ pressed }) => [
            styles.headerAddButton,
            pressed && styles.pressed,
            loading && styles.disabled,
          ]}
        >
          <Ionicons name="add" size={36} color="#FFFFFF" />
        </Pressable>
      </View>

      <FlatList
        data={folders}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.infoCard}>
            <View style={styles.infoIconBox}>
              <Ionicons name="folder-open" size={28} color="#3f5b97" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Organize your files</Text>
              <Text style={styles.infoSubtitle}>
                Tap a folder to view files. Delete removes all files inside.
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="folder-open-outline" size={46} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No folders yet</Text>
            <Text style={styles.emptyText}>
              Tap the + button to create your first folder.
            </Text>
          </View>
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
              <Ionicons name="folder" size={30} color="#4c69a7" />
            </View>

            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={styles.folderName}>
                {item.name}
              </Text>

              <Text style={styles.folderMeta}>
                {item.isPrivate ? "Private folder" : "Public folder"}
              </Text>
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

      <Modal
        visible={openCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <Ionicons name="folder" size={34} color="#4d70be" />
            </View>

            <Text style={styles.modalTitle}>Create Folder</Text>

            <Text style={styles.modalSubtitle}>
              Give your folder a clear name.
            </Text>

            <TextInput
              value={folderName}
              onChangeText={setFolderName}
              placeholder="Folder name"
              placeholderTextColor="#94A3B8"
              style={styles.modalInput}
              autoFocus
            />
            {/* Privacy section */}

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
                      : "Visible in normal public mode"}
                  </Text>
                </View>
              </View>

              <Switch
                value={isPrivateFolder}
                onValueChange={setIsPrivateFolder}
              />
            </View>
          </View>
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
                <Ionicons name="folder" size={22} color="#FFFFFF" />
                <Text style={styles.createText}>Save Folder</Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={styles.cancelButton}
            onPress={() => {
              setFolderName("");
              setOpenCreateModal(false);
            }}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
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
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#111827",
  },

  subtitle: {
    marginTop: 4,
    color: "#64748B",
    fontWeight: "700",
  },

  headerAddButton: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#6f8bc7",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  infoCard: {
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  infoIconBox: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  infoTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111827",
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
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },

  folderIcon: {
    width: 54,
    height: 54,
    borderRadius: 19,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  folderName: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
  },

  folderMeta: {
    marginTop: 3,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
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

  deleteButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyBox: {
    marginTop: 32,
    padding: 32,
    borderRadius: 26,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: "900",
    color: "#111827",
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

  modalInput: {
    marginTop: 20,
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

  createButton: {
    marginTop: 18,
    height: 56,
    borderRadius: 20,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingHorizontal: 15,
    gap: 8,
  },

  createText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  cancelButton: {
    borderRadius: 20,
    marginTop: 14,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: "#64748B",
  },

  cancelText: {
    color: "#FFFFFF",
    fontSize: 16,
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
