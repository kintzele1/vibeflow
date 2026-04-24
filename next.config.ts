import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {};

/**
 * Wrap with Sentry to enable onRequestError auto-wiring for App Router,
 * optional source-map upload (only if SENTRY_AUTH_TOKEN is set), and
 * automatic Vercel cron monitors. silent + disableLogger keep build
 * logs clean.
 */
export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
});
