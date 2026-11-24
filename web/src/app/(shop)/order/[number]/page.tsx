/* Order confirmation page. The order number comes from the URL. */
import type { Metadata } from "next";
import { Suspense } from "react";
import { Receipt } from "@/components/shop/Receipt";

export const metadata: Metadata = { title: "Order placed" };

export default function OrderPage({ params }: PageProps<"/order/[number]">) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-10 sm:px-6">
      <Suspense fallback={<div className="h-64 bg-line" aria-hidden />}>
        {params.then(({ number }) => (
          <Receipt number={decodeURIComponent(number)} />
        ))}
      </Suspense>
    </div>
  );
}
