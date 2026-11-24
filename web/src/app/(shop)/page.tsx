/*
 * Landing page.
 * The text and the photos in public/images are static.
 * The featured products and the categories come from the API at request time.
 * Thus, the build does not need the API, and the page always shows current products.
 * To change a landing photo, replace the file in public/images. Keep the same name.
 */
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { GridSkeleton, ProductGrid } from "@/components/shop/ProductGrid";
import { api, type CatalogFilters, type ProductCard } from "@/lib/api";

const STEPS = [
  { title: "Order online", body: "Choose your size and colour, then send the order. You do not pay now." },
  { title: "We confirm by phone", body: "We call you to confirm the details, the size and the delivery date." },
  { title: "Pay on delivery", body: "Pay in cash when the piece arrives at your door." },
];

/* Categories with a photo in public/images. Other categories show a plain block. */
const CATEGORY_PHOTOS = new Set(["kurtas", "shirts", "dresses", "shawls"]);

export default function Home() {
  return (
    <>
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 pb-20 pt-8 sm:px-6 md:grid-cols-2 md:items-center md:gap-16 md:pt-16">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-line md:order-2">
          <Image
            src="/images/hero.jpg"
            alt="A woman in a maroon kurta with an embroidered neckline"
            fill
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] sm:text-6xl lg:text-7xl">
            Clothing embroidered by hand, made for you.
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted">
            Kurtas, shirts, dresses and shawls. Each piece is stitched to order in a small workshop.
          </p>
          <Link
            href="/shop"
            className="mt-10 inline-block rounded-sm bg-accent px-6 py-3 text-sm font-medium text-accent-ink hover:opacity-90"
          >
            Shop the collection
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-4xl font-semibold">Shop by category</h2>
        <Suspense fallback={<div className="mt-8 aspect-[4/1] bg-line" />}>
          <Categories />
        </Suspense>
      </section>

      <section className="mt-24 border-y border-line bg-surface">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center md:gap-16 md:py-24">
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-line">
            <Image
              src="/images/story-hands.jpg"
              alt="Hands stitching white cloth with a needle and thread"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="font-display text-4xl font-semibold">Slow by design</h2>
            <div className="mt-6 space-y-4 text-muted">
              <p>
                Every motif starts as a drawing on cloth. Then an embroiderer works it by hand, one stitch at a time. A
                single yoke can take days.
              </p>
              <p>
                We do not keep large stock. We make most pieces after you order them. Thus, the stitches vary a little
                from one garment to the next, and nothing goes to waste.
              </p>
            </div>
            <div className="relative mt-8 aspect-[3/2] w-2/3 overflow-hidden bg-line">
              <Image
                src="/images/story-detail.jpg"
                alt="Morning glories embroidered on linen"
                fill
                sizes="(min-width: 768px) 25vw, 66vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pt-24 sm:px-6">
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

      <section className="mx-auto w-full max-w-6xl px-4 pt-24 sm:px-6">
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
    <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6">
      {categories.map((c) => (
        <li key={c.id}>
          <Link href={`/shop?category=${c.slug}`} className="group block">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-line">
              {CATEGORY_PHOTOS.has(c.slug) && (
                <Image
                  src={`/images/category-${c.slug}.jpg`}
                  alt={c.name}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              )}
            </div>
            <p className="mt-3 font-display text-2xl font-semibold group-hover:underline">{c.name}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
