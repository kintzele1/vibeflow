"use client";

export default function AnalyticsPage() {
  return (
    <div style={{ padding: "40px 48px" }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 32, color: "#1F1F1F", letterSpacing: "-0.02em", marginBottom: 8 }}>
          Analytics Hub 📊
        </h1>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 16, color: "#878787" }}>
          Unified performance view across every channel — powered by GA4.
        </p>
      </div>

      {/* Placeholder metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Total Impressions", value: "—", note: "Connect GA4 to see data" },
          { label: "Click-through Rate", value: "—", note: "Connect GA4 to see data" },
          { label: "Campaigns Run", value: "0", note: "Generate your first campaign" },
          { label: "Searches Used", value: "0", note: "This month" },
        ].map(card => (
          <div key={card.label} style={{
            background: "#FFFFFF", borderRadius: 16, padding: "24px",
            border: "1px solid #EEEEEE",
          }}>
            <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#AAAAAA", marginBottom: 8 }}>
              {card.label}
            </div>
            <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 32, color: "#1F1F1F", marginBottom: 4 }}>
              {card.value}
            </div>
            <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#AAAAAA" }}>
              {card.note}
            </div>
          </div>
        ))}
      </div>

      {/* Connect GA4 CTA */}
      <div style={{
        background: "#FFFFFF", borderRadius: 20, border: "1.5px dashed #DDDDDD",
        padding: "60px 40px", textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>📊</div>
        <h3 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 20, color: "#1F1F1F", marginBottom: 12 }}>
          Connect Google Analytics 4
        </h3>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 15, color: "#878787", marginBottom: 28, maxWidth: 400, margin: "0 auto 28px" }}>
          See real-time traffic, conversions, and AI-powered recommendations — all in one place.
        </p>
        <a href="/dashboard/integrations" style={{
          background: "#05AD98", color: "#FFFFFF",
          fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 15,
          padding: "12px 28px", borderRadius: 999, textDecoration: "none",
          display: "inline-block",
        }}>
          Connect GA4 →
        </a>
      </div>
    </div>
  );
}
