import Ionicons from "@expo/vector-icons/Ionicons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { VaultItem } from "./FileGrid";

type Props = {
  item: VaultItem;
  index: number;
  onOpen: (item: VaultItem) => void;
  onMove?: (item: VaultItem) => void;
  onDelete?: (item: VaultItem) => void;
  onShare?: (item: VaultItem) => void;
};

export default function FileCard({ item, index, onOpen }: Props) {
  const heightType = index % 3;

  const cardHeight = heightType === 0 ? 260 : heightType === 1 ? 210 : 180;

  const isImage = item.type === "image" && item.localUri;

  function getIconName() {
    if (item.type === "folder") return "folder";
    if (item.type === "pdf") return "document-text";
    if (item.type === "doc") return "document";
    if (item.type === "image") return "image";
    return "file-tray";
  }

  function getBadgeText() {
    if (item.type === "folder") return "Folder";
    if (item.type === "image") return "Photo";
    if (item.type === "pdf") return "PDF";
    if (item.type === "doc") return "Doc";
    return "File";
  }

  return (
    <Pressable
      onPress={() => onOpen(item)}
      style={({ pressed }) => [
        styles.card,
        { height: cardHeight },
        pressed && styles.cardPressed,
      ]}
    >
      {isImage ? (
        <Image
          source={{ uri: item.localUri! }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.filePreview}>
          <Ionicons name={getIconName()} size={42} color="#2563EB" />
        </View>
      )}

      <View style={styles.darkOverlay} />

      <View style={styles.badge}>
        <Text style={styles.badgeText}>{getBadgeText()}</Text>
      </View>

      {item.isPrivate && (
        <View style={styles.privateBadge}>
          <Ionicons name="lock-closed" size={12} color="#FFFFFF" />
        </View>
      )}

      <View style={styles.bottomGradient}>
        <Text numberOfLines={2} style={styles.title}>
          {item.name}
        </Text>

        <Text style={styles.meta}>{item.isPrivate ? "Private" : "Public"}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
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

  cardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  filePreview: {
    flex: 1,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.14)",
  },

  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
  },

  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#111827",
  },

  privateBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },

  bottomGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    paddingTop: 28,
    // backgroundColor: "rgba(0,0,0,0.38)",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  meta: {
    marginTop: 2,
    color: "#E5E7EB",
    fontSize: 11,
    fontWeight: "700",
  },
});
