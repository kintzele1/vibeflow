"use client";
import { useEffect, useState } from "react";

/**
 * /dashboard/settings
 *
 * Phase 1 scope: a single section — Privacy — with the Continuous Learning
 * Engine opt-in toggle. Additional sections (Notifications, Account, Data
 * Export, etc.) will be added post-launch.
 *
 * The Privacy Policy and Terms of Service point users here to opt out of the
 * Learning Engine. That promise must stay honored — don't delete this page
 * or rename the route without updating the docs.
 */

export default function SettingsPage() {
  const [optIn, setOptIn] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    fetch("/api/user/opt-in")
      .then((r) => r.json())
      .then((data) => {
        setOptIn(Boolean(data.ai_learning_opt_in));
      })
      .catch(() => setOptIn(true)); // fail open — default to opted in
  }, []);

  async function handleToggle(next: boolean) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/user/opt-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ai_learning_opt_in: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Couldn't update your preference");
      }
      setOptIn(next);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2500);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: "40px 48px", maxWidth: 760, margin: "0 auto" }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{
          fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 32,
          color: "#1F1F1F", letterSpacing: "-0.02em", marginBottom: 8,
        }}>
          Settings ⚙️
        </h1>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 16, color: "#878787" }}>
          Control how VibeFlow uses your data.
        </p>
      </div>

      {/* Privacy section */}
      <section style={{
        background: "#FFFFFF", borderRadius: 16, padding: "28px 32px",
        border: "1px solid #EEEEEE", marginBottom: 24,
      }}>
        <h2 style={{
          fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 20,
          color: "#1F1F1F", marginBottom: 6,
        }}>Privacy</h2>
        <p style={{
          fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787",
          marginBottom: 24,
        }}>
          Control what data you share with VibeFlow.
        </p>

        {/* Learning Engine opt-in row */}
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 20,
          padding: "18px 20px", borderRadius: 12,
          background: "#F8F8F8", border: "1px solid #EEEEEE",
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "var(--font-dm-sans)", fontSize: 15, fontWeight: 500,
              color: "#1F1F1F", marginBottom: 4,
            }}>
              Continuous Learning Engine
            </div>
            <p style={{
              fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#555555",
              lineHeight: 1.6, margin: 0,
            }}>
              Help make VibeFlow smarter by sharing anonymized performance signals when you generate campaigns. We collect <strong>metadata only</strong> — agent type, prompt length, a one-way hash of your Brand Kit. Never your prompt content, never your campaign text, never Brand Kit fields. <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#05AD98" }}>Learn more in Privacy Policy →</a>
            </p>
          </div>

          <label style={{
            position: "relative",
            width: 48, height: 26, flexShrink: 0,
            cursor: saving ? "not-allowed" : "pointer",
          }}>
            <input
              type="checkbox"
              checked={optIn ?? true}
              disabled={optIn === null || saving}
              onChange={(e) => handleToggle(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
            />
            <span style={{
              position: "absolute", inset: 0,
              background: (optIn ?? true) ? "#05AD98" : "#CCCCCC",
              borderRadius: 999,
              transition: "background 0.2s",
              opacity: saving ? 0.6 : 1,
            }} />
            <span style={{
              position: "absolute", top: 3, left: (optIn ?? true) ? 25 : 3,
              width: 20, height: 20, borderRadius: "50%", background: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              transition: "left 0.2s",
            }} />
          </label>
        </div>

        {/* Status + error */}
        <div style={{ marginTop: 14, minHeight: 20 }}>
          {optIn === null && (
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#AAAAAA" }}>
              Loading…
            </span>
          )}
          {optIn !== null && savedToast && (
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#05AD98" }}>
              ✓ Saved — your preference takes effect immediately.
            </span>
          )}
          {error && (
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#E24B4A" }}>
              {error}
            </span>
          )}
        </div>
      </section>

      {/* Learn more */}
      <div style={{
        fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787",
        lineHeight: 1.7, padding: "16px 20px",
        background: "#FAFAFA", borderRadius: 12, border: "1px solid #EEEEEE",
      }}>
        More settings coming soon — notifications, data export, account deletion. For now, manage your subscription on <a href="/dashboard/billing" style={{ color: "#05AD98" }}>Usage & Billing</a> and your brand on <a href="/dashboard/brand" style={{ color: "#05AD98" }}>Brand Kit</a>.
      </div>
    </div>
  );
}
