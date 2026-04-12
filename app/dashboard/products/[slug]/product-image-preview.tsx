"use client";

import { CldImage } from "next-cloudinary";

export function ProductImagePreview({
  productName,
  previewImages,
}: {
  productName: string;
  previewImages: string[];
}) {
  if (previewImages.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 text-sm text-muted">
        Belum ada foto produk.
      </div>
    );
  }

  return (
    <div className="grid h-full grid-cols-2 gap-2">
      <div className="relative col-span-2 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
        <CldImage
          width={700}
          height={360}
          src={previewImages[0]}
          alt={`${productName} preview utama`}
          className="h-52 w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>

      <div className="relative col-span-2 overflow-hidden rounded-xl border border-white/10 bg-black/20 sm:col-span-1">
        {previewImages[1] ? (
          <CldImage
            width={340}
            height={220}
            src={previewImages[1]}
            alt={`${productName} preview kedua`}
            className="h-32 w-full object-cover"
          />
        ) : (
          <div className="flex h-32 items-center justify-center text-xs text-muted">
            Upload minimal 2 foto untuk preview tambahan
          </div>
        )}
      </div>

      <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-3 text-xs text-muted sm:col-span-1">
        Gunakan foto utama untuk hero produk dan foto kedua untuk angle atau detail close-up.
      </div>
    </div>
  );
}
