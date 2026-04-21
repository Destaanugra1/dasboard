import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ReturnsManager } from "@/components/dashboard/orders/returns-manager";
import { canAccessStore, defaultDashboardPath } from "@/src/lib/authz";

export default async function ReturnedOrdersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }
  if (!canAccessStore(session.user.role)) {
    redirect(defaultDashboardPath(session.user.role));
  }

  return <ReturnsManager role={session.user.role} />;
}
