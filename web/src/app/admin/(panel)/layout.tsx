/*
 * Frame for the admin pages that need a session.
 * The sign-in page is outside this group. Thus, the session check does not apply to it.
 *
 * The frame and the pages read the URL in the browser.
 * The Suspense boundary lets the build prerender the routes with dynamic segments.
 */
import { Suspense } from "react";
import { Shell } from "@/components/admin/shell";

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<p className="p-4 text-muted">Loading…</p>}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
