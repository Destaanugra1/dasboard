import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { orders } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import midtransClient from "midtrans-client";

const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
const isProd = process.env.MIDTRANS_IS_PRODUCTION === "true";

const coreApi = new midtransClient.CoreApi({
  isProduction: isProd,
  serverKey,
  clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
});

// Map status Midtrans ke status enum yang valid di schema DB
// orderStatusEnum: "pending" | "processing" | "shipped" | "delivered" | "returned" | "success" | "failed"
function mapMidtransStatus(
  transactionStatus: string,
  fraudStatus?: string
): "success" | "failed" | "returned" | "processing" | null {
  if (transactionStatus === "capture") {
    return fraudStatus === "accept" ? "success" : "failed";
  }
  if (transactionStatus === "settlement") return "success";
  if (transactionStatus === "pending") return null; // belum bayar
  if (["deny", "cancel", "expire"].includes(transactionStatus)) return "failed";
  if (transactionStatus === "refund") return "returned";
  return null;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = parseInt(params.id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const orderList = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));
    if (orderList.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderList[0];

    // Jika sudah final (paid/canceled/dll), langsung kembalikan dari DB
    const finalStatuses = ["success", "failed", "returned", "processing", "shipped", "delivered"];
    if (finalStatuses.includes(order.status)) {
      return NextResponse.json({
        success: true,
        orderId: order.id,
        status: order.status,
      });
    }

    // Jika masih pending dan ada externalId, cek ke Midtrans
    if (order.externalId && serverKey) {
      try {
        const midtransStatus = await (coreApi as any).transaction.status(order.externalId);
        const newStatus = mapMidtransStatus(
          midtransStatus.transaction_status,
          midtransStatus.fraud_status
        );

        if (newStatus && newStatus !== order.status) {
          // Update DB dengan status terbaru dari Midtrans
          await db
            .update(orders)
            .set({ status: newStatus })
            .where(eq(orders.id, orderId));

          return NextResponse.json({
            success: true,
            orderId: order.id,
            status: newStatus,
          });
        }
      } catch (midtransError: any) {
        // Jika Midtrans 404 (transaksi tidak ditemukan), kembalikan status DB
        console.warn("Midtrans status check failed:", midtransError?.message);
      }
    }

    // Kembalikan status dari DB (masih pending)
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
