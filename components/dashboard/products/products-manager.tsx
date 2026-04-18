"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { CldImage, CldUploadWidget } from "next-cloudinary";
import { Plus, Search, Trash2, Edit, Link as LinkIcon, ImagePlus, Save } from "lucide-react";
import { toDate } from "@/src/lib/format";
import { parseProductImages } from "@/src/lib/product-images";
import { formatCurrency } from "@/src/lib/currency";
import { RichTextEditor } from "@/components/dashboard/rich-text-editor";

type ProductStatus = "active" | "draft" | "archived";

type ProductRow = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  status: ProductStatus;
  imageUrl: string | null;
  imageUrls?: string[];
  categoryId: number | null;
  categoryName: string | null;
  createdAt: string;
  fileUrl: string | null;
  discountPct: number | null;
};

type UploadInfo = {
  public_id: string;
};

type UploadWidgetResult = {
  info?:
    | UploadInfo
    | {
        files?: Array<{
          uploadInfo?: UploadInfo;
          info?: UploadInfo;
        }>;
      }
    | string;
};

type UploadWidgetError =
  | {
      status?: string;
      statusText?: string;
      message?: string;
    }
  | string
  | null;

type CategoryOption = {
  id: number;
  name: string;
};

type formatCurrency = {
  price: number;
  stock: number;
}

type FormState = {
  name: string;
  description: string;
  categoryId: string;
  price: string;
  stock: string;
  status: ProductStatus;
  imageUrls: string[];
  fileUrl: string;
  discountPct: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  price: "",
  stock: "0",
  categoryId: "",
  status: "active",
  imageUrls: [],
  fileUrl: "",
  discountPct: "0",
};

