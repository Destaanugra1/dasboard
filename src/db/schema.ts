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
  boolean,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "staff", "viewer"]);
export const userStatusEnum = pgEnum("user_status", ["active", "inactive"]);
export const productStatusEnum = pgEnum("product_status", ["active", "draft", "archived"]);
export const popupTypeEnum = pgEnum("popup_type", ["ad", "maintenance"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "returned",
  "success",
  "failed"
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
  fileUrl: text("file_url"),
  discountPct: integer("discount_pct").notNull().default(0),
  status: productStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  desktopImageUrl: text("desktop_image_url").notNull(),
  mobileImageUrl: text("mobile_image_url").notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sitePopups = pgTable("site_popups", {
  id: serial("id").primaryKey(),
  type: popupTypeEnum("type").notNull().default("ad"),
  isActive: boolean("is_active").default(false).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  imageUrl: text("image_url"),
  buttonText: varchar("button_text", { length: 100 }),
  buttonUrl: text("button_url"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }), // Nullable for guest checkouts
  customerName: varchar("customer_name", { length: 120 }), // For guest checkouts
  customerEmail: varchar("customer_email", { length: 255 }), // For guest checkouts
  externalId: varchar("external_id", { length: 255 }), // Xendit external reference ID
  paymentQrString: text("payment_qr_string"), // To store raw QR string
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
