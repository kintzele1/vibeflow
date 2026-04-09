"use client";
import { useState } from "react";

const FAQS = [
  {
    q: "How many searches do I get?",
    a: "The Launch Kit includes 100 searches for 30 days. The Annual Plan includes 1,200 searches (~100/month) over 12 months. Each major AI task — full campaign, SEO audit, ad set, email sequence — counts as one search.",
  },
  {
    q: "What counts as one search?",
    a: "One search = one major AI task. Generating a full campaign, running the SEO agent, building an ad set, or creating an email sequence each count as one search. Tweaking or iterating on output does not cost extra.",
  },
  {
    q: "Can I connect my GitHub or Vercel?",
    a: "Yes — the Integrations tab lets you connect GitHub and Vercel so VibeFlow can pull in your app details automatically and deploy landing page variants for you.",
  },
  {
    q: "What happens when I run out of searches?",
    a: "You can keep working — overages are billed at $0.49/search (Launch Kit) or $0.29/search (Annual). You can also upgrade your plan anytime from the Usage & Billing tab.",
  },
  {
    q: "Does it work for apps that aren't launched yet?",
    a: "Absolutely. VibeFlow works great for pre-launch — you can generate a full campaign, landing page copy, and launch kit before your app is even live.",
  },
  {
    q: "Which AI model powers it?",
    a: "VibeFlow runs on Claude (Anthropic) for all AI tasks — the same model behind some of the best writing and reasoning tools available today.",
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
