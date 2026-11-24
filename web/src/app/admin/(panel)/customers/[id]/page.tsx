/*
 * One customer: profile, order history, lifetime value and internal notes.
 * The order count and the lifetime value do not include cancelled orders.
 */
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { CustomerDetail } from "@/lib/api";
import { money } from "@/lib/config";
import { Notes } from "@/components/admin/notes";
import { OrderTable } from "@/components/admin/order-table";
import { useLoad } from "@/components/admin/use-load";
import { Title, Wait, when } from "@/components/admin/ui";

export default function CustomerPage() {
  const { id } = useParams<{ id: string }>();
  const { data: c, error, set } = useLoad<CustomerDetail>(`/api/admin/customers/${id}`);
  if (!c) return <Wait error={error} />;

  return (
    <>
      <p className="mb-1 text-sm">
        <Link href="/admin/customers" className="text-muted hover:text-ink">
          Customers
        </Link>
      </p>
      <Title>{c.name}</Title>

      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        <div className="min-w-0 space-y-8">
          <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-1 text-sm [&_dt]:text-muted">
            <dt>Phone</dt>
            <dd>{c.phone}</dd>
            <dt>Email</dt>
            <dd className="break-all">{c.email || "None"}</dd>
            <dt>Address</dt>
            <dd className="whitespace-pre-wrap">{c.address}</dd>
            <dt>City</dt>
            <dd>{c.city}</dd>
            <dt>Customer since</dt>
            <dd>{when(c.created_at)}</dd>
            <dt>Orders</dt>
            <dd>{c.order_count}</dd>
            <dt>Lifetime value</dt>
            <dd className="font-semibold">{money(c.lifetime_value)}</dd>
          </dl>
          <section>
            <h2 className="mb-2 font-semibold">Order history</h2>
            <OrderTable orders={c.orders} />
          </section>
        </div>
        <div className="min-w-0">
          <Notes
            notes={c.notes}
            path={`/api/admin/customers/${c.id}/notes`}
            onAdd={(note) => set({ ...c, notes: [note, ...c.notes] })}
          />
        </div>
      </div>
    </>
  );
}
