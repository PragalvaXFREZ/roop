/*
 * Cart lines with quantity controls.
 * The prices here come from the time the customer added the item.
 * The server calculates the final total when the customer places the order.
 */
"use client";

import Link from "next/link";
import { money } from "@/lib/config";
import { MAX_QTY, removeLine, setQty, useCart } from "./cart";
import { ProductImage } from "./ProductImage";

const STEP = "h-9 w-9 border border-line bg-surface text-base disabled:opacity-40";

export function CartView() {
  const cart = useCart();
  if (!cart) return <div className="mt-8 h-40 bg-line" aria-hidden />;
  if (cart.length === 0) return <EmptyCart />;

  const subtotal = cart.reduce((sum, l) => sum + l.price * l.qty, 0);
  return (
    <div className="mt-8 grid gap-10 md:grid-cols-[1fr_300px]">
      <ul className="divide-y divide-line border-y border-line">
        {cart.map((line) => (
          <li key={line.variant_id} className="flex gap-4 py-4">
            <Link href={`/shop/${line.slug}`} className="w-20 shrink-0 sm:w-24">
              <ProductImage src={line.image} alt={line.name} />
            </Link>
            <div className="flex flex-1 flex-col gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <div>
                  <Link href={`/shop/${line.slug}`} className="font-medium hover:underline">
                    {line.name}
                  </Link>
                  <p className="text-muted">
                    {line.size} · {line.color} · {money(line.price)}
                  </p>
                </div>
                <p className="shrink-0">{money(line.price * line.qty)}</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <button
                    type="button"
                    className={STEP}
                    onClick={() => setQty(line.variant_id, line.qty - 1)}
                    disabled={line.qty <= 1}
                    aria-label={`One less ${line.name}`}
                  >
                    −
                  </button>
                  <span className="w-10 text-center" aria-label="Quantity">
                    {line.qty}
                  </span>
                  <button
                    type="button"
                    className={STEP}
                    onClick={() => setQty(line.variant_id, line.qty + 1)}
                    disabled={line.qty >= MAX_QTY}
                    aria-label={`One more ${line.name}`}
                  >
                    +
                  </button>
                </div>
                <button type="button" onClick={() => removeLine(line.variant_id)} className="text-muted hover:text-ink hover:underline">
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="md:self-start">
        <p className="flex justify-between font-medium">
          <span>Subtotal</span>
          <span>{money(subtotal)}</span>
        </p>
        <p className="mt-2 text-sm text-muted">We confirm the total by phone. You pay when the order arrives.</p>
        <Link
          href="/checkout"
          className="mt-6 block rounded-sm bg-accent px-6 py-3 text-center text-sm font-medium text-accent-ink hover:opacity-90"
        >
          Go to checkout
        </Link>
      </div>
    </div>
  );
}

export function EmptyCart() {
  return (
    <div className="mt-8">
      <p className="text-muted">Your cart is empty.</p>
      <Link href="/shop" className="mt-4 inline-block text-sm underline">
        Go to the shop
      </Link>
    </div>
  );
}
