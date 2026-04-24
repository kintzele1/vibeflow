"use client";
import { useState } from "react";

const FAQS = [
  {
    q: "Is there a free tier?",
    a: "Yes. Every user gets one free generation per agent — that's 8 lifetime generations to try every channel before paying. When you're ready for more, Launch Kit ($49) unlocks 100 searches for 30 days, and Annual ($299) unlocks 1,200 searches for 12 months. Your Brand Kit, saved campaigns, and Calendar all stay open on free, too — only new generations are capped.",
  },
  {
    q: "How many searches do I get on paid plans?",
    a: "Launch Kit includes 100 searches valid for 30 days from purchase. Annual includes 1,200 searches (~100/month) over 12 months. Each major AI task — full campaign, SEO audit, ad set, email sequence, social post set — counts as one search.",
  },
  {
    q: "What counts as one search?",
    a: "One search = one major AI task. Generating a full campaign, running an individual agent like SEO or PPC, or building a social post set each count as one search. Editing, tweaking, or re-saving output doesn't cost extra.",
  },
  {
    q: "What happens when I run out of searches?",
    a: "Generation is paused until you upgrade or renew. Today we don't bill overages automatically — when you hit zero, you buy another Launch Kit or upgrade to Annual from the Billing page. Metered overage billing is on the v1.1 roadmap.",
  },
  {
    q: "Does it work for apps that aren't launched yet?",
    a: "Absolutely. VibeFlow works great for pre-launch — you can generate a full campaign, landing page copy, Product Hunt kit, and launch threads before your app is even live.",
  },
  {
    q: "What's the Continuous Learning Engine?",
    a: "An opt-in feature that makes your campaigns get sharper over time. When turned on, VibeFlow collects anonymized performance signals — never your prompt content, campaign text, or Brand Kit fields — and uses them to refine the agents. Optimization without you babysitting every output. Toggle anytime from Settings. See our Privacy Policy for the full data list.",
  },
  {
    q: "Can I connect Google Analytics?",
    a: "Yes. The Integrations tab lets you connect Google Analytics 4 via OAuth, with your token encrypted at rest. Once connected, the Analytics Hub shows per-campaign performance using UTM tagging. More integrations — Meta, LinkedIn, X — are on the post-launch roadmap.",
  },
  {
    q: "Which AI model powers it?",
    a: "VibeFlow runs on Claude (Anthropic) for every agent. Anthropic operates under a zero-retention agreement with us, meaning your prompts are never used to train the underlying model.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section style={{ padding: "100px 24px", background: "#FFFFFF" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{
            display: "inline-block", background: "#EEEEFF", color: "#6060CC",
            fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
            letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "6px 16px", borderRadius: 999, marginBottom: 20,
          }}>FAQ</div>
          <h2 style={{
            fontFamily: "var(--font-syne)", fontWeight: 700,
            fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-0.02em", color: "#1F1F1F",
          }}>Questions? We've got answers.</h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {FAQS.map((faq, i) => (
            <div
              key={i}
              style={{
                border: `1.5px solid ${open === i ? "#05AD98" : "#EEEEEE"}`,
                borderRadius: 14,
                overflow: "hidden",
                transition: "border-color 0.2s",
              }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: "100%", textAlign: "left",
                  padding: "20px 24px",
                  background: open === i ? "#F0FDFB" : "#FFFFFF",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
                  transition: "background 0.2s",
                }}
              >
                <span style={{
                  fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 16,
                  color: "#1F1F1F", letterSpacing: "-0.01em",
                }}>{faq.q}</span>
                <span style={{
                  color: "#05AD98", fontSize: 20, fontWeight: 300, flexShrink: 0,
                  transform: open === i ? "rotate(45deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                  display: "inline-block",
                }}>+</span>
              </button>
              {open === i && (
                <div style={{ padding: "0 24px 20px", background: "#F0FDFB" }}>
                  <p style={{
                    fontFamily: "var(--font-dm-sans)", fontSize: 15,
                    color: "#555555", lineHeight: 1.75,
                  }}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
