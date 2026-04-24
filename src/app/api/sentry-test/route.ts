/**
 * Temporary endpoint used ONLY to verify Sentry error capture end-to-end.
 *
 * Turbopack (Next 16 default) has incomplete Sentry auto-capture wiring at
 * @sentry/nextjs v10.50, so we manually capture + flush here. This is also
 * the robust pattern we'll use across real agent routes.
 *
 * Hit GET /api/sentry-test once after deploy; the intentional throw should
 * appear as a new Issue in Sentry within ~30 seconds. DELETE THIS FILE
 * before launch.
 */
import * as Sentry from "@sentry/nextjs";

export async function GET() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const hasDSN = !!dsn;
  const dsnPrefix = dsn ? `${dsn.slice(0, 40)}...` : "undefined";
  const runtime = process.env.NEXT_RUNTIME ?? "unknown";
  const vercelEnv = process.env.VERCEL_ENV ?? "unknown";

  // Try to capture
  let captureResult = "not attempted";
  try {
    throw new Error(`Sentry test — hasDSN:${hasDSN} runtime:${runtime}`);
  } catch (err) {
    const eventId = Sentry.captureException(err);
    await Sentry.flush(2000);
    captureResult = eventId ? `captured: ${eventId}` : "captured but no eventId (SDK silent)";
  }

  return new Response(JSON.stringify({
    hasDSN,
    dsnPrefix,
    runtime,
    vercelEnv,
    captureResult,
    sentryVersion: "@sentry/nextjs@10.x",
  }, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
