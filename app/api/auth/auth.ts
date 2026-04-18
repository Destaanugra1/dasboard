import jwt from "jsonwebtoken";
import { db } from "@/src/db";
import { tokens } from "@/src/db/token";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const ACCESS_TOKEN_TTL = 60 * 60; // 1 hour in seconds
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days

export async function generateTokens(payload: object) {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
  const accessExpiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL * 1000);

  // Insert token record (replace any existing for same payload identifier if needed)
  await db.insert(tokens).values({
    accessToken,
    refreshToken,
    accessExpiresAt,
  });

  return { accessToken, refreshToken, accessExpiresAt };
}

export async function verifyAccessToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const stored = await db.select().from(tokens).where(eq(tokens.accessToken, token)).limit(1);
    if (!stored.length) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function refreshAccessToken(refreshToken: string) {
  try {
    const payload = jwt.verify(refreshToken, JWT_SECRET) as any;
    const stored = await db.select().from(tokens).where(eq(tokens.refreshToken, refreshToken)).limit(1);
    if (!stored.length) return null;
    const newAccess = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
    const newExpiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL * 1000);
    await db.update(tokens).set({ accessToken: newAccess, accessExpiresAt: newExpiresAt }).where(eq(tokens.id, stored[0].id));
    return { accessToken: newAccess, accessExpiresAt: newExpiresAt };
  } catch {
    return null;
  }
}
