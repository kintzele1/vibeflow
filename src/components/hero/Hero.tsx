"use client";
import { useState } from "react";
import { SparklerLogo } from "@/components/logo/SparklerLogo";

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
          color: "#878787", lineHeight: 1.6, marginBottom: 48,
          maxWidth: 560, margin: "0 auto 48px",
        }}>
          Your complete marketing OS — from launch campaign to ongoing growth, all from a single prompt.
        </p>

        {/* Sparkler */}
        <div style={{ marginBottom: 48, display: "flex", justifyContent: "center" }}>
          <SparklerLogo size={80} colorway="teal" animate />
        </div>

        {/* CTA buttons */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 48 }}>
          <a href="#pricing" style={{
            background: "#05AD98", color: "#FFFFFF",
            fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 16,
            padding: "14px 32px", borderRadius: 999, textDecoration: "none",
          }}>Get Launch Kit — $49.99</a>
          <a href="#how-it-works" style={{
            background: "#F8F8F8", color: "#1F1F1F",
            fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 16,
            padding: "14px 32px", borderRadius: 999, textDecoration: "none",
            border: "1px solid #EEEEEE",
          }}>See how it works →</a>
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
