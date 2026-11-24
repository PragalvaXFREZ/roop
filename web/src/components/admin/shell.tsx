/*
 * Admin frame: navigation, the signed-in admin and the sign-out button.
 * The frame asks the API for the current admin first.
 * It shows the page only after the API accepts the session.
 */
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api, type Admin } from "@/lib/api";
import { BRAND } from "@/lib/config";
import { useLoad } from "./use-load";
import { Wait } from "./ui";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/products", label: "Products" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const { data: admin, error } = useLoad<Admin>("/api/admin/me");
  const pathname = usePathname();
  const router = useRouter();

  if (!admin) {
    return (
      <div className="p-4">
        <Wait error={error} />
      </div>
    );
  }

  async function signOut() {
    await api("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-surface px-4 py-3 md:w-52 md:shrink-0 md:flex-col md:items-stretch md:border-r md:border-b-0 md:py-5">
        <p className="font-semibold">{BRAND} admin</p>
        <nav className="order-last flex w-full gap-4 text-sm md:order-none md:flex-col md:gap-1 md:mt-4">
          {LINKS.map((link) => {
            const active =
              link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? "font-semibold text-ink" : "text-muted hover:text-ink"}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm md:mt-auto md:ml-0 md:flex-col md:items-start md:gap-1">
          <span className="text-muted">{admin.name}</span>
          <button onClick={signOut} className="text-ink underline underline-offset-2">
            Sign out
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-5 md:px-6">{children}</main>
    </div>
  );
}
