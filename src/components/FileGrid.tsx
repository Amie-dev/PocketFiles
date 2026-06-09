import React, { memo, useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

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

type ColumnItem = {
  item: VaultItem;
  originalIndex: number;
};

type Props = {
  items: VaultItem[];
  onOpen: (item: VaultItem) => void;
  onMove?: (item: VaultItem) => void;
  onDelete?: (item: VaultItem) => void;
  onShare?: (item: VaultItem) => void;
};

function FileGrid({
  items = [],
  onOpen,
  onMove,
  onDelete,
  onShare,
}: Props) {
  const columns = useMemo(() => {
    const left: ColumnItem[] = [];
    const right: ColumnItem[] = [];

    items.forEach((item, index) => {
      const columnItem = {
        item,
        originalIndex: index,
      };

      if (index % 2 === 0) {
        left.push(columnItem);
      } else {
        right.push(columnItem);
      }
    });

    return [left, right];
  }, [items]);

  if (items.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>No files or folders found</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={[{ id: "masonry-grid" }]}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      renderItem={() => (
        <View style={styles.grid}>
          <View style={styles.column}>
            {columns[0].map(({ item, originalIndex }) => (
              <FileCard
                key={`${item.type}-${item.id}`}
                item={item}
                index={originalIndex}
                onOpen={onOpen}
                onMove={onMove}
                onDelete={onDelete}
                onShare={onShare}
              />
            ))}
          </View>

          <View style={styles.column}>
            {columns[1].map(({ item, originalIndex }) => (
              <FileCard
                key={`${item.type}-${item.id}`}
                item={item}
                index={originalIndex}
                onOpen={onOpen}
                onMove={onMove}
                onDelete={onDelete}
                onShare={onShare}
              />
            ))}
          </View>
        </View>
      )}
    />
  );
}

export default memo(FileGrid);

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },

  grid: {
    flexDirection: "row",
    gap: 12,
  },

  column: {
    flex: 1,
    gap: 12,
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