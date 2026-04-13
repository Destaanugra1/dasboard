import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { eq, asc, desc, sum, sql } from "drizzle-orm";
import { products, categories, orders, orderItems } from "@/src/db/schema";

export async function GET() {
  try {
    const salesSubquery = db
      .select({
        productId: orderItems.productId,
        salesCount: sql<number>`coalesce(sum(${orderItems.quantity}), 0)`.as('sales_count'),
      })
      .from(orderItems)
      .leftJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(orders.status, "success"))
      .groupBy(orderItems.productId)
      .as("salesSubquery");

    const rows = await db
      .select({
        id: products.id,
        title: products.name,
        slug: products.slug,
        description: products.description,
        price: products.price,
        imageUrl: products.imageUrl,
        fileUrl: products.fileUrl,
        discountPct: products.discountPct,
        category: categories.name,
        salesCount: sql<number>`coalesce(${salesSubquery.salesCount}, 0)`,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(salesSubquery, eq(products.id, salesSubquery.productId))
      .where(eq(products.status, "active"))
      .orderBy(desc(sql`coalesce(${salesSubquery.salesCount}, 0)`), asc(products.id));

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
        slug: row.slug,
        description: row.description || "",
        category: row.category || "GENERAL",
        price,
        finalPrice,
        discountPct,
        salesCount: Number(row.salesCount),
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
