/*
 * Table of orders. The dashboard, the order list and the customer profile use it.
 */
import Link from "next/link";
import type { OrderRow } from "@/lib/api";
import { money } from "@/lib/config";
import { Status, Table, when } from "./ui";

export function OrderTable({ orders }: { orders: OrderRow[] }) {
  if (orders.length === 0) return <p className="text-muted">No orders.</p>;
  return (
    <Table>
      <thead>
        <tr>
          <th>Number</th>
          <th>Date</th>
          <th>Customer</th>
          <th>Phone</th>
          <th>City</th>
          <th className="text-right!">Total</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o) => (
          <tr key={o.id}>
            <td>
              <Link
                href={`/admin/orders/${o.id}`}
                className="font-medium underline underline-offset-2"
              >
                {o.number}
              </Link>
            </td>
            <td>{when(o.created_at)}</td>
            <td>{o.name}</td>
            <td>{o.phone}</td>
            <td>{o.city}</td>
            <td className="text-right">{money(o.total)}</td>
            <td>
              <Status status={o.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
