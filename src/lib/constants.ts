// ── VibeFlow Brand Constants ─────────────────────────────
// Single source of truth for colors, copy, and config.
// Import from here throughout the app — never hardcode values.

export const BRAND = {
  name: "VibeFlow Marketing",
  tagline: "One prompt. Full campaign. Perfectly on-brand.",
  url: "https://vibeflow.marketing", // update when domain is live
} as const;

// ── Sorbet Color Palette ─────────────────────────────────
export const COLORS = {
  teal:          "#05AD98",
  tealLight:     "#E6FAF8",
  tealDark:      "#038C7A",
  lavender:      "#BBBBFB",
  lavenderLight: "#EEEEFF",
  lavenderDark:  "#9898E8",
  dark:          "#1F1F1F",
  gray:          "#878787",
  grayLight:     "#EEEEEE",
  white:         "#FFFFFF",
  bg:            "#F8F8F8",
} as const;

// ── Pricing ──────────────────────────────────────────────
export const PLANS = {
  launch: {
    name: "Launch Kit",
    price: 49.99,
    priceDisplay: "$49.99",
    searches: 100,
    period: "30 days",
    overage: 0.49,
    description: "Single app launches and quick testing",
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_LAUNCH_PRICE_ID ?? "",
  },
  annual: {
    name: "Annual Plan",
    price: 99.99,
    priceDisplay: "$99.99",
    searches: 1200,
    period: "12 months",
    overage: 0.29,
    description: "Regular use across multiple apps",
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID ?? "",
  },
} as const;

// ── Navigation ───────────────────────────────────────────
export const NAV_LINKS = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Features",     href: "/#features" },
  { label: "Pricing",      href: "/#pricing" },
  { label: "Blog",         href: "/blog" },
] as const;

export const DASHBOARD_TABS = [
  { label: "Vibe Launchpad", href: "/dashboard",             icon: "⚡" },
  { label: "My Campaigns",   href: "/dashboard/campaigns",   icon: "📁" },
  { label: "Agents",         href: "/dashboard/agents",      icon: "🤖" },
  { label: "Integrations",   href: "/dashboard/integrations",icon: "🔗" },
  { label: "Analytics Hub",  href: "/dashboard/analytics",   icon: "📊" },
  { label: "Usage & Billing",href: "/dashboard/billing",     icon: "💳" },
] as const;

// ── Marketing Copy ───────────────────────────────────────
export const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Describe your app",
    body: "One natural-language prompt. Tell us what you built, who it's for, and what makes it special.",
  },
  {
    step: 2,
    title: "Agents get to work",
    body: "Our multi-agent system generates a complete, coordinated campaign across every channel — all perfectly on-brand.",
  },
  {
    step: 3,
    title: "Launch in minutes",
    body: "Copy, visuals, ads, SEO, social — ready to publish. Export with one click or schedule directly.",
  },
] as const;

export const FEATURES = [
  { title: "Content Marketing",  body: "Blog posts, newsletters, threads, YouTube scripts, email sequences." },
  { title: "Social Media",       body: "Platform-specific posts for X, LinkedIn, TikTok, Instagram, Reddit." },
  { title: "SEO",                body: "Keyword research, on-page optimization, technical SEO, content briefs." },
  { title: "Paid Ads",           body: "Google, Meta, LinkedIn, X, and TikTok ads with copy, targeting, and budget." },
  { title: "Visual Assets",      body: "AI-generated images, carousels, thumbnails, memes, and demo GIFs." },
  { title: "Analytics",          body: "Unified GA4 dashboard with predictive ROI and automated recommendations." },
] as const;
