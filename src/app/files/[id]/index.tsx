import Ionicons from "@expo/vector-icons/Ionicons";
import { eq } from "drizzle-orm";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {File,Paths} from "expo-file-system"
import { db } from "../../../../db/database";
import { FileItem, filesTable } from "../../../../db/schema";

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function parseTags(tags: string) {
  try {
    return JSON.parse(tags) as string[];
  } catch {
    return [];
  }
}

function getDocumentIcon(type: string) {
  if (type === "pdf") return "document-text";
  if (type === "doc") return "document";
  return "file-tray";
}

export default function FileDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width, height } = useWindowDimensions();

  const previewWidth = width - 32;
  const minImageHeight = 280;
  const maxImageHeight = Math.round(height * 0.72);

  const [file, setFile] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageHeight, setImageHeight] = useState(minImageHeight);

  async function loadFile() {
    if (!id) return;

    const result = await db
      .select()
      .from(filesTable)
      .where(eq(filesTable.id, Number(id)))
      .limit(1);

    setFile(result[0] ?? null);
    setLoading(false);
  }

  useEffect(() => {
    loadFile();
  }, [id]);

  useEffect(() => {
    if (!file || file.type !== "image" || !file.localUri) return;

    Image.getSize(
      file.localUri,
      (imgWidth, imgHeight) => {
        const ratioHeight = (previewWidth * imgHeight) / imgWidth;

        const finalHeight = Math.min(
          Math.max(ratioHeight, minImageHeight),
          maxImageHeight
        );

        setImageHeight(finalHeight);
      },
      () => {
        setImageHeight(Math.round(width * 1.2));
      }
    );
  }, [file?.localUri, file?.type, previewWidth, minImageHeight, maxImageHeight]);

  async function handleShare() {
    if (!file?.localUri) return;

    const available = await Sharing.isAvailableAsync();

    if (!available) {
      Alert.alert("Sharing not available");
      return;
    }

    await Sharing.shareAsync(file.localUri);
  }

 async function handleDelete() {
  if (!file) return;

  Alert.alert("Delete File", "Are you sure you want to delete this file?", [
    {
      text: "Cancel",
      style: "cancel",
    },
    {
      text: "Delete",
      style: "destructive",
      onPress: async () => {
        try {
          if (file.localUri) {
            const storedFile = new File(file.localUri);

            if (storedFile.exists) {
              storedFile.delete();
            }
          }

          await db.delete(filesTable).where(eq(filesTable.id, file.id));

          router.back();
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          Alert.alert("Delete failed", message);
        }
      },
    },
  ]);
}

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.mutedText}>Loading file...</Text>
      </View>
    );
  }

  if (!file) {
    return (
      <View style={styles.center}>
        <Text style={styles.mutedText}>File not found</Text>
      </View>
    );
  }

  const tags = parseTags(file.tags);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.previewCard,
          file.type === "image"
            ? { height: imageHeight }
            : styles.documentPreviewHeight,
        ]}
      >
        {file.type === "image" ? (
          <Image
            source={{ uri: file.localUri }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.docPreview}>
            <View style={styles.docIconBox}>
              <Ionicons
                name={getDocumentIcon(file.type)}
                size={80}
                color="#2563EB"
              />
            </View>

            <Text style={styles.docTitle}>
              {file.type === "pdf" ? "PDF Document" : "Document Preview"}
            </Text>

            <Text style={styles.docSubtitle}>
              Use Share/Open to view this file in a supported app.
            </Text>

            <Pressable style={styles.openBtn} onPress={handleShare}>
              <Ionicons name="open-outline" size={18} color="#FFFFFF" />
              <Text style={styles.openText}>Open / Share</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{file.name}</Text>

          <Text style={styles.subtitle}>
            {file.extension?.toUpperCase() || file.type.toUpperCase()} •{" "}
            {formatSize(file.size)}
          </Text>
        </View>

        <View
          style={[
            styles.privacyBadge,
            file.isPrivate && styles.privateBadge,
          ]}
        >
          <Ionicons
            name={file.isPrivate ? "lock-closed" : "lock-open"}
            size={14}
            color={file.isPrivate ? "#10B981" : "#2563EB"}
          />

          <Text
            style={[
              styles.privacyText,
              file.isPrivate && styles.privateText,
            ]}
          >
            {file.isPrivate ? "Private" : "Public"}
          </Text>
        </View>
      </View>

      <View style={styles.tagsRow}>
        {tags.length > 0 ? (
          tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noTagText}>No tags added</Text>
        )}
      </View>

      <View style={styles.infoCard}>
        <InfoRow
          icon="shield-checkmark"
          label="Privacy"
          value={file.isPrivate ? "Private" : "Public"}
        />

        <InfoRow
          icon="star"
          label="Favorite"
          value={file.isFavorite ? "Yes" : "No"}
        />

        <InfoRow
          icon="document"
          label="Type"
          value={file.type.toUpperCase()}
        />

        <InfoRow
          icon="folder"
          label="Folder"
          value={file.folderId ? `Folder #${file.folderId}` : "Root Folder"}
        />

        <InfoRow
          icon="time"
          label="Created"
          value={new Date(file.createdAt).toLocaleDateString()}
        />
      </View>

      <View style={styles.actionRow}>
        <Pressable
          style={styles.editButton}
          onPress={() => router.push(`/files/${file.id}/edit`)}
        >
          <Ionicons name="create-outline" size={20} color="#FFFFFF" />
          <Text style={styles.actionText}>Edit</Text>
        </Pressable>

        <Pressable style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={20} color="#2563EB" />
          <Text style={styles.shareText}>Share</Text>
        </Pressable>
      </View>

      <Pressable style={styles.deleteButton} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
        <Text style={styles.actionText}>Delete File</Text>
      </Pressable>
    </ScrollView>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon} size={18} color="#64748B" />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>

      <Text numberOfLines={1} style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 16,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  mutedText: {
    color: "#64748B",
    fontWeight: "700",
  },

  previewCard: {
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },

  documentPreviewHeight: {
    height: 360,
  },

  previewImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#FFFFFF",
  },

  docPreview: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  docIconBox: {
    width: 140,
    height: 140,
    borderRadius: 40,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  docTitle: {
    marginTop: 18,
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
  },

  docSubtitle: {
    marginTop: 8,
    color: "#64748B",
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },

  openBtn: {
    marginTop: 20,
    height: 48,
    paddingHorizontal: 22,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  openText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  titleRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111827",
  },

  subtitle: {
    marginTop: 4,
    color: "#64748B",
    fontWeight: "700",
  },

  privacyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },

  privateBadge: {
    backgroundColor: "#ECFDF5",
  },

  privacyText: {
    fontSize: 12,
    color: "#2563EB",
    fontWeight: "900",
  },

  privateText: {
    color: "#10B981",
  },

  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },

  tag: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  tagText: {
    color: "#2563EB",
    fontWeight: "800",
  },

  noTagText: {
    color: "#94A3B8",
    fontWeight: "700",
  },

  infoCard: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },

  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  infoLabel: {
    color: "#64748B",
    fontWeight: "700",
  },

  infoValue: {
    color: "#111827",
    fontWeight: "900",
    maxWidth: "55%",
  },

  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },

  editButton: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },

  shareButton: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },

  deleteButton: {
    marginTop: 12,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },

  actionText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  shareText: {
    color: "#2563EB",
    fontWeight: "900",
  },
});