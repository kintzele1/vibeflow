/**
 * Sentry config for the browser/client. Captures unhandled JS exceptions,
 * React render errors (via global-error.tsx boundary), and 10% of traces.
 *
 * Session replay is intentionally OFF — it's a quota sink. We can enable
 * replay post-launch if an incident demands it.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: false,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
});

// Required by Sentry's Next.js App Router integration for client-side
// navigation instrumentation.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
