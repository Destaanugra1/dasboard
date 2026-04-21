import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ComingSoon } from "@/components/dashboard/coming-soon";
import { canAccessStore, defaultDashboardPath } from "@/src/lib/authz";

export default async function AnalyticsRevenuePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (!canAccessStore(session.user.role)) {
    redirect(defaultDashboardPath(session.user.role));
  }

  return (
    <ComingSoon
      title="Revenue Drilldown"
      description="Detailed breakdown by product, category, and payment window can be added here."
    />
  );
}
