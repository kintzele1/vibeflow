export function MarketingOS() {
  const insights = [
    { label: "Twitter thread outperforming LinkedIn 3:1", icon: "↑", color: "#05AD98" },
    { label: "Blog traffic up 42% this week", icon: "↑", color: "#05AD98" },
    { label: "Email open rate below average — try new subject line", icon: "!", color: "#FFC845" },
    { label: "Best time to post: Tuesday 9am", icon: "✦", color: "#6060CC" },
  ];

  return (
    <section style={{ padding: "100px 24px", background: "#F8F8F8" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{
            display: "inline-block", background: "#1F1F1F", color: "#FFFFFF",
            fontFamily: "var(--font-dm-sans)", fontSize: 11, fontWeight: 600,
            letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "5px 16px", borderRadius: 999, marginBottom: 20,
          }}>Marketing OS</div>
          <h2 style={{
            fontFamily: "var(--font-syne)", fontWeight: 700,
            fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.02em", color: "#1F1F1F",
            lineHeight: 1.2, marginBottom: 16,
          }}>
            Not just a launch tool.<br />
            <span style={{ color: "#05AD98" }}>Your entire marketing system.</span>
          </h2>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 17, color: "#878787", maxWidth: 520, margin: "0 auto" }}>
            Plan, generate, schedule, and track every campaign — all in one place, all perfectly on-brand.
          </p>
        </div>

        {/* 3 pillars */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 48 }}>
          {[
            { num: "01", title: "Generate", desc: "One prompt creates a full campaign across every channel — copy, social, ads, email, SEO." },
            { num: "02", title: "Schedule", desc: "Drag campaigns onto your marketing calendar. See the full month at a glance." },
            { num: "03", title: "Optimize", desc: "Connect your analytics. Get AI recommendations on what's working and what to do next." },
          ].map(p => (
            <div key={p.title} style={{
              background: "#FFFFFF", borderRadius: 16, padding: "28px 24px",
              border: "1px solid #EEEEEE",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            }}>
              <div style={{
                fontFamily: "var(--font-dm-sans)", fontSize: 11, fontWeight: 700,
                color: "#05AD98", letterSpacing: "0.08em", marginBottom: 12,
              }}>{p.num}</div>
              <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 20, color: "#1F1F1F", marginBottom: 10 }}>{p.title}</div>
              <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 15, color: "#878787", lineHeight: 1.65 }}>{p.desc}</div>
            </div>
          ))}
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
