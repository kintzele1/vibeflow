"use client";

const INTEGRATIONS = [
  { icon: "📊", name: "Google Analytics 4", desc: "Real-time widgets and AI insights in your Analytics Hub.", status: "coming" },
  { icon: "💳", name: "Stripe", desc: "Payments, usage tracking, and subscription management.", status: "connected" },
  { icon: "▲", name: "Vercel", desc: "Auto-deploy landing page variants directly from VibeFlow.", status: "coming" },
  { icon: "🐙", name: "GitHub", desc: "Pull app details and deploy pages from your repos.", status: "coming" },
  { icon: "𝕏", name: "X (Twitter)", desc: "Schedule and post social content directly.", status: "coming" },
  { icon: "in", name: "LinkedIn", desc: "Publish posts and track engagement.", status: "coming" },
  { icon: "📘", name: "Meta", desc: "Post to Facebook and Instagram, manage ad campaigns.", status: "coming" },
];

export default function IntegrationsPage() {
  return (
    <div style={{ padding: "40px 48px" }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 32, color: "#1F1F1F", letterSpacing: "-0.02em", marginBottom: 8 }}>
          Integrations 🔗
        </h1>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 16, color: "#878787" }}>
          Connect your tools. One-click setup for every platform.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {INTEGRATIONS.map(item => (
          <div key={item.name} style={{
            background: "#FFFFFF", borderRadius: 16, padding: "24px",
            border: `1px solid ${item.status === "connected" ? "rgba(5,173,152,0.2)" : "#EEEEEE"}`,
            display: "flex", alignItems: "flex-start", gap: 16,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: item.status === "connected" ? "#E6FAF8" : "#F8F8F8",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20,
            }}>{item.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <h3 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 15, color: "#1F1F1F" }}>
                  {item.name}
                </h3>
                <span style={{
                  fontFamily: "var(--font-dm-sans)", fontSize: 11, fontWeight: 500,
                  padding: "2px 8px", borderRadius: 999,
                  background: item.status === "connected" ? "#E6FAF8" : "#F0F0F0",
                  color: item.status === "connected" ? "#05AD98" : "#AAAAAA",
                }}>
                  {item.status === "connected" ? "Connected" : "Coming soon"}
                </span>
              </div>
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787", lineHeight: 1.6 }}>
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
