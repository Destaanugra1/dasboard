import { auth } from "@/auth";
import { InventoryManager } from "@/components/dashboard/products/inventory-manager";

export default async function ProductInventoryPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return <InventoryManager role={session.user.role} />;
}
