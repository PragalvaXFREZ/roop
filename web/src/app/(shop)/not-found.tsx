/* Not-found page for the shop. It shows for an unknown product, for example. */
import Link from "next/link";

export default function ShopNotFound() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
      <h1 className="font-display text-4xl font-semibold">We could not find this page</h1>
      <p className="mt-3 text-muted">The piece may be sold out or no longer in the collection.</p>
      <Link href="/shop" className="mt-8 inline-block text-sm underline">
        Back to the shop
      </Link>
    </div>
  );
}
