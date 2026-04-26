"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PLANS } from "@/lib/constants";

export default function BillingPage() {
  const [usage, setUsage] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("user_usage").select("*").eq("user_id", user.id).single()
        .then(({ data }) => setUsage(data));
    });
  }, []);

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
    } catch {
      setLoadingPlan(null);
    }
  }

  const plan = usage?.plan === "annual" ? PLANS.annual : PLANS.launch;
  const searchesUsed = (plan.searches - (usage?.searches_remaining ?? plan.searches));
  const pct = Math.min((searchesUsed / plan.searches) * 100, 100);
  const hasActivePlan = usage && usage.plan !== "free" && usage.searches_remaining > 0;
  const isFree = usage && usage.plan === "free";

  // Free-tier usage tracking — count of `free_*_used` flags on user_usage.
  // The schema has 8 such flags (one per agent).
  const FREE_TOTAL = 8;
  const freeUsed = isFree && usage ? [
    usage.free_launchpad_used, usage.free_content_used, usage.free_social_used,
    usage.free_seo_used, usage.free_ppc_used, usage.free_email_used,
    usage.free_aso_used, usage.free_community_used,
  ].filter(Boolean).length : 0;
  const freePct = (freeUsed / FREE_TOTAL) * 100;

  return (
    <div style={{ padding: "40px 48px", maxWidth: 720 }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 32, color: "#1F1F1F", letterSpacing: "-0.02em", marginBottom: 8 }}>
          Usage & Billing 💳
        </h1>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 16, color: "#878787" }}>
          Track your searches and manage your subscription.
        </p>
      </div>

      {/* Plan card */}
      <div style={{
        background: "#FFFFFF", borderRadius: 20,
        border: "1.5px solid rgba(5,173,152,0.2)",
        padding: "32px", marginBottom: 24,
        boxShadow: "0 4px 24px rgba(5,173,152,0.06)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 20, color: "#1F1F1F", marginBottom: 4 }}>
              {hasActivePlan ? plan.name : isFree ? "Free Plan" : "No active plan"}
            </div>
            <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#878787" }}>
              {hasActivePlan
                ? `${plan.searches.toLocaleString()} searches · ${plan.period}`
                : isFree
                ? "1 generation per agent · 8 lifetime generations"
                : "Purchase a plan to start generating campaigns"}
            </div>
          </div>
          {hasActivePlan && (
            <div style={{
              background: "#E6FAF8", color: "#05AD98",
              fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
              padding: "4px 14px", borderRadius: 999,
            }}>Active</div>
          )}
          {isFree && (
            <div style={{
              background: "#F0F0F0", color: "#878787",
              fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
              padding: "4px 14px", borderRadius: 999,
            }}>Free</div>
          )}
        </div>

        {/* Usage bar — paid plan */}
        {hasActivePlan && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787" }}>Searches used</span>
              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, fontWeight: 500, color: "#1F1F1F" }}>
                {searchesUsed} / {plan.searches}
              </span>
            </div>
            <div style={{ height: 8, background: "#EEEEEE", borderRadius: 999, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 999,
                background: pct > 90 ? "#E24B4A" : "#05AD98",
                width: `${pct}%`, transition: "width 0.5s ease",
              }} />
            </div>
            <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#AAAAAA", marginTop: 6 }}>
              {usage?.searches_remaining ?? 0} searches remaining
            </div>
          </div>
        )}

        {/* Usage bar — free plan */}
        {isFree && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787" }}>Free generations used</span>
              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, fontWeight: 500, color: "#1F1F1F" }}>
                {freeUsed} / {FREE_TOTAL}
              </span>
            </div>
            <div style={{ height: 8, background: "#EEEEEE", borderRadius: 999, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 999,
                background: freePct >= 100 ? "#E24B4A" : freePct > 75 ? "#F59E0B" : "#05AD98",
                width: `${freePct}%`, transition: "width 0.5s ease",
              }} />
            </div>
            <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#AAAAAA", marginTop: 6 }}>
              {FREE_TOTAL - freeUsed} free generations remaining across all agents
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {hasActivePlan ? (
            <a href="/api/stripe-portal" style={{
              background: "#05AD98", color: "#FFFFFF",
              fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 14,
              padding: "10px 24px", borderRadius: 999, textDecoration: "none",
              display: "inline-block",
            }}>
              Manage subscription →
            </a>
          ) : (
            <>
              <button onClick={() => handleCheckout("launch")} disabled={!!loadingPlan} style={{
                background: "#1F1F1F", color: "#FFFFFF",
                fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 14,
                padding: "10px 24px", borderRadius: 999, border: "none", cursor: "pointer",
              }}>
                {loadingPlan === "launch" ? "Opening Stripe…" : "Get Launch Kit — $49.99"}
              </button>
              <button onClick={() => handleCheckout("annual")} disabled={!!loadingPlan} style={{
                background: "#05AD98", color: "#FFFFFF",
                fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 14,
                padding: "10px 24px", borderRadius: 999, border: "none", cursor: "pointer",
              }}>
                {loadingPlan === "annual" ? "Opening Stripe…" : "Get Annual Plan — $99.99"}
              </button>
            </>
          )}
        </div>

        {/* Payment-flow guidance microcopy — sets expectations for the brief
            click → Stripe redirect → /success roundtrip so users don't refresh
            mid-flight or wonder why they got bounced to a Stripe page. */}
        {!hasActivePlan && (
          <p style={{
            fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#878787",
            marginTop: 14, lineHeight: 1.55,
          }}>
            Secure checkout via Stripe. Takes about 30 seconds — you'll come right back here when it clears, with searches activated immediately.
          </p>
        )}
      </div>

      {/* Limit reached / upgrade nudge */}
      {(isFree && freeUsed >= FREE_TOTAL) || (hasActivePlan && (usage?.searches_remaining ?? 0) === 0) ? (
        <div style={{
          background: "linear-gradient(135deg, #FFF4F4 0%, #FFEFEF 100%)",
          borderRadius: 14, padding: "20px 24px",
          border: "1px solid #F5C6C6",
        }}>
          <h3 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 16, color: "#1F1F1F", marginBottom: 8 }}>
            You've reached your {isFree ? "free" : "search"} limit — time to upgrade?
          </h3>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#878787", lineHeight: 1.6 }}>
            {isFree
              ? "You've used all 8 free generations. Pick a plan above to keep generating campaigns."
              : "You've used all your searches. Renew or upgrade your plan to keep generating."}
          </p>
        </div>
      ) : (
        <div style={{
          background: "#F8F8F8", borderRadius: 14, padding: "20px 24px",
          border: "1px solid #EEEEEE",
        }}>
          <h3 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 16, color: "#1F1F1F", marginBottom: 8 }}>
            What happens when you run out?
          </h3>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#878787", lineHeight: 1.6 }}>
            When you reach your {isFree ? "free generation" : "search"} limit, generation pauses until you{" "}
            {isFree ? "pick a plan" : "renew or upgrade"}. No surprise charges — you only pay for what you sign up for.
          </p>
        </div>
      )}
    </div>
  );
}
