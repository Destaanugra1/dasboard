"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { toCurrency } from "@/src/lib/format";

type ProductStatus = "active" | "draft" | "archived";

type ProductRow = {
  id: number;
  name: string;
  price: string;
  stock: number;
  status: ProductStatus;
  categoryName: string | null;
};

export function InventoryManager({ role }: { role: "admin" | "staff" | "viewer" }) {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ProductStatus | "">("active");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canWrite = role === "admin" || role === "staff";

  async function load() {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ page: "1", pageSize: "300" });
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);

    const response = await fetch(`/api/products?${params.toString()}`);
    const payload = (await response.json()) as { data?: ProductRow[]; error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Failed to load inventory");
      setLoading(false);
      return;
    }

    setRows(payload.data ?? []);
    setDrafts(
      (payload.data ?? []).reduce<Record<number, string>>((acc, row) => {
        acc[row.id] = String(row.stock);
        return acc;
      }, {})
    );
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (!lowStockOnly) {
        return true;
      }
      return row.stock <= 10;
    });
  }, [lowStockOnly, rows]);

  const summary = useMemo(() => {
    const totalUnits = rows.reduce((acc, row) => acc + row.stock, 0);
    const lowStock = rows.filter((row) => row.stock <= 10).length;
    const outOfStock = rows.filter((row) => row.stock === 0).length;
    return { totalUnits, lowStock, outOfStock };
  }, [rows]);

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    await load();
  }

  async function updateStock(id: number) {
    const parsed = Number(drafts[id] ?? "0");
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Stock value must be a non-negative number");
      return;
    }

    setSavingId(id);
    setError(null);

    const response = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: parsed }),
    });

    setSavingId(null);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Failed to update stock");
      return;
    }

    await load();
  }

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="glass-card p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Total Units</p>
          <p className="mt-2 text-2xl font-semibold text-textPrimary">{summary.totalUnits}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Low Stock</p>
          <p className="mt-2 text-2xl font-semibold text-amber-200">{summary.lowStock}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Out of Stock</p>
          <p className="mt-2 text-2xl font-semibold text-red-300">{summary.outOfStock}</p>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <form onSubmit={onSearch} className="flex flex-1 gap-2">
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search product"
              className="glass-card w-full px-3 py-2 text-sm"
            />
            <button className="rounded-xl bg-accentBlue px-4 py-2 text-sm font-medium text-white">
              Search
            </button>
          </form>

          <div className="flex items-center gap-2">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as ProductStatus | "")}
              className="glass-card px-3 py-2 text-sm"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            <label className="glass-card flex items-center gap-2 px-3 py-2 text-sm text-textPrimary">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(event) => setLowStockOnly(event.target.checked)}
              />
              Low stock only
            </label>
          </div>
        </div>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="glass-card overflow-x-auto p-2">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-muted">
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Current Stock</th>
              <th className="px-3 py-2">Adjust Stock</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-muted">
                  Loading inventory...
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-muted">
                  No products found.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id} className="border-t border-white/5">
                  <td className="px-3 py-2 text-textPrimary">{row.name}</td>
                  <td className="px-3 py-2 text-muted">{row.categoryName ?? "Uncategorized"}</td>
                  <td className="px-3 py-2 text-textPrimary">{toCurrency(row.price)}</td>
                  <td className="px-3 py-2 text-textPrimary">{row.stock}</td>
                  <td className="px-3 py-2">
                    {canWrite ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={drafts[row.id] ?? "0"}
                          onChange={(event) =>
                            setDrafts((prev) => ({ ...prev, [row.id]: event.target.value }))
                          }
                          className="glass-card w-24 px-2 py-1.5 text-xs"
                        />
                        <button
                          type="button"
                          disabled={savingId === row.id}
                          onClick={() => void updateStock(row.id)}
                          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted">Read-only</span>
                    )}
                  </td>
                  <td className="px-3 py-2 capitalize text-textPrimary">{row.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
