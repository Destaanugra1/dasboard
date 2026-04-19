"use client";

import { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";

type Settings = {
  blog_name: string;
  blog_tagline: string;
  newsletter_title: string;
  newsletter_subtitle: string;
  newsletter_placeholder: string;
  newsletter_button: string;
  footer_copyright: string;
};

const defaults: Settings = {
  blog_name: "Berita Hari Ini",
  blog_tagline: "Informasi terkini, terpercaya",
  newsletter_title: "Berlangganan Newsletter",
  newsletter_subtitle: "Dapatkan berita terbaru langsung di email kamu setiap hari.",
  newsletter_placeholder: "Masukkan email kamu...",
  newsletter_button: "Berlangganan",
  footer_copyright: "© 2025 Berita Hari Ini. Semua hak dilindungi.",
};

export function BlogSettingsManager() {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/blog/settings");
      const data = await res.json();
      setSettings(prev => ({ ...prev, ...data }));
    })();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/blog/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const set = <K extends keyof Settings>(k: K, v: string) =>
    setSettings(s => ({ ...s, [k]: v }));

  const fields: { key: keyof Settings; label: string; placeholder?: string; multiline?: boolean }[] = [
    { key: "blog_name", label: "Nama Blog", placeholder: "Berita Hari Ini" },
    { key: "blog_tagline", label: "Tagline", placeholder: "Informasi terkini, terpercaya" },
    { key: "newsletter_title", label: "Judul Newsletter", placeholder: "Berlangganan Newsletter" },
    { key: "newsletter_subtitle", label: "Subjudul Newsletter", placeholder: "Dapatkan berita terbaru...", multiline: true },
    { key: "newsletter_placeholder", label: "Placeholder Input Email", placeholder: "Masukkan email kamu..." },
    { key: "newsletter_button", label: "Teks Tombol Newsletter", placeholder: "Berlangganan" },
    { key: "footer_copyright", label: "Teks Copyright Footer", placeholder: "© 2025 ..." },
  ];

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-textPrimary">Pengaturan Blog</h2>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-accentTeal px-5 py-2 text-sm font-bold text-white hover:bg-accentTeal/90 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saved ? "Tersimpan ✓" : saving ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </div>

      <div className="glass-card p-6 space-y-5">
        {fields.map(({ key, label, placeholder, multiline }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-muted mb-1.5">{label}</label>
            {multiline ? (
              <textarea
                rows={3}
                value={settings[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-textPrimary placeholder:text-muted/50 focus:border-accentTeal focus:outline-none resize-none"
              />
            ) : (
              <input
                type="text"
                value={settings[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-textPrimary placeholder:text-muted/50 focus:border-accentTeal focus:outline-none"
              />
            )}
          </div>
        ))}
      </div>
    </form>
  );
}
