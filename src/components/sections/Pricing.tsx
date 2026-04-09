"use client";
import { PLANS } from "@/lib/constants";

export function Pricing() {
  return (
    <section id="pricing" style={{ padding: "100px 24px", background: "#FFFFFF" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{
            display: "inline-block", background: "#E6FAF8", color: "#05AD98",
            fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
            letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "6px 16px", borderRadius: 999, marginBottom: 20,
          }}>Simple Pricing</div>
          <h2 style={{
            fontFamily: "var(--font-syne)", fontWeight: 700,
            fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.02em", color: "#1F1F1F",
          }}>
            Start for less than your daily coffee.
            <br />
            <span style={{ color: "#05AD98" }}>Scale as you grow.</span>
          </h2>
          <p style={{
            fontFamily: "var(--font-dm-sans)", fontSize: 17, color: "#878787", marginTop: 16,
          }}>
            Each major AI task counts as one search — campaign, SEO audit, ad set, you name it.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24 }}>

          {/* Launch Kit */}
          <div style={{
            border: "1.5px solid #EEEEEE", borderRadius: 24, padding: "40px 36px",
            background: "#F8F8F8",
            boxShadow: "0 4px 24px rgba(0,0,0,0.05)",
          }}>
            <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 22, color: "#1F1F1F", marginBottom: 6 }}>
              {PLANS.launch.name}
            </div>
            <div style={{
              fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#05AD98",
              fontWeight: 500, marginBottom: 16,
              background: "#E6FAF8", display: "inline-block",
              padding: "3px 10px", borderRadius: 6,
            }}>
              Perfect for your first Product Hunt launch
            </div>
            <div style={{
              fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 48,
              color: "#1F1F1F", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 6,
            }}>{PLANS.launch.priceDisplay}</div>
            <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#878787", marginBottom: 32 }}>
              One-time · {PLANS.launch.searches} searches · {PLANS.launch.period}
            </div>

            <ul style={{ listStyle: "none", marginBottom: 32, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                `${PLANS.launch.searches} AI searches included`,
                "Full campaign generator",
                "Content + Social agents",
                "One-click export",
                `$${PLANS.launch.overage} per extra search`,
              ].map(item => (
                <li key={item} style={{ fontFamily: "var(--font-dm-sans)", fontSize: 15, color: "#555555", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#05AD98", fontWeight: 700 }}>✓</span>{item}
                </li>
              ))}
            </ul>

            <a href="/api/checkout?plan=launch"
              style={{
                display: "block", textAlign: "center",
                background: "#1F1F1F", color: "#FFFFFF",
                fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 16,
                padding: "14px 28px", borderRadius: 999, textDecoration: "none",
                transition: "background 0.15s, transform 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#333"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#1F1F1F"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              Get Launch Kit — {PLANS.launch.priceDisplay}
            </a>
          </div>

          {/* Annual — featured */}
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
              fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#05AD98",
              fontWeight: 500, marginBottom: 16,
              background: "#E6FAF8", display: "inline-block",
              padding: "3px 10px", borderRadius: 6,
            }}>
              Best value — 12× searches + SEO, PPC & Email agents
            </div>
            <div style={{
              fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 48,
              color: "#05AD98", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 6,
            }}>{PLANS.annual.priceDisplay}</div>
            <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#878787", marginBottom: 32 }}>
              Per year · {PLANS.annual.searches.toLocaleString()} searches · ~100/month
            </div>

            <ul style={{ listStyle: "none", marginBottom: 32, display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                `${PLANS.annual.searches.toLocaleString()} AI searches / year`,
                "Everything in Launch Kit",
                "SEO + PPC agents",
                "Email + Visual agents",
                `$${PLANS.annual.overage} per extra search`,
              ].map(item => (
                <li key={item} style={{ fontFamily: "var(--font-dm-sans)", fontSize: 15, color: "#555555", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#05AD98", fontWeight: 700 }}>✓</span>{item}
                </li>
              ))}
            </ul>

            <a href="/api/checkout?plan=annual"
              style={{
                display: "block", textAlign: "center",
                background: "#05AD98", color: "#FFFFFF",
                fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 16,
                padding: "14px 28px", borderRadius: 999, textDecoration: "none",
                transition: "background 0.15s, transform 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#038C7A"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#05AD98"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              Get Annual Plan — {PLANS.annual.priceDisplay}
            </a>
          </div>
        </div>

        <p style={{
          textAlign: "center", fontFamily: "var(--font-dm-sans)",
          fontSize: 13, color: "#AAAAAA", marginTop: 28,
        }}>
          Payments via Stripe. Cancel or upgrade anytime from your dashboard.
        </p>
      </div>
    </section>
  );
}
