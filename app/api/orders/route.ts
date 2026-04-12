import { NextRequest, NextResponse } from "next/server";
import { and, asc, count, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { orders, users } from "@/src/db/schema";

type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "returned";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get("status") as OrderStatus | null;
  const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
  const pageSize = Number(request.nextUrl.searchParams.get("pageSize") ?? "10");

  const conditions = [];
  if (status) conditions.push(eq(orders.status, status));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select({
      id: orders.id,
      status: orders.status,
      total: orders.total,
      createdAt: orders.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(whereClause)
    .orderBy(asc(orders.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const totalResult = await db.select({ value: count() }).from(orders).where(whereClause);

  return NextResponse.json({
    data,
    page,
    pageSize,
    total: totalResult[0]?.value ?? 0,
  });
}
