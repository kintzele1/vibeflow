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
  try {
    throw new Error("Sentry test — intentional server error from /api/sentry-test");
  } catch (err) {
    Sentry.captureException(err);
    // flush() forces the SDK to send queued events before the function returns
    // (Vercel kills the lambda as soon as the response is sent).
    await Sentry.flush(2000);
    throw err;
  }
}
