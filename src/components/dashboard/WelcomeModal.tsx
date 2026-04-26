"use client";
import { useState } from "react";

/**
 * WelcomeModal — first-run onboarding for new VibeFlow users.
 *
 * Three screens:
 *   1. Welcome — sets the why ("brand-locked output every time") and
 *      offers a 60-second setup vs skip-for-now.
 *   2. Brand Basics — minimal 3-field Brand Kit (name, tagline, color).
 *   3. You're set — celebration with two paths: generate first campaign,
 *      or finish full Brand Kit (logo, voice, audience).
 *
 * "Save & continue" advances 2 → 3 instead of redirecting, so users always
 * see the celebration screen before leaving the modal. Skip on any screen
 * still calls /api/onboarding/complete and dismisses cleanly.
 *
 * Routing destinations:
 *   - "Generate first campaign" → /dashboard?onboarding=1
 *     (Launchpad shows a one-time guided tooltip pointing at the prompt input)
 *   - "Finish my Brand Kit" → /dashboard/brand
 *
 * After completion onComplete() is called so the parent can hide the modal
 * without a page reload.
 */

const PRESET_COLORS = ["#05AD98", "#6060CC", "#E24B4A", "#F59E0B", "#8B5CF6", "#EC4899", "#0EA5E9", "#1F1F1F"];

type Screen = 1 | 2 | 3;

