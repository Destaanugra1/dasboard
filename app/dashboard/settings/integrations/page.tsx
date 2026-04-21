import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ComingSoon } from "@/components/dashboard/coming-soon";
import { canAccessStore, defaultDashboardPath } from "@/src/lib/authz";

export default async function IntegrationsSettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (!canAccessStore(session.user.role)) {
    redirect(defaultDashboardPath(session.user.role));
  }

  return (
    <ComingSoon
      title="Integrations"
      description="Connect shipping, payment, and communication providers from this panel."
    />
  );
}
