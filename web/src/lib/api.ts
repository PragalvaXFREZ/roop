/*
 * API client and response types.
 * The types match api/app/schemas.py. Change both files together.
 *
 * In the browser, requests go to /api on the same origin.
 * On the server, requests go to API_URL directly.
 */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "in_production"
  | "shipped"
  | "delivered"
  | "cancelled";

export const STATUS_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "in_production",
  "shipped",
  "delivered",
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_production: "In production",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export type Category = { id: number; name: string; slug: string };
export type Variant = { id: number; size: string; color: string; stock: number };
export type Image = { id: number; url: string };

export type ProductCard = {
  id: number;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  category: Category | null;
};

export type ProductDetail = ProductCard & {
  description: string;
  embroidery: string;
  fabric: string;
  care: string;
  variants: Variant[];
  images: Image[];
};

export type CatalogFilters = { categories: Category[]; sizes: string[]; colors: string[] };

export type OrderItem = {
  product_name: string;
  size: string;
  color: string;
  unit_price: number;
  quantity: number;
};

export type StatusEvent = { status: OrderStatus; created_at: string };

export type OrderReceipt = {
  number: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  items: OrderItem[];
  events: StatusEvent[];
};

export type OrderIn = {
  name: string;
  phone: string;
  email?: string | null;
  address: string;
  city: string;
  note?: string;
  items: { variant_id: number; quantity: number }[];
};

export type Admin = { id: number; email: string; name: string };
export type Note = { id: number; body: string; created_at: string; admin: Admin };

export type OrderRow = {
  id: number;
  number: string;
  status: OrderStatus;
  name: string;
  phone: string;
  city: string;
  total: number;
  created_at: string;
};

export type OrderDetail = OrderRow & {
  customer_id: number;
  email: string | null;
  address: string;
  customer_note: string;
  items: OrderItem[];
  events: (StatusEvent & { admin: Admin | null })[];
  notes: Note[];
};

export type CustomerRow = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  city: string;
  order_count: number;
  lifetime_value: number;
  last_order_at: string | null;
};

export type CustomerDetail = CustomerRow & {
  address: string;
  created_at: string;
  orders: OrderRow[];
  notes: Note[];
};

export type ProductIn = {
  name: string;
  slug: string;
  description: string;
  embroidery: string;
  fabric: string;
  care: string;
  price: number;
  category_id: number | null;
  is_published: boolean;
  is_featured: boolean;
  variants: { id?: number; size: string; color: string; stock: number }[];
};

export type AdminProduct = ProductDetail & {
  category_id: number | null;
  is_published: boolean;
  is_featured: boolean;
};

export type Dashboard = {
  orders_today: number;
  orders_week: number;
  orders_month: number;
  revenue_month: number;
  by_status: Record<OrderStatus, number>;
  recent: OrderRow[];
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const BASE = typeof window === "undefined" ? (process.env.API_URL ?? "http://127.0.0.1:8000") : "";

/* Send a request. Throw ApiError with the server message if the request fails. */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm = init.body instanceof FormData;
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: isForm ? init.headers : { "Content-Type": "application/json", ...init.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = body?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: { loc: string[]; msg: string }) => `${d.loc.at(-1)}: ${d.msg}`).join(". ")
          : "Something went wrong. Try again.";
    throw new ApiError(res.status, message);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}
