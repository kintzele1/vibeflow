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
  | "generic";

export function platformOf(contentType: string): Platform {
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
    case "generic":
    default:
      return { hasComposer: false, supportsPrefill: false, buttonLabel: "Copy content",        platformName: "your tool" };
  }
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
    case "generic":
    default:
      return null;
  }
}
