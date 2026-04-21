import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ComingSoon } from "@/components/dashboard/coming-soon";
import { canAccessStore, defaultDashboardPath } from "@/src/lib/authz";

export default async function PendingOrdersPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (!canAccessStore(session.user.role)) {
    redirect(defaultDashboardPath(session.user.role));
  }

  return (
    <ComingSoon
      title="Pending Orders"
      description="Use status filter on Orders page to review pending queue and process fulfillment."
    />
  );
}
