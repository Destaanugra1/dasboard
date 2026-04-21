import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RolesManager } from "@/components/dashboard/users/roles-manager";
import { defaultDashboardPath, isAdmin } from "@/src/lib/authz";

export default async function UserRolesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!isAdmin(session.user.role)) {
    redirect(defaultDashboardPath(session.user.role));
  }

  return <RolesManager role={session.user.role} />;
}
