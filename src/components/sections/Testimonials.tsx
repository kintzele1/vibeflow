const TESTIMONIALS = [
  {
    quote: "Saved me 20+ hours on my last launch. I described my app once and had a full Product Hunt kit, Twitter thread, and email sequence in under 10 minutes.",
    name: "Alex K.",
    handle: "@alexbuilds",
    context: "Indie Hacker, 3x PH #1",
  },
  {
    quote: "I'm a developer, not a marketer. VibeFlow is the first tool that actually speaks my language and produces marketing I'm not embarrassed to publish.",
    name: "Sarah M.",
    handle: "@sarahcodes",
    context: "Solo founder, Cursor user",
  },
  {
    quote: "Used it to launch two apps in one month. The SEO briefs alone are worth the annual plan — the content it generates actually ranks.",
    name: "Ravi P.",
    handle: "@ravipbuilds",
    context: "Builder on Replit & Lovable",
  },
];

export function Testimonials() {
  return (
    <section style={{ padding: "100px 24px", background: "#F0FDFB" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{
            display: "inline-block", background: "#E6FAF8", color: "#05AD98",
            fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
            letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "6px 16px", borderRadius: 999, marginBottom: 20,
          }}>What builders say</div>
          <h2 style={{
            fontFamily: "var(--font-syne)", fontWeight: 700,
            fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.02em", color: "#1F1F1F",
          }}>
            Trusted by vibe coders
          </h2>
          {/* Logo row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#AAAAAA" }}>Teams using</span>
            {["Cursor", "Lovable", "Replit", "Product Hunt", "Vercel"].map(b => (
              <span key={b} style={{
                fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
                color: "#878787", background: "#FFFFFF",
                border: "1px solid #EEEEEE",
                padding: "4px 14px", borderRadius: 999,
              }}>{b}</span>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          {TESTIMONIALS.map((t) => (
            <div key={t.name} style={{
              background: "#FFFFFF", borderRadius: 20, padding: "36px 32px",
              border: "1px solid rgba(5,173,152,0.12)",
              boxShadow: "0 4px 24px rgba(5,173,152,0.06)",
            }}>
              {/* Stars */}
              <div style={{ color: "#05AD98", fontSize: 16, marginBottom: 20, letterSpacing: 2 }}>★★★★★</div>
              <p style={{
                fontFamily: "var(--font-dm-sans)", fontSize: 16,
                color: "#333333", lineHeight: 1.75, marginBottom: 28,
                fontStyle: "italic",
              }}>
                "{t.quote}"
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "#E6FAF8",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-syne)", fontWeight: 700,
                  fontSize: 16, color: "#05AD98",
                }}>
                  {t.name[0]}
                </div>
                <div>
                  <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 15, color: "#1F1F1F" }}>
                    {t.name}
                    <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#05AD98", fontWeight: 400, marginLeft: 6 }}>{t.handle}</span>
                  </div>
                  <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787" }}>{t.context}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
