import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ComingSoon } from "@/components/dashboard/coming-soon";
import { canAccessStore, defaultDashboardPath } from "@/src/lib/authz";

export default async function GeneralSettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (!canAccessStore(session.user.role)) {
    redirect(defaultDashboardPath(session.user.role));
  }

  return (
    <ComingSoon
      title="General Settings"
      description="Configure store profile, timezone, and default operational preferences."
    />
  );
}
