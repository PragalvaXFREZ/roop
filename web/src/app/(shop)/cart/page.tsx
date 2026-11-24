/* Cart page. The cart is in the browser, so a client component shows it. */
import type { Metadata } from "next";
import { CartView } from "@/components/shop/CartView";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-10 sm:px-6">
      <h1 className="font-display text-5xl font-semibold">Cart</h1>
      <CartView />
    </div>
  );
}
