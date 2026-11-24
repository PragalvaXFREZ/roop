/* Read-only list of order items with the total. Checkout, the receipt and tracking use it. */
import type { OrderItem } from "@/lib/api";
import { money } from "@/lib/config";

export function ItemList({ items, total, totalLabel = "Total" }: { items: OrderItem[]; total: number; totalLabel?: string }) {
  return (
    <div className="text-sm">
      <ul className="divide-y divide-line border-y border-line">
        {items.map((item, i) => (
          <li key={i} className="flex justify-between gap-4 py-3">
            <div>
              <p className="font-medium">{item.product_name}</p>
              <p className="text-muted">
                {item.size} · {item.color} · Qty {item.quantity}
              </p>
            </div>
            <p className="shrink-0">{money(item.unit_price * item.quantity)}</p>
          </li>
        ))}
      </ul>
      <p className="flex justify-between py-3 font-medium">
        <span>{totalLabel}</span>
        <span>{money(total)}</span>
      </p>
    </div>
  );
}
