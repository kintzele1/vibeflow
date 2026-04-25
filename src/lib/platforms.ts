/**
 * Platform intents — how to pre-fill a post into each social platform's composer.
 *
 * X (Twitter) supports `text=` in its intent URL, so we can pre-fill a tweet.
 * Reddit supports `title` + `text`.
 * LinkedIn, Instagram, TikTok, Threads, Facebook do NOT accept prefilled text
 * via URL — for those we copy to clipboard and open the composer so the user
 * can paste one keystroke away.
 *
 * This file is the single source of truth for both the "Copy + open composer"
 * button in the calendar and any future social publishing integrations.
 */

export type Platform =
  | "x"
  | "twitter"
  | "linkedin"
  | "instagram"
  | "tiktok"
  | "threads"
  | "reddit"
  | "facebook"
  | "email"
  // Ad / PPC platforms — no prefill URLs (each platform's create-campaign
  // flow is multi-step), so we just copy content + open the admin home page.
  | "ads_google"
  | "ads_meta"
  | "ads_linkedin"
  | "ads_x"
  | "ads_tiktok"
  | "generic";

export function platformOf(contentType: string): Platform {
  // Order matters — PPC types must match BEFORE the broader "linkedin"/"x"
  // checks below, otherwise `ppc_linkedin` would route to the LinkedIn organic
  // composer instead of LinkedIn Campaign Manager.
  if (contentType === "ppc_google") return "ads_google";
  if (contentType === "ppc_meta") return "ads_meta";
  if (contentType === "ppc_linkedin") return "ads_linkedin";
  if (contentType === "ppc_x") return "ads_x";
  if (contentType === "ppc_tiktok") return "ads_tiktok";

  if (contentType.includes("x_post") || contentType === "twitter" || contentType.includes("launch_x_thread")) return "x";
  if (contentType.includes("linkedin")) return "linkedin";
  if (contentType.includes("instagram")) return "instagram";
  if (contentType.includes("tiktok")) return "tiktok";
  if (contentType.includes("threads")) return "threads";
  if (contentType.includes("reddit")) return "reddit";
  if (contentType.startsWith("email_") || contentType === "newsletter" || contentType === "email_sequence") return "email";
  return "generic";
}

export type ComposerAction = {
  /** Whether an external composer URL exists for this platform. */
  hasComposer: boolean;
  /** Whether the composer supports pre-filling text via URL (true = smoother UX). */
  supportsPrefill: boolean;
  /** Label for the button users click. */
  buttonLabel: string;
  /** Human-friendly platform name for the toast/help text. */
  platformName: string;
};

export function composerInfo(platform: Platform): ComposerAction {
  switch (platform) {
    case "x":
    case "twitter":
      return { hasComposer: true, supportsPrefill: true,  buttonLabel: "Copy + open X",        platformName: "X (Twitter)" };
    case "reddit":
      return { hasComposer: true, supportsPrefill: true,  buttonLabel: "Copy + open Reddit",   platformName: "Reddit" };
    case "linkedin":
      return { hasComposer: true, supportsPrefill: false, buttonLabel: "Copy + open LinkedIn", platformName: "LinkedIn" };
    case "instagram":
      return { hasComposer: true, supportsPrefill: false, buttonLabel: "Copy + open Instagram", platformName: "Instagram" };
    case "tiktok":
      return { hasComposer: true, supportsPrefill: false, buttonLabel: "Copy + open TikTok",   platformName: "TikTok" };
    case "threads":
      return { hasComposer: true, supportsPrefill: true,  buttonLabel: "Copy + open Threads",  platformName: "Threads" };
    case "facebook":
      return { hasComposer: true, supportsPrefill: false, buttonLabel: "Copy + open Facebook", platformName: "Facebook" };
    case "email":
      return { hasComposer: true, supportsPrefill: true,  buttonLabel: "Copy + open email",    platformName: "Email" };
    case "ads_google":
      return { hasComposer: true, supportsPrefill: false, buttonLabel: "Copy + open Google Ads",            platformName: "Google Ads" };
    case "ads_meta":
      return { hasComposer: true, supportsPrefill: false, buttonLabel: "Copy + open Meta Ads Manager",      platformName: "Meta Ads Manager" };
    case "ads_linkedin":
      return { hasComposer: true, supportsPrefill: false, buttonLabel: "Copy + open LinkedIn Campaign Mgr", platformName: "LinkedIn Campaign Manager" };
    case "ads_x":
      return { hasComposer: true, supportsPrefill: false, buttonLabel: "Copy + open X Ads",                 platformName: "X Ads" };
    case "ads_tiktok":
      return { hasComposer: true, supportsPrefill: false, buttonLabel: "Copy + open TikTok Ads",            platformName: "TikTok Ads" };
    case "generic":
    default:
      return { hasComposer: false, supportsPrefill: false, buttonLabel: "Copy content",        platformName: "your tool" };
  }
}

