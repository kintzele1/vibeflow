"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PLANS } from "@/lib/constants";

export default function BillingPage() {
  const [usage, setUsage] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("user_usage").select("*").eq("user_id", user.id).single()
        .then(({ data }) => setUsage(data));
    });
  }, []);

  const plan = usage?.plan === "annual" ? PLANS.annual : PLANS.launch;
  const searchesUsed = (plan.searches - (usage?.searches_remaining ?? plan.searches));
  const pct = Math.min((searchesUsed / plan.searches) * 100, 100);

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
              {usage ? plan.name : "No active plan"}
            </div>
            <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#878787" }}>
              {usage ? `${plan.searches.toLocaleString()} searches · ${plan.period}` : "Purchase a plan to get started"}
            </div>
          </div>
          {usage && (
            <div style={{
              background: "#E6FAF8", color: "#05AD98",
              fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
              padding: "4px 14px", borderRadius: 999,
            }}>Active</div>
          )}
        </div>

        {/* Usage bar */}
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
            {usage?.searches_remaining ?? plan.searches} searches remaining · Overage: ${plan.overage}/search
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <a href="/api/stripe-portal" style={{
            background: "#05AD98", color: "#FFFFFF",
            fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 14,
            padding: "10px 24px", borderRadius: 999, textDecoration: "none",
            display: "inline-block",
          }}>
            Manage subscription →
          </a>
          {!usage && (
            <a href="/#pricing" style={{
              background: "#1F1F1F", color: "#FFFFFF",
              fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 14,
              padding: "10px 24px", borderRadius: 999, textDecoration: "none",
              display: "inline-block",
            }}>
              Get a plan →
            </a>
          )}
        </div>
      </div>

      {/* Overage info */}
      <div style={{
        background: "#F8F8F8", borderRadius: 14, padding: "20px 24px",
        border: "1px solid #EEEEEE",
      }}>
        <h3 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 16, color: "#1F1F1F", marginBottom: 8 }}>
          Overage pricing
        </h3>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#878787", lineHeight: 1.6 }}>
          When you run out of searches, you can keep going. Overages are billed at{" "}
          <strong style={{ color: "#1F1F1F" }}>${PLANS.launch.overage}/search</strong> (Launch Kit) or{" "}
          <strong style={{ color: "#1F1F1F" }}>${PLANS.annual.overage}/search</strong> (Annual Plan).
          You can upgrade anytime to get more searches at a lower rate.
        </p>
      </div>
    </div>
  );
}
