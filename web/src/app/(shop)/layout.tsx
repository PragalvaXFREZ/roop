/*
 * Shop layout.
 * All public pages use this header and footer.
 * The contact details and social links are placeholders. Replace them before launch.
 */
import Link from "next/link";
import { CartCount } from "@/components/shop/CartCount";
import { BRAND } from "@/lib/config";

const SOCIAL = ["Instagram", "Facebook", "TikTok"];

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="font-display text-3xl font-semibold leading-none">
            {BRAND}
          </Link>
          <nav className="flex gap-5 text-sm">
            <Link href="/shop" className="hover:underline">
              Shop
            </Link>
            <Link href="/track" className="hover:underline">
              Track order
            </Link>
            <CartCount />
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-24 border-t border-line bg-surface">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 text-sm sm:grid-cols-3 sm:px-6">
          <div>
            <p className="font-display text-2xl font-semibold">{BRAND}</p>
            <p className="mt-2 text-muted">Hand-embroidered clothing, made to order.</p>
          </div>
          <div>
            <p className="font-medium">Contact</p>
            <p className="mt-2 text-muted">+977 980-0000000</p>
            <p className="text-muted">hello@example.com</p>
          </div>
          <div>
            <p className="font-medium">Follow</p>
            <ul className="mt-2 space-y-1 text-muted">
              {SOCIAL.map((name) => (
                <li key={name}>
                  <a href="#" className="hover:text-ink hover:underline">
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>
    </>
  );
}
