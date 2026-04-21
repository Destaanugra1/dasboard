import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PopupManager } from "@/components/dashboard/settings/popup-manager";
import { canAccessStore, defaultDashboardPath } from "@/src/lib/authz";

export const metadata: Metadata = {
  title: "Popup Settings | Dashboard",
};

export default async function PopupsPage() {
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
        <h1 className="text-2xl font-bold tracking-tight text-white">Popup & Notifikasi</h1>
        <p className="text-muted">
          Kelola popup iklan dan status maintenance yang ditampilkan di halaman storefront.
        </p>
      </div>
      <PopupManager />
    </div>
  );
}
