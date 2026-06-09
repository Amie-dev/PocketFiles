import Ionicons from "@expo/vector-icons/Ionicons";
import { eq } from "drizzle-orm";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
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

// -------------------------
// Tags helpers
// -------------------------

function parseTags(tags: string): string[] {
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeTag(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}

function getTagsJson(tags: string[]) {
  return JSON.stringify(tags);
}

// -------------------------
// File helpers
// -------------------------

function getFileIcon(type: string) {
  if (type === "image") return "image";
  if (type === "pdf") return "document-text";
  if (type === "doc") return "document";
  return "file-tray";
}

// -------------------------
// Screen
// -------------------------

export default function EditFileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [file, setFile] = useState<FileItem | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // -------------------------
  // Load folders
  // -------------------------

  async function loadFolders(privateMode: boolean) {
    const result = await db
      .select()
      .from(foldersTable)
      .where(eq(foldersTable.isPrivate, privateMode));

    setFolders(result);
  }

  // -------------------------
  // Load file
  // -------------------------

  async function loadFile() {
    if (!id) return;

    const result = await db
      .select()
      .from(filesTable)
      .where(eq(filesTable.id, Number(id)))
      .limit(1);

    const currentFile = result[0] ?? null;

    setFile(currentFile);

    if (currentFile) {
      setName(currentFile.name);
      setTags(parseTags(currentFile.tags));
      setIsFavorite(currentFile.isFavorite);
      setIsPrivate(currentFile.isPrivate);
      setSelectedFolderId(currentFile.folderId);

      await loadFolders(currentFile.isPrivate);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadFile();
  }, [id]);

  // -------------------------
  // Privacy change
  // -------------------------

  async function handlePrivateChange(value: boolean) {
    setIsPrivate(value);
    setSelectedFolderId(null);
    await loadFolders(value);
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
    const shouldCreateTag = text.includes(",") || text.endsWith(" ");

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
  // Save
  // -------------------------

  async function handleSave() {
    if (!file) return;

    if (!name.trim()) {
      Alert.alert("Invalid name", "File name cannot be empty");
      return;
    }

    try {
      setSaving(true);

      await db
        .update(filesTable)
        .set({
          name: name.trim(),
          tags: getTagsJson(tags),
          isFavorite,
          isPrivate,
          folderId: selectedFolderId,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(filesTable.id, file.id));

      Alert.alert("Updated", "File updated successfully");
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert("Update failed", message);
    } finally {
      setSaving(false);
    }
  }

  // -------------------------
  // Loading states
  // -------------------------

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2563EB" />
        <Text style={styles.loadingText}>Loading file...</Text>
      </View>
    );
  }

  if (!file) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>File not found</Text>
      </View>
    );
  }

  // -------------------------
  // UI
  // -------------------------

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* File preview */}

      <View style={styles.previewCard}>
        {file.type === "image" ? (
          <Image
            source={{ uri: file.localUri }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.fileIconBox}>
            <Ionicons name={getFileIcon(file.type)} size={72} color="#2563EB" />
          </View>
        )}
      </View>

      {/* Form card */}

      <View style={styles.formCard}>
        {/* File name */}

        <Text style={styles.label}>File Name</Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="File name"
          placeholderTextColor="#94A3B8"
          style={styles.input}
        />

        {/* Tags */}

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

        {/* Favorite */}

        <View style={styles.switchCard}>
          <View style={styles.switchLeft}>
            <View style={styles.favoriteIcon}>
              <Ionicons
                name={isFavorite ? "star" : "star-outline"}
                size={22}
                color="#F59E0B"
              />
            </View>

            <View>
              <Text style={styles.switchTitle}>Favorite</Text>
              <Text style={styles.switchSubtitle}>Show in favorite filter</Text>
            </View>
          </View>

          <Switch value={isFavorite} onValueChange={setIsFavorite} />
        </View>

        {/* Privacy */}

        <View style={styles.switchCard}>
          <View style={styles.switchLeft}>
            <View
              style={[
                styles.privateIconBox,
                isPrivate && styles.privateIconActive,
              ]}
            >
              <Ionicons
                name={isPrivate ? "lock-closed" : "lock-open"}
                size={22}
                color={isPrivate ? "#10B981" : "#2563EB"}
              />
            </View>

            <View>
              <Text style={styles.switchTitle}>
                {isPrivate ? "Private File" : "Public File"}
              </Text>
              <Text style={styles.switchSubtitle}>
                {isPrivate
                  ? "Only visible in private mode"
                  : "Visible in public mode"}
              </Text>
            </View>
          </View>

          <Switch value={isPrivate} onValueChange={handlePrivateChange} />
        </View>

        {/* Folder move */}

        <Text style={styles.label}>Move To Folder</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.folderRow}>
            <Pressable
              onPress={() => setSelectedFolderId(null)}
              style={[
                styles.folderChip,
                selectedFolderId === null && styles.activeFolderChip,
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
                  selectedFolderId === null && styles.activeFolderText,
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
                  style={[styles.folderChip, active && styles.activeFolderChip]}
                >
                  <Ionicons
                    name="folder"
                    size={14}
                    color={active ? "#FFFFFF" : "#64748B"}
                  />

                  <Text
                    numberOfLines={1}
                    style={[
                      styles.folderText,
                      active && styles.activeFolderText,
                    ]}
                  >
                    {folder.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Save */}

      <Pressable
        disabled={saving}
        onPress={handleSave}
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
            <Ionicons name="save" size={22} color="#FFFFFF" />
            <Text style={styles.saveText}>Save Changes</Text>
          </>
        )}
      </Pressable>

      <Pressable style={styles.cancelButton} onPress={() => router.back()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </ScrollView>
  );
}

// -------------------------
// Styles
// -------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 16, paddingBottom: 40 },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 10, color: "#64748B", fontWeight: "700" },

  previewCard: {
    height: 260,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  previewImage: {
    width: "100%",
    height: "100%",
  },

  fileIconBox: {
    width: 130,
    height: 130,
    borderRadius: 36,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  formCard: {
    marginTop: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  section: {
    marginTop: 14,
  },

  label: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
  },

  input: {
    height: 54,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
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
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },

  switchCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  switchLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },

  favoriteIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },

  privateIconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  privateIconActive: {
    backgroundColor: "#ECFDF5",
  },

  switchTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111827",
  },

  switchSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },

  folderRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },

  folderChip: {
    maxWidth: 160,
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

  activeFolderChip: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },

  folderText: {
    color: "#64748B",
    fontWeight: "800",
  },

  activeFolderText: {
    color: "#FFFFFF",
  },

  saveButton: {
    marginTop: 24,
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
    fontSize: 16,
    fontWeight: "900",
  },

  cancelButton: {
    marginTop: 14,
    alignItems: "center",
    paddingVertical: 10,
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