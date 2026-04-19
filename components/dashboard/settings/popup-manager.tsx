"use client";

import { useEffect, useState } from "react";
import {
  Plus, Trash2, CheckCircle, XCircle, Megaphone, WrenchIcon,
  Edit2, ToggleLeft, ToggleRight, X, Save, Loader2
} from "lucide-react";
import { CldUploadWidget, CldImage } from "next-cloudinary";

type PopupType = "ad" | "maintenance";

type SitePopup = {
  id: number;
  type: PopupType;
  isActive: boolean;
  title: string;
  message: string | null;
  imageUrl: string | null;
  buttonText: string | null;
  buttonUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

const defaultForm = {
  type: "ad" as PopupType,
  isActive: false,
  title: "",
  message: "",
  imageUrl: "",
  buttonText: "",
  buttonUrl: "",
};

export function PopupManager() {
  const [popups, setPopups] = useState<SitePopup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    fetchPopups();
  }, []);

  const fetchPopups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/popups");
      const data = await res.json();
      setPopups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEditModal = (popup: SitePopup) => {
    setEditingId(popup.id);
    setForm({
      type: popup.type,
      isActive: popup.isActive,
      title: popup.title,
      message: popup.message || "",
      imageUrl: popup.imageUrl || "",
      buttonText: popup.buttonText || "",
      buttonUrl: popup.buttonUrl || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `/api/popups/${editingId}` : "/api/popups";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowModal(false);
        fetchPopups();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (popup: SitePopup) => {
    try {
      await fetch(`/api/popups/${popup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !popup.isActive }),
      });
      fetchPopups();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus popup ini?")) return;
    try {
      await fetch(`/api/popups/${id}`, { method: "DELETE" });
      fetchPopups();
    } catch (err) {
      console.error(err);
    }
  };

  const adPopups = popups.filter((p) => p.type === "ad");
  const maintenancePopups = popups.filter((p) => p.type === "maintenance");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-textPrimary">Popup Manager</h2>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl bg-accentTeal px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accentTeal/90"
        >
          <Plus size={16} />
          <span>Buat Popup</span>
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted flex items-center justify-center gap-2">
          <Loader2 size={18} className="animate-spin" /> Memuat...
        </div>
      ) : (
        <div className="space-y-8">
          {/* Ad Popups */}
          <PopupSection
            title="Popup Iklan"
            description="Popup promosi yang muncul di halaman /template setelah beberapa detik."
            icon={<Megaphone size={18} className="text-accentTeal" />}
            popups={adPopups}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onToggle={handleToggleActive}
            emptyText="Belum ada popup iklan. Buat satu untuk ditampilkan di storefront."
          />

          {/* Maintenance Popups */}
          <PopupSection
            title="Popup Maintenance"
            description="Mengunci halaman /template untuk pengunjung. Tidak bisa ditutup."
            icon={<WrenchIcon size={18} className="text-orange-400" />}
            popups={maintenancePopups}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onToggle={handleToggleActive}
            emptyText="Belum ada konfigurasi maintenance."
          />
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-lg overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="text-base font-semibold text-textPrimary">
                {editingId ? "Edit Popup" : "Buat Popup Baru"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted hover:text-textPrimary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Type Picker */}
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Jenis Popup</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["ad", "maintenance"] as PopupType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, type: t }))}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                        form.type === t
                          ? "border-accentTeal bg-accentTeal/10 text-accentTeal"
                          : "border-white/10 text-muted hover:border-white/20"
                      }`}
                    >
                      {t === "ad" ? <Megaphone size={20} /> : <WrenchIcon size={20} />}
                      <span className="text-xs font-semibold">
                        {t === "ad" ? "Iklan / Promo" : "Maintenance"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Judul *</label>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder={form.type === "ad" ? "🎉 Promo Spesial Hari Ini!" : "🔧 Sedang dalam Pemeliharaan"}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-textPrimary placeholder:text-muted/50 focus:border-accentTeal focus:outline-none"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Pesan / Deskripsi</label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder={form.type === "ad" ? "Dapatkan diskon 30% untuk semua template..." : "Kami sedang melakukan pembaruan sistem. Mohon tunggu sebentar."}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-textPrimary placeholder:text-muted/50 focus:border-accentTeal focus:outline-none resize-none"
                />
              </div>

              {/* Image Upload (only for ad) */}
              {form.type === "ad" && (
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Gambar (Opsional)</label>
                  {form.imageUrl ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black/20">
                      <CldImage src={form.imageUrl} alt="Preview" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))}
                        className="absolute right-2 top-2 rounded-md bg-black/60 p-1 text-white hover:bg-black/80"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  ) : (
                    <CldUploadWidget
                      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""}
                      options={{ folder: "popups", maxFiles: 1 }}
                      onSuccess={(result: any) =>
                        setForm((f) => ({ ...f, imageUrl: result.info.public_id }))
                      }
                    >
                      {({ open }) => (
                        <button
                          type="button"
                          onClick={() => open()}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 p-6 text-muted hover:bg-white/5 transition-colors"
                        >
                          <Plus size={20} />
                          <span className="text-sm">Upload Gambar</span>
                        </button>
                      )}
                    </CldUploadWidget>
                  )}
                </div>
              )}

              {/* CTA Button (only for ad) */}
              {form.type === "ad" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">Teks Tombol</label>
                    <input
                      type="text"
                      value={form.buttonText}
                      onChange={(e) => setForm((f) => ({ ...f, buttonText: e.target.value }))}
                      placeholder="Lihat Promo"
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-textPrimary placeholder:text-muted/50 focus:border-accentTeal focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">URL Tombol</label>
                    <input
                      type="url"
                      value={form.buttonUrl}
                      onChange={(e) => setForm((f) => ({ ...f, buttonUrl: e.target.value }))}
                      placeholder="https://..."
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-textPrimary placeholder:text-muted/50 focus:border-accentTeal focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Active Toggle */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                  className="transition-colors"
                >
                  {form.isActive ? (
                    <ToggleRight size={28} className="text-accentTeal" />
                  ) : (
                    <ToggleLeft size={28} className="text-muted" />
                  )}
                </button>
                <div>
                  <p className="text-sm font-medium text-textPrimary">
                    {form.isActive ? "Aktif" : "Nonaktif"}
                  </p>
                  <p className="text-xs text-muted">
                    {form.isActive
                      ? "Popup akan ditampilkan ke pengunjung."
                      : "Popup tidak akan ditampilkan."}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-muted hover:text-textPrimary transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-accentTeal px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-accentTeal/90 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub-component: Popup Section ---
function PopupSection({
  title,
  description,
  icon,
  popups,
  onEdit,
  onDelete,
  onToggle,
  emptyText,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  popups: SitePopup[];
  onEdit: (p: SitePopup) => void;
  onDelete: (id: number) => void;
  onToggle: (p: SitePopup) => void;
  emptyText: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <h3 className="text-base font-semibold text-textPrimary leading-tight">{title}</h3>
          <p className="text-xs text-muted mt-0.5">{description}</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {popups.length === 0 ? (
          <div className="p-6 text-center text-muted text-sm">{emptyText}</div>
        ) : (
          <div className="divide-y divide-white/5">
            {popups.map((popup) => (
              <div
                key={popup.id}
                className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
              >
                {/* Active status dot */}
                <div
                  className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${
                    popup.isActive ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" : "bg-white/20"
                  }`}
                />

                {/* Image preview (ad only) */}
                {popup.imageUrl && (
                  <div className="relative w-16 h-10 rounded-md overflow-hidden border border-white/10 flex-shrink-0">
                    <CldImage src={popup.imageUrl} alt="" fill className="object-cover" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-textPrimary truncate">{popup.title}</p>
                  {popup.message && (
                    <p className="text-xs text-muted truncate mt-0.5">{popup.message}</p>
                  )}
                </div>

                {/* Status badge */}
                {popup.isActive ? (
                  <span className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                    <CheckCircle size={10} /> Aktif
                  </span>
                ) : (
                  <span className="flex-shrink-0 flex items-center gap-1 text-xs text-muted">
                    <XCircle size={10} /> Nonaktif
                  </span>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => onToggle(popup)}
                    title={popup.isActive ? "Nonaktifkan" : "Aktifkan"}
                    className="p-2 rounded-lg text-muted hover:text-accentTeal hover:bg-accentTeal/10 transition-colors"
                  >
                    {popup.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  </button>
                  <button
                    onClick={() => onEdit(popup)}
                    className="p-2 rounded-lg text-muted hover:text-textPrimary hover:bg-white/10 transition-colors"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => onDelete(popup.id)}
                    className="p-2 rounded-lg text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
