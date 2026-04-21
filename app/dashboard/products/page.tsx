import { asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ProductsManager } from "@/components/dashboard/products/products-manager";
import { db } from "@/src/db";
import { categories } from "@/src/db/schema";
import { canAccessStore, defaultDashboardPath } from "@/src/lib/authz";

export default async function ProductsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }
  if (!canAccessStore(session.user.role)) {
    redirect(defaultDashboardPath(session.user.role));
  }

  const categoryRows = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.name));

  return <ProductsManager role={session.user.role} categories={categoryRows} />;
}
