/**
 * Sentry config for Node server runtime (API routes, server components).
 * Captures errors + 10% of traces. Errors are ALWAYS captured regardless of
 * tracesSampleRate (trace sampling only affects performance monitoring).
 *
 * DSN is read from NEXT_PUBLIC_SENTRY_DSN so the same value works client and
 * server. Missing env var → Sentry silently does nothing (safe for local dev).
 *
 * PII scrubbing: agent routes can throw with prompt text in the message,
 * which would leak user content to Sentry. The beforeSend hook redacts
 * request bodies and any string >200 chars in extras to honor our Privacy
 * Policy promise that we don't collect raw prompts/campaigns.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: false,
  environment: process.env.VERCEL_ENV ?? "development",
  sendDefaultPii: false,
  beforeSend: scrubPii,
});

function scrubPii(event: Sentry.ErrorEvent): Sentry.ErrorEvent | null {
  // Strip request body — never want to send user prompts/payloads to Sentry
  if (event.request) {
    if ("data" in event.request) event.request.data = "[redacted]";
    if (event.request.cookies) event.request.cookies = { redacted: "true" };
    if (event.request.headers) {
      const headers = event.request.headers as Record<string, string>;
      if (headers.cookie) headers.cookie = "[redacted]";
      if (headers.authorization) headers.authorization = "[redacted]";
    }
  }
  // Redact long strings in extras — likely to contain prompt or campaign content
  if (event.extra) {
    for (const key of Object.keys(event.extra)) {
      const val = event.extra[key];
      if (typeof val === "string" && val.length > 200) {
        event.extra[key] = `[redacted ${val.length} chars]`;
      }
    }
  }
  // Redact long strings in breadcrumbs (URL paths sometimes embed query content)
  if (event.breadcrumbs) {
    for (const bc of event.breadcrumbs) {
      if (bc.message && bc.message.length > 200) {
        bc.message = `[redacted ${bc.message.length} chars]`;
      }
    }
  }
  return event;
}
