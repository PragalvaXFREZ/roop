/*
 * Product grid for the landing page and the catalog.
 * The grid has two columns on phones and more columns on wide screens.
 */
import Link from "next/link";
import type { ProductCard } from "@/lib/api";
import { money } from "@/lib/config";
import { ProductImage } from "./ProductImage";

const GRID = "grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-3";

export function ProductGrid({ products }: { products: ProductCard[] }) {
  return (
    <ul className={GRID}>
      {products.map((p) => (
        <li key={p.id}>
          <Link href={`/shop/${p.slug}`} className="group block">
            <ProductImage src={p.image} alt={p.name} />
            <p className="mt-3 text-sm font-medium group-hover:underline">{p.name}</p>
            <p className="mt-1 text-sm text-muted">{money(p.price)}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* The Suspense fallback for a grid. It has the same layout, so the page does not jump. */
export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className={GRID} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <div className="aspect-[4/5] w-full bg-line" />
          <div className="mt-3 h-4 w-2/3 bg-line" />
          <div className="mt-2 h-4 w-1/3 bg-line" />
        </li>
      ))}
    </ul>
  );
}
