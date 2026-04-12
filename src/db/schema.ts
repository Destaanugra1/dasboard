import { relations } from "drizzle-orm";
import {
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "staff", "viewer"]);
export const userStatusEnum = pgEnum("user_status", ["active", "inactive"]);
export const productStatusEnum = pgEnum("product_status", ["active", "draft", "archived"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "returned",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("viewer"),
  avatarUrl: text("avatar_url"),
  status: userStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  description: text("description"),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 140 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  description: text("description"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  imageUrl: text("image_url"),
  status: productStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  status: orderStatusEnum("status").notNull().default("pending"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  quantity: integer("quantity").notNull().default(1),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
});

export const media = pgTable("media", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  publicId: varchar("public_id", { length: 255 }).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  size: integer("size").notNull(),
  uploadedBy: integer("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  uploads: many(media),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const mediaRelations = relations(media, ({ one }) => ({
  uploader: one(users, {
    fields: [media.uploadedBy],
    references: [users.id],
  }),
}));
