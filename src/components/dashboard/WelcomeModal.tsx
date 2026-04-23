"use client";
import { useState } from "react";

/**
 * WelcomeModal — first-run onboarding for new VibeFlow users.
 *
 * Screen 1: Welcome message + primary CTA "Set up Brand Kit (60 sec)"
 *           + secondary "Skip for now" link.
 * Screen 2: Minimal 3-field Brand Kit form (app name, tagline, primary color).
 *
 * Both "Save" and "Skip" call /api/onboarding/complete which flips
 * user_usage.onboarded=true so the modal never reappears. If the user
 * Saved, we also write those 3 fields to brand_kit via /api/brand.
 *
 * After completion we call onComplete() so the parent can hide the modal
 * without a page reload.
 */

const PRESET_COLORS = ["#05AD98", "#6060CC", "#E24B4A", "#F59E0B", "#8B5CF6", "#EC4899", "#0EA5E9", "#1F1F1F"];

export default function WelcomeModal({ onComplete }: { onComplete: () => void }) {
  const [screen, setScreen] = useState<1 | 2>(1);
  const [appName, setAppName] = useState("");
  const [tagline, setTagline] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#05AD98");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSkip() {
    setSaving(true);
    try {
      await fetch("/api/onboarding/complete", { method: "POST" });
      onComplete();
    } catch {
      // If the network call fails, still hide the modal — we'll catch it next load
      onComplete();
    }
  }

  async function handleSave() {
    if (!appName.trim()) {
      setError("App name is required");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      // Write brand kit first
      const brandRes = await fetch("/api/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_name: appName.trim(),
          tagline: tagline.trim() || null,
          primary_color: primaryColor,
        }),
      });
      if (!brandRes.ok) {
        const data = await brandRes.json().catch(() => ({}));
        throw new Error(data.error || "Couldn't save Brand Kit");
      }

      // Then mark onboarded
      await fetch("/api/onboarding/complete", { method: "POST" });

      // Set tooltip flag in localStorage so Launchpad shows a one-time tip
      try { localStorage.setItem("vibeflow_show_launchpad_tip", "1"); } catch {}

      onComplete();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Try again.");
      setSaving(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 3000,
      background: "rgba(15,15,15,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        background: "#FFFFFF", borderRadius: 24, padding: "40px 40px 32px",
        maxWidth: 520, width: "100%", maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
      }}>

        {screen === 1 && (
          <>
            {/* Badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#E6FAF8", border: "1px solid rgba(5,173,152,0.2)",
              borderRadius: 999, padding: "5px 12px", marginBottom: 20,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#05AD98" }} />
              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 11, fontWeight: 600, color: "#05AD98", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                Welcome to VibeFlow
              </span>
            </div>

            {/* Headline */}
            <h2 style={{
              fontFamily: "var(--font-syne)", fontWeight: 700,
              fontSize: 28, color: "#1F1F1F",
              letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 14,
            }}>
              Let's lock in your vibe.
            </h2>

            {/* Body */}
            <p style={{
              fontFamily: "var(--font-dm-sans)", fontSize: 15, color: "#555555",
              lineHeight: 1.6, marginBottom: 28,
            }}>
              Tell us three quick things about your app and every campaign — social posts, emails, ads, SEO — comes out automatically on-brand. 60 seconds, then you're generating.
            </p>

            {/* What you'll set */}
            <div style={{
              background: "#F8F8F8", borderRadius: 14, padding: "16px 18px",
              marginBottom: 28,
              fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#555555", lineHeight: 1.7,
            }}>
              <div style={{ fontWeight: 500, color: "#1F1F1F", marginBottom: 4 }}>You'll set:</div>
              • App name<br />
              • One-line description<br />
              • Brand color
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => setScreen(2)}
                disabled={saving}
                style={{
                  width: "100%", padding: "14px 20px", borderRadius: 12, border: "none",
                  background: "#05AD98", color: "#FFFFFF",
                  fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 15,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#038C7A"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#05AD98"; }}
              >
                Set up Brand Kit — 60 seconds
              </button>
              <button
                onClick={handleSkip}
                disabled={saving}
                style={{
                  width: "100%", padding: "10px", background: "transparent", border: "none",
                  fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#AAAAAA",
                  cursor: saving ? "not-allowed" : "pointer",
                  textDecoration: "underline", textUnderlineOffset: 3,
                }}
              >
                {saving ? "Skipping…" : "Skip for now — I'll do it later"}
              </button>
            </div>
          </>
        )}

        {screen === 2 && (
          <>
            {/* Back link */}
            <button
              onClick={() => setScreen(1)}
              disabled={saving}
              style={{
                background: "none", border: "none", padding: 0, marginBottom: 12,
                fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >← Back</button>

            <h2 style={{
              fontFamily: "var(--font-syne)", fontWeight: 700,
              fontSize: 24, color: "#1F1F1F",
              letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 8,
            }}>
              Your Brand Kit
            </h2>
            <p style={{
              fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787",
              marginBottom: 24,
            }}>
              You can edit these anytime from the Brand Kit tab.
            </p>

            {/* App name */}
            <div style={{ marginBottom: 18 }}>
              <label style={{
                display: "block", marginBottom: 6,
                fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
                color: "#555555", letterSpacing: "0.04em", textTransform: "uppercase",
              }}>
                App name *
              </label>
              <input
                type="text"
                value={appName}
                onChange={(e) => { setAppName(e.target.value); setError(null); }}
                placeholder="e.g. HabitKit"
                autoFocus
                disabled={saving}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 10,
                  border: "1.5px solid #EEEEEE", outline: "none",
                  fontFamily: "var(--font-dm-sans)", fontSize: 15, color: "#1F1F1F",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#05AD98"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#EEEEEE"; }}
              />
            </div>

            {/* Tagline */}
            <div style={{ marginBottom: 18 }}>
              <label style={{
                display: "block", marginBottom: 6,
                fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
                color: "#555555", letterSpacing: "0.04em", textTransform: "uppercase",
              }}>
                One-line description
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Calm, shame-free habit tracking for busy people."
                disabled={saving}
                maxLength={120}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 10,
                  border: "1.5px solid #EEEEEE", outline: "none",
                  fontFamily: "var(--font-dm-sans)", fontSize: 15, color: "#1F1F1F",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#05AD98"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#EEEEEE"; }}
              />
            </div>

            {/* Primary color */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: "block", marginBottom: 8,
                fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
                color: "#555555", letterSpacing: "0.04em", textTransform: "uppercase",
              }}>
                Brand color
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setPrimaryColor(c)}
                    disabled={saving}
                    aria-label={`Set brand color to ${c}`}
                    style={{
                      width: 32, height: 32, borderRadius: 8, cursor: "pointer",
                      background: c,
                      border: primaryColor === c ? "3px solid #1F1F1F" : "3px solid transparent",
                      transition: "border-color 0.15s, transform 0.1s",
                    }}
                  />
                ))}
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  disabled={saving}
                  aria-label="Pick custom brand color"
                  style={{
                    width: 40, height: 32, padding: 0, border: "1.5px solid #EEEEEE",
                    borderRadius: 8, cursor: "pointer", background: "transparent",
                  }}
                />
                <span style={{
                  fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787",
                  marginLeft: 4,
                }}>{primaryColor}</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: 10,
                background: "rgba(226,75,74,0.08)", border: "1px solid rgba(226,75,74,0.2)",
                fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#E24B4A",
                marginBottom: 16,
              }}>{error}</div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={handleSave}
                disabled={saving || !appName.trim()}
                style={{
                  width: "100%", padding: "14px 20px", borderRadius: 12, border: "none",
                  background: saving || !appName.trim() ? "#CCCCCC" : "#05AD98",
                  color: "#FFFFFF",
                  fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 15,
                  cursor: saving || !appName.trim() ? "not-allowed" : "pointer",
                  transition: "background 0.15s",
                }}
              >
                {saving ? "Saving…" : "Save Brand Kit & start generating →"}
              </button>
              <button
                onClick={handleSkip}
                disabled={saving}
                style={{
                  width: "100%", padding: "10px", background: "transparent", border: "none",
                  fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#AAAAAA",
                  cursor: saving ? "not-allowed" : "pointer",
                  textDecoration: "underline", textUnderlineOffset: 3,
                }}
              >
                Skip for now
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
