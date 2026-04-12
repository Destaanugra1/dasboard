import { asc } from "drizzle-orm";
import { auth } from "@/auth";
import { ProductsManager } from "@/components/dashboard/products/products-manager";
import { db } from "@/src/db";
import { categories } from "@/src/db/schema";

export default async function ProductsPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const categoryRows = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.name));

  return <ProductsManager role={session.user.role} categories={categoryRows} />;
}
