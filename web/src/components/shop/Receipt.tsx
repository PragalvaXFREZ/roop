/*
 * Order confirmation.
 * The receipt comes from sessionStorage, where checkout put it.
 * If this tab has no receipt, show the order number and a link to the track page.
 */
"use client";

import Link from "next/link";
import { STATUS_LABEL, type OrderReceipt } from "@/lib/api";
import { ItemList } from "./ItemList";
import { useReceiptText } from "./savedReceipt";

export function Receipt({ number }: { number: string }) {
  const text = useReceiptText(number);
  if (text === undefined) return <div className="mt-8 h-64 bg-line" aria-hidden />;
  const receipt: OrderReceipt | null = text ? JSON.parse(text) : null;

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-5xl font-semibold">Thank you</h1>
      <p className="mt-4">
        Your order number is <span className="font-semibold">{number}</span>.
      </p>
      <p className="mt-2 text-muted">
        Save this number. You need it and your phone number to track the order. We will call you soon to confirm it.
      </p>

      {receipt ? (
        <div className="mt-10">
          <p className="text-sm">
            Status: <span className="text-muted">{STATUS_LABEL[receipt.status]}</span>
          </p>
          <div className="mt-4">
            <ItemList items={receipt.items} total={receipt.total} />
          </div>
          <p className="text-sm text-muted">Pay this amount in cash on delivery.</p>
        </div>
      ) : null}

      <Link href={`/track?number=${encodeURIComponent(number)}`} className="mt-10 inline-block text-sm underline">
        Track this order
      </Link>
    </div>
  );
}
