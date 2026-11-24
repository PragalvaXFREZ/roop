/*
 * Order tracking form.
 * The customer gives the order number and the phone number from the order.
 * The API needs both, so that other people cannot guess an order.
 */
"use client";

import { useState } from "react";
import { api, ApiError, STATUS_FLOW, STATUS_LABEL, type OrderReceipt } from "@/lib/api";
import { ItemList } from "./ItemList";

const INPUT = "mt-1 w-full rounded-sm border border-line bg-surface px-3 py-2";
const DATE = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" });

export function TrackForm({ defaultNumber }: { defaultNumber: string }) {
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const number = String(form.get("number") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    if (!number || phone.replace(/\D/g, "").length < 7) {
      setError("Enter the order number and the phone number from the order.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      setReceipt(await api<OrderReceipt>("/api/orders/track", { method: "POST", body: JSON.stringify({ number, phone }) }));
    } catch (e) {
      setReceipt(null);
      setError(e instanceof ApiError ? e.message : "We could not reach the server. Try again.");
    }
    setBusy(false);
  }

  return (
    <div className="mt-8 grid gap-12 md:grid-cols-[320px_1fr]">
      <form onSubmit={submit} noValidate className="space-y-5 text-sm">
        <label className="block">
          Order number
          <input name="number" defaultValue={defaultNumber} placeholder="RP-00001" autoCapitalize="characters" className={INPUT} />
        </label>
        <label className="block">
          Phone
          <input name="phone" type="tel" autoComplete="tel" className={INPUT} />
        </label>
        {error && (
          <p role="alert" className="border-l-2 border-danger pl-3 text-danger">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-sm bg-accent px-6 py-3 font-medium text-accent-ink hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Looking…" : "Track order"}
        </button>
      </form>

      {receipt && <Status receipt={receipt} />}
    </div>
  );
}

function Status({ receipt }: { receipt: OrderReceipt }) {
  /* The status events give the date of each step. A later event for the same status replaces an earlier one. */
  const reached = new Map(receipt.events.map((e) => [e.status, e.created_at]));
  const current = STATUS_FLOW.indexOf(receipt.status);

  return (
    <section aria-live="polite">
      <h2 className="font-display text-3xl font-semibold">{receipt.number}</h2>
      <p className="mt-1 text-sm text-muted">Placed {DATE.format(new Date(receipt.created_at))}</p>

      {receipt.status === "cancelled" ? (
        <p className="mt-6 text-danger">This order was cancelled. Call us if you have a question.</p>
      ) : (
        <ol className="mt-6 space-y-4">
          {STATUS_FLOW.map((status, i) => {
            const done = i <= current;
            const date = reached.get(status);
            return (
              <li key={status} className="flex items-baseline gap-3">
                <span className={`h-2.5 w-2.5 shrink-0 border ${done ? "border-accent bg-accent" : "border-line"}`} />
                <span className={done ? "" : "text-muted"}>
                  {STATUS_LABEL[status]}
                  {i === current && " (now)"}
                </span>
                {done && date && <span className="ml-auto text-sm text-muted">{DATE.format(new Date(date))}</span>}
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-10">
        <ItemList items={receipt.items} total={receipt.total} />
      </div>
    </section>
  );
}
