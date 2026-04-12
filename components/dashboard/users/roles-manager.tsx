"use client";

import { useEffect, useMemo, useState } from "react";

type UserRole = "admin" | "staff" | "viewer";
type UserStatus = "active" | "inactive";

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
};

export function RolesManager({ role }: { role: UserRole }) {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  const canWrite = role === "admin";

  async function load() {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ page: "1", pageSize: "100" });
    if (q.trim()) params.set("q", q.trim());
    if (filterRole) params.set("role", filterRole);

    const response = await fetch(`/api/users?${params.toString()}`);
    const payload = (await response.json()) as { data?: UserRow[]; error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Failed to load users");
      setLoading(false);
      return;
    }

    setRows(payload.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRole]);

  const summary = useMemo(() => {
    const admins = rows.filter((user) => user.role === "admin").length;
    const staffs = rows.filter((user) => user.role === "staff").length;
    const viewers = rows.filter((user) => user.role === "viewer").length;
    return { admins, staffs, viewers };
  }, [rows]);

  async function updateUser(id: number, patch: Partial<Pick<UserRow, "role" | "status">>) {
    setSavingId(id);
    setError(null);

    const response = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    setSavingId(null);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Failed to update role");
      return;
    }

    await load();
  }

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="glass-card p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Admins</p>
          <p className="mt-2 text-2xl font-semibold text-textPrimary">{summary.admins}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Staff</p>
          <p className="mt-2 text-2xl font-semibold text-textPrimary">{summary.staffs}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Viewer</p>
          <p className="mt-2 text-2xl font-semibold text-textPrimary">{summary.viewers}</p>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 gap-2">
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search user"
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

          <select
            value={filterRole}
            onChange={(event) => setFilterRole(event.target.value as UserRole | "")}
            className="glass-card px-3 py-2 text-sm"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="viewer">Viewer</option>
          </select>
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
              <th className="px-3 py-2">Permission</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-muted">
                  Loading roles...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-muted">
                  No users found.
                </td>
              </tr>
            ) : (
              rows.map((user) => (
                <tr key={user.id} className="border-t border-white/5">
                  <td className="px-3 py-2">
                    <p className="text-textPrimary">{user.name}</p>
                    <p className="text-xs text-muted">{user.email}</p>
                  </td>
                  <td className="px-3 py-2">
                    {canWrite ? (
                      <select
                        value={user.role}
                        disabled={savingId === user.id}
                        onChange={(event) =>
                          void updateUser(user.id, { role: event.target.value as UserRole })
                        }
                        className="glass-card px-2 py-1.5 text-xs"
                      >
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className="capitalize text-textPrimary">{user.role}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {canWrite ? (
                      <select
                        value={user.status}
                        disabled={savingId === user.id}
                        onChange={(event) =>
                          void updateUser(user.id, { status: event.target.value as UserStatus })
                        }
                        className="glass-card px-2 py-1.5 text-xs"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    ) : (
                      <span className="capitalize text-textPrimary">{user.status}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted">
                    {user.role === "admin"
                      ? "Full access"
                      : user.role === "staff"
                        ? "Write limited"
                        : "Read-only"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
