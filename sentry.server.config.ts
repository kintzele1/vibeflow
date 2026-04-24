/**
 * Sentry config for Node server runtime (API routes, server components).
 * Captures errors + 10% of traces. Errors are ALWAYS captured regardless of
 * tracesSampleRate (trace sampling only affects performance monitoring).
 *
 * DSN is read from NEXT_PUBLIC_SENTRY_DSN so the same value works client and
 * server. Missing env var → Sentry silently does nothing (safe for local dev).
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: false,
  environment: process.env.VERCEL_ENV ?? "development",
});
