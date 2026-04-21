import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CategoriesManager } from "@/components/dashboard/products/categories-manager";
import { canAccessStore, defaultDashboardPath } from "@/src/lib/authz";

export default async function ProductCategoriesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }
  if (!canAccessStore(session.user.role)) {
    redirect(defaultDashboardPath(session.user.role));
  }

  return <CategoriesManager role={session.user.role} />;
}
