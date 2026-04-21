import { NextRequest, NextResponse } from "next/server";
import { and, desc, count, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { orders, users } from "@/src/db/schema";
import { canAccessStore } from "@/src/lib/authz";

type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "returned" | "success" | "failed";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canAccessStore(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
      userName: orders.customerName,
      userEmail: orders.customerEmail,
      // fallback if customerName is null but user is linked (rare/legacy)
      accountName: users.name,
      accountEmail: users.email,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .where(whereClause)
    .orderBy(desc(orders.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const totalResult = await db.select({ value: count() }).from(orders).where(whereClause);

  // map the fallback
  const mappedData = data.map((row) => ({
    ...row,
    userName: row.userName || row.accountName,
    userEmail: row.userEmail || row.accountEmail,
  }));

  return NextResponse.json({
    data: mappedData,
    page,
    pageSize,
    total: totalResult[0]?.value ?? 0,
  });
}
