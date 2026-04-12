import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { categories, orderItems, orders, products, users } from "./schema";

async function seed() {
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(products);
  await db.delete(categories);
  await db.delete(users);

  const passwordHash = await bcrypt.hash("password123", 10);

  const seededUsers = await db
    .insert(users)
    .values(
      Array.from({ length: 10 }).map((_, index) => {
        const role: "admin" | "staff" | "viewer" =
          index === 0 ? "admin" : index < 4 ? "staff" : "viewer";

        return {
          name: `User ${index + 1}`,
          email: index === 0 ? "admin@demo.com" : `user${index + 1}@demo.com`,
          passwordHash,
          role,
          status: "active" as const,
          avatarUrl: null,
        };
      })
    )
    .returning();

  const seededCategories = await db
    .insert(categories)
    .values([
      { name: "Electronics", slug: "electronics", description: "Electronic devices" },
      { name: "Fashion", slug: "fashion", description: "Clothing and accessories" },
      { name: "Home", slug: "home", description: "Home and living" },
      { name: "Sports", slug: "sports", description: "Sports gear" },
    ])
    .returning();

  const seededProducts = await db
    .insert(products)
    .values(
      Array.from({ length: 20 }).map((_, index) => ({
        name: `Product ${index + 1}`,
        slug: `product-${index + 1}`,
        description: `Description for product ${index + 1}`,
        price: (Math.random() * 150 + 10).toFixed(2),
        stock: Math.floor(Math.random() * 120),
        categoryId: seededCategories[index % seededCategories.length]?.id,
        imageUrl: "sample",
        status: "active" as const,
      }))
    )
    .returning();

  const seededOrders = await db
    .insert(orders)
    .values(
      Array.from({ length: 30 }).map((_, index) => ({
        userId: seededUsers[index % seededUsers.length]?.id,
        status: (["pending", "processing", "shipped", "delivered", "returned"] as const)[
          index % 5
        ],
        total: (Math.random() * 450 + 20).toFixed(2),
      }))
    )
    .returning();

  for (const [index, order] of seededOrders.entries()) {
    const p1 = seededProducts[index % seededProducts.length];
    const p2 = seededProducts[(index + 3) % seededProducts.length];

    if (p1) {
      await db.insert(orderItems).values({
        orderId: order.id,
        productId: p1.id,
        quantity: 1 + (index % 3),
        price: p1.price,
      });
    }

    if (p2) {
      await db.insert(orderItems).values({
        orderId: order.id,
        productId: p2.id,
        quantity: 1,
        price: p2.price,
      });
    }
  }

  const [admin] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, "admin@demo.com"))
    .limit(1);

  console.log("Seed completed", {
    users: seededUsers.length,
    categories: seededCategories.length,
    products: seededProducts.length,
    orders: seededOrders.length,
    admin,
  });
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
