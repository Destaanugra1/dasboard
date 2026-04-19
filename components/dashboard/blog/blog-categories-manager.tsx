"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, Loader2, Save, X } from "lucide-react";

type BlogCategory = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  color: string;
  createdAt: string;
};

const PRESET_COLORS = [
  "#b91c1c", "#d97706", "#059669", "#2563eb", "#7c3aed",
  "#db2777", "#0891b2", "#65a30d", "#ea580c", "#6b7280",
];

const PRESET_ICONS = ["📰", "🌍", "⚽", "💻", "🎬", "🏥", "🏦", "🎓", "📈", "🍔", "✈️", "🎨", "🔬", "🎵", "💡"];

type FormState = { name: string; description: string; icon: string; color: string };
const defaultForm: FormState = { name: "", description: "", icon: "📰", color: "#b91c1c" };

export function BlogCategoriesManager() {
  const [cats, setCats] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCats(); }, []);

  const fetchCats = async () => {
    setLoading(true);
    const res = await fetch("/api/blog/categories");
    const data = await res.json();
    setCats(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const openCreate = () => { setEditingSlug(null); setForm(defaultForm); setShowModal(true); };
  const openEdit = (c: BlogCategory) => {
    setEditingSlug(c.slug);
    setForm({ name: c.name, description: c.description ?? "", icon: c.icon, color: c.color });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const method = editingSlug ? "PATCH" : "POST";
    const url = editingSlug ? `/api/blog/categories/${editingSlug}` : "/api/blog/categories";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowModal(false);
    fetchCats();
    setSaving(false);
  };

  const handleDelete = async (slug: string, name: string) => {
    if (!confirm(`Hapus kategori "${name}"?`)) return;
    await fetch(`/api/blog/categories/${slug}`, { method: "DELETE" });
    fetchCats();
  };

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-textPrimary">Kategori Blog</h2>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-accentTeal px-4 py-2 text-sm font-medium text-white hover:bg-accentTeal/90 transition-colors"
        >
          <Plus size={16} /> Tambah Kategori
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 p-12 text-muted">
          <Loader2 size={18} className="animate-spin" /> Memuat...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cats.map(cat => (
            <div key={cat.slug} className="glass-card p-4 flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: cat.color + "22" }}
              >
                {cat.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-textPrimary truncate">{cat.name}</p>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                </div>
                <p className="text-xs text-muted mt-0.5 truncate">{cat.slug}</p>
                {cat.description && (
                  <p className="text-xs text-muted/70 mt-1 line-clamp-2">{cat.description}</p>
                )}
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg text-muted hover:text-textPrimary hover:bg-white/10 transition-colors">
                  <Edit2 size={13} />
                </button>
                <button onClick={() => handleDelete(cat.slug, cat.name)} className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
          {cats.length === 0 && (
            <div className="glass-card col-span-full p-10 text-center text-muted text-sm">
              Belum ada kategori. Buat kategori pertama.
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="text-base font-semibold text-textPrimary">
                {editingSlug ? "Edit Kategori" : "Tambah Kategori"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-textPrimary">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Nama Kategori *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                  placeholder="Contoh: Politik, Teknologi, Olahraga..."
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-textPrimary placeholder:text-muted/50 focus:border-accentTeal focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-muted mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => set("description", e.target.value)}
                  placeholder="Deskripsi singkat kategori..."
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-textPrimary placeholder:text-muted/50 focus:border-accentTeal focus:outline-none resize-none"
                />
              </div>

              {/* Icon picker */}
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Ikon</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_ICONS.map(ic => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => set("icon", ic)}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-all ${
                        form.icon === ic ? "border-accentTeal bg-accentTeal/10" : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                  <input
                    type="text"
                    value={form.icon}
                    onChange={e => set("icon", e.target.value)}
                    className="w-16 rounded-lg bg-white/5 border border-white/10 px-2 text-sm text-center text-textPrimary focus:border-accentTeal focus:outline-none"
                    placeholder="🔖"
                  />
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-muted mb-2">Warna</label>
                <div className="flex flex-wrap gap-2 items-center">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set("color", c)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? "border-white scale-110" : "border-transparent"}`}
                      style={{ background: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={form.color}
                    onChange={e => set("color", e.target.value)}
                    className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="p-3 rounded-xl border border-white/10 bg-white/5">
                <p className="text-xs text-muted mb-2">Preview:</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ background: form.color + "22" }}>
                    {form.icon}
                  </div>
                  <span
                    className="text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-full"
                    style={{ background: form.color + "22", color: form.color }}
                  >
                    {form.name || "Nama Kategori"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-sm text-muted hover:text-textPrimary transition-colors">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-accentTeal px-5 py-2 text-sm font-bold text-white hover:bg-accentTeal/90 disabled:opacity-50 transition-colors"
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
