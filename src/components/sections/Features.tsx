"use client";
import {
  Palette, MessagesSquare, Send, Search, Target,
  Share2, CalendarCheck, Sparkles,
} from "lucide-react";

const FEATURES = [
  {
    Icon: Palette,
    title: "Brand Kit",
    body: "Upload your logo, colors, tagline & vibe once. Everything we create auto-applies it forever. Zero manual edits.",
  },
  {
    Icon: MessagesSquare,
    title: "Community & Earned Media",
    body: "Helps you engage on Reddit and Hacker News with natural, high-quality posts and replies that match the community tone.",
  },
  {
    Icon: Send,
    title: "Outbound / GTM Agent",
    body: "Builds warm, personalized email + LinkedIn outreach sequences — all perfectly on-brand.",
  },
  {
    Icon: Search,
    title: "SEO + GSEO",
    body: "Keyword research, content briefs, and optimization that ranks in Google and AI engines like ChatGPT, Perplexity, and Claude.",
  },
  {
    Icon: Target,
    title: "PPC & ASO",
    body: "Complete ad sets for Google, Meta, LinkedIn & TikTok + App Store optimization that actually converts.",
  },
  {
    Icon: Share2,
    title: "Social + Content",
    body: "Platform-specific posts, threads, carousels, emails, and blogs — all consistent and ready to schedule.",
  },
  {
    Icon: CalendarCheck,
    title: "Marketing Calendar & Results",
    body: "Drag-and-drop scheduling with smart timing suggestions + unified analytics dashboard with AI insights.",
  },
  {
    Icon: Sparkles,
    title: "Self-Improving Engine",
    body: "Learns from your real campaign performance (anonymized & opt-in) so every future campaign gets better — higher engagement, better conversions.",
  },
];

export function Features() {
  return (
    <section id="features" style={{ padding: "100px 24px", background: "#F8F8F8" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{
            display: "inline-block", background: "#EEEEFF", color: "#6060CC",
            fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
            letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "6px 16px", borderRadius: 999, marginBottom: 20,
          }}>Agents</div>
          <h2 style={{
            fontFamily: "var(--font-syne)", fontWeight: 700,
            fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.02em",
            color: "#1F1F1F", maxWidth: 720, margin: "0 auto 20px", lineHeight: 1.15,
          }}>
            Everything your marketing needs.{" "}
            <span style={{ color: "#05AD98" }}>One system.</span>
          </h2>
          <p style={{
            fontFamily: "var(--font-dm-sans)", fontSize: 17, color: "#555555",
            maxWidth: 640, margin: "0 auto", lineHeight: 1.65,
          }}>
            Our multi-agent system works together so every piece of your campaign feels like it came from the same brilliant team — perfectly on-brand.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          {FEATURES.map((feature) => {
            const Icon = feature.Icon;
            return (
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
                <div style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 44, height: 44, borderRadius: 12,
                  background: "#E6FAF8", marginBottom: 16,
                }}>
                  <Icon size={22} color="#05AD98" strokeWidth={2} />
                </div>
                <h3 style={{
                  fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 17,
                  color: "#1F1F1F", marginBottom: 10, letterSpacing: "-0.01em",
                }}>{feature.title}</h3>
                <p style={{
                  fontFamily: "var(--font-dm-sans)", fontSize: 14,
                  color: "#666666", lineHeight: 1.7,
                }}>{feature.body}</p>
              </div>
            );
          })}
        </div>

        {/* Section CTA */}
        <div style={{ textAlign: "center", marginTop: 56 }}>
          <p style={{
            fontFamily: "var(--font-dm-sans)", fontSize: 16, color: "#555555",
            marginBottom: 16,
          }}>
            Ready to see it in action?
          </p>
          <a href="/login" style={{
            display: "inline-block",
            background: "#05AD98", color: "#FFFFFF",
            fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 16,
            padding: "14px 32px", borderRadius: 999, textDecoration: "none",
          }}>
            Generate Your First Campaign — Free
          </a>
        </div>
      </div>
    </section>
  );
}
