/*
 * Brand settings.
 * Change the name or the currency here. Do not change them in other files.
 */
export const BRAND = "Roop";
export const CURRENCY = "NPR";

/* The API keeps money in the smallest unit. 100 units are 1 rupee. */
export function money(units: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: CURRENCY,
    maximumFractionDigits: 0,
  }).format(units / 100);
}
