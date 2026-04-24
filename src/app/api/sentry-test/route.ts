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

// Force-init at module load. If instrumentation.ts never fired (Turbopack
// quirk), this ensures the SDK is actually initialized before capture.
// debug:true makes the SDK log its internal state to stdout — visible in
// Vercel runtime logs so we can see if events are actually transmitted.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const initializedByRoute = !Sentry.isInitialized() && !!dsn;
if (initializedByRoute) {
  Sentry.init({ dsn, debug: true });
}

export async function GET() {
  const hasDSN = !!dsn;
  const dsnPrefix = dsn ? `${dsn.slice(0, 40)}...` : "undefined";
  const runtime = process.env.NEXT_RUNTIME ?? "unknown";
  const vercelEnv = process.env.VERCEL_ENV ?? "unknown";
  const wasInitialized = Sentry.isInitialized();

  let captureResult = "not attempted";
  try {
    throw new Error(`Sentry test — hasDSN:${hasDSN} runtime:${runtime}`);
  } catch (err) {
    const eventId = Sentry.captureException(err);
    const flushed = await Sentry.flush(3000);
    captureResult = `eventId: ${eventId}, flushed: ${flushed}`;
  }

  return new Response(JSON.stringify({
    hasDSN,
    dsnPrefix,
    runtime,
    vercelEnv,
    wasInitialized,
    initializedByRoute,
    captureResult,
  }, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
