import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { orders } from "@/src/db/schema";
import { canAccessStore } from "@/src/lib/authz";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!canAccessStore(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      week: sql<string>`to_char(date_trunc('week', ${orders.createdAt}), 'YYYY-MM-DD')`,
      totalOrders: sql<string>`count(*)`,
    })
    .from(orders)
    .groupBy(sql`date_trunc('week', ${orders.createdAt})`)
    .orderBy(sql`date_trunc('week', ${orders.createdAt}) asc`);

  return NextResponse.json({
    data: rows.map((row) => ({
      week: row.week,
      totalOrders: Number(row.totalOrders),
    })),
  });
}
