import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { products, categories } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const [row] = await db
      .select({
        id: products.id,
        title: products.name,
        description: products.description,
        price: products.price,
        imageUrl: products.imageUrl,
        fileUrl: products.fileUrl,
        discountPct: products.discountPct,
        categoryName: categories.name,
        status: products.status,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, id))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const price = Number(row.price);
    const discountPct = row.discountPct ?? 0;
    const finalPrice = discountPct > 0 ? Math.round(price * (1 - discountPct / 100)) : price;

    let imageUrls: string[] = [];
    if (row.imageUrl) {
      try { imageUrls = JSON.parse(row.imageUrl); } catch {
        imageUrls = row.imageUrl.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: row.id,
        title: row.title,
        description: row.description || "",
        category: row.categoryName || "GENERAL",
        price,
        finalPrice,
        discountPct,
        imageUrls,
        fileUrl: row.fileUrl || null,
        badge: price === 0 ? "Free" : "Pro",
        status: row.status,
      },
    });
  } catch (err: any) {
    console.error("Product detail error", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
