import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/src/db";
import { parseProductImages } from "@/src/lib/product-images";
import { products } from "@/src/db/schema";
import { ProductImagePreview } from "./product-image-preview";
import { canAccessStore, defaultDashboardPath } from "@/src/lib/authz";

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (!canAccessStore(session.user.role)) {
    redirect(defaultDashboardPath(session.user.role));
  }

  const [product] = await db
    .select({
      id: products.id,
      name: products.name,
      description: products.description,
      slug: products.slug,
      imageUrl: products.imageUrl,
    })
    .from(products)
    .where(eq(products.slug, params.slug))
    .limit(1);

  if (!product) {
    notFound();
  }

  const previewImages = parseProductImages(product.imageUrl).slice(0, 2);

  return (
    <section className="space-y-4">
      <div>
        <Link
          href="/dashboard/products"
          className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-textPrimary"
        >
          <ArrowLeft size={14} />
          Kembali ke daftar produk
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="glass-card p-6 lg:col-span-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Detail Produk</p>
          <h1 className="mt-2 text-2xl font-semibold text-textPrimary">{product.name}</h1>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-textPrimary">
            {product.description?.trim() || "Belum ada deskripsi produk."}
          </p>
        </div>

        <div className="glass-card overflow-hidden p-4 lg:col-span-2">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted">Preview Foto</p>
          <ProductImagePreview productName={product.name} previewImages={previewImages} />
        </div>
      </div>
    </section>
  );
}
