"use client";

import { useEffect, useState } from "react";
import { CldImage } from "next-cloudinary";

type MediaRow = {
  id: number;
  url: string;
  publicId: string;
  filename: string;
  size: number;
  createdAt: string;
};

export function MediaLibrary() {
  const [rows, setRows] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/media");
    const payload = (await response.json()) as { data?: MediaRow[]; error?: string };

    if (!response.ok) {
      setError(payload.error ?? "Failed to load media");
      setLoading(false);
      return;
    }

    setRows(payload.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function remove(id: number) {
    const response = await fetch(`/api/media?id=${id}`, { method: "DELETE" });
    if (!response.ok) {
      setError("Failed to delete media");
      return;
    }
    setRows((prev) => prev.filter((item) => item.id !== id));
  }

  async function copy(url: string) {
    await navigator.clipboard.writeText(url);
  }

  return (
    <section className="space-y-4">
      <div className="glass-card p-4">
        <h2 className="text-lg font-semibold text-textPrimary">Media Library</h2>
        <p className="text-sm text-muted">Manage uploaded images from Neon + Cloudinary.</p>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {loading ? (
        <div className="glass-card p-4 text-sm text-muted">Loading media...</div>
      ) : rows.length === 0 ? (
        <div className="glass-card p-4 text-sm text-muted">No media uploaded yet.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((row) => (
            <article key={row.id} className="glass-card p-3">
              <CldImage
                width={400}
                height={300}
                src={row.publicId}
                alt={row.filename}
                className="h-40 w-full rounded-xl object-cover"
              />
              <p className="mt-2 truncate text-sm text-textPrimary">{row.filename}</p>
              <p className="text-xs text-muted">{(row.size / 1024).toFixed(1)} KB</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => void copy(row.url)}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs"
                >
                  Copy URL
                </button>
                <button
                  type="button"
                  onClick={() => void remove(row.id)}
                  className="rounded-lg border border-red-300/40 px-3 py-1.5 text-xs text-red-200"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