/**
 * splitIntoPosts — parse a multi-post campaign body into discrete units.
 *
 * Multi-asset agents (social X/LinkedIn/IG/Threads/Carousel, Content Twitter
 * thread, Community Launch X thread, Email sequence) output several posts in
 * one campaign. The naive "copy all" flow pastes everything into one platform
 * composer, blowing past per-post limits. This parser splits the content at
 * the standard headers (POST 1, TWEET 1/, CAPTION 1, SLIDE 1, SCRIPT 1,
 * EMAIL 1, DAY 1, 1/N) and returns each chunk with a clean label + the body
 * only (no header, no (xxx / LIMIT chars) footer, no --- dividers).
 *
 * Callers show these units in a picker so the user copies one post at a time.
 * If only one unit is found, the content is treated as single-asset.
 */
export type PostUnit = {
  label: string;      // e.g. "POST 1 — Founder Story"
  preview: string;    // First ~120 chars of body, single-line
  fullText: string;   // Clean body text ready to paste
  charCount: number;
};

/**
 * Strip markdown formatting from content before sending to a social composer.
 *
 * Social composers (X, LinkedIn, Threads, IG, etc.) render plain text, so
 * `**bold**` shows literal asterisks and `## POST 1` shows a literal hash-and-text.
 * This helper strips:
 *   - Markdown headers (lines starting with `# ` through `###### `)
 *   - **bold** / __bold__ → bold
 *   - *italic* / _italic_ → italic
 *   - [text](url) → "text url"
 *   - Excess blank lines (3+ in a row → 2)
 *
 * Hashtags like `#buildingtools` (no space after #) are preserved — they're
 * intentional content, not markdown.
 */
