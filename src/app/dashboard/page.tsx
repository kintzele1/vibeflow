"use client";
import { useState } from "react";

export default function DashboardPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    // AI generation coming in Step 5
    setTimeout(() => setLoading(false), 1500);
  }

  return (
    <div style={{ padding: "40px 48px", maxWidth: 860, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{
          fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 32,
          color: "#1F1F1F", letterSpacing: "-0.02em", marginBottom: 8,
        }}>
          Vibe Launchpad ⚡
        </h1>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 16, color: "#878787" }}>
          Describe your app once. Get a full campaign across every channel.
        </p>
      </div>

      {/* Prompt box */}
      <div style={{
        background: "#FFFFFF", borderRadius: 20,
        border: "1.5px solid #EEEEEE",
        boxShadow: "0 4px 24px rgba(5,173,152,0.06)",
        padding: "28px 32px", marginBottom: 24,
      }}>
        <label style={{
          fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
          color: "#AAAAAA", letterSpacing: "0.08em", textTransform: "uppercase",
          display: "block", marginBottom: 12,
        }}>
          Describe your app
        </label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="e.g. A habit tracker that actually works — no streaks, no guilt, just a calm daily check-in that takes 30 seconds. iOS app, free with a $4/mo Pro plan..."
          rows={5}
          style={{
            width: "100%", border: "none", outline: "none", resize: "none",
            fontFamily: "var(--font-dm-sans)", fontSize: 16, color: "#1F1F1F",
            lineHeight: 1.65, background: "transparent",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, paddingTop: 20, borderTop: "1px solid #EEEEEE" }}>
          <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#AAAAAA" }}>
            {prompt.length} characters
          </span>
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            style={{
              background: loading || !prompt.trim() ? "#AAAAAA" : "#05AD98",
              color: "#FFFFFF",
              fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 15,
              padding: "12px 28px", borderRadius: 999, border: "none",
              cursor: loading || !prompt.trim() ? "not-allowed" : "pointer",
              transition: "background 0.15s, transform 0.15s",
            }}
            onMouseEnter={e => { if (!loading && prompt.trim()) { e.currentTarget.style.background = "#038C7A"; e.currentTarget.style.transform = "translateY(-1px)"; }}}
            onMouseLeave={e => { e.currentTarget.style.background = loading || !prompt.trim() ? "#AAAAAA" : "#05AD98"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            {loading ? "Generating..." : "Generate Full Campaign →"}
          </button>
        </div>
      </div>

      {/* Coming soon notice */}
      <div style={{
        background: "#EEEEFF", borderRadius: 12, padding: "16px 20px",
        border: "1px solid rgba(96,96,204,0.15)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <span style={{ fontSize: 20 }}>🚀</span>
        <div>
          <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, fontWeight: 500, color: "#3333AA", marginBottom: 2 }}>
            AI generation coming in Step 5
          </div>
          <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#6060CC" }}>
            The Claude multi-agent system will generate your full campaign here — content, social, SEO, ads, and more.
          </div>
        </div>
      </div>
    </div>
  );
}
