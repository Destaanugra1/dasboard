"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, CheckCircle, XCircle } from "lucide-react";
import { CldImage, CldUploadWidget } from "next-cloudinary";

type Banner = {
  id: number;
  desktopImageUrl: string;
  mobileImageUrl: string;
  isActive: boolean;
  createdAt: string;
};

export function BannersManager() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [desktopImage, setDesktopImage] = useState("");
  const [mobileImage, setMobileImage] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/banners");
      const data = await res.json();
      setBanners(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desktopImage || !mobileImage) {
      alert("Please upload both Desktop and Mobile banners.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          desktopImageUrl: desktopImage,
          mobileImageUrl: mobileImage,
          isActive,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setDesktopImage("");
        setMobileImage("");
        setIsActive(true);
        fetchBanners();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      await fetch(`/api/banners/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      fetchBanners();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this banner?")) return;
    try {
      await fetch(`/api/banners/${id}`, { method: "DELETE" });
      fetchBanners();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-textPrimary">Banners Settings</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-accentTeal px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accentTeal/90"
        >
          <Plus size={16} />
          <span>Add Banner</span>
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted">Loading...</div>
        ) : banners.length === 0 ? (
          <div className="p-8 text-center text-muted">No banners found. Add one to display on the storefront.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {banners.map((banner) => (
              <div key={banner.id} className="relative rounded-xl border border-white/10 bg-black/20 p-4 transition-all hover:bg-black/30 flex flex-col gap-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2 items-center">
                    {banner.isActive ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-green-400 bg-green-400/10 px-2 py-1 rounded-full"><CheckCircle size={12}/> Active</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium text-gray-400"><XCircle size={12}/> Inactive</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="space-y-4 flex-1">
                  <div>
                    <span className="text-xs text-muted block mb-1">Desktop Preview</span>
                    <div className="relative aspect-[2/1] w-full overflow-hidden rounded-md bg-black/40 border border-white/5">
                      <CldImage
                        src={banner.desktopImageUrl}
                        alt="Desktop Banner"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 300px"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted block mb-1">Mobile Preview</span>
                    <div className="relative aspect-[4/3] w-24 overflow-hidden rounded-md bg-black/40 border border-white/5 mx-auto">
                      <CldImage
                        src={banner.mobileImageUrl}
                        alt="Mobile Banner"
                        fill
                        className="object-cover"
                        sizes="100px"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleActive(banner.id, banner.isActive)}
                  className={`mt-2 w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                    banner.isActive ? "bg-white/5 text-muted hover:bg-white/10" : "bg-accentTeal/20 text-accentTeal hover:bg-accentTeal/30"
                  }`}
                >
                  {banner.isActive ? "Deactivate" : "Set as Active"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg overflow-hidden p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold text-textPrimary">Add Display Banner</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div>
                <label className="mb-2 block text-sm font-medium text-muted">
                  Desktop Banner (e.g., 3780x1890 or 2:1 ratio)
                </label>
                {desktopImage ? (
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-white/10 bg-black/20">
                    <CldImage src={desktopImage} alt="Preview" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setDesktopImage("")}
                      className="absolute right-2 top-2 rounded-md bg-black/60 p-1 text-white hover:bg-black/80"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                ) : (
                  <CldUploadWidget
                    uploadPreset="ml_default"
                    options={{ folder: "banners", maxFiles: 1 }}
                    onSuccess={(result: any) => setDesktopImage(result.info.public_id)}
                  >
                    {({ open }) => (
                      <button
                        type="button"
                        onClick={() => open()}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 p-8 text-muted hover:bg-white/5 transition-colors"
                      >
                        <Plus size={20} />
                        <span>Upload Desktop Image</span>
                      </button>
                    )}
                  </CldUploadWidget>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted">
                  Mobile Banner (e.g., 1080x1080 or square/portrait ratio)
                </label>
                {mobileImage ? (
                  <div className="relative aspect-square w-32 mx-auto overflow-hidden rounded-lg border border-white/10 bg-black/20">
                    <CldImage src={mobileImage} alt="Preview" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setMobileImage("")}
                      className="absolute right-1 top-1 rounded-md bg-black/60 p-1 text-white hover:bg-black/80"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                ) : (
                  <CldUploadWidget
                    uploadPreset="ml_default"
                    options={{ folder: "banners", maxFiles: 1 }}
                    onSuccess={(result: any) => setMobileImage(result.info.public_id)}
                  >
                    {({ open }) => (
                      <button
                        type="button"
                        onClick={() => open()}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 p-6 text-muted hover:bg-white/5 transition-colors"
                      >
                        <Plus size={20} />
                        <span>Upload Mobile Image</span>
                      </button>
                    )}
                  </CldUploadWidget>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-accentTeal focus:ring-accentTeal focus:ring-offset-gray-800"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-textPrimary">
                  Set as Active Banner (Deactivates others)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-muted hover:text-textPrimary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !desktopImage || !mobileImage}
                  className="rounded-xl bg-accentTeal px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-accentTeal/90 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
