"use client";

export default function CampaignsPage() {
  return (
    <div style={{ padding: "40px 48px" }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 32, color: "#1F1F1F", letterSpacing: "-0.02em", marginBottom: 8 }}>
          My Campaigns 📁
        </h1>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 16, color: "#878787" }}>
          All your generated campaigns in one place.
        </p>
      </div>

      {/* Empty state */}
      <div style={{
        background: "#FFFFFF", borderRadius: 20, border: "1.5px dashed #DDDDDD",
        padding: "80px 40px", textAlign: "center",
      }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>📭</div>
        <h3 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 20, color: "#1F1F1F", marginBottom: 12 }}>
          No campaigns yet
        </h3>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 15, color: "#878787", marginBottom: 28, maxWidth: 360, margin: "0 auto 28px" }}>
          Head to the Vibe Launchpad to generate your first campaign. It takes about 60 seconds.
        </p>
        <a href="/dashboard" style={{
          background: "#05AD98", color: "#FFFFFF",
          fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 15,
          padding: "12px 28px", borderRadius: 999, textDecoration: "none",
          display: "inline-block",
        }}>
          Go to Launchpad →
        </a>
      </div>
    </div>
  );
}
