import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { orders } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const orderId = Number(params.id);

    if (!orderId) {
      return NextResponse.json({ error: "Invalid Order ID" }, { status: 400 });
    }

    // Force update the order status to "processing" (meaning paid and waiting to be delivered)
    await db.update(orders)
      .set({ status: "processing" })
      .where(eq(orders.id, orderId));

    return NextResponse.json({ success: true, message: "Order mocked as paid" });
  } catch (error: any) {
    console.error("Mock Pay Error:", error);
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
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