export function stripMarkdownForSocial(text: string): string {
  if (!text) return text;
  return text
    .split("\n")
    // Strip lines that are markdown headers ("# ", "## ", up to "###### ")
    .filter(line => !/^\s*#{1,6}\s+\S/.test(line))
    .join("\n")
    // Bold + italic via asterisks
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "$1")
    // Bold + italic via underscores
    .replace(/__([^_\n]+)__/g, "$1")
    .replace(/(?<!_)_([^_\n]+)_(?!_)/g, "$1")
    // Markdown links — keep text + url plain
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 $2")
    // Collapse 3+ newlines to 2
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function splitIntoPosts(content: string): PostUnit[] {
  if (!content?.trim()) return [];

  // Detect headers of common multi-post formats. Matches at start of line,
  // optional leading markdown hashes (# / ##), and captures a header like:
  //   POST 1 — Founder Story
  //   TWEET 3/15
  //   CAPTION 2: Launch announcement
  //   SLIDE 5 - CTA
  //   EMAIL 3 (Day 7)
  //   DAY 4 — Social proof
  //   1/15 — Hook   (numbered X-thread without "TWEET" keyword)
  const headerRegex = /^(?:\s*#{1,3}\s*)?(?:POST|TWEET|CAPTION|SCRIPT|SLIDE|EMAIL|DAY)\s+\d+(?:\s*\/\s*\d+)?.*$|^(?:\s*#{1,3}\s*)?\d+\s*\/\s*\d+\s*[—\-:].*$/gim;
  const matches = Array.from(content.matchAll(headerRegex));

  if (matches.length < 2) {
    // Treat as single asset — strip markdown so social composers get clean text.
    const cleaned = stripMarkdownForSocial(content);
    return [{
      label: "Full content",
      preview: cleaned.slice(0, 120).replace(/\s+/g, " ").trim(),
      fullText: cleaned,
      charCount: cleaned.length,
    }];
  }

  const units: PostUnit[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index!;
    const end = i + 1 < matches.length ? matches[i + 1].index! : content.length;
    const block = content.slice(start, end);

    const lines = block.split("\n");
    const headerLine = (lines[0] || "").trim().replace(/^#+\s*/, "").replace(/^\*+|\*+$/g, "").trim();
    let bodyLines = lines.slice(1);

    // Strip trailing (xxx / LIMIT chars) footer, --- dividers, and blank lines
    while (bodyLines.length > 0) {
      const last = bodyLines[bodyLines.length - 1].trim();
      if (
        !last ||
        /^-{3,}$/.test(last) ||
        /^\(\s*\d+\s*\/\s*\S+\s*chars?\s*\)$/i.test(last)
      ) {
        bodyLines.pop();
      } else {
        break;
      }
    }

    // Strip markdown so social composers (X, LinkedIn, Threads, etc.) receive
    // clean plain text. The label keeps emphasis stripped via the headerLine
    // cleanup above; the body gets full markdown stripping here.
    const bodyText = stripMarkdownForSocial(bodyLines.join("\n").trim());
    units.push({
      label: headerLine || `Post ${i + 1}`,
      preview: bodyText.slice(0, 120).replace(/\s+/g, " ").trim(),
      fullText: bodyText,
      charCount: bodyText.length,
    });
  }

  return units;
}

/**
 * Build a URL that opens the platform's composer, prefilled where possible.
 * Returns null if the platform has no external composer (user should copy only).
 */
export function composerUrl(platform: Platform, text: string, title?: string): string | null {
  const t = encodeURIComponent(text);
  const ttl = title ? encodeURIComponent(title) : "";

  switch (platform) {
    case "x":
    case "twitter":
      // Twitter's tweet intent accepts text. Trim to 280 chars so it doesn't auto-truncate awkwardly.
      return `https://x.com/intent/tweet?text=${encodeURIComponent(text.slice(0, 280))}`;
    case "reddit":
      return `https://www.reddit.com/submit?title=${ttl || t.slice(0, 300)}&text=${t}`;
    case "threads":
      return `https://www.threads.net/intent/post?text=${encodeURIComponent(text.slice(0, 500))}`;
    case "linkedin":
      // LinkedIn doesn't accept prefilled text. Best we can do is open the create-post page.
      return "https://www.linkedin.com/feed/?shareActive=true";
    case "instagram":
      // Instagram has no web composer that accepts content. Open their create page.
      return "https://www.instagram.com/";
    case "tiktok":
      return "https://www.tiktok.com/upload";
    case "facebook":
      return "https://www.facebook.com/";
    case "email":
      // Mailto with subject + body (subject = title if provided, else first 60 chars).
      const subject = title ?? text.split("\n")[0].slice(0, 60);
      return `mailto:?subject=${encodeURIComponent(subject)}&body=${t}`;
    case "ads_google":
      // Google Ads admin home — user creates new campaign + pastes copy
      return "https://ads.google.com/aw/campaigns/new";
    case "ads_meta":
      return "https://business.facebook.com/adsmanager/manage/campaigns";
    case "ads_linkedin":
      return "https://www.linkedin.com/campaignmanager/accounts";
    case "ads_x":
      return "https://ads.x.com/";
    case "ads_tiktok":
      return "https://ads.tiktok.com/";
    case "generic":
    default:
      return null;
  }
}
