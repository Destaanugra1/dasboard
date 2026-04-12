"use client";

import { useEffect, useState } from "react";
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
    productImage: string | null;
  }>;
};

export function OrdersManager({ role }: { role: Role }) {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [detail, setDetail] = useState<OrderDetail | null>(null);

  const canWrite = role === "admin" || role === "staff";

  async function load() {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ page: "1", pageSize: "100" });
    if (status) params.set("status", status);

    const response = await fetch(`/api/orders?${params.toString()}`);
    const payload = (await response.json()) as { data?: OrderRow[]; error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Failed to load orders");
      setLoading(false);
      return;
    }

    setRows(payload.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function openDetail(id: number) {
    const response = await fetch(`/api/orders/${id}`);
    const payload = (await response.json()) as { data?: OrderDetail; error?: string };
    if (!response.ok) {
      setError(payload.error ?? "Failed to load order detail");
      return;
    }

    setDetail(payload.data ?? null);
    setOpenId(id);
  }

  async function updateStatus(id: number, nextStatus: OrderStatus) {
    const response = await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (!response.ok) {
      setError("Failed to update status");
      return;
    }

    await load();
    if (openId === id) {
      await openDetail(id);
    }
  }

  return (
    <section className="space-y-4">
      <div className="glass-card p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-textPrimary">Orders Management</h2>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as OrderStatus | "")}
            className="glass-card px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="returned">Returned</option>
          </select>
        </div>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="glass-card overflow-x-auto p-2">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-muted">
              <th className="px-3 py-2">Order ID</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-muted">
                  Loading orders...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-muted">
                  No orders found.
                </td>
              </tr>
            ) : (
              rows.map((order) => (
                <tr key={order.id} className="border-t border-white/5">
                  <td className="px-3 py-2 text-textPrimary">#{order.id}</td>
                  <td className="px-3 py-2">
                    <p className="text-textPrimary">{order.userName ?? "Unknown"}</p>
                    <p className="text-xs text-muted">{order.userEmail ?? ""}</p>
                  </td>
                  <td className="px-3 py-2 text-textPrimary">{toCurrency(order.total)}</td>
                  <td className="px-3 py-2 capitalize text-textPrimary">{order.status}</td>
                  <td className="px-3 py-2 text-textPrimary">{toDate(order.createdAt)}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => void openDetail(order.id)}
                      className="rounded-lg border border-white/15 px-3 py-1.5 text-xs"
                    >
                      Details
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
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">Order</p>
                  <h3 className="text-lg font-semibold text-textPrimary">#{detail.id}</h3>
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

              <div className="mt-4 grid gap-3 rounded-xl bg-black/10 p-3 text-sm">
                <p className="text-textPrimary">Customer: {detail.userName ?? "Unknown"}</p>
                <p className="text-textPrimary">Email: {detail.userEmail ?? "-"}</p>
                <p className="text-textPrimary">Total: {toCurrency(detail.total)}</p>
                <p className="text-textPrimary">Date: {toDate(detail.createdAt)}</p>
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium text-textPrimary">Items</p>
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
                  <p className="mb-2 text-sm text-muted">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {["pending", "processing", "shipped", "delivered", "returned"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => void updateStatus(detail.id, option as OrderStatus)}
                        className="rounded-lg border border-white/15 px-3 py-1.5 text-xs capitalize"
                      >
                        {option}
                      </button>
                    ))}
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
