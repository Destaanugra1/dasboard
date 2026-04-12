"use client";

import { useEffect, useMemo, useState } from "react";
import { toCurrency, toDate } from "@/src/lib/format";

type Role = "admin" | "staff" | "viewer";
type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "returned";

type OrderRow = {
  id: number;
  status: OrderStatus;
  total: string;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
};

type OrderDetail = {
  id: number;
  status: OrderStatus;
  total: string;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
  items: Array<{
    id: number;
    quantity: number;
    price: string;
    productName: string | null;
  }>;
};

export function ReturnsManager({ role }: { role: Role }) {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [detail, setDetail] = useState<OrderDetail | null>(null);

  const canWrite = role === "admin" || role === "staff";

  async function load() {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/orders?status=returned&page=1&pageSize=200");
    const payload = (await response.json()) as { data?: OrderRow[]; error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Failed to load return orders");
      setLoading(false);
      return;
    }

    setRows(payload.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) {
      return rows;
    }

    return rows.filter((row) => {
      return (
        String(row.id).includes(query) ||
        (row.userName ?? "").toLowerCase().includes(query) ||
        (row.userEmail ?? "").toLowerCase().includes(query)
      );
    });
  }, [q, rows]);

  async function openDetail(id: number) {
    const response = await fetch(`/api/orders/${id}`);
    const payload = (await response.json()) as { data?: OrderDetail; error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Failed to load detail");
      return;
    }

    setDetail(payload.data ?? null);
    setOpenId(id);
  }

  async function updateStatus(id: number, status: Exclude<OrderStatus, "returned">) {
    const response = await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      setError("Failed to update return status");
      return;
    }

    await load();
    setOpenId(null);
    setDetail(null);
  }

  return (
    <section className="space-y-4">
      <div className="glass-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search by order id or customer"
            className="glass-card w-full max-w-xl px-3 py-2 text-sm"
          />
          <p className="text-sm text-muted">Returned orders: {filtered.length}</p>
        </div>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="glass-card overflow-x-auto p-2">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-muted">
              <th className="px-3 py-2">Order</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Returned At</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-muted">
                  Loading return records...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-muted">
                  No returned orders found.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="border-t border-white/5">
                  <td className="px-3 py-2 text-textPrimary">#{row.id}</td>
                  <td className="px-3 py-2">
                    <p className="text-textPrimary">{row.userName ?? "Unknown"}</p>
                    <p className="text-xs text-muted">{row.userEmail ?? ""}</p>
                  </td>
                  <td className="px-3 py-2 text-textPrimary">{toCurrency(row.total)}</td>
                  <td className="px-3 py-2 text-textPrimary">{toDate(row.createdAt)}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => void openDetail(row.id)}
                      className="rounded-lg border border-white/15 px-3 py-1.5 text-xs"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {openId && detail ? (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-black/65">
          <div className="ml-auto h-full w-full max-w-xl overflow-y-auto p-4">
            <div className="glass-card min-h-full p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">Return Review</p>
                  <h3 className="text-lg font-semibold text-textPrimary">Order #{detail.id}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOpenId(null);
                    setDetail(null);
                  }}
                  className="rounded-lg border border-white/10 px-3 py-1 text-sm"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 space-y-2 rounded-xl bg-black/10 p-3 text-sm">
                <p className="text-textPrimary">Customer: {detail.userName ?? "Unknown"}</p>
                <p className="text-textPrimary">Email: {detail.userEmail ?? "-"}</p>
                <p className="text-textPrimary">Total: {toCurrency(detail.total)}</p>
                <p className="text-textPrimary">Date: {toDate(detail.createdAt)}</p>
              </div>

              <div className="mt-4">
                <p className="text-sm font-semibold text-textPrimary">Returned Items</p>
                <div className="mt-2 space-y-2">
                  {detail.items.map((item) => (
                    <div key={item.id} className="rounded-xl bg-black/10 p-2 text-sm">
                      <p className="text-textPrimary">{item.productName ?? "Unknown Product"}</p>
                      <p className="text-muted">
                        Qty {item.quantity} • {toCurrency(item.price)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {canWrite ? (
                <div className="mt-5">
                  <p className="mb-2 text-sm text-muted">Resolve Return</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void updateStatus(detail.id, "processing")}
                      className="rounded-lg border border-white/15 px-3 py-1.5 text-xs"
                    >
                      Re-process
                    </button>
                    <button
                      type="button"
                      onClick={() => void updateStatus(detail.id, "delivered")}
                      className="rounded-lg border border-accentTeal/30 px-3 py-1.5 text-xs text-accentTeal"
                    >
                      Close as Resolved
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
