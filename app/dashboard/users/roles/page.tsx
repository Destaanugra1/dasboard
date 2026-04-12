import { auth } from "@/auth";
import { RolesManager } from "@/components/dashboard/users/roles-manager";

export default async function UserRolesPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return <RolesManager role={session.user.role} />;
}
