/*
 * Dashboard: order counts, revenue this month, counts by status and the newest orders.
 */
"use client";

import Link from "next/link";
import { STATUS_LABEL, type Dashboard, type OrderStatus } from "@/lib/api";
import { money } from "@/lib/config";
import { OrderTable } from "@/components/admin/order-table";
import { useLoad } from "@/components/admin/use-load";
import { Title, Wait } from "@/components/admin/ui";

export default function DashboardPage() {
  const { data, error } = useLoad<Dashboard>("/api/admin/dashboard");
  if (!data) return <Wait error={error} />;

  const totals = [
    ["Orders today", data.orders_today],
    ["Orders this week", data.orders_week],
    ["Orders this month", data.orders_month],
    ["Revenue this month", money(data.revenue_month)],
  ];

  return (
    <>
      <Title>Dashboard</Title>
      <dl className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded border border-line bg-line lg:grid-cols-4">
        {totals.map(([label, value]) => (
          <div key={label} className="bg-surface px-4 py-3">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="mt-1 text-2xl font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mb-2 font-semibold">Orders by status</h2>
      <ul className="mb-8 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => (
          <li key={s}>
            <Link href={`/admin/orders?status=${s}`} className="hover:underline">
              {STATUS_LABEL[s]}: <span className="font-semibold">{data.by_status[s]}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="font-semibold">Recent orders</h2>
        <Link href="/admin/orders" className="text-sm underline underline-offset-2">
          All orders
        </Link>
      </div>
      <OrderTable orders={data.recent} />
    </>
  );
}
