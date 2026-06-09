import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const foldersTable = sqliteTable("folders", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  name: text("name").notNull(),

  // folder inside folder
  // null means root folder
  parentId: integer("parent_id"),

  // false = public, true = private
  isPrivate: integer("is_private", { mode: "boolean" })
    .notNull()
    .default(false),

  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const filesTable = sqliteTable("files", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  name: text("name").notNull(),

  type: text("type", {
    enum: ["image", "pdf", "doc", "other"],
  }).notNull(),

  extension: text("extension"),

  localUri: text("local_uri").notNull(),

  folderId: integer("folder_id"),

  isPrivate: integer("is_private", {
    mode: "boolean",
  })
    .notNull()
    .default(false),

  size: integer("size").notNull().default(0),

  thumbnailUri: text("thumbnail_uri"),

  // ⭐ Favorite
  isFavorite: integer("is_favorite", {
    mode: "boolean",
  })
    .notNull()
    .default(false),

  // 🏷️ Tags stored as JSON string
  // Example:
  // ["Travel","Family","Important"]
  tags: text("tags").notNull().default("[]"),

  createdAt: text("created_at").notNull(),

  updatedAt: text("updated_at").notNull(),
});
export type Folder = typeof foldersTable.$inferSelect;
export type NewFolder = typeof foldersTable.$inferInsert;

export type FileItem = typeof filesTable.$inferSelect;
export type NewFileItem = typeof filesTable.$inferInsert;
