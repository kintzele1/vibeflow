/**
 * Sentry config for the browser/client. Captures unhandled JS exceptions,
 * React render errors (via global-error.tsx boundary), and 10% of traces.
 *
 * Session replay is intentionally OFF — it's a quota sink. We can enable
 * replay post-launch if an incident demands it.
 *
 * PII scrubbing mirrors the server config — see sentry.server.config.ts.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: false,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
  sendDefaultPii: false,
  beforeSend: (event) => {
    // Browser errors usually don't have request bodies, but breadcrumbs
    // can capture user input from form fields. Redact long strings.
    if (event.extra) {
      for (const k of Object.keys(event.extra)) {
        const v = event.extra[k];
        if (typeof v === "string" && v.length > 200) {
          event.extra[k] = `[redacted ${v.length} chars]`;
        }
      }
    }
    if (event.breadcrumbs) {
      for (const bc of event.breadcrumbs) {
        if (bc.message && bc.message.length > 200) {
          bc.message = `[redacted ${bc.message.length} chars]`;
        }
      }
    }
    return event;
  },
});

// Required by Sentry's Next.js App Router integration for client-side
// navigation instrumentation.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
