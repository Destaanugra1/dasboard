import { NextRequest, NextResponse } from "next/server";
import { asc, eq, ilike, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { categories, products } from "@/src/db/schema";
import { canWrite } from "@/src/lib/authz";
import { slugify } from "@/src/lib/slug";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();
  const whereClause = q ? ilike(categories.name, `%${q}%`) : undefined;

  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      productCount: sql<string>`count(${products.id})`,
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .where(whereClause)
    .groupBy(categories.id)
    .orderBy(asc(categories.name));

  return NextResponse.json({
    data: rows.map((row) => ({
      ...row,
      productCount: Number(row.productCount),
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    name?: string;
    description?: string;
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Category name is required" }, { status: 400 });
  }

  const [created] = await db
    .insert(categories)
    .values({
      name: body.name.trim(),
      slug: slugify(body.name),
      description: body.description?.trim() || null,
    })
    .returning();

  return NextResponse.json({ data: created }, { status: 201 });
}
