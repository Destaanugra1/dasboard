"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus, Trash2, Edit2, Loader2, Star, TrendingUp, BarChart2,
  Eye, EyeOff, Search, Filter
} from "lucide-react";
import { canManageBlog, type UserRole } from "@/src/lib/authz";

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  authorName: string;
  isFeatured: boolean;
  isTrending: boolean;
  isPopular: boolean;
  status: "published" | "draft";
  publishedAt: string | null;
  createdAt: string;
  categoryName: string | null;
  categorySlug: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
};

export function BlogManager({ role }: { role: UserRole }) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all");
  const [total, setTotal] = useState(0);
  const canEdit = canManageBlog(role);

  useEffect(() => {
    fetchPosts();
  }, [filterStatus]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: "50" });
      if (filterStatus !== "all") params.set("status", filterStatus);
      const res = await fetch(`/api/blog/posts?${params}`);
      const data = await res.json();
      setPosts(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug: string, title: string) => {
    if (!canEdit) return;
    if (!confirm(`Hapus artikel "${title}"?`)) return;
    await fetch(`/api/blog/posts/${slug}`, { method: "DELETE" });
    fetchPosts();
  };

  const handleToggle = async (post: BlogPost, field: "isFeatured" | "isTrending" | "isPopular" | "status") => {
    if (!canEdit) return;
    const body =
      field === "status"
        ? { status: post.status === "published" ? "draft" : "published" }
        : { [field]: !post[field] };
    await fetch(`/api/blog/posts/${post.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    fetchPosts();
  };

  const filtered = posts.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.excerpt ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-textPrimary">Manajemen Artikel Blog</h2>
          <p className="text-sm text-muted mt-0.5">{total} artikel total</p>
        </div>
        {canEdit ? (
          <Link
            href="/dashboard/blog/new"
            className="flex items-center gap-2 rounded-xl bg-accentTeal px-4 py-2 text-sm font-medium text-white hover:bg-accentTeal/90 transition-colors"
          >
            <Plus size={16} />
            Tulis Artikel
          </Link>
        ) : null}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Cari artikel..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-4 py-2 text-sm text-textPrimary placeholder:text-muted/50 focus:border-accentTeal focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
          {(["all", "published", "draft"] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterStatus === s ? "bg-accentTeal text-white" : "text-muted hover:text-textPrimary"
              }`}
            >
              {s === "all" ? "Semua" : s === "published" ? "Published" : "Draft"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-muted">
            <Loader2 size={18} className="animate-spin" /> Memuat...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted text-sm">
            Belum ada artikel.{" "}
            <Link href="/dashboard/blog/new" className="text-accentTeal hover:underline">
              Tulis artikel pertama.
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map(post => (
              <div key={post.slug} className="flex items-start gap-4 p-4 hover:bg-white/5 transition-colors">
                {/* Cover thumbnail */}
                <div className="flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden bg-white/5 border border-white/10">
                  {post.coverImageUrl ? (
                    <img src={post.coverImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">
                      {post.categoryIcon ?? "📰"}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {post.categoryName && (
                      <span
                        className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                        style={{
                          background: (post.categoryColor ?? "#b91c1c") + "22",
                          color: post.categoryColor ?? "#b91c1c",
                        }}
                      >
                        {post.categoryIcon} {post.categoryName}
                      </span>
                    )}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      post.status === "published"
                        ? "bg-green-400/10 text-green-400"
                        : "bg-yellow-400/10 text-yellow-400"
                    }`}>
                      {post.status === "published" ? "● Published" : "○ Draft"}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-textPrimary truncate">{post.title}</p>
                  <p className="text-xs text-muted mt-0.5 line-clamp-1">{post.excerpt}</p>
                  <p className="text-[10px] text-muted/60 mt-1">
                    {post.authorName} · {new Date(post.publishedAt ?? post.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>

                {/* Flag toggles */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  {canEdit ? (
                    <>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggle(post, "isFeatured")}
                          title="Featured (Hero)"
                          className={`p-1.5 rounded-lg transition-colors ${post.isFeatured ? "text-yellow-400 bg-yellow-400/10" : "text-muted hover:text-yellow-400"}`}
                        >
                          <Star size={13} />
                        </button>
                        <button
                          onClick={() => handleToggle(post, "isTrending")}
                          title="Trending"
                          className={`p-1.5 rounded-lg transition-colors ${post.isTrending ? "text-orange-400 bg-orange-400/10" : "text-muted hover:text-orange-400"}`}
                        >
                          <TrendingUp size={13} />
                        </button>
                        <button
                          onClick={() => handleToggle(post, "isPopular")}
                          title="Popular"
                          className={`p-1.5 rounded-lg transition-colors ${post.isPopular ? "text-accentTeal bg-accentTeal/10" : "text-muted hover:text-accentTeal"}`}
                        >
                          <BarChart2 size={13} />
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggle(post, "status")}
                          title={post.status === "published" ? "Set ke Draft" : "Publish"}
                          className={`p-1.5 rounded-lg transition-colors ${post.status === "published" ? "text-green-400 hover:text-muted" : "text-muted hover:text-green-400"}`}
                        >
                          {post.status === "published" ? <Eye size={13} /> : <EyeOff size={13} />}
                        </button>
                        <Link
                          href={`/dashboard/blog/${post.slug}`}
                          className="p-1.5 rounded-lg text-muted hover:text-textPrimary hover:bg-white/10 transition-colors"
                        >
                          <Edit2 size={13} />
                        </Link>
                        <button
                          onClick={() => handleDelete(post.slug, post.title)}
                          className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
