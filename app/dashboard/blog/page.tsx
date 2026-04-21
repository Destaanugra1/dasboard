import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { BlogManager } from "@/components/dashboard/blog/blog-manager";
import { canAccessBlog, defaultDashboardPath } from "@/src/lib/authz";

export const metadata = { title: "Blog — Dashboard" };

export default async function BlogPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (!canAccessBlog(session.user.role)) {
    redirect(defaultDashboardPath(session.user.role));
  }

  return <BlogManager role={session.user.role} />;
}
