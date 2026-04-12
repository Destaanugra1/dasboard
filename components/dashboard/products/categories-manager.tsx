"use client";

import { FormEvent, useEffect, useState } from "react";

type CategoryRow = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  productCount: number;
};

type FormState = {
  name: string;
  description: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
};

export function CategoriesManager({ role }: { role: "admin" | "staff" | "viewer" }) {
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const canWrite = role === "admin" || role === "staff";

  async function load() {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());

    const response = await fetch(`/api/categories?${params.toString()}`);
    const payload = (await response.json()) as { data?: CategoryRow[]; error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Failed to load categories");
      setLoading(false);
      return;
    }

    setRows(payload.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(row: CategoryRow) {
    setEditingId(row.id);
    setForm({
      name: row.name,
      description: row.description ?? "",
    });
    setOpen(true);
  }

  async function submitForm(event: FormEvent) {
    event.preventDefault();

    const endpoint = editingId ? `/api/categories/${editingId}` : "/api/categories";
    const method = editingId ? "PUT" : "POST";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Failed to save category");
      return;
    }

    setOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    await load();
  }

  async function remove(id: number) {
    const response = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Failed to delete category");
      return;
    }
    await load();
  }

  return (
    <section className="space-y-4">
      <div className="glass-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 gap-2">
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search category"
              className="glass-card w-full px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-xl bg-accentBlue px-4 py-2 text-sm font-medium text-white"
            >
              Search
            </button>
          </div>

          {canWrite ? (
            <button
              type="button"
              onClick={openCreate}
              className="rounded-xl bg-accentTeal px-4 py-2 text-sm font-medium text-black"
            >
              New Category
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="glass-card overflow-x-auto p-2">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-muted">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Slug</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Products</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-muted">
                  Loading categories...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-muted">
                  No categories found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-white/5">
                  <td className="px-3 py-2 text-textPrimary">{row.name}</td>
                  <td className="px-3 py-2 text-muted">{row.slug}</td>
                  <td className="px-3 py-2 text-textPrimary">{row.description || "-"}</td>
                  <td className="px-3 py-2 text-textPrimary">{row.productCount}</td>
                  <td className="px-3 py-2">
                    {canWrite ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(row.id)}
                          className="rounded-lg border border-red-400/40 px-3 py-1.5 text-xs text-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted">Read-only</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={submitForm} className="glass-card w-full max-w-lg space-y-3 p-5">
            <h3 className="text-lg font-semibold text-textPrimary">
              {editingId ? "Edit Category" : "Create Category"}
            </h3>
            <input
              required
              value={form.name}
              onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))}
              placeholder="Category name"
              className="glass-card w-full px-3 py-2 text-sm"
            />
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((value) => ({ ...value, description: event.target.value }))
              }
              placeholder="Description"
              className="glass-card min-h-24 w-full px-3 py-2 text-sm"
            />

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