export function ProductsManager({
  role,
  categories,
}: {
  role: "admin" | "staff" | "viewer";
  categories: CategoryOption[];
}) {
  const uploadPreset = (process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "")
    .replace(/^['\"]|['\"]$/g, "")
    .trim();
  const cloudName = (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "")
    .replace(/^['\"]|['\"]$/g, "")
    .trim();

  const [rows, setRows] = useState<ProductRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ProductStatus | "">("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const canWrite = role === "admin" || role === "staff";

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rowStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rowEnd = Math.min(page * pageSize, total);

  async function load(targetPage = page) {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: String(targetPage),
      pageSize: String(pageSize),
    });
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    if (categoryId) params.set("categoryId", categoryId);

    const response = await fetch(`/api/products?${params.toString()}`);
    const payload = (await response.json()) as {
      data?: ProductRow[];
      page?: number;
      pageSize?: number;
      total?: number;
      error?: string;
    };

    if (!response.ok) {
      setError(payload.error ?? "Failed to load products");
      setLoading(false);
      return;
    }

    const nextTotal = payload.total ?? 0;
    const nextPageSize = payload.pageSize ?? pageSize;
    const maxPage = Math.max(1, Math.ceil(nextTotal / nextPageSize));
    const requestedPage = payload.page ?? targetPage;

    setRows(payload.data ?? []);
    setTotal(nextTotal);
    if (requestedPage > maxPage) {
      setPage(maxPage);
    } else {
      setPage(requestedPage);
    }
    setLoading(false);
  }

  useEffect(() => {
    void load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, categoryId, page, pageSize]);

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    await load(1);
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setUploadError(null);
    setOpen(true);
  }

  function openEdit(product: ProductRow) {
    setEditingId(product.id);
    setUploadError(null);
    setForm({
      name: product.name,
      description: product.description ?? "",
      price: String(product.price),
      stock: String(product.stock),
      categoryId: product.categoryId ? String(product.categoryId) : "",
      status: product.status,
      fileUrl: product.fileUrl ?? "",
      discountPct: String(product.discountPct ?? 0),
      imageUrls:
        product.imageUrls && product.imageUrls.length > 0
          ? product.imageUrls
          : parseProductImages(product.imageUrl),
    });
    setOpen(true);
  }

  function extractUploadedPublicIds(result: UploadWidgetResult): string[] {
    const info = result.info;
    if (!info || typeof info === "string") {
      return [];
    }

    if ("public_id" in info && typeof info.public_id === "string") {
      return [info.public_id];
    }

    if (!("files" in info) || !Array.isArray(info.files)) {
      return [];
    }

    return info.files
      .map((entry) => entry.uploadInfo?.public_id ?? entry.info?.public_id ?? null)
      .filter((item): item is string => Boolean(item));
  }

  function onUploadResult(result: UploadWidgetResult) {
    const uploadedIds = extractUploadedPublicIds(result);
    if (uploadedIds.length === 0) {
      setUploadError("Upload selesai, tapi id foto tidak terbaca. Coba upload ulang sekali lagi.");
      return;
    }

    setUploadError(null);
    setForm((current) => {
      const merged = [...current.imageUrls];

      for (const uploadedId of uploadedIds) {
        if (!merged.includes(uploadedId)) {
          merged.push(uploadedId);
        }
      }

      return { ...current, imageUrls: merged };
    });
  }

  function formatUploadError(error: UploadWidgetError): string {
    if (!error) {
      return "Upload gagal. Periksa preset Cloudinary lalu coba lagi.";
    }

    if (typeof error === "string") {
      return `Upload gagal: ${error}`;
    }

    const detail = error.statusText ?? error.message ?? error.status;
    if (!detail) {
      return "Upload gagal. Periksa preset Cloudinary lalu coba lagi.";
    }

    return `Upload gagal: ${detail}`;
  }

  async function submitForm(event: FormEvent) {
    event.preventDefault();

    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      stock: Number(form.stock),
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      imageUrls: form.imageUrls,
      status: form.status,
      fileUrl: form.fileUrl,
      discountPct: Number(form.discountPct),
    };

    const endpoint = editingId ? `/api/products/${editingId}` : "/api/products";
    const method = editingId ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setError("Failed to save product");
      return;
    }

    setOpen(false);
    setForm(EMPTY_FORM);
    setEditingId(null);
    await load();
  }

  async function deleteProduct(id: number) {
    if (!window.confirm("Delete this product permanently?")) {
      return;
    }

    const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Failed to delete product");
      return;
    }
    await load(page);
  }

  return (
    <section className="space-y-4">
      <div className="glass-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <form onSubmit={onSearch} className="flex flex-1 gap-2">
            <div className="glass-card flex flex-1 items-center gap-2 px-3 py-2">
              <Search size={16} className="text-muted" />
              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Search product name"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
            <button className="rounded-xl bg-accentBlue px-4 py-2 text-sm font-medium text-white">Search</button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={status}
              onChange={(event) => {
                setPage(1);
                setStatus(event.target.value as ProductStatus | "");
              }}
              className="glass-card px-3 py-2 text-sm"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={categoryId}
              onChange={(event) => {
                setPage(1);
                setCategoryId(event.target.value);
              }}
              className="glass-card px-3 py-2 text-sm"
            >
              <option value="">All Categories</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            {canWrite ? (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-accentTeal px-4 py-2 text-sm font-medium text-black"
              >
                <Plus size={16} /> New Product
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {loading ? (
        <div className="glass-card p-4 text-sm text-muted">Loading products...</div>
      ) : rows.length === 0 ? (
        <div className="glass-card p-4 text-sm text-muted">No products found.</div>
      ) : (
        <div className="glass-card p-2">
          <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Image</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((product) => (
                <tr key={product.id} className="border-t border-white/5">
                  <td className="px-3 py-2 text-textPrimary">{product.name}</td>
                  <td className="px-3 py-2 text-textPrimary">
                    {(() => {
                      const previewImage =
                        product.imageUrls?.[0] ?? parseProductImages(product.imageUrl)[0] ?? null;

                      return previewImage ? (
                        <CldImage
                          width={64}
                          height={64}
                          src={previewImage}
                          alt={product.name}
                          className="h-16 w-16 rounded object-cover"
                        />
                      ) : (
                        <div className="bg-muted h-16 w-16 rounded" />
                      );
                    })()}
                  </td>
                  <td className="px-3 py-2 text-muted">{product.categoryName ?? "-"}</td>
                  <td className="px-3 py-2 text-textPrimary">{formatCurrency(product.price)}</td>
                  <td className="px-3 py-2 text-textPrimary">{product.stock}</td>
                  <td className="px-3 py-2 capitalize text-textPrimary">{product.status}</td>
                  <td className="px-3 py-2 text-textPrimary">{toDate(product.createdAt)}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/products/${product.slug}`}
                        className="rounded-lg border border-white/15 px-3 py-1.5 text-xs"
                      >
                        Detail
                      </Link>
                      {canWrite ? (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(product)}
                            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteProduct(product.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-300/40 px-3 py-1.5 text-xs text-red-200"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-muted">Read-only</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          <div className="mt-3 flex flex-col gap-2 border-t border-white/10 px-3 pt-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing {rowStart}-{rowEnd} of {total} products
            </p>

            <div className="flex items-center gap-2">
              <label className="text-xs text-muted">Rows</label>
              <select
                value={pageSize}
                onChange={(event) => {
                  setPage(1);
                  setPageSize(Number(event.target.value));
                }}
                className="glass-card px-2 py-1 text-xs"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>

              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="rounded border border-white/15 px-2 py-1 text-xs disabled:opacity-40"
              >
                Prev
              </button>
              <span className="px-1 text-xs text-textPrimary">
                Page {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
                className="rounded border border-white/15 px-2 py-1 text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-6 backdrop-blur-[2px] overflow-y-auto">
          <form onSubmit={submitForm} className="glass-card w-full max-w-3xl flex flex-col bg-[#222222] border border-white/10 shadow-2xl relative my-auto rounded-xl">
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center bg-accentBlue/20 text-accentBlue rounded-xl">
                  <Edit size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide">
                    {editingId ? "Edit Product" : "Tambah Product"}
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    {editingId ? "Perbarui detail produk Anda" : "Masukkan detail produk baru Anda"}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setOpen(false)} 
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-muted hover:text-white hover:bg-white/5 transition-colors"
               >
                ✕
              </button>
            </div>

            {/* Scrollable body */}
            <div className="p-6 space-y-6 pt-5 bg-[#1f1f1f]">
              {/* Row 1: Name + Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold tracking-wider uppercase text-white/50">Nama Produk</label>
                  <input
                    required
                    value={form.name}
                    onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))}
                    placeholder="Contoh: Template Premium"
                    className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white focus:border-accentBlue focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold tracking-wider uppercase text-white/50">Harga (Rp)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) => setForm((value) => ({ ...value, price: event.target.value }))}
                    placeholder="0"
                    className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white focus:border-accentBlue focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Row 2: Description (Tiptap) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold tracking-wider uppercase text-white/50">Deskripsi</label>
                <RichTextEditor 
                  value={form.description}
                  onChange={(val) => setForm((prev) => ({ ...prev, description: val }))}
                />
              </div>

              {/* Row 3: Stock + Category + Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold tracking-wider uppercase text-white/50">Stok</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(event) => setForm((value) => ({ ...value, stock: event.target.value }))}
                    placeholder="0"
                    className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white focus:border-accentBlue focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold tracking-wider uppercase text-white/50">Kategori</label>
                  <select
                    value={form.categoryId}
                    onChange={(event) => setForm((value) => ({ ...value, categoryId: event.target.value }))}
                    className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white focus:border-accentBlue focus:outline-none cursor-pointer transition-colors [&>option]:bg-[#1a1a1a]"
                  >
                    <option value="">No Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold tracking-wider uppercase text-white/50">Status</label>
                  <select
                    value={form.status}
                    onChange={(event) => setForm((value) => ({ ...value, status: event.target.value as ProductStatus }))}
                    className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white focus:border-accentBlue focus:outline-none cursor-pointer transition-colors [&>option]:bg-[#1a1a1a]"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Download link */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold tracking-wider uppercase text-white/50">URL File / Drive</label>
                <div className="flex w-full overflow-hidden rounded-lg border border-white/10 bg-black/20 focus-within:border-accentBlue transition-colors group">
                  <div className="flex items-center justify-center px-4 text-muted border-r border-white/10 group-focus-within:text-accentBlue transition-colors">
                    <LinkIcon size={16} />
                  </div>
                  <input
                    value={form.fileUrl}
                    onChange={(event) => setForm((value) => ({ ...value, fileUrl: event.target.value }))}
                    placeholder="https://drive.google.com/..."
                    className="w-full bg-transparent px-3 py-2.5 text-sm text-white outline-none"
                  />
                </div>
              </div>

              {/* Row 5: Diskon */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold tracking-wider uppercase text-white/50">Diskon (%)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.discountPct}
                    onChange={(event) => setForm((value) => ({ ...value, discountPct: event.target.value }))}
                    placeholder="0"
                    className="w-24 rounded-lg border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white focus:border-accentBlue focus:outline-none transition-colors"
                  />
                  <span className="text-xs text-muted">Harga asli akan dicoret di storefront</span>
                </div>
              </div>

              {/* Row 6: Photo Upload */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold tracking-wider uppercase text-white/50">Foto Produk</label>
                  <CldUploadWidget
                    uploadPreset={uploadPreset || undefined}
                    config={cloudName ? { cloud: { cloudName } } : undefined}
                    options={{ maxFiles: 8, multiple: true }}
                    onSuccess={(result) => onUploadResult(result as UploadWidgetResult)}
                    onUpload={(result) => onUploadResult(result as UploadWidgetResult)}
                    onError={(error) => { setUploadError(formatUploadError(error as UploadWidgetError)); }}
                  >
                    {({ open }) => (
                      <button
                        type="button"
                        onClick={() => open()}
                        className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
                      >
                        + Upload Foto
                      </button>
                    )}
                  </CldUploadWidget>
                </div>

                {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}

                <div className="flex flex-wrap gap-4 mt-2">
                  {form.imageUrls.map((image, idx) => (
                    <div key={image} className="relative overflow-hidden rounded-xl border border-white/10 bg-[#161616] w-[130px] aspect-square flex items-center justify-center group shadow-md">
                      <CldImage
                        width={260}
                        height={260}
                        src={image}
                        alt="Product image"
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                      />
                      <button
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, imageUrls: current.imageUrls.filter((item) => item !== image) }))}
                        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-[10px] text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 border border-white/10 shadow-sm"
                      >
                        ✕
                      </button>
                      
                      {idx === 0 && (
                         <div className="absolute bottom-2 bg-[#059669] text-white text-[10px] px-2.5 py-0.5 rounded flex items-center justify-center shadow-lg font-bold tracking-wide left-1/2 -translate-x-1/2">
                           Cover
                         </div>
                      )}
                    </div>
                  ))}

                  <CldUploadWidget
                    uploadPreset={uploadPreset || undefined}
                    config={cloudName ? { cloud: { cloudName } } : undefined}
                    options={{ maxFiles: 8, multiple: true }}
                    onSuccess={(result) => onUploadResult(result as UploadWidgetResult)}
                    onUpload={(result) => onUploadResult(result as UploadWidgetResult)}
                    onError={(error) => { setUploadError(formatUploadError(error as UploadWidgetError)); }}
                  >
                    {({ open }) => (
                      <button
                        type="button"
                        onClick={() => open()}
                        className="flex flex-col items-center justify-center gap-2 w-[130px] aspect-square rounded-xl border border-dashed border-white/20 hover:border-white/40 bg-white/[0.01] hover:bg-white/5 transition-all text-muted hover:text-white/90 shadow-sm"
                      >
                        <ImagePlus size={22} className="opacity-70" />
                        <span className="text-[11px] font-medium tracking-wide">Tambah</span>
                      </button>
                    )}
                  </CldUploadWidget>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex justify-end gap-3 px-6 py-5 border-t border-white/10 shrink-0 bg-[#1c1c1c] rounded-b-xl">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all focus:outline-none"
               >
                Batal
              </button>
              <button 
                type="submit"
                className="rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-black hover:bg-gray-100 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.1)] focus:outline-none"
              >
                <Save size={16} /> Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

