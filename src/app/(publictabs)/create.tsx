import Ionicons from "@expo/vector-icons/Ionicons";
import * as DocumentPicker from "expo-document-picker";
import { eq } from "drizzle-orm";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { db } from "../../../db/database";
import { filesTable, foldersTable, Folder } from "../../../db/schema";

type FileType = "image" | "pdf" | "doc" | "other";

type PickedFile = {
  name: string;
  uri: string;
  size: number;
  extension: string;
  type: FileType;
};

// -------------------------
// File helpers
// -------------------------

function getExtension(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function getFileType(extension: string): FileType {
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(extension)) {
    return "image";
  }

  if (extension === "pdf") {
    return "pdf";
  }

  if (["doc", "docx", "txt"].includes(extension)) {
    return "doc";
  }

  return "other";
}

function getFileIcon(type: FileType) {
  if (type === "image") return "image";
  if (type === "pdf") return "document-text";
  if (type === "doc") return "document";
  return "file-tray";
}

// -------------------------
// Tag helpers
// -------------------------

function normalizeTag(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}

// -------------------------
// Screen
// -------------------------

export default function CreateScreen() {
  const [loading, setLoading] = useState(false);

  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null);
  const [fileName, setFileName] = useState("");

  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);

  const [folders, setFolders] = useState<Folder[]>([]);
  const [newFolderName, setNewFolderName] = useState("");

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // -------------------------
  // Load folders
  // -------------------------

  useEffect(() => {
    loadFolders();
  }, [isPrivate]);

  async function loadFolders() {
    const result = await db
      .select()
      .from(foldersTable)
      .where(eq(foldersTable.isPrivate, isPrivate));

    setFolders(result);
  }

  // -------------------------
  // Pick file
  // -------------------------

  async function pickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      const extension = getExtension(asset.name);
      const type = getFileType(extension);

      setPickedFile({
        name: asset.name,
        uri: asset.uri,
        size: asset.size ?? 0,
        extension,
        type,
      });

      setFileName(asset.name);
    } catch (error) {
      console.log(error);
      Alert.alert("Pick failed", "Could not pick file");
    }
  }

  // -------------------------
  // Folder create
  // -------------------------

  async function createFolder() {
    if (!newFolderName.trim()) {
      Alert.alert("Folder name required", "Please enter folder name");
      return;
    }

    const now = new Date().toISOString();

    await db.insert(foldersTable).values({
      name: newFolderName.trim(),
      parentId: null,
      isPrivate,
      createdAt: now,
      updatedAt: now,
    });

    setNewFolderName("");
    await loadFolders();
  }

  // -------------------------
  // Tag actions
  // -------------------------

  function addTag() {
    const cleanTag = normalizeTag(tagInput);

    if (!cleanTag) return;

    if (tags.includes(cleanTag)) {
      setTagInput("");
      return;
    }

    setTags((prev) => [...prev, cleanTag]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((item) => item !== tag));
  }

  function handleTagChange(text: string) {
    const shouldCreateTag =
      text.includes(",") || text.endsWith(" ");

    if (shouldCreateTag) {
      const cleanTag = normalizeTag(text.replace(",", ""));

      if (cleanTag && !tags.includes(cleanTag)) {
        setTags((prev) => [...prev, cleanTag]);
      }

      setTagInput("");
      return;
    }

    setTagInput(text);
  }

  // -------------------------
  // Save file
  // -------------------------

  async function saveFile() {
    if (!pickedFile) {
      Alert.alert("No file selected", "Please choose a file first");
      return;
    }

    if (!fileName.trim()) {
      Alert.alert("File name required", "Please enter file name");
      return;
    }

    try {
      setLoading(true);

      const now = new Date().toISOString();

      await db.insert(filesTable).values({
        name: fileName.trim(),
        type: pickedFile.type,
        extension: pickedFile.extension,
        localUri: pickedFile.uri,
        folderId: selectedFolderId,
        isPrivate,
        size: pickedFile.size,
        thumbnailUri: pickedFile.type === "image" ? pickedFile.uri : null,
        isFavorite: false,
        tags: JSON.stringify(tags),
        createdAt: now,
        updatedAt: now,
      });

      Alert.alert("Success", "File saved successfully");

      setPickedFile(null);
      setFileName("");
      setSelectedFolderId(null);
      setIsPrivate(false);
      setTags([]);
      setTagInput("");

      router.replace(isPrivate ? "/(locktabs)" : "/(publictabs)");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert("Save failed", message);
    } finally {
      setLoading(false);
    }
  }

  // -------------------------
  // UI
  // -------------------------

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Pick file card */}

        <Pressable
          onPress={pickFile}
          style={({ pressed }) => [
            styles.importCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.importIconBox}>
            <Ionicons name="cloud-upload" size={36} color="#2563EB" />
          </View>

          <Text style={styles.title}>Choose File</Text>

          <Text style={styles.subtitle}>
            Import photos, PDFs, docs, or any file into your vault
          </Text>
        </Pressable>

        {/* Selected file preview */}

        {pickedFile && (
          <View style={styles.previewCard}>
            <View style={styles.previewIconBox}>
              <Ionicons
                name={getFileIcon(pickedFile.type)}
                size={26}
                color="#2563EB"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={styles.previewName}>
                {pickedFile.name}
              </Text>

              <Text style={styles.previewMeta}>
                {pickedFile.type.toUpperCase()} • {pickedFile.size} bytes
              </Text>
            </View>

            <Pressable
              onPress={() => {
                setPickedFile(null);
                setFileName("");
              }}
            >
              <Ionicons name="close-circle" size={24} color="#94A3B8" />
            </Pressable>
          </View>
        )}

        {/* Rename section */}

        <View style={styles.section}>
          <Text style={styles.label}>Rename File</Text>

          <TextInput
            value={fileName}
            onChangeText={setFileName}
            placeholder="Enter file name"
            placeholderTextColor="#94A3B8"
            style={styles.input}
          />
        </View>

        {/* Privacy section */}

        <View style={styles.privateCard}>
          <View style={styles.privateLeft}>
            <View
              style={[
                styles.privateIcon,
                isPrivate && styles.privateIconActive,
              ]}
            >
              <Ionicons
                name={isPrivate ? "lock-closed" : "lock-open"}
                size={22}
                color={isPrivate ? "#10B981" : "#2563EB"}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.privateTitle}>
                {isPrivate ? "Private File" : "Public File"}
              </Text>

              <Text style={styles.privateSubtitle}>
                {isPrivate
                  ? "Only visible after PIN unlock"
                  : "Visible in normal public mode"}
              </Text>
            </View>
          </View>

          <Switch
            value={isPrivate}
            onValueChange={(value) => {
              setIsPrivate(value);
              setSelectedFolderId(null);
            }}
          />
        </View>

        {/* Folder section */}

        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Select Folder</Text>

            <Text style={styles.smallText}>
              {selectedFolderId === null ? "Root selected" : "Folder selected"}
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.folderRow}>
              <Pressable
                onPress={() => setSelectedFolderId(null)}
                style={[
                  styles.folderChip,
                  selectedFolderId === null && styles.activeChip,
                ]}
              >
                <Ionicons
                  name="home"
                  size={14}
                  color={selectedFolderId === null ? "#FFFFFF" : "#64748B"}
                />

                <Text
                  style={[
                    styles.folderText,
                    selectedFolderId === null && styles.activeText,
                  ]}
                >
                  Root
                </Text>
              </Pressable>

              {folders.map((folder) => {
                const active = selectedFolderId === folder.id;

                return (
                  <Pressable
                    key={folder.id}
                    onPress={() => setSelectedFolderId(folder.id)}
                    style={[styles.folderChip, active && styles.activeChip]}
                  >
                    <Ionicons
                      name="folder"
                      size={14}
                      color={active ? "#FFFFFF" : "#64748B"}
                    />

                    <Text
                      numberOfLines={1}
                      style={[styles.folderText, active && styles.activeText]}
                    >
                      {folder.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.createFolderRow}>
            <TextInput
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="Create new folder"
              placeholderTextColor="#94A3B8"
              style={[styles.input, { flex: 1 }]}
            />

            <Pressable
              onPress={createFolder}
              style={({ pressed }) => [
                styles.addFolderBtn,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* Tags section */}

        <View style={styles.section}>
          <Text style={styles.label}>Tags</Text>

          {tags.length > 0 && (
            <View style={styles.tagList}>
              {tags.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => removeTag(tag)}
                  style={styles.tagChip}
                >
                  <Text style={styles.tagText}>#{tag}</Text>
                  <Ionicons name="close" size={14} color="#2563EB" />
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.tagInputRow}>
            <TextInput
              value={tagInput}
              onChangeText={handleTagChange}
              onSubmitEditing={addTag}
              placeholder="type tag and press space"
              placeholderTextColor="#94A3B8"
              style={styles.tagInput}
              returnKeyType="done"
            />

            <Pressable onPress={addTag} style={styles.tagAddBtn}>
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          <Text style={styles.hint}>
            Example: family photo becomes #family-photo
          </Text>
        </View>

        {/* Save button */}

        <Pressable
          disabled={loading}
          onPress={saveFile}
          style={({ pressed }) => [
            styles.saveBtn,
            pressed && styles.pressed,
            loading && styles.disabled,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="save" size={22} color="#FFFFFF" />
              <Text style={styles.saveText}>Save File</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// -------------------------
// Styles
// -------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 20,
    paddingBottom: 130,
  },

  importCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  importIconBox: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  title: {
    fontSize: 25,
    fontWeight: "900",
    color: "#111827",
  },

  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#64748B",
    textAlign: "center",
  },

  previewCard: {
    marginTop: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  previewIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  previewName: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111827",
  },

  previewMeta: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },

  section: {
    marginTop: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 8,
  },

  input: {
    height: 54,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  privateCard: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
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

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  smallText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
  },

  folderRow: {
    flexDirection: "row",
    gap: 8,
  },

  folderChip: {
    maxWidth: 150,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  activeChip: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },

  folderText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#64748B",
  },

  activeText: {
    color: "#FFFFFF",
  },

  createFolderRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },

  addFolderBtn: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },

  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },

  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#DBEAFE",
  },

  tagText: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "900",
  },

  tagInputRow: {
    flexDirection: "row",
    gap: 10,
  },

  tagInput: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  tagAddBtn: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },

  hint: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },

  saveBtn: {
    marginTop: 28,
    height: 58,
    borderRadius: 22,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },

  saveText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },

  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },

  disabled: {
    opacity: 0.7,
  },
});