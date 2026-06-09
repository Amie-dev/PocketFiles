import React, { memo, useMemo } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import FileCard from "./FileCard";

export type VaultItem = {
  id: number;
  name: string;
  type: "folder" | "image" | "pdf" | "doc" | "other";
  localUri?: string | null;
  isPrivate: boolean;
  isFavorite?: boolean;
  size?: number;
  extension?: string | null;
};

type Props = {
  items: VaultItem[];
  onOpen: (item: VaultItem) => void;
  onMove?: (item: VaultItem) => void;
  onDelete?: (item: VaultItem) => void;
  onShare?: (item: VaultItem) => void;
};

function FileGrid({
  items,
  onOpen,
  onMove,
  onDelete,
  onShare,
}: Props) {
  const columns = useMemo(() => {
    const left: VaultItem[] = [];
    const right: VaultItem[] = [];

    items.forEach((item, index) => {
      if (index % 3 === 0) {
        left.push(item);
      } else {
        right.push(item);
      }
    });

    return { left, right };
  }, [items]);

  if (items.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>
          No files or folders found
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      <FlatList
        data={columns.left}
        keyExtractor={(item) => item.id.toString()}
        style={styles.column}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <FileCard
            item={item}
            index={index}
            onOpen={onOpen}
            onMove={onMove}
            onDelete={onDelete}
            onShare={onShare}
          />
        )}
      />

      <FlatList
        data={columns.right}
        keyExtractor={(item) => item.id.toString()}
        style={styles.column}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <FileCard
            item={item}
            index={index}
            onOpen={onOpen}
            onMove={onMove}
            onDelete={onDelete}
            onShare={onShare}
          />
        )}
      />
    </View>
  );
}

export default memo(FileGrid);

const styles = StyleSheet.create({
  grid: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
  },

  column: {
    flex: 1,
  },

  emptyBox: {
    margin: 16,
    padding: 30,
    borderRadius: 22,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
  },

  emptyText: {
    color: "#64748B",
    fontWeight: "600",
  },
});