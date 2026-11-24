/*
 * One order: items, contact details, status, timeline and internal notes.
 * Each change goes to the API. The page then shows the order that the API sends back.
 */
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { api, STATUS_FLOW, STATUS_LABEL, type OrderDetail, type OrderStatus } from "@/lib/api";
import { money } from "@/lib/config";
import { Notes } from "@/components/admin/notes";
import { useLoad } from "@/components/admin/use-load";
import {
  button,
  danger,
  Field,
  input,
  primary,
  Status,
  Table,
  Title,
  Wait,
  when,
} from "@/components/admin/ui";

/* The API does not let staff change a delivered or cancelled order. */
const FINAL: OrderStatus[] = ["delivered", "cancelled"];

type Change = (order: OrderDetail) => void;

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, error, set } = useLoad<OrderDetail>(`/api/admin/orders/${id}`);
  if (!order) return <Wait error={error} />;

  return (
    <>
      <p className="mb-1 text-sm">
        <Link href="/admin/orders" className="text-muted hover:text-ink">
          Orders
        </Link>
      </p>
      <Title>
        {order.number} · <Status status={order.status} />
      </Title>
      <p className="-mt-3 mb-5 text-sm text-muted">Placed {when(order.created_at)}</p>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0 space-y-8">
          <Items order={order} />
          {order.customer_note && (
            <section>
              <h2 className="mb-2 font-semibold">Customer note</h2>
              <p className="whitespace-pre-wrap rounded border border-line bg-surface px-3 py-2 text-sm">
                {order.customer_note}
              </p>
            </section>
          )}
          <Timeline order={order} />
        </div>
        <div className="min-w-0 space-y-8">
          <StatusControl order={order} onChange={set} />
          <Contact order={order} onChange={set} />
          <Notes
            notes={order.notes}
            path={`/api/admin/orders/${order.id}/notes`}
            onAdd={(note) => set({ ...order, notes: [note, ...order.notes] })}
          />
        </div>
      </div>
    </>
  );
}

function Items({ order }: { order: OrderDetail }) {
  return (
    <section>
      <h2 className="mb-2 font-semibold">Items</h2>
      <Table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Size</th>
            <th>Colour</th>
            <th className="text-right!">Qty</th>
            <th className="text-right!">Price</th>
            <th className="text-right!">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, i) => (
            <tr key={i}>
              <td>{item.product_name}</td>
              <td>{item.size}</td>
              <td>{item.color}</td>
              <td className="text-right">{item.quantity}</td>
              <td className="text-right">{money(item.unit_price)}</td>
              <td className="text-right">{money(item.unit_price * item.quantity)}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={5} className="text-right font-semibold">
              Total
            </td>
            <td className="text-right font-semibold">{money(order.total)}</td>
          </tr>
        </tbody>
      </Table>
    </section>
  );
}

/*
 * The main button moves the order to the next step in STATUS_FLOW.
 * The list sets any other status that is not final.
 * Cancel asks for a second click, because it is final and returns the stock.
 */
