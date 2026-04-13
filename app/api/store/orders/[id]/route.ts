import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { orders, orderItems, products } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = parseInt(params.id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const orderList = await db.select().from(orders).where(eq(orders.id, orderId));
    if (orderList.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderData = orderList[0];

    // Fetch the attached fileUrl and productName from order items
    const [item] = await db.select({
       productName: products.name,
       fileUrl: products.fileUrl
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, orderId))
    .limit(1);

    return NextResponse.json({
      success: true,
      order: {
         ...orderData,
         productName: item?.productName || "Produk",
         fileUrl: item?.fileUrl || null
      },
    });
  } catch (error: any) {
    console.error("Fetch Order error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
