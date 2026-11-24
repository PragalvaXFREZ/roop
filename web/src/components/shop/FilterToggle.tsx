/*
 * Collapsible filter panel.
 * On phones, the panel is closed until the customer opens it.
 * On wide screens, the panel is always open and the button is hidden.
 */
"use client";

import { useState } from "react";

export function FilterToggle({ active, children }: { active: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full rounded-sm border border-line bg-surface px-4 py-3 text-left text-sm md:hidden"
      >
        {open ? "Hide filters" : "Filters"}
        {active > 0 && <span className="text-muted"> · {active} on</span>}
      </button>
      <div className={`${open ? "block" : "hidden"} md:block`}>{children}</div>
    </>
  );
}
