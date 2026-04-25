/**
 * URL analysis — fetch + parse on-page state for SEO + ASO agents.
 *
 * Used when a user has set website_url / app_store_url / play_store_url
 * on their Brand Kit. The agent route fetches the URL, extracts a small
 * structured snapshot of current state, and includes it in the prompt
 * so the agent can give SPECIFIC recommendations vs generic advice.
 *
 * All functions:
 *   - Run server-side only (use fetch with timeout)
 *   - Return null on any failure (network, parse, timeout) — the agent
 *     falls back to generic advice gracefully
 *   - Limit response size to avoid eating Anthropic context window
 *   - Use regex parsing instead of cheerio to keep deps minimal
 */

const FETCH_TIMEOUT_MS = 8000;
const MAX_HTML_BYTES = 500_000;
const USER_AGENT = "VibeFlow-Marketing-Bot/1.0 (+https://www.vibeflow.marketing)";

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, "Accept": "text/html,*/*" },
      redirect: "follow",
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_HTML_BYTES) {
      return new TextDecoder().decode(buffer.slice(0, MAX_HTML_BYTES));
    }
    return new TextDecoder().decode(buffer);
  } catch {
    return null;
  }
}

function extract(regex: RegExp, html: string): string | null {
  const match = html.match(regex);
  return match?.[1]?.trim() ?? null;
}

function extractAll(regex: RegExp, html: string, max = 10): string[] {
  const matches = Array.from(html.matchAll(regex));
  return matches.slice(0, max).map(m => m[1]?.trim()).filter(Boolean) as string[];
}

// Strip tags/whitespace from extracted text
function clean(text: string | null, maxLen = 300): string | null {
  if (!text) return null;
  return text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, maxLen);
}

// ============================================================================
// Website / SEO analysis
// ============================================================================

export type WebsiteAnalysis = {
  url: string;
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  twitterCard: string | null;
  h1s: string[];
  h2s: string[];
  hasStructuredData: boolean;
  hasSitemap: boolean | null;     // null = didn't check, true/false = exists or not
  hasRobotsTxt: boolean | null;
};

export async function analyzeWebsite(url: string): Promise<WebsiteAnalysis | null> {
  if (!url) return null;
  const html = await fetchHtml(url);
  if (!html) return null;

  const headRe = /<title[^>]*>([^<]*)<\/title>/i;
  const metaDescRe = /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i;
  const canonicalRe = /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i;
  const ogTitleRe = /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i;
  const ogDescRe = /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i;
  const twCardRe = /<meta[^>]*name=["']twitter:card["'][^>]*content=["']([^"']*)["']/i;
  const h1Re = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  const h2Re = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  const structuredDataRe = /<script[^>]*type=["']application\/ld\+json["']/i;

  return {
    url,
    title: clean(extract(headRe, html), 200),
    metaDescription: clean(extract(metaDescRe, html), 300),
    canonical: extract(canonicalRe, html),
    ogTitle: clean(extract(ogTitleRe, html), 200),
    ogDescription: clean(extract(ogDescRe, html), 300),
    twitterCard: extract(twCardRe, html),
    h1s: extractAll(h1Re, html, 5).map(t => clean(t, 200)).filter(Boolean) as string[],
    h2s: extractAll(h2Re, html, 8).map(t => clean(t, 200)).filter(Boolean) as string[],
    hasStructuredData: structuredDataRe.test(html),
    hasSitemap: null,    // populated separately if we want; skip for v1
    hasRobotsTxt: null,
  };
}

export function formatWebsiteAnalysisForPrompt(a: WebsiteAnalysis): string {
  const lines: string[] = [
    "",
    "CURRENT WEBSITE ON-PAGE SEO STATE (live snapshot — analyze and recommend specific improvements):",
    `- URL: ${a.url}`,
    `- <title>: ${a.title ?? "MISSING"}`,
    `- meta description: ${a.metaDescription ?? "MISSING"}`,
    `- canonical: ${a.canonical ?? "MISSING"}`,
    `- og:title: ${a.ogTitle ?? "MISSING"}`,
    `- og:description: ${a.ogDescription ?? "MISSING"}`,
    `- twitter:card: ${a.twitterCard ?? "MISSING"}`,
    `- h1s (${a.h1s.length}): ${a.h1s.length ? a.h1s.map(h => `"${h}"`).join(", ") : "MISSING"}`,
    `- h2s (${a.h2s.length}): ${a.h2s.slice(0, 5).map(h => `"${h}"`).join(", ") || "MISSING"}`,
    `- structured data (JSON-LD): ${a.hasStructuredData ? "PRESENT" : "MISSING"}`,
    "",
    "Use this snapshot to give SPECIFIC recommendations: what's missing, what's weak, what to rewrite, what to add. Reference exact current values when suggesting improvements.",
  ];
  return lines.join("\n");
}

// ============================================================================
// App Store / Play Store analysis
// ============================================================================

export type AppStoreAnalysis = {
  url: string;
  store: "apple" | "google" | "unknown";
  title: string | null;
  subtitle: string | null;
  description: string | null;
  rating: string | null;
  reviewCount: string | null;
};

export async function analyzeAppStore(url: string): Promise<AppStoreAnalysis | null> {
  if (!url) return null;
  const html = await fetchHtml(url);
  if (!html) return null;

  const isApple = url.includes("apps.apple.com");
  const isGoogle = url.includes("play.google.com");
  const store: AppStoreAnalysis["store"] = isApple ? "apple" : isGoogle ? "google" : "unknown";

  // App stores embed structured data extensively, so we look at OG tags + JSON-LD
  const titleRe = /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i;
  const descRe = /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i;
  // Apple uses <meta name="description"> often as subtitle hint; Google embeds itemprop="description"
  const altDescRe = /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i;
  const ratingRe = /"ratingValue"\s*:\s*"?([0-9.]+)"?/i;
  const reviewCountRe = /"reviewCount"\s*:\s*"?([0-9,]+)"?/i;

  return {
    url,
    store,
    title: clean(extract(titleRe, html), 200),
    subtitle: clean(extract(altDescRe, html), 200),
    description: clean(extract(descRe, html), 800),
    rating: extract(ratingRe, html),
    reviewCount: extract(reviewCountRe, html),
  };
}

export function formatAppStoreAnalysisForPrompt(a: AppStoreAnalysis): string {
  const storeName = a.store === "apple" ? "App Store (iOS)" : a.store === "google" ? "Google Play (Android)" : "App Store (unknown platform)";
  const lines: string[] = [
    "",
    `CURRENT ${storeName.toUpperCase()} LISTING (live snapshot — analyze and recommend specific improvements):`,
    `- URL: ${a.url}`,
    `- Title (og:title): ${a.title ?? "MISSING"}`,
    `- Subtitle / short description: ${a.subtitle ?? "MISSING"}`,
    `- Long description: ${a.description ?? "MISSING"}`,
    `- Average rating: ${a.rating ?? "not available"}`,
    `- Review count: ${a.reviewCount ?? "not available"}`,
    "",
    "Use this snapshot to give SPECIFIC ASO recommendations: what's missing, what's weak, what to rewrite. Reference current title/subtitle/description when suggesting improvements.",
  ];
  return lines.join("\n");
}
