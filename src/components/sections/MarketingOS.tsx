import { Check } from "lucide-react";

export function MarketingOS() {
  const insights = [
    { label: "Twitter thread outperforming LinkedIn 3:1", icon: "↑", color: "#05AD98" },
    { label: "Blog traffic up 42% this week", icon: "↑", color: "#05AD98" },
    { label: "Email open rate below average — try new subject line", icon: "!", color: "#FFC845" },
    { label: "Best time to post: Tuesday 9am", icon: "✦", color: "#6060CC" },
  ];

  const differentiators = [
    "A self-improving Learning Engine that gets better from your actual performance",
    "Powerful Community tools for Reddit & Hacker News",
    "Warm outbound & GTM sequences",
    "Smart Marketing Calendar + real results tracking",
  ];

  return (
    <section style={{ padding: "100px 24px", background: "#F8F8F8" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            display: "inline-block", background: "#1F1F1F", color: "#FFFFFF",
            fontFamily: "var(--font-dm-sans)", fontSize: 11, fontWeight: 600,
            letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "5px 16px", borderRadius: 999, marginBottom: 20,
          }}>Marketing OS</div>
          <h2 style={{
            fontFamily: "var(--font-syne)", fontWeight: 700,
            fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.02em", color: "#1F1F1F",
            lineHeight: 1.2,
          }}>
            Marketing that finally <span style={{ color: "#05AD98" }}>matches your speed.</span>
          </h2>
        </div>

        {/* Body copy */}
        <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 17, color: "#333333", lineHeight: 1.75, marginBottom: 32 }}>
          <p style={{ margin: 0, marginBottom: 18 }}>
            Most AI tools spit out generic content. VibeFlow is different. You upload your brand once. We remember it forever.
          </p>
          <p style={{ margin: 0, marginBottom: 18 }}>
            One natural language prompt gives you a full marketing system — not just content, but a complete, on-brand campaign engine that includes:
          </p>

          {/* Bullets — teal checkmarks */}
          <ul style={{ listStyle: "none", padding: 0, margin: "20px 0 24px" }}>
            {differentiators.map(item => (
              <li key={item} style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                padding: "10px 0",
              }}>
                <span style={{
                  flexShrink: 0, marginTop: 4,
                  width: 22, height: 22, borderRadius: "50%",
                  background: "#E6FAF8", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Check size={13} color="#05AD98" strokeWidth={3} />
                </span>
                <span style={{ color: "#1F1F1F" }}>{item}</span>
              </li>
            ))}
          </ul>

          <p style={{ margin: 0, marginBottom: 0 }}>
            No more tone-switching. No more manual branding. No more marketing bottlenecks.
          </p>
        </div>

        {/* Built for builders — emphasis */}
        <div style={{
          textAlign: "center", padding: "32px 0",
          borderTop: "1px solid #EEEEEE", borderBottom: "1px solid #EEEEEE",
          marginBottom: 56,
        }}>
          <p style={{
            fontFamily: "var(--font-syne)", fontWeight: 700,
            fontSize: "clamp(22px, 3vw, 28px)", color: "#1F1F1F",
            letterSpacing: "-0.02em", margin: 0,
          }}>
            Built for founders and teams who <span style={{ color: "#05AD98" }}>ship fast.</span>
          </p>
        </div>

        {/* Analytics mockup */}
        <div style={{
          background: "#FFFFFF", borderRadius: 20, border: "1px solid #EEEEEE",
          padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
        }}>
          <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 18, color: "#1F1F1F", marginBottom: 4 }}>
            Analytics Hub
          </div>
          <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787", marginBottom: 24 }}>
            AI-powered insights across all your campaigns
          </div>

          {/* Stats 2x2 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Total Reach", value: "24.3K", delta: "+12%" },
              { label: "Clicks", value: "1,842", delta: "+8%" },
              { label: "Conversions", value: "47", delta: "+23%" },
              { label: "Est. ROI", value: "4.2×", delta: "+0.8×" },
            ].map(s => (
              <div key={s.label} style={{ background: "#F8F8F8", borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#878787", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 24, color: "#1F1F1F", marginBottom: 2 }}>{s.value}</div>
                <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#05AD98", fontWeight: 500 }}>{s.delta} this week</div>
              </div>
            ))}
          </div>

          {/* AI Recommendations */}
          <div style={{
            fontFamily: "var(--font-dm-sans)", fontSize: 11, fontWeight: 600,
            color: "#878787", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12,
          }}>✦ AI Recommendations</div>
          {insights.map((ins, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "#F8F8F8", borderRadius: 10, padding: "10px 14px", marginBottom: 8,
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%", background: ins.color,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <span style={{ fontSize: 11, color: "#fff", fontWeight: 700 }}>{ins.icon}</span>
              </div>
              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#333333" }}>{ins.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
