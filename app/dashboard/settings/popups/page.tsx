import { Metadata } from "next";
import { PopupManager } from "@/components/dashboard/settings/popup-manager";

export const metadata: Metadata = {
  title: "Popup Settings | Dashboard",
};

export default function PopupsPage() {
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
