/*
 * Product list, including drafts. The stock is the total of all variants.
 */
"use client";

import Link from "next/link";
import type { AdminProduct } from "@/lib/api";
import { money } from "@/lib/config";
import { useLoad } from "@/components/admin/use-load";
import { primary, Table, Title, Wait } from "@/components/admin/ui";

export default function ProductsPage() {
  const { data, error } = useLoad<AdminProduct[]>("/api/admin/products");

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <Title>Products</Title>
        <Link href="/admin/products/new" className={primary}>
          New product
        </Link>
      </div>
      {!data ? (
        <Wait error={error} />
      ) : data.length === 0 ? (
        <p className="text-muted">No products.</p>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>State</th>
              <th className="text-right!">Price</th>
              <th className="text-right!">Stock</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="font-medium underline underline-offset-2"
                  >
                    {p.name}
                  </Link>
                </td>
                <td>{p.category?.name}</td>
                <td>
                  {p.is_published ? "Published" : "Draft"}
                  {p.is_featured && ", featured"}
                </td>
                <td className="text-right">{money(p.price)}</td>
                <td className="text-right">{p.variants.reduce((sum, v) => sum + v.stock, 0)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
