/* Checkout page. The form reads the cart in the browser. */
import type { Metadata } from "next";
import { CheckoutForm } from "@/components/shop/CheckoutForm";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-10 sm:px-6">
      <h1 className="font-display text-5xl font-semibold">Checkout</h1>
      <CheckoutForm />
    </div>
  );
}
