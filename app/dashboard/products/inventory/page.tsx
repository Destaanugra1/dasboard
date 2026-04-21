import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { InventoryManager } from "@/components/dashboard/products/inventory-manager";
import { canAccessStore, defaultDashboardPath } from "@/src/lib/authz";

export default async function ProductInventoryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }
  if (!canAccessStore(session.user.role)) {
    redirect(defaultDashboardPath(session.user.role));
  }

  return <InventoryManager role={session.user.role} />;
}
