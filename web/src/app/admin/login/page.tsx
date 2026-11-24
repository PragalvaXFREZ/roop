/*
 * Admin sign-in.
 * The API sets the session cookie. Then the page opens the dashboard.
 */
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { BRAND } from "@/lib/config";
import { Field, input, primary } from "@/components/admin/ui";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      // Next.js keeps this page hidden after sign-in. Clear it for the next sign-in.
      formElement.reset();
      router.replace("/admin");
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  }

  return (
    <main className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="mb-6 text-xl font-semibold">{BRAND} admin</h1>
      <form onSubmit={submit} className="space-y-4 rounded border border-line bg-surface p-5">
        <Field label="Email">
          <input name="email" type="email" required autoComplete="username" className={input} />
        </Field>
        <Field label="Password">
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={input}
          />
        </Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button disabled={busy} className={`${primary} w-full`}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
