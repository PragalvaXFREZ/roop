/*
 * Product page.
 * The product loads at request time, so the stock is always current.
 * An unknown or unpublished slug shows the not-found page.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import { ProductImage } from "@/components/shop/ProductImage";
import { VariantPicker } from "@/components/shop/VariantPicker";
import { api, ApiError, type ProductDetail } from "@/lib/api";
import { money } from "@/lib/config";

/* The metadata and the page both need the product. React cache makes one request for both. */
const getProduct = cache(async (slug: string) => {
  try {
    return await api<ProductDetail>(`/api/products/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
});

export async function generateMetadata({ params }: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  return { title: product.name, description: product.embroidery || product.description };
}

export default function ProductPage({ params }: PageProps<"/shop/[slug]">) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6">
      <Suspense fallback={<ProductSkeleton />}>
        <Product params={params} />
      </Suspense>
    </div>
  );
}

async function Product({ params }: Pick<PageProps<"/shop/[slug]">, "params">) {
  const product = await getProduct((await params).slug);
  const details = [
    { title: "Embroidery", body: product.embroidery },
    { title: "Fabric", body: product.fabric },
    { title: "Care", body: product.care },
  ].filter((d) => d.body);

  return (
    <div className="grid gap-10 md:grid-cols-2 md:gap-16">
      {/* On phones, swipe through the photos. On wide screens, the photos stack. */}
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto md:flex-col md:overflow-visible">
        {product.images.length > 0 ? (
          product.images.map((img, i) => (
            <div key={img.id} className={`shrink-0 snap-start ${product.images.length > 1 ? "w-[85%] md:w-full" : "w-full"}`}>
              <ProductImage src={img.url} alt={`${product.name}, photo ${i + 1}`} />
            </div>
          ))
        ) : (
          <ProductImage src={null} alt={product.name} />
        )}
      </div>

      <div className="md:sticky md:top-8 md:self-start">
        {product.category && (
          <Link href={`/shop?category=${product.category.slug}`} className="text-sm text-muted hover:underline">
            {product.category.name}
          </Link>
        )}
        <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">{product.name}</h1>
        <p className="mt-3 text-lg">{money(product.price)}</p>
        <p className="mt-6 text-muted">{product.description}</p>

        <div className="mt-8">
          <VariantPicker product={product} />
        </div>

        <p className="mt-4 text-sm text-muted">Pay on delivery. We call you to confirm the order first.</p>

        <dl className="mt-10 divide-y divide-line border-y border-line">
          {details.map((d) => (
            <div key={d.title} className="py-4">
              <dt className="text-sm font-medium">{d.title}</dt>
              <dd className="mt-1 text-sm text-muted">{d.body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="grid gap-10 md:grid-cols-2 md:gap-16" aria-hidden>
      <div className="aspect-[4/5] w-full bg-line" />
      <div className="space-y-4">
        <div className="h-10 w-2/3 bg-line" />
        <div className="h-5 w-1/4 bg-line" />
        <div className="h-24 bg-line" />
      </div>
    </div>
  );
}
