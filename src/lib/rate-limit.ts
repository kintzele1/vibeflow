import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

/**
 * Per-user API rate limiter.
 *
 * Uses Upstash Redis (free tier: 10K commands/day) with a sliding-window
 * algorithm. Each authenticated user is capped at 10 agent-generation requests
 * per 60 seconds across all agent routes.
 *
 * Threat model this protects against:
 *   - Buggy scripts that loop through agent calls and burn Anthropic budget
 *   - Brute-force abuse (malicious user, stolen session)
 *   - Single-user DoS attempts
 *
 * It does NOT protect against:
 *   - Distributed abuse across many compromised accounts (by design — that's
 *     an auth-level problem, not a rate-limit problem)
 *   - Anthropic downstream rate limits (those hit regardless)
 *
 * Graceful degradation: if Upstash env vars are missing (e.g., in local dev
 * without Upstash setup), the limiter fails OPEN — requests pass through.
 * This keeps dev unblocked. In production, env vars MUST be set — confirm
 * in Vercel before going live.
 */

// Read env vars. Missing values → rate limiter disabled (fail open).
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Lazily initialize — if env vars are absent, we skip.
const limiter = redisUrl && redisToken
  ? new Ratelimit({
      redis: new Redis({ url: redisUrl, token: redisToken }),
      limiter: Ratelimit.slidingWindow(10, "60 s"),
      analytics: true,
      prefix: "vibeflow:rl",
    })
  : null;

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;   // ms since epoch when the window fully resets
  retryAfterSec: number; // seconds to wait before retrying
};

/**
 * Check + consume one unit from the user's rate-limit bucket.
 * Call this from each agent route AFTER auth, BEFORE plan check.
 *
 * Returns allowed=false when the user has exceeded 10 requests in the last
 * 60 seconds. Callers should return a 429 response with the retryAfter hint.
 */
export async function checkAgentRateLimit(userId: string): Promise<RateLimitResult> {
  if (!limiter) {
    // Fail OPEN — no Upstash configured. Returning allowed lets dev work.
    return { allowed: true, remaining: 10, resetAt: Date.now() + 60_000, retryAfterSec: 0 };
  }

  try {
    const { success, remaining, reset } = await limiter.limit(`agent:${userId}`);
    const retryAfterSec = success ? 0 : Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return { allowed: success, remaining, resetAt: reset, retryAfterSec };
  } catch {
    // If Upstash errors for any reason, fail OPEN — don't block legitimate
    // users because Upstash had a hiccup. Log only.
    return { allowed: true, remaining: 10, resetAt: Date.now() + 60_000, retryAfterSec: 0 };
  }
}

/**
 * Format a standard 429 Response for a rate-limited request. Agent routes use this.
 */
export function rateLimitedResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: "rate_limit",
      message: `You're generating too fast. Wait ${result.retryAfterSec} seconds and try again.`,
      retry_after_seconds: result.retryAfterSec,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSec),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
      },
    }
  );
}
