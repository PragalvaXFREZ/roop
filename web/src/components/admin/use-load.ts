/*
 * Load data from the API when a page opens.
 * The hook gives the data or an error message. If both are empty, the request is in progress.
 * A 401 response sends the admin to the sign-in page.
 * Next.js hides a page when staff leave it. When the page shows again, the hook loads the data again.
 */
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

type Result<T> = { path: string; data?: T; error?: string };

export function useLoad<T>(path: string) {
  const router = useRouter();
  const [result, setResult] = useState<Result<T>>();

  useEffect(() => {
    // Ignore a response that arrives after the path changes.
    let live = true;
    api<T>(path).then(
      (data) => live && setResult({ path, data }),
      (e: Error) => {
        if (!live) return;
        if (e instanceof ApiError && e.status === 401) router.replace("/admin/login");
        else setResult({ path, error: e.message });
      },
    );
    return () => {
      live = false;
    };
  }, [path, router]);

  // Do not show the data of the previous path.
  const current = result?.path === path ? result : undefined;
  return {
    data: current?.data,
    error: current?.error,
    set: (data: T) => setResult({ path, data }),
  };
}
