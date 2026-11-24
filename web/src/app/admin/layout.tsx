/*
 * Settings for all admin pages, including the sign-in page.
 * Search engines must not index the admin panel.
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
