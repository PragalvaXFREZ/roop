/*
 * Catalog page.
 * The URL holds all the filters, the sort and the search text.
 * Thus, customers can share a filtered list and use the back button.
 * The filter form uses GET, so it works before the page loads its JavaScript.
 */
import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { FilterToggle } from "@/components/shop/FilterToggle";
import { GridSkeleton, ProductGrid } from "@/components/shop/ProductGrid";
import { api, type CatalogFilters, type ProductCard } from "@/lib/api";

export const metadata: Metadata = { title: "Shop" };

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price, low to high" },
  { value: "price_desc", label: "Price, high to low" },
];

const FIELD = "mt-1 w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm";

type Query = { q: string; category: string; size: string; color: string; min: string; max: string; sort: string };

export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-10 sm:px-6">
      <h1 className="font-display text-5xl font-semibold">Shop</h1>
      <Suspense
        fallback={
          <div className="mt-8">
            <GridSkeleton />
          </div>
        }
      >
        <Catalog searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Catalog({ searchParams }: Pick<PageProps<"/shop">, "searchParams">) {
  const query = readQuery(await searchParams);
  const [filters, products] = await Promise.all([
    api<CatalogFilters>("/api/filters"),
    api<ProductCard[]>(`/api/products?${apiQuery(query)}`),
  ]);
  const active = [query.category, query.size, query.color, query.min, query.max].filter(Boolean).length;

  return (
    <div className="mt-8 gap-10 md:grid md:grid-cols-[220px_1fr]">
      {/* A new key resets the inputs after each navigation, because the inputs are uncontrolled. */}
      <Form key={JSON.stringify(query)} action="/shop" className="space-y-4">
        <label className="block text-sm">
          <span className="sr-only">Search</span>
          <input name="q" type="search" defaultValue={query.q} placeholder="Search" className={FIELD} />
        </label>
        <FilterToggle active={active}>
          <div className="space-y-4 pt-2">
            <Select name="category" label="Category" value={query.category} empty="All">
              {filters.categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Select name="size" label="Size" value={query.size} empty="Any">
              {filters.sizes.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
            <Select name="color" label="Colour" value={query.color} empty="Any">
              {filters.colors.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
            <fieldset className="text-sm">
              <legend>Price (NPR)</legend>
              <div className="flex gap-2">
                <input name="min" type="number" min={0} inputMode="numeric" defaultValue={query.min} placeholder="Min" aria-label="Minimum price" className={FIELD} />
                <input name="max" type="number" min={0} inputMode="numeric" defaultValue={query.max} placeholder="Max" aria-label="Maximum price" className={FIELD} />
              </div>
            </fieldset>
            <Select name="sort" label="Sort by" value={query.sort}>
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
            <div className="flex items-center gap-4">
              <button type="submit" className="rounded-sm bg-accent px-5 py-2 text-sm font-medium text-accent-ink hover:opacity-90">
                Apply
              </button>
              <Link href="/shop" className="text-sm text-muted hover:text-ink hover:underline">
                Clear all
              </Link>
            </div>
          </div>
        </FilterToggle>
      </Form>

      <section className="mt-8 md:mt-0">
        <p className="mb-6 text-sm text-muted">
          {products.length} {products.length === 1 ? "piece" : "pieces"}
        </p>
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <p className="py-16 text-muted">
            No pieces match these filters.{" "}
            <Link href="/shop" className="text-ink underline">
              Clear all filters
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}

function Select({
  name,
  label,
  value,
  empty,
  children,
}: {
  name: string;
  label: string;
  value: string;
  empty?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      {label}
      <select name={name} defaultValue={value} className={FIELD}>
        {empty && <option value="">{empty}</option>}
        {children}
      </select>
    </label>
  );
}

/* Take the first value of each parameter. The form sends empty fields as empty strings. */
function readQuery(params: Record<string, string | string[] | undefined>): Query {
  const get = (key: string) => {
    const value = params[key];
    return ((Array.isArray(value) ? value[0] : value) ?? "").trim();
  };
  const rupees = (key: string) => (/^\d+$/.test(get(key)) ? get(key) : "");
  const sort = get("sort");
  return {
    q: get("q"),
    category: get("category"),
    size: get("size"),
    color: get("color"),
    min: rupees("min"),
    max: rupees("max"),
    sort: SORTS.some((s) => s.value === sort) ? sort : "newest",
  };
}

/*
 * Make the API query from the URL query.
 * Do not send empty values, because the API rejects them.
 * The URL has prices in rupees. The API has prices in paisa.
 */
function apiQuery(query: Query): string {
  const out = new URLSearchParams({ sort: query.sort });
  for (const key of ["q", "category", "size", "color"] as const) {
    if (query[key]) out.set(key, query[key]);
  }
  if (query.min) out.set("min_price", String(Number(query.min) * 100));
  if (query.max) out.set("max_price", String(Number(query.max) * 100));
  return out.toString();
}
