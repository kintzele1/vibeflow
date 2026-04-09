"use client";
import { SparklerLogo } from "@/components/logo/SparklerLogo";

export function FinalCTA() {
  return (
    <section style={{
      padding: "100px 24px",
      background: "#1F1F1F",
      textAlign: "center",
    }}>
      <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>

        <SparklerLogo size={72} colorway="white" animate={false} />

        <h2 style={{
          fontFamily: "var(--font-syne)", fontWeight: 700,
          fontSize: "clamp(32px, 5vw, 52px)", letterSpacing: "-0.03em",
          color: "#FFFFFF", lineHeight: 1.1,
        }}>
          Ready to vibe-code
          <br />
          <span style={{ color: "#05AD98" }}>your marketing?</span>
        </h2>

        <p style={{
          fontFamily: "var(--font-dm-sans)", fontSize: 18,
          color: "rgba(255,255,255,0.55)", lineHeight: 1.7, maxWidth: 480,
        }}>
          One prompt. Full campaign. Stop letting marketing be the bottleneck between you and your launch.
        </p>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          <a
            href="#pricing"
            style={{
              background: "#05AD98", color: "#FFFFFF",
              fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 17,
              padding: "16px 36px", borderRadius: 999, textDecoration: "none",
              transition: "background 0.15s, transform 0.15s",
              display: "inline-block",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#038C7A"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#05AD98"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            Get Launch Kit — $49.99
          </a>
          <a
            href="#pricing"
            style={{
              background: "transparent", color: "rgba(255,255,255,0.7)",
              fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 17,
              padding: "16px 36px", borderRadius: 999, textDecoration: "none",
              border: "1.5px solid rgba(255,255,255,0.2)",
              transition: "border-color 0.15s, color 0.15s",
              display: "inline-block",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#05AD98"; e.currentTarget.style.color = "#05AD98"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
          >
            View Annual Plan
          </a>
        </div>

        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
          No subscription required to start · Cancel anytime · Powered by Claude
        </p>
      </div>
    </section>
  );
}
