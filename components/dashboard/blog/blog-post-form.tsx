"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, X, Star, TrendingUp, BarChart2, Eye, EyeOff } from "lucide-react";
import { CldUploadWidget } from "next-cloudinary";
import { RichTextEditor } from "@/components/dashboard/rich-text-editor";

type BlogCategory = { id: number; name: string; slug: string; icon: string };

type BlogPostFormProps = {
  slug?: string; // editing mode if provided
  categories: BlogCategory[];
};

type FormState = {
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  categoryId: number | null;
  authorName: string;
  isFeatured: boolean;
  isTrending: boolean;
  isPopular: boolean;
  status: "published" | "draft";
  publishedAt: string;
};

const defaultForm: FormState = {
  title: "",
  excerpt: "",
  content: "",
  coverImageUrl: "",
  categoryId: null,
  authorName: "Admin",
  isFeatured: false,
  isTrending: false,
  isPopular: false,
  status: "draft",
  publishedAt: "",
};

export function BlogPostForm({ slug, categories }: BlogPostFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!slug);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const res = await fetch(`/api/blog/posts/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setForm({
          title: data.title ?? "",
          excerpt: data.excerpt ?? "",
          content: data.content ?? "",
          coverImageUrl: data.coverImageUrl ?? "",
          categoryId: data.categoryId ?? null,
          authorName: data.authorName ?? "Admin",
          isFeatured: data.isFeatured ?? false,
          isTrending: data.isTrending ?? false,
          isPopular: data.isPopular ?? false,
          status: data.status ?? "draft",
          publishedAt: data.publishedAt
            ? new Date(data.publishedAt).toISOString().slice(0, 16)
            : "",
        });
      }
      setLoading(false);
    })();
  }, [slug]);

  // Restore body scroll whenever coverImageUrl is set
  // (Cloudinary widget unmounts before onClose fires, leaving scroll locked)
  useEffect(() => {
    if (form.coverImageUrl) {
      const timer = setTimeout(() => {
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [form.coverImageUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = slug ? "PATCH" : "POST";
      const url = slug ? `/api/blog/posts/${slug}` : "/api/blog/posts";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          publishedAt: form.publishedAt || null,
        }),
      });
      if (res.ok) {
        router.push("/dashboard/blog");
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error ?? "Gagal menyimpan artikel");
      }
    } finally {
      setSaving(false);
    }
  };

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-16 text-muted">
        <Loader2 size={20} className="animate-spin" /> Memuat...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-textPrimary">
          {slug ? "Edit Artikel" : "Tulis Artikel Baru"}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl px-4 py-2 text-sm font-medium text-muted hover:text-textPrimary border border-white/10 hover:border-white/20 transition-colors"
          >
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — main fields */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title */}
          <div className="glass-card p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">Judul Artikel *</label>
              <input
                required
                type="text"
                value={form.title}
                onChange={e => set("title", e.target.value)}
                placeholder="Masukkan judul artikel yang menarik..."
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-base font-semibold text-textPrimary placeholder:text-muted/50 focus:border-accentTeal focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1.5">Ringkasan (Excerpt)</label>
              <textarea
                rows={3}
                value={form.excerpt}
                onChange={e => set("excerpt", e.target.value)}
                placeholder="Ringkasan singkat artikel yang muncul di listing blog..."
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-textPrimary placeholder:text-muted/50 focus:border-accentTeal focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Content */}
          <div className="glass-card p-5">
            <label className="block text-sm font-medium text-muted mb-1.5">Konten Artikel</label>
            <RichTextEditor
              value={form.content}
              onChange={val => set("content", val)}
            />
          </div>
        </div>

        {/* Right — sidebar */}
        <div className="space-y-5">
          {/* Status & publish */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-textPrimary">Publikasi</h3>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <button
                type="button"
                onClick={() => set("status", form.status === "published" ? "draft" : "published")}
                className="transition-colors"
              >
                {form.status === "published" ? (
                  <Eye size={26} className="text-green-400" />
                ) : (
                  <EyeOff size={26} className="text-muted" />
                )}
              </button>
              <div>
                <p className="text-sm font-medium text-textPrimary">
                  {form.status === "published" ? "Published" : "Draft"}
                </p>
                <p className="text-xs text-muted">
                  {form.status === "published" ? "Tampil di blog publik" : "Tidak tampil ke publik"}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1">Tanggal Publish</label>
              <input
                type="datetime-local"
                value={form.publishedAt}
                onChange={e => set("publishedAt", e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-textPrimary focus:border-accentTeal focus:outline-none"
              />
            </div>
          </div>

          {/* Flags */}
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-textPrimary">Flag Artikel</h3>
            {([
              { key: "isFeatured", label: "Featured (Hero Banner)", desc: "Tampil di hero utama", icon: <Star size={16} />, color: "text-yellow-400 bg-yellow-400/10" },
              { key: "isTrending", label: "Trending Today", desc: "Tampil di bagian trending", icon: <TrendingUp size={16} />, color: "text-orange-400 bg-orange-400/10" },
              { key: "isPopular", label: "Popular This Week", desc: "Tampil di sidebar popular", icon: <BarChart2 size={16} />, color: "text-accentTeal bg-accentTeal/10" },
            ] as const).map(({ key, label, desc, icon, color }) => (
              <button
                key={key}
                type="button"
                onClick={() => set(key, !form[key])}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  form[key] ? `border-white/20 ${color}` : "border-white/10 text-muted hover:border-white/20"
                }`}
              >
                <span className="flex-shrink-0">{icon}</span>
                <div>
                  <p className="text-xs font-semibold">{label}</p>
                  <p className="text-[10px] opacity-70">{desc}</p>
                </div>
                <div className={`ml-auto w-4 h-4 rounded-full border-2 flex-shrink-0 ${form[key] ? "bg-current border-current" : "border-muted/40"}`} />
              </button>
            ))}
          </div>

          {/* Category */}
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-textPrimary">Kategori</h3>
            <select
              value={form.categoryId ?? ""}
              onChange={e => set("categoryId", e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-textPrimary focus:border-accentTeal focus:outline-none"
            >
              <option value="">— Tanpa Kategori —</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cover Image */}
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-textPrimary">Cover Image</h3>
            {form.coverImageUrl ? (
              <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10">
                <img src={form.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => set("coverImageUrl", "")}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <CldUploadWidget
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""}
                options={{ folder: "blog/covers", maxFiles: 1 }}
                onSuccess={(result: any) => {
                  // Restore scroll BEFORE state update triggers re-render
                  document.body.style.overflow = "";
                  document.body.style.paddingRight = "";
                  set("coverImageUrl", result.info.secure_url);
                }}
                onClose={() => {
                  document.body.style.overflow = "";
                  document.body.style.paddingRight = "";
                }}
              >
                {({ open }) => (
                  <button
                    type="button"
                    onClick={() => open()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 p-8 text-muted hover:bg-white/5 transition-colors text-sm"
                  >
                    + Upload Cover
                  </button>
                )}
              </CldUploadWidget>
            )}
          </div>

          {/* Author */}
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-textPrimary">Penulis</h3>
            <input
              type="text"
              value={form.authorName}
              onChange={e => set("authorName", e.target.value)}
              placeholder="Nama penulis"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-textPrimary placeholder:text-muted/50 focus:border-accentTeal focus:outline-none"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
