"use client";

import { useState } from "react";
import { CldImage, CldUploadWidget } from "next-cloudinary";

type UploadInfo = {
  public_id: string;
  secure_url: string;
  original_filename: string;
  bytes: number;
};

type MediaRecord = {
  id: number;
  url: string;
  publicId: string;
  filename: string;
  size: number;
};

export function MediaUpload() {
  const [uploaded, setUploaded] = useState<MediaRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function saveMedia(info: UploadInfo) {
    const response = await fetch("/api/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: info.secure_url,
        publicId: info.public_id,
        filename: info.original_filename,
        size: info.bytes,
      }),
    });

    if (!response.ok) {
      setError("Upload succeeded but failed to save metadata.");
      return;
    }

    const payload = (await response.json()) as { data?: MediaRecord };
    if (payload.data) {
      setUploaded((prev) => [payload.data as MediaRecord, ...prev]);
    }
  }

  return (
    <section className="space-y-4">
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-textPrimary">Upload Media</h2>
        <p className="mt-1 text-sm text-muted">
          Drag files into the widget and save Cloudinary references to Neon.
        </p>

        <div className="mt-4">
          <CldUploadWidget
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
            options={{ maxFiles: 10 }}
            onSuccess={(result) => {
              const info = (result as { info?: UploadInfo }).info;
              if (info?.public_id && info?.secure_url) {
                void saveMedia(info);
              }
            }}
          >
            {({ open }) => (
              <button
                type="button"
                onClick={() => open()}
                className="w-full rounded-2xl border border-dashed border-accentBlue/50 bg-accentBlue/10 px-6 py-10 text-center text-sm text-textPrimary"
              >
                Click to Upload or Drop Files Here
              </button>
            )}
          </CldUploadWidget>
        </div>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {uploaded.map((item) => (
          <article key={item.id} className="glass-card p-3">
            <CldImage
              width={400}
              height={300}
              src={item.publicId}
              alt={item.filename}
              className="h-40 w-full rounded-xl object-cover"
            />
            <p className="mt-2 truncate text-sm text-textPrimary">{item.filename}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
