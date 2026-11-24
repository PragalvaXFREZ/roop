/*
 * Order list with filters and pages.
 * The URL keeps the filters and the page number. Thus, staff can share and reload a filtered list.
 */
"use client";

import Form from "next/form";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { STATUS_LABEL, type OrderRow, type OrderStatus } from "@/lib/api";
import { OrderTable } from "@/components/admin/order-table";
import { useLoad } from "@/components/admin/use-load";
import { button, Field, input, primary, Title, Wait } from "@/components/admin/ui";

const PAGE_SIZE = 25;

/* Change a "YYYY-MM-DD" date to local midnight, as a UTC time. Add days to move the date. */
function midnight(date: string, addDays = 0): string {
  const d = new Date(`${date}T00:00`);
  d.setDate(d.getDate() + addDays);
  return d.toISOString();
}

export default function OrdersPage() {
  const params = useSearchParams();
  const status = params.get("status") ?? "";
  const q = params.get("q") ?? "";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);

  // Send only the filters that have a value. The API rejects an empty status or date.
  // The API end time is exclusive. Thus, send the midnight after the "to" date.
  const query = new URLSearchParams({ page: String(page) });
  if (status) query.set("status", status);
  if (q) query.set("q", q);
  if (from) query.set("date_from", midnight(from));
  if (to) query.set("date_to", midnight(to, 1));
  const { data, error } = useLoad<{ items: OrderRow[]; total: number }>(
    `/api/admin/orders?${query}`,
  );

  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  function pageLink(n: number) {
    const next = new URLSearchParams(params);
    next.set("page", String(n));
    return `/admin/orders?${next}`;
  }

  return (
    <>
      <Title>Orders</Title>
      {/* The key resets the fields when the URL changes, for example after "Clear". */}
      <Form
        key={params.toString()}
        action="/admin/orders"
        className="mb-4 grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap"
      >
        <Field label="Status">
          <select name="status" defaultValue={status} className={input}>
            <option value="">All</option>
            {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>
        <div className="col-span-2 sm:w-64">
          <Field label="Search">
            <input
              name="q"
              defaultValue={q}
              placeholder="Name, phone, email or RP-00012"
              className={input}
            />
          </Field>
        </div>
        <Field label="From">
          <input type="date" name="from" defaultValue={from} className={input} />
        </Field>
        <Field label="To">
          <input type="date" name="to" defaultValue={to} className={input} />
        </Field>
        <div className="col-span-2 flex gap-2">
          <button className={primary}>Apply</button>
          <Link href="/admin/orders" className={button}>
            Clear
          </Link>
        </div>
      </Form>

      {!data ? (
        <Wait error={error} />
      ) : (
        <>
          <OrderTable orders={data.items} />
          <div className="mt-3 flex items-center gap-3 text-sm">
            <span className="text-muted">
              {data.total} {data.total === 1 ? "order" : "orders"}. Page {page} of {pages}.
            </span>
            {page > 1 && (
              <Link href={pageLink(page - 1)} className={button}>
                Previous
              </Link>
            )}
            {page < pages && (
              <Link href={pageLink(page + 1)} className={button}>
                Next
              </Link>
            )}
          </div>
        </>
      )}
    </>
  );
}
