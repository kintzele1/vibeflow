"use client";

import { useEffect } from "react";

/**
 * GoogleAnalytics — pure client-side GA4 loader.
 *
 * Why this exists instead of @next/third-parties or next/script:
 * On Apr 21 2026, both approaches placed in the root `layout.tsx` caused
 * Next.js 16.2.3 + Turbopack to return 403 on static chunks for /login and
 * /dashboard routes. Root cause unconfirmed, but reproducible.
 *
 * This implementation sidesteps the whole problem:
 *   - No <Script> component. Just a vanilla `<script>` injected into <head>
 *     via DOM API after hydration.
 *   - Renders nothing. Returns null.
 *   - Mount it in a client leaf component (e.g. landing page `page.tsx`),
 *     NOT in the root layout. Keeps the suspected interaction off the table.
 *
 * Skips silently when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is unset so dev and
 * preview environments keep working without configuration.
 */
export function GoogleAnalytics() {
  useEffect(() => {
    const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    if (!gaId) return;
    if (typeof window === "undefined") return;
    // Guard against re-init if this component remounts during SPA navigation
    if ((window as any).__vf_ga4_initialized) return;
    (window as any).__vf_ga4_initialized = true;

    // 1. Load gtag.js async from Google
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    // 2. Initialize dataLayer + gtag function
    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(..._args: unknown[]) {
      (window as any).dataLayer.push(arguments);
    }
    (window as any).gtag = gtag;

    // 3. Register the property and fire the initial pageview
    gtag("js", new Date());
    gtag("config", gaId, {
      // Let Google handle the first pageview automatically; route changes
      // within the SPA would need manual gtag("event","page_view",...) calls.
      // For the landing page alone, auto-pageview is sufficient.
      send_page_view: true,
    });
  }, []);

  return null;
}
