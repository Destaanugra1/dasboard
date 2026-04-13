import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { orders } from "@/src/db/schema";
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

    const order = orderList[0];

    return NextResponse.json({
      success: true,
      orderId: order.id,
      status: order.status,
    });
  } catch (error: any) {
    console.error("Status check error:", error);
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
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
