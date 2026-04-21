import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UsersManager } from "@/components/dashboard/users/users-manager";
import { defaultDashboardPath, isAdmin } from "@/src/lib/authz";

export default async function UsersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!isAdmin(session.user.role)) {
    redirect(defaultDashboardPath(session.user.role));
  }

  return <UsersManager role={session.user.role} />;
}
