/**
 * Next.js 13+ instrumentation hook. Next auto-loads this file and calls
 * `register()` once per process start. We use it to boot the Sentry SDK
 * for whichever runtime is active.
 *
 * Also exports `onRequestError`, which Next.js calls for unhandled errors
 * from server components / route handlers, letting Sentry capture them
 * with proper request context.
 */
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