function StatusControl({ order, onChange }: { order: OrderDetail; onChange: Change }) {
  const [other, setOther] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Next.js keeps the state of a hidden page. Close the confirm step when staff leave the page.
  useLayoutEffect(() => () => setConfirm(false), []);

  const final = FINAL.includes(order.status);
  const next = final ? undefined : STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];
  const others = STATUS_FLOW.filter((s) => !FINAL.includes(s) && s !== order.status && s !== next);

  async function change(status: OrderStatus) {
    setBusy(true);
    setError("");
    try {
      onChange(
        await api<OrderDetail>(`/api/admin/orders/${order.id}/status`, {
          method: "POST",
          body: JSON.stringify({ status }),
        }),
      );
      setOther("");
      setConfirm(false);
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  }

  return (
    <section>
      <h2 className="mb-2 font-semibold">Status</h2>
      <fieldset disabled={final || busy} className="space-y-3">
        {final && (
          <p className="text-sm text-muted">
            This order is {STATUS_LABEL[order.status].toLowerCase()}. You cannot change the status.
          </p>
        )}
        {next && (
          <button onClick={() => change(next)} className={primary}>
            Mark as {STATUS_LABEL[next].toLowerCase()}
          </button>
        )}
        <div className="flex gap-2">
          <select value={other} onChange={(e) => setOther(e.target.value)} className={input}>
            <option value="">Set another status</option>
            {others.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <button onClick={() => change(other as OrderStatus)} disabled={!other} className={button}>
            Set
          </button>
        </div>
        {confirm ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>Cancel this order? The stock goes back. You cannot undo this.</span>
            <button onClick={() => change("cancelled")} className={danger}>
              Yes, cancel order
            </button>
            <button onClick={() => setConfirm(false)} className={button}>
              No
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirm(true)} className={danger}>
            Cancel order
          </button>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
      </fieldset>
    </section>
  );
}

function Timeline({ order }: { order: OrderDetail }) {
  return (
    <section>
      <h2 className="mb-2 font-semibold">Timeline</h2>
      <ol className="divide-y divide-line rounded border border-line bg-surface text-sm">
        {order.events.map((e, i) => (
          <li key={i} className="flex flex-wrap justify-between gap-x-4 px-3 py-2">
            <Status status={e.status} />
            {/* The API places the first event when the customer orders. It has no admin. */}
            <span className="text-muted">
              {when(e.created_at)}, {e.admin ? e.admin.name : "customer"}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* Contact details on this order. The customer profile keeps its own copy. */
function Contact({ order, onChange }: { order: OrderDetail; onChange: Change }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      onChange(
        await api<OrderDetail>(`/api/admin/orders/${order.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: form.get("name"),
            phone: form.get("phone"),
            email: form.get("email") || null,
            address: form.get("address"),
            city: form.get("city"),
          }),
        }),
      );
      setEditing(false);
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  }

  const heading = (
    <div className="mb-2 flex items-baseline justify-between gap-4">
      <h2 className="font-semibold">Contact</h2>
      <Link
        href={`/admin/customers/${order.customer_id}`}
        className="text-sm underline underline-offset-2"
      >
        Customer profile
      </Link>
    </div>
  );

  if (!editing) {
    return (
      <section>
        {heading}
        <dl className="grid grid-cols-[6rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm [&_dt]:text-muted">
          <dt>Name</dt>
          <dd>{order.name}</dd>
          <dt>Phone</dt>
          <dd>{order.phone}</dd>
          <dt>Email</dt>
          <dd className="break-all">{order.email || "None"}</dd>
          <dt>Address</dt>
          <dd className="whitespace-pre-wrap">{order.address}</dd>
          <dt>City</dt>
          <dd>{order.city}</dd>
        </dl>
        <button onClick={() => setEditing(true)} className={`${button} mt-3`}>
          Edit contact
        </button>
      </section>
    );
  }

  return (
    <section>
      {heading}
      <form onSubmit={save} className="space-y-3">
        <Field label="Name">
          <input name="name" defaultValue={order.name} required className={input} />
        </Field>
        <Field label="Phone">
          <input name="phone" defaultValue={order.phone} required className={input} />
        </Field>
        <Field label="Email">
          <input name="email" type="email" defaultValue={order.email ?? ""} className={input} />
        </Field>
        <Field label="Address">
          <textarea
            name="address"
            defaultValue={order.address}
            required
            rows={2}
            className={input}
          />
        </Field>
        <Field label="City">
          <input name="city" defaultValue={order.city} required className={input} />
        </Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex gap-2">
          <button disabled={busy} className={primary}>
            Save
          </button>
          <button type="button" onClick={() => setEditing(false)} className={button}>
            Close
          </button>
        </div>
      </form>
    </section>
  );
}
