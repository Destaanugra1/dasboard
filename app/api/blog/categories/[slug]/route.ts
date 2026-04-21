import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { blogCategories } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { canManageBlog } from "@/src/lib/authz";
import { slugify } from "@/src/lib/slug";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const [row] = await db.select().from(blogCategories).where(eq(blogCategories.slug, slug));
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageBlog(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { slug } = await params;
  const body = await req.json();

  const updates: Partial<typeof blogCategories.$inferInsert> = {};
  if (body.name !== undefined) { updates.name = body.name; updates.slug = slugify(body.name); }
  if (body.description !== undefined) updates.description = body.description;
  if (body.icon !== undefined) updates.icon = body.icon;
  if (body.color !== undefined) updates.color = body.color;

  const [updated] = await db
    .update(blogCategories)
    .set(updates)
    .where(eq(blogCategories.slug, slug))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageBlog(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { slug } = await params;
  await db.delete(blogCategories).where(eq(blogCategories.slug, slug));
  return NextResponse.json({ success: true });
}
