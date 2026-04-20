"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

/**
 * PostHogProvider — initializes PostHog on mount, captures pageviews on route changes.
 *
 * Autocapture is on (default), so clicks + form submits get tagged automatically.
 * Custom events can be added later via `posthog.capture('event_name', { props })`.
 *
 * Configured via env:
 *   NEXT_PUBLIC_POSTHOG_KEY — project API key (required, else init is skipped silently)
 *   NEXT_PUBLIC_POSTHOG_HOST — optional, defaults to https://us.i.posthog.com
 *
 * Note: we skip init when the env var is missing, so the build keeps working in dev
 * without PostHog set up. Production requires both env vars on Vercel.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    if (typeof window === "undefined") return;
    if ((window as any).__posthog_initialized) return;

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      capture_pageview: false, // we capture manually on route change below
      capture_pageleave: true,
      autocapture: true,
      persistence: "localStorage+cookie",
    });

    (window as any).__posthog_initialized = true;
  }, []);

  // Capture SPA pageviews on client-side route changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!(window as any).__posthog_initialized) return;
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return <>{children}</>;
}
