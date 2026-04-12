"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CldImage } from "next-cloudinary";
import { Plus, Search } from "lucide-react";
import { toDate } from "@/src/lib/format";

type UserRole = "admin" | "staff" | "viewer";
type UserStatus = "active" | "inactive";

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl: string | null;
  createdAt: string;
};

type FormState = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  password: "",
  role: "viewer",
  status: "active",
  avatarUrl: "",
};

export function UsersManager({ role }: { role: UserRole }) {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "">("");
  const [filterStatus, setFilterStatus] = useState<UserStatus | "">("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const pageSize = 10;
  const canWrite = role === "admin" || role === "staff";
  const maxPage = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  async function load() {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });

    if (q.trim()) params.set("q", q.trim());
    if (filterRole) params.set("role", filterRole);
    if (filterStatus) params.set("status", filterStatus);

    const response = await fetch(`/api/users?${params.toString()}`);
    const payload = (await response.json()) as {
      data?: UserRow[];
      total?: number;
      error?: string;
    };

    if (!response.ok) {
      setError(payload.error ?? "Failed to load users");
      setLoading(false);
      return;
    }

    setRows(payload.data ?? []);
    setTotal(payload.total ?? 0);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterRole, filterStatus]);

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    await load();
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(user: UserRow) {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl ?? "",
    });
    setOpen(true);
  }

  async function submitForm(event: FormEvent) {
    event.preventDefault();

    const method = editingId ? "PUT" : "POST";
    const endpoint = editingId ? `/api/users/${editingId}` : "/api/users";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      setError("Failed to save user");
      return;
    }

    setOpen(false);
    setForm(EMPTY_FORM);
    setEditingId(null);
    await load();
  }

  async function softDelete(id: number) {
    const response = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Failed to deactivate user");
      return;
    }
    await load();
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
                placeholder="Search by name"
                className="w-full bg-transparent text-sm text-textPrimary outline-none"
              />
            </div>
            <button className="rounded-xl bg-accentBlue px-4 py-2 text-sm font-medium text-white">Search</button>
          </form>

          <div className="flex gap-2">
            <select
              value={filterRole}
              onChange={(event) => setFilterRole(event.target.value as UserRole | "")}
              className="glass-card px-3 py-2 text-sm text-textPrimary"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="viewer">Viewer</option>
            </select>
            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value as UserStatus | "")}
              className="glass-card px-3 py-2 text-sm text-textPrimary"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {canWrite ? (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-accentTeal px-4 py-2 text-sm font-medium text-black"
              >
                <Plus size={16} />
                New User
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="glass-card overflow-x-auto p-2">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-muted">
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Joined</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-3 py-4 text-muted" colSpan={5}>
                  Loading users...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-muted" colSpan={5}>
                  No users found.
                </td>
              </tr>
            ) : (
              rows.map((user) => (
                <tr key={user.id} className="border-t border-white/5 text-textPrimary">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        <CldImage
                          width={36}
                          height={36}
                          src={user.avatarUrl}
                          alt={user.name}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-accentBlue/20" />
                      )}
                      <div>
                        <p>{user.name}</p>
                        <p className="text-xs text-muted">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 capitalize">{user.role}</td>
                  <td className="px-3 py-2 capitalize">{user.status}</td>
                  <td className="px-3 py-2">{toDate(user.createdAt)}</td>
                  <td className="px-3 py-2">
                    {canWrite ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(user)}
                          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void softDelete(user.id)}
                          className="rounded-lg border border-red-400/40 px-3 py-1.5 text-xs text-red-200"
                        >
                          Deactivate
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

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          Page {page} of {maxPage}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={page >= maxPage}
            onClick={() => setPage((value) => Math.min(maxPage, value + 1))}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <form onSubmit={submitForm} className="glass-card w-full max-w-lg space-y-3 p-5">
            <h3 className="text-lg font-semibold text-textPrimary">
              {editingId ? "Edit User" : "Create User"}
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
                type="email"
                value={form.email}
                onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))}
                placeholder="Email"
                className="glass-card px-3 py-2 text-sm"
              />
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((value) => ({ ...value, password: event.target.value }))}
                placeholder={editingId ? "Leave blank to keep password" : "Password"}
                className="glass-card px-3 py-2 text-sm"
              />
              <input
                value={form.avatarUrl}
                onChange={(event) => setForm((value) => ({ ...value, avatarUrl: event.target.value }))}
                placeholder="Cloudinary public id"
                className="glass-card px-3 py-2 text-sm"
              />
              <select
                value={form.role}
                onChange={(event) => setForm((value) => ({ ...value, role: event.target.value as UserRole }))}
                className="glass-card px-3 py-2 text-sm"
              >
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
                <option value="viewer">Viewer</option>
              </select>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((value) => ({ ...value, status: event.target.value as UserStatus }))
                }
                className="glass-card px-3 py-2 text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
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
