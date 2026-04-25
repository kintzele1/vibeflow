"use client";
import { useState } from "react";

export function Hero() {
  const [prompt, setPrompt] = useState("");

  return (
    <section style={{
      padding: "80px 24px 100px",
      background: "linear-gradient(180deg, #FFFFFF 0%, #F8F8F8 100%)",
      textAlign: "center",
    }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "#E6FAF8", border: "1px solid rgba(5,173,152,0.2)",
          borderRadius: 999, padding: "6px 16px", marginBottom: 32,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#05AD98" }} />
          <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, fontWeight: 500, color: "#05AD98" }}>
            Built for solo builders and vibe coders
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: "var(--font-syne)", fontWeight: 700,
          fontSize: "clamp(36px, 6vw, 68px)",
          letterSpacing: "-0.03em", color: "#1F1F1F",
          lineHeight: 1.1, marginBottom: 24,
        }}>
          One prompt.{" "}
          <span style={{ color: "#05AD98" }}>Full campaign.</span>
          <br />
          <span style={{ color: "#878787" }}>Always on-brand.</span>
        </h1>

        {/* Subheadline */}
        <p style={{
          fontFamily: "var(--font-dm-sans)", fontSize: "clamp(16px, 2vw, 20px)",
          color: "#555555", lineHeight: 1.6, marginBottom: 16,
          maxWidth: 720, margin: "0 auto 16px",
        }}>
          The AI Marketing Operating System that generates complete, coordinated campaigns across SEO, PPC, Social, Email, Affiliate, Community, Outbound, and more — all automatically styled with your logo, colors, tagline, and exact vibe.
        </p>

        {/* Supporting line — speed + learning hook */}
        <p style={{
          fontFamily: "var(--font-dm-sans)", fontSize: "clamp(14px, 1.6vw, 16px)",
          color: "#878787", lineHeight: 1.6, marginBottom: 40,
          maxWidth: 560, margin: "0 auto 40px",
          fontWeight: 500,
        }}>
          Campaigns in under 90 seconds. Gets smarter with every result.
        </p>

        {/* CTA buttons */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 48 }}>
          <a href="/login" style={{
            background: "#05AD98", color: "#FFFFFF",
            fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 16,
            padding: "14px 28px", borderRadius: 999, textDecoration: "none",
            textAlign: "center",
          }}>Try It Free – Generate Your First Campaign</a>
          <a href="#how-it-works" style={{
            background: "#F8F8F8", color: "#1F1F1F",
            fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 16,
            padding: "14px 28px", borderRadius: 999, textDecoration: "none",
            border: "1px solid #EEEEEE",
          }}>Watch 60-second demo →</a>
        </div>

        {/* Demo prompt box */}
        <div style={{
          background: "#FFFFFF", borderRadius: 20,
          border: "1.5px solid #EEEEEE",
          boxShadow: "0 8px 48px rgba(5,173,152,0.08)",
          padding: "28px 32px", maxWidth: 600, margin: "0 auto",
          textAlign: "left",
        }}>
          <label style={{
            fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
            color: "#AAAAAA", letterSpacing: "0.08em", textTransform: "uppercase",
            display: "block", marginBottom: 12,
          }}>Describe your app</label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. A habit tracker that actually works — no streaks, no guilt, just a calm daily check-in that takes 30 seconds. iOS app, free with a $4/mo Pro plan."
            rows={3}
            style={{
              width: "100%", border: "none", outline: "none", resize: "none",
              fontFamily: "var(--font-dm-sans)", fontSize: 16, color: "#1F1F1F",
              lineHeight: 1.65, background: "transparent",
            }}
          />
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginTop: 20, paddingTop: 20, borderTop: "1px solid #EEEEEE",
          }}>
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#AAAAAA" }}>
              {prompt.length} characters · 1 search
            </span>
            <a href="/login" style={{
              background: "#05AD98", color: "#FFFFFF",
              fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 15,
              padding: "12px 28px", borderRadius: 999, textDecoration: "none",
              display: "inline-block",
            }}>Generate Full Campaign →</a>
          </div>
        </div>
      </div>
    </section>
  );
}
