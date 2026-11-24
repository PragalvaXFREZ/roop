/*
 * Page to add a product. After the first save, the edit page opens. There, staff can add images.
 */
import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { Title } from "@/components/admin/ui";

export default function NewProductPage() {
  return (
    <>
      <p className="mb-1 text-sm">
        <Link href="/admin/products" className="text-muted hover:text-ink">
          Products
        </Link>
      </p>
      <Title>New product</Title>
      <ProductForm />
    </>
  );
}
