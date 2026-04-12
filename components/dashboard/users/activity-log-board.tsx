"use client";

import { useMemo, useState } from "react";
import { toDate } from "@/src/lib/format";

export type ActivityEntry = {
  id: string;
  type: "user" | "order" | "product" | "media";
  title: string;
  detail: string;
  actor: string;
  createdAt: string;
  severity: "info" | "success" | "warning";
};

export function ActivityLogBoard({ entries }: { entries: ActivityEntry[] }) {
  const [typeFilter, setTypeFilter] = useState<ActivityEntry["type"] | "">("");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      const passType = !typeFilter || entry.type === typeFilter;
      const query = q.trim().toLowerCase();
      const passSearch =
        !query ||
        entry.title.toLowerCase().includes(query) ||
        entry.detail.toLowerCase().includes(query) ||
        entry.actor.toLowerCase().includes(query);
      return passType && passSearch;
    });
  }, [entries, q, typeFilter]);

  return (
    <section className="space-y-4">
      <div className="glass-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search activity"
            className="glass-card w-full max-w-xl px-3 py-2 text-sm"
          />

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as ActivityEntry["type"] | "")}
            className="glass-card px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            <option value="user">User</option>
            <option value="order">Order</option>
            <option value="product">Product</option>
            <option value="media">Media</option>
          </select>
        </div>
      </div>

      <div className="glass-card divide-y divide-white/5">
        {filtered.length === 0 ? (
          <div className="p-5 text-sm text-muted">No activity found.</div>
        ) : (
          filtered.map((entry) => (
            <article key={entry.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-textPrimary">{entry.title}</p>
                  <p className="mt-1 text-xs text-muted">{entry.detail}</p>
                  <p className="mt-1 text-xs text-muted">Actor: {entry.actor}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      entry.severity === "success"
                        ? "bg-accentTeal/20 text-accentTeal"
                        : entry.severity === "warning"
                          ? "bg-amber-300/20 text-amber-200"
                          : "bg-accentBlue/20 text-accentBlue"
                    }`}
                  >
                    {entry.type}
                  </span>
                  <p className="mt-2 text-xs text-muted">{toDate(entry.createdAt)}</p>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
