/*
 * Landing page.
 * The text is static. The featured products and the categories come from the API at request time.
 * Thus, the build does not need the API, and the page always shows current products.
 */
import Link from "next/link";
import { Suspense } from "react";
import { GridSkeleton, ProductGrid } from "@/components/shop/ProductGrid";
import { api, type CatalogFilters, type ProductCard } from "@/lib/api";

const STEPS = [
  { title: "Order online", body: "Choose your size and colour, then send the order. You do not pay now." },
  { title: "We confirm by phone", body: "We call you to confirm the details, the size and the delivery date." },
  { title: "Pay on delivery", body: "Pay in cash when the piece arrives at your door." },
];

export default function Home() {
  return (
    <>
      <section className="mx-auto w-full max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
        <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[1.05] sm:text-7xl">
          Clothing embroidered by hand, made for you.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted">
          Kurtas, shirts, dresses and shawls. Each piece is stitched to order in a small workshop.
        </p>
        <Link
          href="/shop"
          className="mt-10 inline-block rounded-sm bg-accent px-6 py-3 text-sm font-medium text-accent-ink hover:opacity-90"
        >
          Shop the collection
        </Link>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-2 md:gap-16">
          <h2 className="font-display text-4xl font-semibold">Slow by design</h2>
          <div className="space-y-4 text-muted">
            <p>
              Every motif starts as a drawing on cloth. Then an embroiderer works it by hand, one stitch at a time. A
              single yoke can take days.
            </p>
            <p>
              We do not keep large stock. We make most pieces after you order them. Thus, the stitches vary a little
              from one garment to the next, and nothing goes to waste.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pt-20 sm:px-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-4xl font-semibold">Featured</h2>
          <Link href="/shop" className="text-sm hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-8">
          <Suspense fallback={<GridSkeleton count={3} />}>
            <Featured />
          </Suspense>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pt-20 sm:px-6">
        <h2 className="font-display text-4xl font-semibold">Categories</h2>
        <Suspense fallback={<div className="mt-8 h-16 bg-line" />}>
          <Categories />
        </Suspense>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pt-20 sm:px-6">
        <h2 className="font-display text-4xl font-semibold">How ordering works</h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="border-t border-line pt-6">
              <p className="font-display text-3xl font-semibold text-accent">{i + 1}</p>
              <p className="mt-2 font-medium">{step.title}</p>
              <p className="mt-2 text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

async function Featured() {
  const products = await api<ProductCard[]>("/api/products?featured=true");
  return <ProductGrid products={products.slice(0, 6)} />;
}

async function Categories() {
  const { categories } = await api<CatalogFilters>("/api/filters");
  return (
    <ul className="mt-8 grid grid-cols-2 border-l border-t border-line md:grid-cols-4">
      {categories.map((c) => (
        <li key={c.id} className="border-b border-r border-line">
          <Link href={`/shop?category=${c.slug}`} className="block px-4 py-6 font-display text-2xl font-semibold hover:bg-surface">
            {c.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
