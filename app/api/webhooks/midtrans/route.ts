import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { orders } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // In production, verify signature using serverKey:
    // sha512(order_id + status_code + gross_amount + server_key)
    
    const { order_id, transaction_status, fraud_status } = body;

    // 'settlement' is used for full payment completion for QRIS
    // 'capture' is used for credit card (if any)
    if (transaction_status === "capture" || transaction_status === "settlement") {
      if (fraud_status !== "challenge") {
         await db.update(orders)
           .set({ status: "success" }) 
           .where(eq(orders.externalId, order_id));

         // TODO: Send email with template download link here
      }
    } else if (transaction_status === "cancel" || transaction_status === "deny" || transaction_status === "expire") {
       await db.update(orders)
         .set({ status: "failed" }) 
         .where(eq(orders.externalId, order_id));
    }

    return NextResponse.json({ success: true, message: "Webhook processed" });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
