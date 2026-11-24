/*
 * Track page.
 * The confirmation page links here with ?number= in the URL. The form fills in that number.
 */
import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackForm } from "@/components/shop/TrackForm";

export const metadata: Metadata = { title: "Track your order" };

export default function TrackPage({ searchParams }: PageProps<"/track">) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-10 sm:px-6">
      <h1 className="font-display text-5xl font-semibold">Track your order</h1>
      <p className="mt-3 max-w-xl text-muted">Enter the order number from your receipt and the phone number you gave at checkout.</p>
      <Suspense fallback={<div className="mt-8 h-48 bg-line" aria-hidden />}>
        {searchParams.then(({ number }) => (
          <TrackForm defaultNumber={typeof number === "string" ? number : ""} />
        ))}
      </Suspense>
    </div>
  );
}
