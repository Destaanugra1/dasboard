import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { OrdersManager } from "@/components/dashboard/orders/orders-manager";
import { canAccessStore, defaultDashboardPath } from "@/src/lib/authz";

export default async function OrdersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }
  if (!canAccessStore(session.user.role)) {
    redirect(defaultDashboardPath(session.user.role));
  }

  return <OrdersManager role={session.user.role} />;
}
