/* The cart link in the header. It shows the number of items in the cart. */
"use client";

import Link from "next/link";
import { useCart } from "./cart";

export function CartCount() {
  const count = (useCart() ?? []).reduce((sum, l) => sum + l.qty, 0);
  return (
    <Link href="/cart" className="hover:underline">
      Cart{count > 0 && ` (${count})`}
    </Link>
  );
}
