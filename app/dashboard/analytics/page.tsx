import { eq, sql } from "drizzle-orm";
import { db } from "@/src/db";
import { orderItems, orders, products, users } from "@/src/db/schema";
import { StatCard } from "@/components/dashboard/stat-card";
import { RevenueAreaChart } from "@/components/dashboard/charts/revenue-area-chart";
import { OrdersBarChart } from "@/components/dashboard/charts/orders-bar-chart";
import { TopProductsPieChart } from "@/components/dashboard/charts/top-products-pie-chart";

export default async function AnalyticsPage() {
  const monthlyRevenue = await db
    .select({
      label: sql<string>`to_char(date_trunc('month', ${orders.createdAt}), 'Mon YYYY')`,
      total: sql<string>`coalesce(sum(${orders.total}), 0)`,
    })
    .from(orders)
    .groupBy(sql`date_trunc('month', ${orders.createdAt})`)
    .orderBy(sql`date_trunc('month', ${orders.createdAt}) asc`);

  const weeklyOrders = await db
    .select({
      label: sql<string>`to_char(date_trunc('week', ${orders.createdAt}), 'DD Mon')`,
      total: sql<string>`count(*)`,
    })
    .from(orders)
    .groupBy(sql`date_trunc('week', ${orders.createdAt})`)
    .orderBy(sql`date_trunc('week', ${orders.createdAt}) asc`);

  const topProducts = await db
    .select({
      name: products.name,
      value: sql<string>`coalesce(sum(${orderItems.quantity}), 0)`,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .groupBy(products.id)
    .orderBy(sql`coalesce(sum(${orderItems.quantity}), 0) desc`)
    .limit(5);

  const [ordersCount] = await db.select({ value: sql<string>`count(*)` }).from(orders);
  const [usersCount] = await db.select({ value: sql<string>`count(*)` }).from(users);
  const [activeProducts] = await db
    .select({ value: sql<string>`count(*)` })
    .from(products)
    .where(eq(products.status, "active"));

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Traffic Sessions" value={Number(usersCount?.value ?? 0) * 22} />
        <StatCard label="Weekly Orders" value={Number(ordersCount?.value ?? 0)} />
        <StatCard label="Active Catalog" value={Number(activeProducts?.value ?? 0)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <RevenueAreaChart
          data={monthlyRevenue.map((row) => ({ label: row.label, total: Number(row.total) }))}
        />
        <OrdersBarChart
          data={weeklyOrders.map((row) => ({ label: row.label, total: Number(row.total) }))}
        />
      </section>

      <section>
        <TopProductsPieChart
          data={topProducts.map((product) => ({
            name: product.name ?? "Unknown",
            value: Number(product.value),
          }))}
        />
      </section>
    </div>
  );
}
