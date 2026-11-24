/*
 * Error page for the shop.
 * It shows when a page cannot get data, for example when the API is down.
 */
"use client";

export default function ShopError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
      <h1 className="font-display text-4xl font-semibold">We could not load this page</h1>
      <p className="mt-3 text-muted">Check your connection and try again.</p>
      <button onClick={() => retry()} className="mt-8 rounded-sm bg-accent px-5 py-3 text-sm font-medium text-accent-ink">
        Try again
      </button>
    </div>
  );
}
