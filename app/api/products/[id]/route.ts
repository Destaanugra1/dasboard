import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { products } from "@/src/db/schema";
import { canWrite } from "@/src/lib/authz";
import { firstProductImage, parseProductImages, serializeProductImages } from "@/src/lib/product-images";
import { slugify } from "@/src/lib/slug";

type ProductStatus = "active" | "draft" | "archived";

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(context.params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [record] = await db.select().from(products).where(eq(products.id, id)).limit(1);

  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      ...record,
      imageUrl: firstProductImage(record.imageUrl),
      imageUrls: parseProductImages(record.imageUrl),
    },
  });
}

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = Number(context.params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = (await request.json()) as {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    categoryId?: number | null;
    imageUrl?: string;
    imageUrls?: string[];
    fileUrl?: string;
    status?: ProductStatus;
  };

  const updateValues: {
    name?: string;
    slug?: string;
    description?: string;
    price?: string;
    stock?: number;
    categoryId?: number | null;
    imageUrl?: string;
    fileUrl?: string;
    status?: ProductStatus;
  } = {};

  if (body.name) {
    updateValues.name = body.name;
    updateValues.slug = slugify(body.name);
  }
  if (body.description !== undefined) updateValues.description = body.description;
  if (body.price !== undefined) updateValues.price = body.price.toFixed(2);
  if (body.stock !== undefined) updateValues.stock = body.stock;
  if (body.categoryId !== undefined) updateValues.categoryId = body.categoryId;
  if (body.imageUrls !== undefined) {
    updateValues.imageUrl = serializeProductImages(body.imageUrls) ?? undefined;
  } else if (body.imageUrl !== undefined) {
    updateValues.imageUrl = serializeProductImages(body.imageUrl ? [body.imageUrl] : []) ?? undefined;
  }
  if (body.fileUrl !== undefined) updateValues.fileUrl = body.fileUrl;
  if (body.status) updateValues.status = body.status;

  const [updated] = await db
    .update(products)
    .set(updateValues)
    .where(eq(products.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      ...updated,
      imageUrl: firstProductImage(updated.imageUrl),
      imageUrls: parseProductImages(updated.imageUrl),
    },
  });
}

export async function DELETE(_request: NextRequest, context: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = Number(context.params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [deleted] = await db.delete(products).where(eq(products.id, id)).returning({ id: products.id });

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: deleted });
}
