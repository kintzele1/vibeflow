"use client";

const FEATURES = [
  {
    icon: "✍️",
    title: "Content Marketing",
    body: "Blog posts that rank, newsletters people open, and threads that go viral — all written in your voice, on your brand, in minutes.",
  },
  {
    icon: "📱",
    title: "Social Media",
    body: "Platform-native posts for X, LinkedIn, TikTok, Instagram, and Reddit — with captions, hashtags, and scheduling suggestions built in.",
  },
  {
    icon: "🔍",
    title: "SEO That Ranks",
    body: "Keyword research, on-page optimization, technical fixes, and content briefs — all on-brand and optimized for AI search too.",
  },
  {
    icon: "🎯",
    title: "Paid Ads",
    body: "Google, Meta, LinkedIn, X, and TikTok ads with headlines, copy, targeting suggestions, and budget allocation — ready to launch.",
  },
  {
    icon: "🎨",
    title: "Visual Assets",
    body: "AI-generated images, carousels, thumbnails, memes, and demo GIFs — all matching your vibe so your feed looks like a real brand.",
  },
  {
    icon: "📊",
    title: "Analytics",
    body: "Unified GA4 dashboard with predictive ROI, automated recommendations, and plain-English insights — no analyst required.",
  },
  {
    icon: "📧",
    title: "Email Marketing",
    body: "Welcome flows, onboarding sequences, upsell campaigns, and re-engagement drips — personalized and ready to plug into any ESP.",
  },
  {
    icon: "📲",
    title: "App Store (ASO)",
    body: "App Store and Google Play titles, keywords, descriptions, and screenshot captions optimized to rank and convert — for both stores.",
  },
  {
    icon: "🚀",
    title: "Community & Launch",
    body: "Product Hunt launch kits, influencer outreach templates, Discord/Reddit community ideas, and PR pitches — all done for you.",
  },
];

export function Features() {
  return (
    <section id="features" style={{ padding: "100px 24px", background: "#F8F8F8" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <div style={{
            display: "inline-block", background: "#EEEEFF", color: "#6060CC",
            fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
            letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "6px 16px", borderRadius: 999, marginBottom: 20,
          }}>Full Coverage</div>
          <h2 style={{
            fontFamily: "var(--font-syne)", fontWeight: 700,
            fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.02em",
            color: "#1F1F1F", maxWidth: 560, margin: "0 auto", lineHeight: 1.15,
          }}>
            Every channel. Every format.{" "}
            <span style={{ color: "#05AD98" }}>All on-brand.</span>
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              style={{
                background: "#FFFFFF", borderRadius: 16, padding: "32px 28px",
                border: "1px solid #EEEEEE",
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
                cursor: "default",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget;
                el.style.borderColor = "#05AD98";
                el.style.transform = "translateY(-4px)";
                el.style.boxShadow = "0 12px 40px rgba(5,173,152,0.12)";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget;
                el.style.borderColor = "#EEEEEE";
                el.style.transform = "translateY(0)";
                el.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)";
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 16, lineHeight: 1 }}>{feature.icon}</div>
              <h3 style={{
                fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 17,
                color: "#1F1F1F", marginBottom: 10, letterSpacing: "-0.01em",
              }}>{feature.title}</h3>
              <p style={{
                fontFamily: "var(--font-dm-sans)", fontSize: 14,
                color: "#666666", lineHeight: 1.7,
              }}>{feature.body}</p>
            </div>
          ))}
        </div>

        <p style={{
          textAlign: "center", fontFamily: "var(--font-dm-sans)",
          fontSize: 14, color: "#AAAAAA", marginTop: 48,
        }}>
          All agents collaborate — SEO feeds PPC, content feeds social. One vibe, everywhere.
        </p>
      </div>
    </section>
  );
}
