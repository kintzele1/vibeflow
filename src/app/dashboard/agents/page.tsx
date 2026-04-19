"use client";

type Agent = { icon: string; name: string; desc: string; status: "live" | "coming"; href?: string };

const AGENTS: Agent[] = [
  { icon: "✍️", name: "Content Marketing", desc: "Blog posts, newsletters, threads, YouTube scripts, email sequences.", status: "live", href: "/dashboard/content" },
  { icon: "📱", name: "Social Media", desc: "X, LinkedIn, TikTok, Instagram, Reddit — captions, hashtags, scheduling.", status: "live", href: "/dashboard/social" },
  { icon: "🔍", name: "SEO", desc: "Keyword research, on-page, technical SEO, content briefs, backlink outreach.", status: "live", href: "/dashboard/seo" },
  { icon: "🎯", name: "Paid Ads (PPC)", desc: "Google, Meta, LinkedIn, X, TikTok ads with copy and targeting.", status: "live", href: "/dashboard/ppc" },
  { icon: "🎨", name: "Visual Assets", desc: "AI-generated images, carousels, thumbnails, memes, and GIFs.", status: "live", href: "/dashboard/visuals" },
  { icon: "📧", name: "Email Marketing", desc: "Welcome flows, onboarding, upsell, and re-engagement sequences.", status: "coming" },
  { icon: "📲", name: "ASO", desc: "App Store and Google Play titles, keywords, descriptions, screenshots.", status: "coming" },
  { icon: "📊", name: "Analytics", desc: "Unified GA4 dashboard, predictive ROI, automated recommendations.", status: "coming" },
  { icon: "🚀", name: "Community & Launch", desc: "Product Hunt kits, influencer outreach, Discord/Reddit, PR pitches.", status: "coming" },
];

export default function AgentsPage() {
  return (
    <div style={{ padding: "40px 48px" }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 32, color: "#1F1F1F", letterSpacing: "-0.02em", marginBottom: 8 }}>
          Agents 🤖
        </h1>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 16, color: "#878787" }}>
          Run individual agents for any channel. All stay on-brand with your vibe.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {AGENTS.map(agent => (
          <div key={agent.name} style={{
            background: "#FFFFFF", borderRadius: 16, padding: "24px",
            border: `1px solid ${agent.status === "live" ? "rgba(5,173,152,0.2)" : "#EEEEEE"}`,
            opacity: agent.status === "coming" ? 0.65 : 1,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>{agent.icon}</span>
              <span style={{
                fontFamily: "var(--font-dm-sans)", fontSize: 11, fontWeight: 500,
                padding: "3px 10px", borderRadius: 999,
                background: agent.status === "live" ? "#E6FAF8" : "#F0F0F0",
                color: agent.status === "live" ? "#05AD98" : "#AAAAAA",
              }}>
                {agent.status === "live" ? "Live" : "Coming soon"}
              </span>
            </div>
            <h3 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 16, color: "#1F1F1F", marginBottom: 8 }}>
              {agent.name}
            </h3>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787", lineHeight: 1.6 }}>
              {agent.desc}
            </p>
            {agent.status === "live" && (
              <a href={agent.href ?? "/dashboard"} style={{
                display: "inline-block", marginTop: 16,
                fontFamily: "var(--font-dm-sans)", fontSize: 13, fontWeight: 500,
                color: "#05AD98", textDecoration: "none",
              }}>
                Run agent →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
