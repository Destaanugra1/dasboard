import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { orderItems, orders, products, users } from "@/src/db/schema";
import { canWrite } from "@/src/lib/authz";

type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "returned" | "success" | "failed";

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(context.params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [order] = await db
    .select({
      id: orders.id,
      status: orders.status,
      total: orders.total,
      createdAt: orders.createdAt,
      userName: orders.customerName,
      userEmail: orders.customerEmail,
      accountName: users.name,
      accountEmail: users.email,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(eq(orders.id, id))
    .limit(1);

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const items = await db
    .select({
      id: orderItems.id,
      quantity: orderItems.quantity,
      price: orderItems.price,
      productName: products.name,
      productImage: products.imageUrl,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, id));

  const mappedOrder = {
    ...order,
    userName: order.userName || order.accountName,
    userEmail: order.userEmail || order.accountEmail,
  };

  return NextResponse.json({ data: { ...mappedOrder, items } });
}

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canWrite(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = Number(context.params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = (await request.json()) as { status?: OrderStatus };
  if (!body.status) {
    return NextResponse.json({ error: "status is required" }, { status: 400 });
  }

  const [updated] = await db
    .update(orders)
    .set({ status: body.status })
    .where(eq(orders.id, id))
    .returning({ id: orders.id, status: orders.status });

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: updated });
}
