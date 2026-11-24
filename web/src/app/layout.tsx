/*
 * Root layout for the whole site.
 * The shop and the admin panel add their own headers in their own layouts.
 */
import type { Metadata } from "next";
import { Cormorant_Garamond, IBM_Plex_Sans } from "next/font/google";
import { BRAND } from "@/lib/config";
import "./globals.css";

const body = IBM_Plex_Sans({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600"] });
const display = Cormorant_Garamond({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600"] });

export const metadata: Metadata = {
  title: { default: `${BRAND} · Hand-embroidered clothing`, template: `%s · ${BRAND}` },
  description: "Clothing with hand embroidery, made to order.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
