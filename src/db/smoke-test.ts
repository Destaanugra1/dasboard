import { eq } from "drizzle-orm";
import { db } from "./index";
import { media, products, users } from "./schema";

async function main() {
  const stamp = Date.now();
  const testEmail = `smoke-${stamp}@demo.com`;
  const testName = `Smoke User ${stamp}`;

  const [createdUser] = await db
    .insert(users)
    .values({
      name: testName,
      email: testEmail,
      passwordHash: "hash",
      role: "viewer",
      status: "active",
    })
    .returning({ id: users.id, email: users.email });

  if (!createdUser) {
    throw new Error("User create failed");
  }

  const [fetchedUser] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.id, createdUser.id))
    .limit(1);

  if (!fetchedUser) {
    throw new Error("User read failed");
  }

  const [updatedUser] = await db
    .update(users)
    .set({ status: "inactive" })
    .where(eq(users.id, createdUser.id))
    .returning({ id: users.id, status: users.status });

  if (!updatedUser || updatedUser.status !== "inactive") {
    throw new Error("User update failed");
  }

  const [createdProduct] = await db
    .insert(products)
    .values({
      name: `Smoke Product ${stamp}`,
      slug: `smoke-product-${stamp}`,
      price: "19.99",
      stock: 10,
      status: "active",
    })
    .returning({ id: products.id });

  if (!createdProduct) {
    throw new Error("Product create failed");
  }

  await db
    .insert(media)
    .values({
      url: "https://example.com/img.jpg",
      publicId: `smoke/${stamp}`,
      filename: `smoke-${stamp}.jpg`,
      size: 1024,
      uploadedBy: createdUser.id,
    })
    .returning({ id: media.id });

  await db.delete(products).where(eq(products.id, createdProduct.id));
  await db.delete(users).where(eq(users.id, createdUser.id));

  console.log("CRUD smoke test passed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("CRUD smoke test failed", error);
    process.exit(1);
  });
