import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { BlogSettingsManager } from "@/components/dashboard/blog/blog-settings-manager";
import { canManageBlog, defaultDashboardPath } from "@/src/lib/authz";

export const metadata = { title: "Pengaturan Blog — Dashboard" };

export default async function BlogSettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (!canManageBlog(session.user.role)) {
    redirect(defaultDashboardPath(session.user.role));
  }

  return <BlogSettingsManager />;
}
