"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { VibeFlowWordmark } from "@/components/logo/SparklerLogo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = createClient();

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
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
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleGoogle() {
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

            {/* OAuth buttons */}
            <button onClick={handleGoogle} style={{
              width: "100%", padding: "13px 20px",
              background: "#FFFFFF", border: "1.5px solid #EEEEEE",
              borderRadius: 12, cursor: "pointer",
              fontFamily: "var(--font-dm-sans)", fontSize: 15, fontWeight: 500,
              color: "#1F1F1F", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 10,
              transition: "border-color 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#05AD98"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#EEEEEE"}
            >
              <span>G</span> Continue with Google
            </button>

            <button onClick={handleGitHub} style={{
              width: "100%", padding: "13px 20px",
              background: "#1F1F1F", border: "1.5px solid #1F1F1F",
              borderRadius: 12, cursor: "pointer",
              fontFamily: "var(--font-dm-sans)", fontSize: 15, fontWeight: 500,
              color: "#FFFFFF", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 10,
              transition: "background 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#333"}
              onMouseLeave={e => e.currentTarget.style.background = "#1F1F1F"}
            >
              ⌥ Continue with GitHub
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
              <button type="submit" disabled={loading} style={{
                width: "100%", padding: "13px 20px",
                background: loading ? "#AAAAAA" : "#05AD98",
                border: "none", borderRadius: 12, cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "var(--font-dm-sans)", fontSize: 15, fontWeight: 500,
                color: "#FFFFFF", transition: "background 0.15s",
              }}>
                {loading ? "Sending..." : "Send magic link →"}
              </button>
            </form>

            <p style={{
              fontFamily: "var(--font-dm-sans)", fontSize: 12,
              color: "#AAAAAA", textAlign: "center", lineHeight: 1.5,
            }}>
              By signing in you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
