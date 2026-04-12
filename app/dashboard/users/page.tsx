import { auth } from "@/auth";
import { UsersManager } from "@/components/dashboard/users/users-manager";

export default async function UsersPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return <UsersManager role={session.user.role} />;
}
