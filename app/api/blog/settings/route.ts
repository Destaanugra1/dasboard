import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { blogSettings } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { canManageBlog } from "@/src/lib/authz";

// Public — GET all settings as key-value map
export async function GET() {
  const rows = await db.select().from(blogSettings);
  const map: Record<string, string | null> = {};
  for (const r of rows) map[r.key] = r.value;
  return NextResponse.json(map);
}

// Auth — PATCH upsert settings
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageBlog(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as Record<string, string>;
  const now = new Date();

  for (const [key, value] of Object.entries(body)) {
    await db
      .insert(blogSettings)
      .values({ key, value: String(value), updatedAt: now })
      .onConflictDoUpdate({
        target: blogSettings.key,
        set: { value: String(value), updatedAt: now },
      });
  }

  return NextResponse.json({ success: true });
}
