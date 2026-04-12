import { auth } from "@/auth";
import { CategoriesManager } from "@/components/dashboard/products/categories-manager";

export default async function ProductCategoriesPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return <CategoriesManager role={session.user.role} />;
}
