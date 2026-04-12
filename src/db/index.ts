import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing. Please set it in .env.local");
}

const sql = neon(databaseUrl);

export const db = drizzle(sql, { schema });

export type Database = typeof db;
