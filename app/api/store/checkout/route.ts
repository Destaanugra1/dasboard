import { NextResponse } from "next/server";
import { db } from "@/src/db";
import { products, orders, orderItems } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import midtransClient from "midtrans-client";

const serverKey = process.env.MIDTRANS_SERVER_KEY || "SB-Mid-server-12345";
const clientKey = process.env.MIDTRANS_CLIENT_KEY || "SB-Mid-client-12345";

// Midtrans Sandbox keys start with 'SB-'. If it doesn't, it's a production key.
const isProd = process.env.MIDTRANS_IS_PRODUCTION === 'true' || !serverKey.startsWith('SB-');

const coreApi = new midtransClient.CoreApi({
  isProduction: isProd,
  serverKey: serverKey, 
  clientKey: clientKey
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, customerName, customerEmail, paymentMethod = 'qris' } = body;

    if (!productId || !customerName || !customerEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const productList = await db.select().from(products).where(eq(products.id, productId));
    if (productList.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const product = productList[0];
    const basePrice = Number(product.price);
    const discountPct = product.discountPct ?? 0;
    const finalPrice = discountPct > 0 ? Math.round(basePrice * (1 - discountPct / 100)) : basePrice;

    // Insert Order (Pending)
    const newOrder = await db.insert(orders).values({
      customerName,
      customerEmail,
      total: String(finalPrice),
      status: "pending",
    }).returning();
    const order = newOrder[0];

    // Insert Order Items so we know which product it is
    await db.insert(orderItems).values({
      orderId: order.id,
      productId: product.id,
      quantity: 1,
      price: product.price
    });

    const externalId = `order_${order.id}_${Date.now()}`;

    // Midtrans API Request
    let parameter: any = {
      transaction_details: {
        order_id: externalId,
        gross_amount: finalPrice
      },
      customer_details: {
        first_name: customerName,
        email: customerEmail
      }
    };

    if (paymentMethod === 'bri') {
      parameter.payment_type = "bank_transfer";
      parameter.bank_transfer = {
        bank: "bri"
      };
    } else {
      parameter.payment_type = "qris";
    }

    const chargeResponse = await coreApi.charge(parameter);

    let qrImageUrl = "";
    let vaNumber = "";

    if (paymentMethod === 'qris') {
      const action = chargeResponse.actions?.find((a: any) => a.name === "generate-qr-code");
      qrImageUrl = action ? action.url : "";
    } else if (paymentMethod === 'bri') {
      if (chargeResponse.va_numbers && chargeResponse.va_numbers.length > 0) {
        vaNumber = chargeResponse.va_numbers[0].va_number;
      }
    }

    await db.update(orders).set({ 
      externalId,
      paymentQrString: qrImageUrl 
    }).where(eq(orders.id, order.id));

    return NextResponse.json({
      success: true,
      orderId: order.id,
      qrString: qrImageUrl, // Sending URL of the image
      vaNumber: vaNumber,   // Sending VA number if it's BRI
      amount: product.price
    });

  } catch (error: any) {
    console.error("Checkout Error:", error);
    return NextResponse.json(
      { 
        error: "Internal Server Error", 
        message: error?.message || "Unknown error occurred",
        midtransDetail: error?.ApiResponse || null
      },
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
