import { auth } from "@/auth";
import { ReturnsManager } from "@/components/dashboard/orders/returns-manager";

export default async function ReturnedOrdersPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return <ReturnsManager role={session.user.role} />;
}
