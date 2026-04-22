"use client";
import { useState } from "react";
import { PLANS } from "@/lib/constants";

export function Pricing() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  async function handleCheckout(plan: "launch" | "annual") {
    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else { alert("Something went wrong. Please try again."); setLoadingPlan(null); }
    } catch {
      alert("Something went wrong. Please try again.");
      setLoadingPlan(null);
    }
  }

  return (
    <section id="pricing" style={{ padding: "100px 24px", background: "#F8F8F8" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{
            display: "inline-block", background: "#E6FAF8", color: "#05AD98",
            fontFamily: "var(--font-dm-sans)", fontSize: 11, fontWeight: 600,
            letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "6px 16px", borderRadius: 999, marginBottom: 20,
          }}>Simple Pricing</div>
          <h2 style={{
            fontFamily: "var(--font-syne)", fontWeight: 700,
            fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.02em", color: "#1F1F1F",
          }}>
            Start for less than your daily coffee.
            <br /><span style={{ color: "#05AD98" }}>Scale as you grow.</span>
          </h2>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 17, color: "#878787", marginTop: 16 }}>
            Each major AI task counts as one search — campaign, SEO audit, ad set, you name it.
          </p>
        </div>

        {/* Launch pricing banner */}
        <div style={{
          background: "linear-gradient(135deg, #1F1F1F 0%, #2D2D2D 100%)",
          borderRadius: 16, padding: "18px 24px", marginBottom: 28,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{
              background: "#05AD98", borderRadius: 6, padding: "3px 10px",
              fontFamily: "var(--font-dm-sans)", fontSize: 10, fontWeight: 700,
              color: "#FFFFFF", letterSpacing: "0.08em", textTransform: "uppercase",
              flexShrink: 0, marginTop: 2,
            }}>Early Access</div>
            <div>
              <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 15, fontWeight: 600, color: "#FFFFFF", marginBottom: 3 }}>
                We're in early access. Lock in founding member pricing before we raise rates.
              </div>
              <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                Prices will increase after the first 100 users. Your rate is locked in forever.
              </div>
            </div>
          </div>
          <div style={{
            background: "rgba(5,173,152,0.15)", border: "1px solid rgba(5,173,152,0.3)",
            borderRadius: 8, padding: "6px 14px",
            fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500, color: "#05AD98",
            flexShrink: 0, whiteSpace: "nowrap",
          }}>
            🔒 Founding rate — locked in for life
          </div>
        </div>

        {/* Plans */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: 24 }}>

          {/* Free */}
          <div style={{
            border: "1.5px solid #EEEEEE", borderRadius: 24, padding: "40px 32px",
            background: "#FFFFFF",
          }}>
            <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 22, color: "#1F1F1F", marginBottom: 6 }}>
              Free
            </div>
            <div style={{
              fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787", fontWeight: 500,
              background: "#F0F0F0", display: "inline-block", padding: "3px 10px", borderRadius: 6, marginBottom: 16,
            }}>Try every agent before you pay</div>
            <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 48, color: "#1F1F1F", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 4 }}>
              $0
            </div>
            <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787", fontWeight: 500, marginBottom: 4 }}>&nbsp;</div>
            <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#878787", marginBottom: 32 }}>
              Forever · 1 generation per agent · 9 total
            </div>
            <ul style={{ listStyle: "none", marginBottom: 32, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                "1 full campaign (Launchpad)",
                "1 content · 1 social · 1 email",
                "1 SEO · 1 Paid Ads · 1 ASO",
                "1 launch kit · 1 affiliate program",
                "Brand Kit, Calendar, saved campaigns",
                "No credit card required",
              ].map(item => (
                <li key={item} style={{ fontFamily: "var(--font-dm-sans)", fontSize: 15, color: "#555555", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#05AD98", fontWeight: 700 }}>✓</span>{item}
                </li>
              ))}
            </ul>
            <a href="/login" style={{
              display: "block", width: "100%", textAlign: "center", boxSizing: "border-box",
              background: "#FFFFFF", color: "#1F1F1F",
              fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 16,
              padding: "14px 28px", borderRadius: 999, textDecoration: "none",
              border: "1.5px solid #1F1F1F",
            }}>
              Start free →
            </a>
          </div>

          {/* Launch Kit */}
          <div style={{
            border: "1.5px solid #EEEEEE", borderRadius: 24, padding: "40px 36px",
            background: "#FFFFFF", boxShadow: "0 4px 24px rgba(0,0,0,0.05)",
          }}>
            <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 22, color: "#1F1F1F", marginBottom: 6 }}>
              {PLANS.launch.name}
            </div>
            <div style={{
              fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#05AD98", fontWeight: 500,
              background: "#E6FAF8", display: "inline-block", padding: "3px 10px", borderRadius: 6, marginBottom: 16,
            }}>Perfect for your first Product Hunt launch</div>
            <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 48, color: "#1F1F1F", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 4 }}>
              {PLANS.launch.priceDisplay}
            </div>
            <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#05AD98", fontWeight: 500, marginBottom: 4 }}>Founding member rate</div>
            <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#878787", marginBottom: 32 }}>
              One-time · {PLANS.launch.searches} searches · {PLANS.launch.period}
            </div>
            <ul style={{ listStyle: "none", marginBottom: 32, display: "flex", flexDirection: "column", gap: 12 }}>
              {[`${PLANS.launch.searches} AI searches included`, "Full campaign generator", "Content + Social agents", "One-click export", `$${PLANS.launch.overage} per extra search`].map(item => (
                <li key={item} style={{ fontFamily: "var(--font-dm-sans)", fontSize: 15, color: "#555555", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#05AD98", fontWeight: 700 }}>✓</span>{item}
                </li>
              ))}
            </ul>
            <button onClick={() => handleCheckout("launch")} disabled={!!loadingPlan} style={{
              display: "block", width: "100%", textAlign: "center",
              background: loadingPlan === "launch" ? "#AAAAAA" : "#1F1F1F", color: "#FFFFFF",
              fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 16,
              padding: "14px 28px", borderRadius: 999, border: "none",
              cursor: loadingPlan ? "not-allowed" : "pointer",
            }}>
              {loadingPlan === "launch" ? "Redirecting..." : `Get Launch Kit — ${PLANS.launch.priceDisplay}`}
            </button>
          </div>

          {/* Annual */}
          <div style={{
            border: "2px solid #05AD98", borderRadius: 24, padding: "40px 36px",
            background: "#FFFFFF", position: "relative",
            boxShadow: "0 12px 48px rgba(5,173,152,0.15)",
          }}>
            <div style={{
              position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
              background: "#05AD98", color: "#FFFFFF",
              fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 12,
              letterSpacing: "0.06em", textTransform: "uppercase",
              padding: "4px 16px", borderRadius: 999, whiteSpace: "nowrap",
            }}>Most Popular</div>
            <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 22, color: "#1F1F1F", marginBottom: 6 }}>
              {PLANS.annual.name}
            </div>
            <div style={{
              fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#05AD98", fontWeight: 500,
              background: "#E6FAF8", display: "inline-block", padding: "3px 10px", borderRadius: 6, marginBottom: 16,
            }}>Best value — 12× searches + SEO, PPC & Email agents</div>
            <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 48, color: "#05AD98", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 4 }}>
              {PLANS.annual.priceDisplay}
            </div>
            <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#05AD98", fontWeight: 500, marginBottom: 4 }}>Founding rate — locked in for life</div>
            <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#878787", marginBottom: 32 }}>
              Per year · {PLANS.annual.searches.toLocaleString()} searches · ~100/month
            </div>
            <ul style={{ listStyle: "none", marginBottom: 32, display: "flex", flexDirection: "column", gap: 12 }}>
              {[`${PLANS.annual.searches.toLocaleString()} AI searches / year`, "Everything in Launch Kit", "SEO + PPC agents", "Email + Visual agents", `$${PLANS.annual.overage} per extra search`].map(item => (
                <li key={item} style={{ fontFamily: "var(--font-dm-sans)", fontSize: 15, color: "#555555", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#05AD98", fontWeight: 700 }}>✓</span>{item}
                </li>
              ))}
            </ul>
            <button onClick={() => handleCheckout("annual")} disabled={!!loadingPlan} style={{
              display: "block", width: "100%", textAlign: "center",
              background: loadingPlan === "annual" ? "#AAAAAA" : "#05AD98", color: "#FFFFFF",
              fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 16,
              padding: "14px 28px", borderRadius: 999, border: "none",
              cursor: loadingPlan ? "not-allowed" : "pointer",
            }}>
              {loadingPlan === "annual" ? "Redirecting..." : `Get Annual Plan — ${PLANS.annual.priceDisplay}`}
            </button>
          </div>
        </div>

        <p style={{ textAlign: "center", fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#AAAAAA", marginTop: 28 }}>
          Payments via Stripe. Cancel or upgrade anytime from your dashboard.
        </p>
      </div>
    </section>
  );
}
