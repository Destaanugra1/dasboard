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
        price: products.price,
        category: categories.name,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.status, "active"))
      .orderBy(asc(products.id));

    const data = rows.map((row) => {
      return {
        id: row.id,
        title: row.title,
        category: row.category || "GENERAL",
        price: Number(row.price),
        badge: Number(row.price) === 0 ? "Free" : "Pro",
        isNew: false,
        bg: "#1e1b4b", // Default background color for template cards
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
