import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { BlogCategoriesManager } from "@/components/dashboard/blog/blog-categories-manager";
import { canManageBlog, defaultDashboardPath } from "@/src/lib/authz";

export const metadata = { title: "Kategori Blog — Dashboard" };

export default async function BlogCategoriesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (!canManageBlog(session.user.role)) {
    redirect(defaultDashboardPath(session.user.role));
  }

  return <BlogCategoriesManager />;
}
