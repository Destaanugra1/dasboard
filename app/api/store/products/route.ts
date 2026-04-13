import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { products, categories } from "@/src/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select({
        id: products.id,
        title: products.name,
        description: products.description,
        price: products.price,
        imageUrl: products.imageUrl,
        fileUrl: products.fileUrl,
        discountPct: products.discountPct,
        category: categories.name,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.status, "active"))
      .orderBy(asc(products.id));

    const data = rows.map((row) => {
      const price = Number(row.price);
      const discountPct = row.discountPct ?? 0;
      const finalPrice = discountPct > 0 ? Math.round(price * (1 - discountPct / 100)) : price;
      // Parse imageUrl as JSON array or comma-separated
      let imageUrls: string[] = [];
      if (row.imageUrl) {
        try { imageUrls = JSON.parse(row.imageUrl); } catch {
          imageUrls = row.imageUrl.split(",").map((s) => s.trim()).filter(Boolean);
        }
      }
      return {
        id: row.id,
        title: row.title,
        description: row.description || "",
        category: row.category || "GENERAL",
        price,
        finalPrice,
        discountPct,
        imageUrl: imageUrls[0] || null,
        imageUrls,
        fileUrl: row.fileUrl || null,
        badge: price === 0 ? "Free" : "Pro",
        isNew: false,
        bg: "#1e1b4b",
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Products error", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
