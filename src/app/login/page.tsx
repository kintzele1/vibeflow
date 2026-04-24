"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { VibeFlowWordmark } from "@/components/logo/SparklerLogo";

// Versioned key — bump if Terms/Privacy change materially, forces re-consent.
const CONSENT_KEY = "vibeflow_consent_v1";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [consented, setConsented] = useState(false);
  // priorConsent: user previously agreed to THIS version of Terms+Privacy on this device.
  // Bumping CONSENT_KEY (when Terms or Privacy change materially) invalidates and forces re-consent.
  const [priorConsent, setPriorConsent] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(CONSENT_KEY) === "1") {
        setConsented(true);
        setPriorConsent(true);
      }
    } catch {}
  }, []);

  const supabase = createClient();

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!consented) {
      setError("Please agree to the Terms and Privacy Policy before continuing.");
      return;
    }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  async function handleGitHub() {
    if (!consented) { setError("Please agree to the Terms and Privacy Policy before continuing."); return; }
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleGoogle() {
    if (!consented) { setError("Please agree to the Terms and Privacy Policy before continuing."); return; }
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#F0FDFB", padding: 24,
    }}>
      <div style={{
        width: "100%", maxWidth: 420,
        background: "#FFFFFF", borderRadius: 24,
        border: "1px solid #EEEEEE",
        boxShadow: "0 8px 48px rgba(5,173,152,0.08)",
        padding: "48px 40px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 32,
      }}>

        <VibeFlowWordmark size="md" colorway="teal" animate showTagline />

        {sent ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✉️</div>
            <h2 style={{
              fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 22,
              color: "#1F1F1F", marginBottom: 12,
            }}>Check your email</h2>
            <p style={{
              fontFamily: "var(--font-dm-sans)", fontSize: 15,
              color: "#878787", lineHeight: 1.6,
            }}>
              We sent a magic link to <strong>{email}</strong>. Click it to sign in — no password needed.
            </p>
          </div>
        ) : (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>

            <h2 style={{
              fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 22,
              color: "#1F1F1F", textAlign: "center",
            }}>Sign in to VibeFlow</h2>

            {/* Consent — required on first sign-up; hidden for returning users
                who already accepted this version of Terms + Privacy.
                If Terms or Privacy are updated, bump CONSENT_KEY to force re-consent. */}
            {!priorConsent && (
              <label style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                padding: "12px 14px", borderRadius: 12,
                background: consented ? "#F0FDFB" : "#FAFAFA",
                border: `1.5px solid ${consented ? "rgba(5,173,152,0.25)" : "#EEEEEE"}`,
                cursor: "pointer",
                transition: "background 0.15s, border-color 0.15s",
              }}>
                <input
                  type="checkbox"
                  checked={consented}
                  onChange={e => {
                    const checked = e.target.checked;
                    setConsented(checked);
                    if (checked) {
                      setError("");
                      try { localStorage.setItem(CONSENT_KEY, "1"); } catch {}
                    } else {
                      try { localStorage.removeItem(CONSENT_KEY); } catch {}
                    }
                  }}
                  style={{ marginTop: 3, accentColor: "#05AD98", cursor: "pointer", flexShrink: 0 }}
                />
                <span style={{
                  fontFamily: "var(--font-dm-sans)", fontSize: 13,
                  color: "#333333", lineHeight: 1.55,
                }}>
                  I agree to the{" "}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: "#05AD98", textDecoration: "underline" }}>Terms of Service</a>
                  {" "}and{" "}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#05AD98", textDecoration: "underline" }}>Privacy Policy</a>.
                  <span style={{ display: "block", fontSize: 12, color: "#878787", marginTop: 4 }}>
                    Note: VibeFlow uses an opt-in Continuous Learning Engine to improve agent quality. You can disable it anytime from Settings.
                  </span>
                </span>
              </label>
            )}

            {/* OAuth buttons */}
            <button onClick={handleGoogle} disabled={!consented} style={{
              width: "100%", padding: "13px 20px",
              background: "#FFFFFF", border: "1.5px solid #EEEEEE",
              borderRadius: 12, cursor: consented ? "pointer" : "not-allowed",
              opacity: consented ? 1 : 0.55,
              fontFamily: "var(--font-dm-sans)", fontSize: 15, fontWeight: 500,
              color: "#1F1F1F", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 10,
              transition: "border-color 0.15s, opacity 0.15s",
            }}
              onMouseEnter={e => { if (consented) e.currentTarget.style.borderColor = "#05AD98"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#EEEEEE"; }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" />
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
              </svg>
              Continue with Google
            </button>

            <button onClick={handleGitHub} disabled={!consented} style={{
              width: "100%", padding: "13px 20px",
              background: "#1F1F1F", border: "1.5px solid #1F1F1F",
              borderRadius: 12, cursor: consented ? "pointer" : "not-allowed",
              opacity: consented ? 1 : 0.55,
              fontFamily: "var(--font-dm-sans)", fontSize: 15, fontWeight: 500,
              color: "#FFFFFF", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 10,
              transition: "background 0.15s, opacity 0.15s",
            }}
              onMouseEnter={e => { if (consented) e.currentTarget.style.background = "#333"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#1F1F1F"; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              Continue with GitHub
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: "#EEEEEE" }} />
              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#AAAAAA" }}>or</span>
              <div style={{ flex: 1, height: 1, background: "#EEEEEE" }} />
            </div>

            {/* Magic link form */}
            <form onSubmit={handleMagicLink} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  width: "100%", padding: "13px 16px",
                  border: "1.5px solid #EEEEEE", borderRadius: 12,
                  fontFamily: "var(--font-dm-sans)", fontSize: 15, color: "#1F1F1F",
                  outline: "none", transition: "border-color 0.15s",
                }}
                onFocus={e => e.currentTarget.style.borderColor = "#05AD98"}
                onBlur={e => e.currentTarget.style.borderColor = "#EEEEEE"}
              />
              {error && (
                <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#E24B4A" }}>{error}</p>
              )}
              <button type="submit" disabled={loading || !consented} style={{
                width: "100%", padding: "13px 20px",
                background: (loading || !consented) ? "#AAAAAA" : "#05AD98",
                border: "none", borderRadius: 12,
                cursor: (loading || !consented) ? "not-allowed" : "pointer",
                opacity: !consented ? 0.7 : 1,
                fontFamily: "var(--font-dm-sans)", fontSize: 15, fontWeight: 500,
                color: "#FFFFFF", transition: "background 0.15s, opacity 0.15s",
              }}>
                {loading ? "Sending..." : "Send magic link →"}
              </button>
            </form>

            {/* Returning users: small reminder text instead of the big checkbox.
                They already consented on this device; this just reminds them. */}
            {priorConsent && (
              <p style={{
                fontFamily: "var(--font-dm-sans)", fontSize: 12,
                color: "#AAAAAA", textAlign: "center", lineHeight: 1.5,
              }}>
                Signing in continues your agreement to our{" "}
                <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: "#878787", textDecoration: "underline" }}>Terms</a>
                {" "}and{" "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#878787", textDecoration: "underline" }}>Privacy Policy</a>.
              </p>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
