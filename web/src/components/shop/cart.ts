/*
 * Cart store.
 * The cart lives in localStorage, so it stays in this browser only.
 * Components read the cart with useCart and change it with the functions below.
 * The server gets variant ids and quantities only. It calculates the prices again.
 */
import { useSyncExternalStore } from "react";

export type CartLine = {
  variant_id: number;
  slug: string;
  name: string;
  size: string;
  color: string;
  price: number;
  image: string | null;
  qty: number;
};

/* The API accepts 1 to 20 of each item in one order. */
export const MAX_QTY = 20;

const KEY = "roop-cart";
const EMPTY: CartLine[] = [];
const listeners = new Set<() => void>();

/*
 * useSyncExternalStore needs the same array until the cart changes.
 * Thus, parse the stored text again only when the text changes.
 */
let raw: string | null = null;
let lines = EMPTY;

function read(): CartLine[] {
  const next = localStorage.getItem(KEY);
  if (next !== raw) {
    raw = next;
    try {
      lines = next ? JSON.parse(next) : EMPTY;
    } catch {
      lines = EMPTY;
    }
  }
  return lines;
}

function write(next: CartLine[]) {
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}

/* The storage event tells this tab about changes in other tabs. */
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/* The server has no cart. It renders an empty cart, and the browser fills it in. */
export function useCart(): CartLine[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/* Add the line, or add to its quantity. Do not go above the stock or MAX_QTY. */
export function addToCart(line: Omit<CartLine, "qty">, stock: number) {
  const cart = read();
  const found = cart.find((l) => l.variant_id === line.variant_id);
  const limit = Math.min(stock, MAX_QTY);
  if (found) {
    write(cart.map((l) => (l === found ? { ...l, qty: Math.min(l.qty + 1, limit) } : l)));
  } else {
    write([...cart, { ...line, qty: 1 }]);
  }
}

export function setQty(variantId: number, qty: number) {
  const clamped = Math.max(1, Math.min(qty, MAX_QTY));
  write(read().map((l) => (l.variant_id === variantId ? { ...l, qty: clamped } : l)));
}

export function removeLine(variantId: number) {
  write(read().filter((l) => l.variant_id !== variantId));
}

export function clearCart() {
  write(EMPTY);
}
