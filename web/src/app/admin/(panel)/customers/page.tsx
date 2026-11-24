/*
 * Customer list with search. The URL keeps the search text.
 * The API sorts customers by their last order, newest first.
 */
"use client";

import Form from "next/form";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { CustomerRow } from "@/lib/api";
import { money } from "@/lib/config";
import { useLoad } from "@/components/admin/use-load";
import { button, input, Table, Title, Wait, when } from "@/components/admin/ui";

export default function CustomersPage() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const { data, error } = useLoad<CustomerRow[]>(
    `/api/admin/customers${q ? `?${new URLSearchParams({ q })}` : ""}`,
  );

  return (
    <>
      <Title>Customers</Title>
      <Form key={q} action="/admin/customers" className="mb-4 flex gap-2 sm:max-w-md">
        <input
          name="q"
          defaultValue={q}
          placeholder="Name, phone or email"
          aria-label="Search customers"
          className={input}
        />
        <button className={button}>Search</button>
      </Form>

      {!data ? (
        <Wait error={error} />
      ) : data.length === 0 ? (
        <p className="text-muted">No customers.</p>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>City</th>
              <th className="text-right!">Orders</th>
              <th className="text-right!">Lifetime value</th>
              <th>Last order</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link
                    href={`/admin/customers/${c.id}`}
                    className="font-medium underline underline-offset-2"
                  >
                    {c.name}
                  </Link>
                </td>
                <td>{c.phone}</td>
                <td>{c.email}</td>
                <td>{c.city}</td>
                <td className="text-right">{c.order_count}</td>
                <td className="text-right">{money(c.lifetime_value)}</td>
                <td>{c.last_order_at ? when(c.last_order_at) : "None"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
