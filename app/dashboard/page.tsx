import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/src/db";
import { orderItems, orders, products, users } from "@/src/db/schema";
import { toCurrency, toDate } from "@/src/lib/format";
import { StatCard } from "@/components/dashboard/stat-card";
import { RevenueAreaChart } from "@/components/dashboard/charts/revenue-area-chart";
import { TopProductsCard } from "@/components/dashboard/top-products-card";

export default async function DashboardOverviewPage() {
  const [revenueAgg] = await db
    .select({ value: sql<string>`coalesce(sum(${orders.total}), 0)` })
    .from(orders)
    .where(eq(orders.status, "success"));

  const [ordersAgg] = await db
    .select({ value: sql<string>`count(*)` })
    .from(orders)
    .where(eq(orders.status, "success"));
  const [usersAgg] = await db.select({ value: sql<string>`count(*)` }).from(users);
  const [productsAgg] = await db
    .select({ value: sql<string>`count(*)` })
    .from(products)
    .where(eq(products.status, "active"));

  const revenueRows = await db
    .select({
      day: sql<string>`to_char(${orders.createdAt}, 'MM/DD')`,
      total: sql<string>`coalesce(sum(${orders.total}), 0)`,
    })
    .from(orders)
    .where(sql`${orders.status} = 'success' AND ${orders.createdAt} >= now() - interval '30 days'`)
    .groupBy(sql`to_char(${orders.createdAt}, 'MM/DD')`)
    .orderBy(sql`to_char(${orders.createdAt}, 'MM/DD') asc`);

  const recentOrders = await db
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
    .orderBy(desc(orders.createdAt))
    .limit(5);

  const topProducts = await db
    .select({
      id: products.id,
      name: products.name,
      imageUrl: products.imageUrl,
      sold: sql<string>`coalesce(sum(${orderItems.quantity}), 0)`,
    })
    .from(orderItems)
    .leftJoin(products, eq(orderItems.productId, products.id))
    .groupBy(products.id)
    .orderBy(sql`coalesce(sum(${orderItems.quantity}), 0) desc`)
    .limit(5);

  const topProductsData = topProducts
    .filter((product) => product.id !== null)
    .map((product) => ({
      id: product.id as number,
      name: product.name,
      imageUrl: product.imageUrl,
      sold: Number(product.sold),
    }));

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Revenue" value={Number(revenueAgg?.value ?? 0)} kind="currency" />
        <StatCard label="Total Orders" value={Number(ordersAgg?.value ?? 0)} />
        <StatCard label="Total Users" value={Number(usersAgg?.value ?? 0)} />
        <StatCard label="Active Products" value={Number(productsAgg?.value ?? 0)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueAreaChart
            data={revenueRows.map((row) => ({ label: row.day, total: Number(row.total) }))}
          />
        </div>

        <TopProductsCard products={topProductsData} />
      </section>

      <section className="glass-card p-4">
        <h3 className="text-sm font-semibold text-textPrimary">Recent Orders</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="px-2 py-2">Order ID</th>
                <th className="px-2 py-2">Customer</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Total</th>
                <th className="px-2 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-t border-white/5 text-textPrimary">
                  <td className="px-2 py-2">#{order.id}</td>
                  <td className="px-2 py-2">
                    <p>{order.userName ?? order.accountName ?? "Unknown"}</p>
                    <p className="text-xs text-muted">{order.userEmail ?? order.accountEmail ?? ""}</p>
                  </td>
                  <td className="px-2 py-2 capitalize">{order.status}</td>
                  <td className="px-2 py-2">{toCurrency(order.total)}</td>
                  <td className="px-2 py-2">{toDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
