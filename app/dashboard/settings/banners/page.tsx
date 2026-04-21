import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { BannersManager } from "@/components/dashboard/settings/banners-manager";
import { canAccessStore, defaultDashboardPath } from "@/src/lib/authz";

export const metadata: Metadata = {
  title: "Banners Settings | Dashboard",
};

export default async function BannersPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (!canAccessStore(session.user.role)) {
    redirect(defaultDashboardPath(session.user.role));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Storefront Banners</h1>
        <p className="text-muted">Manage the large promotional banners displayed at the top of your shop.</p>
      </div>

      <BannersManager />
    </div>
  );
}
