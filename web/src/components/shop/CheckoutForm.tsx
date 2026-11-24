/*
 * Checkout form.
 * The form sends variant ids and quantities only. The server calculates the total.
 * The checks here are the same as the checks in the API (api/app/schemas.py, OrderIn).
 * If the server rejects the order, the form shows the server message.
 */
"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { api, ApiError, type OrderIn, type OrderReceipt } from "@/lib/api";
import { clearCart, useCart } from "./cart";
import { EmptyCart } from "./CartView";
import { ItemList } from "./ItemList";
import { saveReceipt } from "./savedReceipt";

type Field = "name" | "phone" | "email" | "address" | "city" | "note";
type Values = Record<Field, string>;
type Errors = Partial<Record<Field, string>>;

function validate(v: Values): Errors {
  const errors: Errors = {};
  const digits = v.phone.replace(/\D/g, "");
  if (v.name.length < 2 || v.name.length > 120) errors.name = "Enter your name (2 to 120 characters).";
  if (digits.length < 7 || digits.length > 15) errors.phone = "Enter a valid phone number.";
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) errors.email = "Enter a valid email, or leave it empty.";
  if (v.address.length < 5 || v.address.length > 500) errors.address = "Enter your full address (5 to 500 characters).";
  if (v.city.length < 2 || v.city.length > 80) errors.city = "Enter your city.";
  if (v.note.length > 1000) errors.note = "Keep the note to 1000 characters or fewer.";
  return errors;
}

const INPUT = "mt-1 w-full rounded-sm border bg-surface px-3 py-2";

export function CheckoutForm() {
  const cart = useCart();
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);
  /* After success, the cart is empty. This flag stops the "empty cart" text before the next page shows. */
  const [placed, setPlaced] = useState(false);

  /*
   * Next.js keeps a hidden page and its state after the customer leaves it.
   * Thus, reset the flags when the page goes hidden. Then a return visit shows the form.
   */
  useLayoutEffect(
    () => () => {
      setPlaced(false);
      setBusy(false);
    },
    [],
  );

  if (placed) return <p className="mt-8 text-muted">Opening your receipt…</p>;
  if (!cart) return <div className="mt-8 h-64 bg-line" aria-hidden />;
  if (cart.length === 0) return <EmptyCart />;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cart) return;
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(
      (["name", "phone", "email", "address", "city", "note"] as const).map((f) => [f, String(form.get(f) ?? "").trim()]),
    ) as Values;
    const found = validate(values);
    setErrors(found);
    setServerError("");
    if (Object.keys(found).length > 0) return;

    /* The API rejects an empty email. Send null if the customer gives no email. */
    const order: OrderIn = {
      ...values,
      email: values.email || null,
      items: cart.map((l) => ({ variant_id: l.variant_id, quantity: l.qty })),
    };
    setBusy(true);
    try {
      const receipt = await api<OrderReceipt>("/api/orders", { method: "POST", body: JSON.stringify(order) });
      saveReceipt(receipt);
      setPlaced(true);
      clearCart();
      /* Replace the history entry, so that the back button does not open checkout again. */
      router.replace(`/order/${receipt.number}`);
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : "We could not send your order. Check your connection and try again.");
      setBusy(false);
    }
  }

  const subtotal = cart.reduce((sum, l) => sum + l.price * l.qty, 0);
  const items = cart.map((l) => ({
    product_name: l.name,
    size: l.size,
    color: l.color,
    unit_price: l.price,
    quantity: l.qty,
  }));

  return (
    <div className="mt-8 grid gap-10 md:grid-cols-[1fr_340px]">
      {/* On phones, the summary comes first. On wide screens, it is on the right. */}
      <aside className="md:order-last">
        <h2 className="text-sm font-medium">Your order</h2>
        <div className="mt-3">
          <ItemList items={items} total={subtotal} totalLabel="Subtotal" />
        </div>
      </aside>
      <form onSubmit={submit} noValidate className="space-y-5">
        <Input name="name" label="Full name" autoComplete="name" error={errors.name} />
        <Input name="phone" label="Phone" type="tel" autoComplete="tel" error={errors.phone} hint="We call this number to confirm the order." />
        <Input name="email" label="Email (optional)" type="email" autoComplete="email" error={errors.email} />
        <Input name="address" label="Address" autoComplete="street-address" error={errors.address} multiline />
        <Input name="city" label="City" autoComplete="address-level2" error={errors.city} />
        <Input name="note" label="Note (optional)" error={errors.note} multiline hint="For example, a good time to call." />

        {serverError && (
          <p role="alert" className="border-l-2 border-danger pl-3 text-sm text-danger">
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-sm bg-accent px-6 py-3 text-sm font-medium text-accent-ink hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Placing order…" : "Place order"}
        </button>
        <p className="text-sm text-muted">You pay in cash on delivery. We call you to confirm before we start.</p>
      </form>

    </div>
  );
}

function Input({
  name,
  label,
  error,
  hint,
  multiline,
  ...rest
}: {
  name: Field;
  label: string;
  error?: string;
  hint?: string;
  multiline?: boolean;
  type?: string;
  autoComplete?: string;
}) {
  const props = {
    id: name,
    name,
    "aria-invalid": !!error,
    "aria-describedby": error ? `${name}-error` : undefined,
    className: `${INPUT} ${error ? "border-danger" : "border-line"}`,
    ...rest,
  };
  return (
    <div className="text-sm">
      <label htmlFor={name}>{label}</label>
      {multiline ? <textarea rows={3} {...props} /> : <input {...props} />}
      {error ? (
        <p id={`${name}-error`} className="mt-1 text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-muted">{hint}</p>
      )}
    </div>
  );
}
