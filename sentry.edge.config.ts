/**
 * Sentry config for the Edge runtime (middleware — proxy.ts — and any
 * Edge-runtime API routes we might add later). Errors captured + 10% traces.
 *
 * PII scrubbing mirrors the server config — see sentry.server.config.ts
 * for rationale.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: false,
  environment: process.env.VERCEL_ENV ?? "development",
  sendDefaultPii: false,
  beforeSend: (event) => {
    if (event.request) {
      if ("data" in event.request) event.request.data = "[redacted]";
      if (event.request.cookies) event.request.cookies = { redacted: "true" };
      if (event.request.headers) {
        const h = event.request.headers as Record<string, string>;
        if (h.cookie) h.cookie = "[redacted]";
        if (h.authorization) h.authorization = "[redacted]";
      }
    }
    if (event.extra) {
      for (const k of Object.keys(event.extra)) {
        const v = event.extra[k];
        if (typeof v === "string" && v.length > 200) {
          event.extra[k] = `[redacted ${v.length} chars]`;
        }
      }
    }
    return event;
  },
});
