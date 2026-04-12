import { auth } from "@/auth";
import { OrdersManager } from "@/components/dashboard/orders/orders-manager";

export default async function OrdersPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return <OrdersManager role={session.user.role} />;
}
