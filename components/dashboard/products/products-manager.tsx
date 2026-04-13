"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { CldImage, CldUploadWidget } from "next-cloudinary";
import { Plus, Search, Trash2 } from "lucide-react";
import { toDate } from "@/src/lib/format";
import { parseProductImages } from "@/src/lib/product-images";
import { formatCurrency } from "@/src/lib/currency";

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={submitForm} className="glass-card w-full max-w-2xl space-y-3 p-5">
            <h3 className="text-lg font-semibold text-textPrimary">
              {editingId ? "Edit Product" : "Create Product"}
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                required
                value={form.name}
                onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))}
                placeholder="Name"
                className="glass-card px-3 py-2 text-sm"
              />
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => setForm((value) => ({ ...value, price: event.target.value }))}
                placeholder="Price"
                className="glass-card px-3 py-2 text-sm"
              />
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((value) => ({ ...value, description: event.target.value }))
                }
                placeholder="Description"
                className="glass-card min-h-20 px-3 py-2 text-sm md:col-span-2"
              />
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(event) => setForm((value) => ({ ...value, stock: event.target.value }))}
                placeholder="Stock"
                className="glass-card px-3 py-2 text-sm"
              />
              <input
                value={form.fileUrl}
                onChange={(event) => setForm((value) => ({ ...value, fileUrl: event.target.value }))}
                placeholder="Link Download Template (Google Drive, dll)"
                className="glass-card px-3 py-2 text-sm md:col-span-2"
              />
              {/* Discount – only show when editing */}
              {editingId !== null && (
                <div className="glass-card px-3 py-3 md:col-span-2 space-y-1">
                  <p className="text-sm font-medium text-textPrimary">Diskon (%)</p>
                  <p className="text-xs text-muted">Masukkan angka 0–100. Harga asli akan dicoret di storefront.</p>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.discountPct}
                    onChange={(event) => setForm((value) => ({ ...value, discountPct: event.target.value }))}
                    placeholder="0"
                    className="glass-card px-3 py-2 text-sm w-32"
                  />
                </div>
              )}
              <select
                value={form.categoryId}
                onChange={(event) => setForm((value) => ({ ...value, categoryId: event.target.value }))}
                className="glass-card px-3 py-2 text-sm"
              >
                <option value="">No Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="glass-card space-y-3 px-3 py-3 text-sm md:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-textPrimary">Foto Produk</p>
                    <p className="text-xs text-muted">Upload lebih dari 1 foto, tanpa input id manual</p>
                  </div>
                  <CldUploadWidget
                    uploadPreset={uploadPreset || undefined}
                    config={cloudName ? { cloud: { cloudName } } : undefined}
                    options={{ maxFiles: 8, multiple: true }}
                    onSuccess={(result) => onUploadResult(result as UploadWidgetResult)}
                    onUpload={(result) => onUploadResult(result as UploadWidgetResult)}
                    onError={(error) => {
                      setUploadError(formatUploadError(error as UploadWidgetError));
                    }}
                  >
                    {({ open }) => (
                      <button
                        type="button"
                        onClick={() => open()}
                        className="rounded-lg border border-white/15 px-3 py-1.5 text-xs"
                      >
                        Upload Foto
                      </button>
                    )}
                  </CldUploadWidget>
                </div>

                {uploadError ? <p className="text-xs text-red-300">{uploadError}</p> : null}

                {form.imageUrls.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {form.imageUrls.map((image) => (
                      <div key={image} className="relative overflow-hidden rounded-lg bg-white/5">
                        <CldImage
                          width={200}
                          height={140}
                          src={image}
                          alt="Product image"
                          className="h-20 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              imageUrls: current.imageUrls.filter((item) => item !== image),
                            }))
                          }
                          className="absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white"
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted">Belum ada foto diupload.</p>
                )}
              </div>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((value) => ({ ...value, status: event.target.value as ProductStatus }))
                }
                className="glass-card px-3 py-2 text-sm"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button className="rounded-lg bg-accentBlue px-4 py-2 text-sm font-medium text-white">
                Save
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
