import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ApiAuthSettings } from "@/components/dashboard/settings/api-auth-settings";
import { canAccessStore, defaultDashboardPath } from "@/src/lib/authz";

export default async function ApiAuthSettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (!canAccessStore(session.user.role)) {
    redirect(defaultDashboardPath(session.user.role));
  }

  return <ApiAuthSettings />;
}
