import { desc, eq } from "drizzle-orm";
import { ActivityLogBoard, type ActivityEntry } from "@/components/dashboard/users/activity-log-board";
import { db } from "@/src/db";
import { media, orders, products, users } from "@/src/db/schema";

export default async function UserActivityPage() {
  const [userRows, orderRows, productRows, mediaRows] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(40),
    db
      .select({
        id: orders.id,
        status: orders.status,
        total: orders.total,
        userName: users.name,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt))
      .limit(40),
    db
      .select({
        id: products.id,
        name: products.name,
        status: products.status,
        stock: products.stock,
        createdAt: products.createdAt,
      })
      .from(products)
      .orderBy(desc(products.createdAt))
      .limit(40),
    db
      .select({
        id: media.id,
        filename: media.filename,
        uploader: users.name,
        createdAt: media.createdAt,
      })
      .from(media)
      .leftJoin(users, eq(media.uploadedBy, users.id))
      .orderBy(desc(media.createdAt))
      .limit(40),
  ]);

  const entries: ActivityEntry[] = [
    ...userRows.map((row) => ({
      id: `user-${row.id}`,
      type: "user" as const,
      title: `User ${row.name} created`,
      detail: `${row.email} assigned as ${row.role}`,
      actor: "System",
      createdAt: new Date(row.createdAt).toISOString(),
      severity: row.status === "active" ? ("success" as const) : ("warning" as const),
    })),
    ...orderRows.map((row) => ({
      id: `order-${row.id}`,
      type: "order" as const,
      title: `Order #${row.id} updated`,
      detail: `Status set to ${row.status}, total ${row.total}`,
      actor: row.userName ?? "Unknown user",
      createdAt: new Date(row.createdAt).toISOString(),
      severity:
        row.status === "delivered"
          ? ("success" as const)
          : row.status === "returned"
            ? ("warning" as const)
            : ("info" as const),
    })),
    ...productRows.map((row) => ({
      id: `product-${row.id}`,
      type: "product" as const,
      title: `Product ${row.name} synced`,
      detail: `Status ${row.status}, stock ${row.stock}`,
      actor: "Catalog service",
      createdAt: new Date(row.createdAt).toISOString(),
      severity: row.status === "archived" ? ("warning" as const) : ("info" as const),
    })),
    ...mediaRows.map((row) => ({
      id: `media-${row.id}`,
      type: "media" as const,
      title: `Media uploaded: ${row.filename}`,
      detail: "Asset added to Cloudinary and linked in dashboard",
      actor: row.uploader ?? "Unknown uploader",
      createdAt: new Date(row.createdAt).toISOString(),
      severity: "success" as const,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return <ActivityLogBoard entries={entries} />;
}
