/*
 * Receipt store.
 * Checkout keeps the receipt in sessionStorage, and the confirmation page reads it.
 * The receipt stays in this tab only. In other tabs, the customer uses the track page.
 */
import { useSyncExternalStore } from "react";
import type { OrderReceipt } from "@/lib/api";

const key = (number: string) => `roop-receipt:${number}`;

export function saveReceipt(receipt: OrderReceipt) {
  sessionStorage.setItem(key(receipt.number), JSON.stringify(receipt));
}

/* The receipt does not change in this tab. Thus, subscribe does nothing. */
const subscribe = () => () => {};

/*
 * Get the stored text of the receipt.
 * The value is undefined on the server and null if this tab has no receipt.
 * A string has a stable identity, so useSyncExternalStore can compare it.
 */
export function useReceiptText(number: string): string | null | undefined {
  return useSyncExternalStore(
    subscribe,
    () => sessionStorage.getItem(key(number)),
    () => undefined,
  );
}
