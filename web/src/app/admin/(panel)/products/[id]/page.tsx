/*
 * Page to edit a product, its variants and its images.
 */
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { AdminProduct } from "@/lib/api";
import { ProductForm } from "@/components/admin/product-form";
import { useLoad } from "@/components/admin/use-load";
import { Title, Wait } from "@/components/admin/ui";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const { data, error } = useLoad<AdminProduct>(`/api/admin/products/${id}`);

  return (
    <>
      <p className="mb-1 text-sm">
        <Link href="/admin/products" className="text-muted hover:text-ink">
          Products
        </Link>
      </p>
      <Title>Edit product</Title>
      {data ? <ProductForm key={data.id} product={data} /> : <Wait error={error} />}
    </>
  );
}
