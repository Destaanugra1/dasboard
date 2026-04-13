import { Metadata } from "next";
import { BannersManager } from "@/components/dashboard/settings/banners-manager";

export const metadata: Metadata = {
  title: "Banners Settings | Dashboard",
};

export default function BannersPage() {
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
