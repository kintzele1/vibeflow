"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SuccessPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthed(!!user);
      setAuthChecked(true);
    });
  }, []);

  async function handleMagicLink() {
    if (!email.trim() || loading) return;
    setLoading(true);
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: "https://vibeflow.marketing/auth/callback?next=/dashboard" },
    });
    setSent(true);
    setLoading(false);
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: "https://vibeflow.marketing/auth/callback?next=/dashboard" },
    });
  }

  async function handleGitHub() {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: "https://vibeflow.marketing/auth/callback?next=/dashboard" },
    });
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#F8F8F8",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>

        {/* Logo */}
        <div style={{ marginBottom: 32 }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <span style={{
              fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 22,
              color: "#05AD98", letterSpacing: "-0.02em",
            }}>VibeFlow</span>
            <span style={{
              fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787",
              letterSpacing: "0.1em", textTransform: "uppercase", marginLeft: 6,
            }}>Marketing</span>
          </a>
        </div>

        {/* Success card */}
        <div style={{
          background: "#FFFFFF", borderRadius: 24, padding: "48px 40px",
          boxShadow: "0 8px 48px rgba(5,173,152,0.1)",
          border: "1.5px solid rgba(5,173,152,0.2)",
        }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>

          <h1 style={{
            fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 28,
            color: "#1F1F1F", letterSpacing: "-0.02em", marginBottom: 12,
          }}>
            Payment successful!
          </h1>

          {!authChecked ? (
            <p style={{
              fontFamily: "var(--font-dm-sans)", fontSize: 16, color: "#878787",
              lineHeight: 1.6, marginBottom: 32,
            }}>
              Loading…
            </p>
          ) : isAuthed ? (
            <>
              <p style={{
                fontFamily: "var(--font-dm-sans)", fontSize: 16, color: "#878787",
                lineHeight: 1.6, marginBottom: 32,
              }}>
                Your searches are ready. Head back to the dashboard and start generating.
              </p>
              <a
                href="/dashboard"
                style={{
                  display: "inline-block", width: "100%",
                  padding: "14px",
                  background: "#05AD98", color: "#FFFFFF",
                  borderRadius: 12, textDecoration: "none",
                  fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 15,
                  boxSizing: "border-box",
                }}
              >
                Continue to Dashboard →
              </a>
              <a
                href="/dashboard/billing"
                style={{
                  display: "inline-block", marginTop: 12,
                  fontFamily: "var(--font-dm-sans)", fontSize: 13,
                  color: "#878787", textDecoration: "none",
                }}
              >
                View billing details
              </a>
            </>
          ) : (
            <>
              <p style={{
                fontFamily: "var(--font-dm-sans)", fontSize: 16, color: "#878787",
                lineHeight: 1.6, marginBottom: 32,
              }}>
                Your searches are ready. Sign in or create your account to start generating campaigns.
              </p>

              {!sent ? (
                <>
                  {/* Magic link */}
                  <div style={{ marginBottom: 16 }}>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleMagicLink()}
                      placeholder="Enter your email"
                      style={{
                        width: "100%", padding: "14px 18px",
                        borderRadius: 12, border: "1.5px solid #EEEEEE",
                        fontFamily: "var(--font-dm-sans)", fontSize: 15, color: "#1F1F1F",
                        outline: "none", marginBottom: 10,
                        transition: "border-color 0.15s",
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = "#05AD98"}
                      onBlur={e => e.currentTarget.style.borderColor = "#EEEEEE"}
                    />
                    <button
                      onClick={handleMagicLink}
                      disabled={!email.trim() || loading}
                      style={{
                        width: "100%", padding: "14px",
                        background: !email.trim() ? "#CCCCCC" : "#05AD98",
                        color: "#FFFFFF", borderRadius: 12, border: "none",
                        fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 15,
                        cursor: !email.trim() ? "not-allowed" : "pointer",
                        transition: "background 0.15s",
                      }}
                    >
                      {loading ? "Sending..." : "Continue with Email →"}
                    </button>
                  </div>

                  {/* Divider */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
                    <div style={{ flex: 1, height: 1, background: "#EEEEEE" }} />
                    <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#AAAAAA" }}>or</span>
                    <div style={{ flex: 1, height: 1, background: "#EEEEEE" }} />
                  </div>

                  {/* OAuth buttons */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <button onClick={handleGoogle} style={{
                      width: "100%", padding: "13px",
                      background: "#FFFFFF", border: "1.5px solid #EEEEEE",
                      borderRadius: 12, fontFamily: "var(--font-dm-sans)", fontWeight: 500,
                      fontSize: 15, color: "#1F1F1F", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    }}>
                      <span>🔵</span> Continue with Google
                    </button>
                    <button onClick={handleGitHub} style={{
                      width: "100%", padding: "13px",
                      background: "#1F1F1F", border: "none",
                      borderRadius: 12, fontFamily: "var(--font-dm-sans)", fontWeight: 500,
                      fontSize: 15, color: "#FFFFFF", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    }}>
                      <span>⚫</span> Continue with GitHub
                    </button>
                  </div>
                </>
              ) : (
                <div style={{
                  background: "#E6FAF8", borderRadius: 14, padding: "24px",
                  border: "1px solid rgba(5,173,152,0.2)",
                }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📧</div>
                  <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 18, color: "#05AD98", marginBottom: 8 }}>
                    Check your email!
                  </div>
                  <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#05AD98", opacity: 0.8 }}>
                    We sent a magic link to <strong>{email}</strong>. Click it to access your dashboard.
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {authChecked && !isAuthed && (
          <p style={{
            fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#AAAAAA",
            marginTop: 24,
          }}>
            Already have an account? <a href="/login" style={{ color: "#05AD98", textDecoration: "none" }}>Sign in</a>
          </p>
        )}
      </div>
    </div>
  );
}
