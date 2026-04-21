import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { blogCategories } from "@/src/db/schema";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { canManageBlog } from "@/src/lib/authz";
import { slugify } from "@/src/lib/slug";

// Public — GET all categories
export async function GET() {
  try {
    const rows = await db
      .select()
      .from(blogCategories)
      .orderBy(asc(blogCategories.name));
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// Auth — POST create category
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageBlog(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, description, icon, color } = body;

  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const slug = slugify(name);

  const [row] = await db
    .insert(blogCategories)
    .values({ name, slug, description, icon: icon ?? "📰", color: color ?? "#b91c1c" })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
