/**
 * Temporary endpoint used ONLY to verify Sentry error capture end-to-end.
 *
 * Hit GET /api/sentry-test once after setup; the intentional throw should
 * appear as a new Issue in Sentry within ~30 seconds. DELETE THIS FILE
 * before launch — it's a no-op public endpoint that's also a minor
 * reliability signal if it stays around in prod.
 */
export async function GET() {
  throw new Error("Sentry test — intentional server error from /api/sentry-test");
}
