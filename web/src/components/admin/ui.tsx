/*
 * Small parts that all admin pages use.
 * Keep them plain: text, lines and one accent colour for main actions.
 */
import { STATUS_LABEL, type OrderStatus } from "@/lib/api";

export const input =
  "w-full rounded border border-line bg-surface px-2.5 py-1.5 text-sm text-ink focus:border-ink focus:outline-none";
export const button =
  "rounded border border-line bg-surface px-3 py-1.5 text-sm text-ink hover:border-ink disabled:opacity-50";
export const primary =
  "rounded border border-accent bg-accent px-3 py-1.5 text-sm text-accent-ink hover:opacity-90 disabled:opacity-50";
export const danger =
  "rounded border border-danger bg-surface px-3 py-1.5 text-sm text-danger hover:bg-danger hover:text-accent-ink disabled:opacity-50";

/* Show an API time in local time, for example "24 Nov 2026, 14:05". */
export function when(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Status({ status }: { status: OrderStatus }) {
  return <span className="font-semibold">{STATUS_LABEL[status]}</span>;
}

/* Show the error, or a loading line while the request is in progress. */
export function Wait({ error }: { error?: string }) {
  return error ? <p className="text-danger">{error}</p> : <p className="text-muted">Loading…</p>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-muted">{label}</span>
      {children}
    </label>
  );
}

/* The table scrolls inside its own box. Thus, the page does not scroll sideways on a phone. */
export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded border border-line bg-surface">
      <table className="w-full whitespace-nowrap text-sm [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-medium [&_th]:text-muted [&_tr]:border-b [&_tr]:border-line [&_tbody_tr:last-child]:border-0">
        {children}
      </table>
    </div>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  return <h1 className="mb-4 text-xl font-semibold">{children}</h1>;
}
