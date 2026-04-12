import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { orders } from "@/src/db/schema";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      day: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
      total: sql<string>`coalesce(sum(${orders.total}), 0)`,
    })
    .from(orders)
    .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD') asc`);

  return NextResponse.json({
    data: rows.map((row) => ({
      day: row.day,
      total: Number(row.total),
    })),
  });
}