export default function WelcomeModal({ onComplete }: { onComplete: () => void }) {
  const [screen, setScreen] = useState<Screen>(1);
  const [appName, setAppName] = useState("");
  const [tagline, setTagline] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#05AD98");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markOnboarded() {
    try {
      await fetch("/api/onboarding/complete", { method: "POST" });
    } catch {
      // If the network call fails, still hide the modal — we'll catch it next load
    }
  }

  async function handleSkip() {
    setSaving(true);
    await markOnboarded();
    onComplete();
  }

  async function handleSave() {
    if (!appName.trim()) {
      setError("App name is required");
      return;
    }
    setError(null);
    setSaving(true);
    try {
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

      await markOnboarded();
      // Advance to celebration screen instead of redirecting away. Lets
      // users explicitly choose Generate vs Finish-Brand-Kit instead of
      // being dropped on /dashboard/brand and wondering what happened.
      setScreen(3);
      setSaving(false);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Try again.");
      setSaving(false);
    }
  }

  function goToFirstCampaign() {
    onComplete();
    window.location.href = "/dashboard?onboarding=1";
  }

  function goToFullBrandKit() {
    onComplete();
    window.location.href = "/dashboard/brand";
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 3000,
      background: "rgba(15,15,15,0.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        background: "#FFFFFF", borderRadius: 24, padding: "32px 40px",
        maxWidth: 520, width: "100%", maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
      }}>

        {/* Progress indicator — visible on all screens for orientation */}
        <ProgressDots screen={screen} />

        {screen === 1 && (
          <>
            <Badge label="Welcome to VibeFlow" />

            <h2 style={{
              fontFamily: "var(--font-syne)", fontWeight: 700,
              fontSize: 28, color: "#1F1F1F",
              letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 14,
            }}>
              Let's lock in your vibe.
            </h2>

            <p style={{
              fontFamily: "var(--font-dm-sans)", fontSize: 15, color: "#555555",
              lineHeight: 1.6, marginBottom: 24,
            }}>
              Three quick questions about your app. Then every campaign — content, social, SEO, ads, email — comes out automatically on-brand. Sixty seconds, then you're generating.
            </p>

            <div style={{
              background: "#F8F8F8", borderRadius: 14, padding: "16px 18px",
              marginBottom: 28,
              fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#555555", lineHeight: 1.7,
            }}>
              <div style={{ fontWeight: 500, color: "#1F1F1F", marginBottom: 6 }}>You'll set:</div>
              <div>• App name</div>
              <div>• One-line description</div>
              <div>• Brand color</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => setScreen(2)}
                disabled={saving}
                style={primaryBtn(saving)}
                onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = "#038C7A"; }}
                onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = "#05AD98"; }}
              >
                Set up Brand Kit — 60 seconds
              </button>
              <button
                onClick={handleSkip}
                disabled={saving}
                style={subtleBtn(saving)}
              >
                {saving ? "Skipping…" : "Skip — I'll set this up later"}
              </button>
            </div>
          </>
        )}

        {screen === 2 && (
          <>
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
              Brand basics.
            </h2>
            <p style={{
              fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787",
              marginBottom: 24, lineHeight: 1.55,
            }}>
              Just the essentials. Logo, voice, and audience can wait — we'll get there.
            </p>

            <FormField label="App name *">
              <input
                type="text"
                value={appName}
                onChange={(e) => { setAppName(e.target.value); setError(null); }}
                placeholder="e.g. HabitKit"
                autoFocus
                disabled={saving}
                style={inputStyle()}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#05AD98"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#EEEEEE"; }}
              />
            </FormField>

            <FormField label="One-line description">
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Calm, shame-free habit tracking for busy people."
                disabled={saving}
                maxLength={120}
                style={inputStyle()}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#05AD98"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#EEEEEE"; }}
              />
            </FormField>

            <div style={{ marginBottom: 24 }}>
              <Label>Brand color</Label>
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

            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: 10,
                background: "rgba(226,75,74,0.08)", border: "1px solid rgba(226,75,74,0.2)",
                fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#E24B4A",
                marginBottom: 16,
              }}>{error}</div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={handleSave}
                disabled={saving || !appName.trim()}
                style={{
                  ...primaryBtn(saving || !appName.trim()),
                  background: saving || !appName.trim() ? "#CCCCCC" : "#05AD98",
                }}
              >
                {saving ? "Saving…" : "Save & continue →"}
              </button>
              <button
                onClick={handleSkip}
                disabled={saving}
                style={subtleBtn(saving)}
              >
                Skip for now
              </button>
            </div>
          </>
        )}

        {screen === 3 && (
          <>
            {/* Celebration */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "linear-gradient(135deg, #E6FAF8 0%, #D1F4EE 100%)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 32, marginBottom: 18,
                boxShadow: "0 4px 16px rgba(5,173,152,0.2)",
              }}>✨</div>

              <h2 style={{
                fontFamily: "var(--font-syne)", fontWeight: 700,
                fontSize: 28, color: "#1F1F1F",
                letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 12,
              }}>
                You're set, {appName.trim() || "builder"}.
              </h2>

              <p style={{
                fontFamily: "var(--font-dm-sans)", fontSize: 15, color: "#555555",
                lineHeight: 1.6, maxWidth: 380, margin: "0 auto",
              }}>
                Your brand basics are saved. Every agent will use them automatically when you toggle Brand Kit on.
              </p>
            </div>

            {/* What happens next */}
            <div style={{
              background: "#F8F8F8", borderRadius: 14, padding: "16px 18px",
              marginBottom: 24,
              fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#555555", lineHeight: 1.7,
            }}>
              <div style={{ fontWeight: 500, color: "#1F1F1F", marginBottom: 6 }}>You have 8 free generations:</div>
              <div>• 1 full campaign (Launchpad)</div>
              <div>• 1 each for Content, Social, Email, SEO, Ads, ASO, Community</div>
              <div style={{ color: "#878787", marginTop: 8, fontSize: 12 }}>
                No card needed. Upgrade only if you want more searches.
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={goToFirstCampaign}
                style={primaryBtn(false)}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#038C7A"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#05AD98"; }}
              >
                Generate my first campaign →
              </button>
              <button
                onClick={goToFullBrandKit}
                style={{
                  width: "100%", padding: "14px 20px", borderRadius: 12,
                  background: "#FFFFFF", color: "#1F1F1F",
                  fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 15,
                  cursor: "pointer", border: "1.5px solid #EEEEEE",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#05AD98"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#EEEEEE"; }}
              >
                Finish my Brand Kit first
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ───────── Small layout primitives — keep the markup above readable ───────── */

function ProgressDots({ screen }: { screen: Screen }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      marginBottom: 24,
    }}>
      {[1, 2, 3].map((n) => (
        <div
          key={n}
          aria-label={`Step ${n} of 3${n === screen ? " (current)" : n < screen ? " (complete)" : ""}`}
          style={{
            width: n === screen ? 28 : 8,
            height: 8, borderRadius: 4,
            background: n <= screen ? "#05AD98" : "#EEEEEE",
            transition: "all 0.2s",
          }}
        />
      ))}
      <span style={{
        marginLeft: 8,
        fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
        color: "#AAAAAA", letterSpacing: "0.04em",
      }}>
        Step {screen} of 3
      </span>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: "#E6FAF8", border: "1px solid rgba(5,173,152,0.2)",
      borderRadius: 999, padding: "5px 12px", marginBottom: 16,
    }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#05AD98" }} />
      <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 11, fontWeight: 600, color: "#05AD98", letterSpacing: "0.05em", textTransform: "uppercase" }}>
        {label}
      </span>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      display: "block", marginBottom: 8,
      fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
      color: "#555555", letterSpacing: "0.04em", textTransform: "uppercase",
    }}>{children}</label>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%", padding: "12px 14px", borderRadius: 10,
    border: "1.5px solid #EEEEEE", outline: "none",
    fontFamily: "var(--font-dm-sans)", fontSize: 15, color: "#1F1F1F",
  };
}

function primaryBtn(disabled: boolean): React.CSSProperties {
  return {
    width: "100%", padding: "14px 20px", borderRadius: 12, border: "none",
    background: disabled ? "#CCCCCC" : "#05AD98", color: "#FFFFFF",
    fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 15,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "background 0.15s",
  };
}

function subtleBtn(disabled: boolean): React.CSSProperties {
  return {
    width: "100%", padding: "10px", background: "transparent", border: "none",
    fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#AAAAAA",
    cursor: disabled ? "not-allowed" : "pointer",
    textDecoration: "underline", textUnderlineOffset: 3,
  };
}
