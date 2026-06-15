import Ionicons from "@expo/vector-icons/Ionicons";
import { eq } from "drizzle-orm";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import FileGrid, { VaultItem } from "@/components/FileGrid";
import { useLock } from "@/context/LockProvider";
import { db } from "../../../db/database";
import { FileItem, filesTable } from "../../../db/schema";
import migrations from "../../../drizzle/migrations";

type FilterType = "all" | "image" | "pdf" | "doc" | "favorite";

export default function HomeScreen() {
  const { success, error } = useMigrations(db, migrations);
  const { isPrivate } = useLock();
  const [items, setItems] = useState<VaultItem[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  // console.log("isPrivate =", isPrivate);
  const loadPublicRootFiles = useCallback(async () => {
    const files: FileItem[] = await db
      .select()
      .from(filesTable)
      .where(eq(filesTable.isPrivate, isPrivate));
    // .where(and(isNull(filesTable.folderId), eq(filesTable.isPrivate, false)));

    const mappedItems: VaultItem[] = files
      .map((file) => ({
        id: file.id,
        name: file.name,
        type: file.type,
        localUri: file.localUri,
        isPrivate: file.isPrivate,
        size: file.size,
        extension: file.extension,
        isFavorite: file.isFavorite,
      }))
      .reverse();

    setItems(mappedItems);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (success) {
        loadPublicRootFiles();
      }
    }, [success, loadPublicRootFiles]),
  );

  const filteredItems = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchSearch =
        searchText.length === 0 ||
        item.name.toLowerCase().includes(searchText) ||
        item.extension?.toLowerCase().includes(searchText);

      const matchFilter =
        activeFilter === "all" ||
        item.type === activeFilter ||
        (activeFilter === "favorite" && item.isFavorite);

      return matchSearch && matchFilter;
    });
  }, [items, search, activeFilter]);

  const handleOpen = useCallback((item: VaultItem) => {
    router.push(`/files/${item.id}`);
  }, []);

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
        <Text style={styles.loadingText}>Migration is in progress...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <View style={styles.headerArea}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#94A3B8" />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search files, photos, docs..."
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
            />

            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={20} color="#94A3B8" />
              </Pressable>
            )}
          </View>

          <Pressable
            style={styles.filterButton}
            onPress={() => setActiveFilter("favorite")}
          >
            <Ionicons name="options" size={22} color="#779ced" />
          </Pressable>
        </View>

        <View style={styles.filterRow}>
          {(["all", "image", "pdf", "doc", "favorite"] as FilterType[]).map(
            (filter) => {
              const active = activeFilter === filter;

              return (
                <Pressable
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  style={[styles.filterChip, active && styles.activeFilterChip]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      active && styles.activeFilterText,
                    ]}
                  >
                    {filter === "all"
                      ? "All"
                      : filter === "favorite"
                        ? "★ Favorite"
                        : filter.toUpperCase()}
                  </Text>
                </Pressable>
              );
            },
          )}
        </View>
      </View>

      <FileGrid items={filteredItems} onOpen={handleOpen} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  headerArea: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  searchBox: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    fontWeight: "600",
  },

  filterButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },

  filterRow: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  activeFilterChip: {
    backgroundColor: "#6e84b3",
    borderColor: "#505257",
  },

  filterText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
  },

  activeFilterText: {
    color: "#FFFFFF",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  errorText: {
    color: "#EF4444",
    fontWeight: "700",
    textAlign: "center",
  },

  loadingText: {
    color: "#64748B",
    fontWeight: "700",
  },
});
