import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { categories, products } from "@/src/db/schema";
import { canAccessStore, canManageStore } from "@/src/lib/authz";
import { slugify } from "@/src/lib/slug";

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canAccessStore(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = Number(context.params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [record] = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      productCount: sql<string>`count(${products.id})`,
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .where(eq(categories.id, id))
    .groupBy(categories.id)
    .limit(1);

  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: { ...record, productCount: Number(record.productCount) } });
}

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageStore(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = Number(context.params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = (await request.json()) as {
    name?: string;
    description?: string;
  };

  const updateValues: { name?: string; slug?: string; description?: string | null } = {};

  if (body.name?.trim()) {
    updateValues.name = body.name.trim();
    updateValues.slug = slugify(body.name.trim());
  }

  if (body.description !== undefined) {
    updateValues.description = body.description.trim() || null;
  }

  const [updated] = await db
    .update(categories)
    .set(updateValues)
    .where(eq(categories.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: updated });
}

export async function DELETE(_request: NextRequest, context: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canManageStore(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = Number(context.params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [deleted] = await db.delete(categories).where(eq(categories.id, id)).returning({ id: categories.id });

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: deleted });
}
