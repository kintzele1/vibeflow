"use client";
import { SparklerLogo } from "@/components/logo/SparklerLogo";

export function Hero() {
  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "120px 24px 100px",
        background: "linear-gradient(180deg, #F0FDFB 0%, #FFFFFF 60%)",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Soft background orbs */}
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "8%", left: "5%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(5,173,152,0.07) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: "15%", right: "5%", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(187,187,251,0.1) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "10%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(5,173,152,0.05) 0%, transparent 70%)" }} />
      </div>

      {/* Sparkler */}
      <div style={{ marginBottom: 28 }}>
        <SparklerLogo size={88} colorway="teal" animate />
      </div>

      {/* Eyebrow */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        background: "#E6FAF8", border: "1px solid rgba(5,173,152,0.2)",
        borderRadius: 999, padding: "6px 16px", marginBottom: 28,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#05AD98", display: "inline-block" }} />
        <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#05AD98", fontWeight: 500 }}>
          AI-powered marketing for vibe coders
        </span>
      </div>

      {/* Headline */}
      <h1 style={{
        fontFamily: "var(--font-syne)",
        fontWeight: 700,
        fontSize: "clamp(38px, 6.5vw, 68px)",
        letterSpacing: "-0.03em",
        lineHeight: 1.08,
        color: "#1F1F1F",
        maxWidth: 840,
        marginBottom: 24,
      }}>
        One prompt.{" "}
        <span style={{ color: "#05AD98", fontWeight: 700 }}>Full campaign.</span>
        <br />
        Perfectly on-brand.
      </h1>

      {/* Subheadline */}
      <p style={{
        fontFamily: "var(--font-dm-sans)",
        fontSize: "clamp(17px, 2.2vw, 20px)",
        color: "#878787",
        maxWidth: 580,
        lineHeight: 1.75,
        marginBottom: 52,
        fontWeight: 400,
      }}>
        Describe your app once and get a complete, coordinated campaign
        across every channel — instantly. Built for vibe coders using
        Cursor, Lovable, and Replit.
      </p>

      {/* Prompt demo box */}
      <div style={{
        width: "100%", maxWidth: 660,
        background: "#FFFFFF",
        border: "1.5px solid #E0E0E0",
        borderRadius: 20,
        padding: "24px 28px",
        marginBottom: 20,
        boxShadow: "0 8px 48px rgba(5,173,152,0.1), 0 2px 12px rgba(0,0,0,0.06)",
        textAlign: "left",
      }}>
        <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 11, color: "#AAAAAA", marginBottom: 10, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500 }}>
          Describe your app
        </div>
        <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 17, color: "#1F1F1F", lineHeight: 1.6, marginBottom: 20 }}>
          "A habit tracker that actually works — no streaks, no guilt, just a calm daily check-in that takes 30 seconds. iOS app, free with a $4/mo Pro plan. Built with Lovable."
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a href="#pricing" style={{
            flex: 1, minWidth: 200,
            background: "#05AD98", color: "#FFFFFF",
            fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 16,
            padding: "14px 28px", borderRadius: 999,
            textDecoration: "none", textAlign: "center",
            transition: "background 0.15s, transform 0.15s",
            display: "block",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#038C7A"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#05AD98"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            Get Launch Kit — $49.99
          </a>
          <a href="#how-it-works" style={{
            flex: 1, minWidth: 180,
            background: "transparent", color: "#1F1F1F",
            fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 16,
            padding: "14px 28px", borderRadius: 999,
            textDecoration: "none", textAlign: "center",
            border: "1.5px solid #E0E0E0",
            transition: "border-color 0.15s, color 0.15s",
            display: "block",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#05AD98"; e.currentTarget.style.color = "#05AD98"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#E0E0E0"; e.currentTarget.style.color = "#1F1F1F"; }}
          >
            ▶ Watch 45-second demo
          </a>
        </div>
      </div>

      {/* Trust badges */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
        <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#AAAAAA" }}>Built for teams using</span>
        {["Cursor", "Lovable", "Replit", "Product Hunt"].map(b => (
          <span key={b} style={{
            fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
            color: "#878787", background: "#F4F4F4",
            padding: "4px 12px", borderRadius: 999,
          }}>{b}</span>
        ))}
      </div>
    </section>
  );
}
