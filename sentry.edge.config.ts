/**
 * Sentry config for the Edge runtime (middleware — proxy.ts — and any
 * Edge-runtime API routes we might add later). Errors captured + 10% traces.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: false,
  environment: process.env.VERCEL_ENV ?? "development",
});
