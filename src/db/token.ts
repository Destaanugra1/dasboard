import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const tokens = pgTable("tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  accessExpiresAt: timestamp("access_expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // userId: uuid("user_id"), // uncomment if you have a users table
});
