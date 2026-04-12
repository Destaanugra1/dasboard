"use client";

import { CldImage } from "next-cloudinary";

type TopProduct = {
  id: number;
  name: string | null;
  imageUrl: string | null;
  sold: number;
};

type TopProductsCardProps = {
  products: TopProduct[];
};

export function TopProductsCard({ products }: TopProductsCardProps) {
  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-semibold text-textPrimary">Top Products</h3>
      <div className="mt-3 space-y-3">
        {products.map((product) => (
          <div key={product.id} className="flex items-center gap-3 rounded-xl bg-black/10 p-2">
            {product.imageUrl ? (
              <CldImage
                width={42}
                height={42}
                src={product.imageUrl}
                alt={product.name ?? "Product"}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-accentBlue/20" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-textPrimary">{product.name ?? "Unnamed Product"}</p>
              <p className="text-xs text-muted">{product.sold} sold</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
