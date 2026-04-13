import { NextRequest, NextResponse } from "next/server";
import { and, asc, count, eq, ilike } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { categories, products } from "@/src/db/schema";
import { canWrite } from "@/src/lib/authz";
import { firstProductImage, parseProductImages, serializeProductImages } from "@/src/lib/product-images";
import { slugify } from "@/src/lib/slug";

type ProductStatus = "active" | "draft" | "archived";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const q = params.get("q")?.trim();
  const status = params.get("status") as ProductStatus | null;
  const categoryId = Number(params.get("categoryId") ?? "0");
  const page = Number(params.get("page") ?? "1");
  const pageSize = Number(params.get("pageSize") ?? "10");

  const conditions = [];
  if (q) conditions.push(ilike(products.name, `%${q}%`));
  if (status) conditions.push(eq(products.status, status));
  if (categoryId > 0) conditions.push(eq(products.categoryId, categoryId));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      price: products.price,
      stock: products.stock,
      status: products.status,
      imageUrl: products.imageUrl,
      discountPct: products.discountPct,
      categoryId: products.categoryId,
      categoryName: categories.name,
      fileUrl: products.fileUrl,
      createdAt: products.createdAt,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(whereClause)
    .orderBy(asc(products.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const data = rows.map((row) => ({
    ...row,
    imageUrl: firstProductImage(row.imageUrl),
    imageUrls: parseProductImages(row.imageUrl),
    discountPct: row.discountPct ?? 0,
  }));

  const totalResult = await db.select({ value: count() }).from(products).where(whereClause);

  return NextResponse.json({
    data,
    page,
    pageSize,
    total: totalResult[0]?.value ?? 0,
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
    name: string;
    description?: string;
    price: number;
    stock?: number;
    categoryId?: number | null;
    imageUrl?: string;
    imageUrls?: string[];
    fileUrl?: string;
    discountPct?: number;
    status?: ProductStatus;
  };

  const resolvedImages = Array.isArray(body.imageUrls)
    ? body.imageUrls
    : body.imageUrl
      ? [body.imageUrl]
      : [];

  if (!body.name || typeof body.price !== "number") {
    return NextResponse.json({ error: "name and price are required" }, { status: 400 });
  }

  const [created] = await db
    .insert(products)
    .values({
      name: body.name,
      slug: slugify(body.name),
      description: body.description,
      price: body.price.toFixed(2),
      stock: body.stock ?? 0,
      categoryId: body.categoryId ?? null,
      imageUrl: serializeProductImages(resolvedImages),
      fileUrl: body.fileUrl,
      discountPct: body.discountPct ?? 0,
      status: body.status ?? "active",
    })
    .returning();

  return NextResponse.json(
    {
      data: {
        ...created,
        imageUrl: firstProductImage(created.imageUrl),
        imageUrls: parseProductImages(created.imageUrl),
      },
    },
    { status: 201 }
  );
}
