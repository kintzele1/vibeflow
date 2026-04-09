import { HOW_IT_WORKS } from "@/lib/constants";

const BENEFITS = [
  "No briefs, no agency, no back-and-forth. Just describe and go.",
  "Content, social, SEO, ads, email — all aligned, all on-brand, all at once.",
  "No manual work. Export or schedule with one click.",
];

export function HowItWorks() {
  return (
    <section id="how-it-works" style={{ padding: "100px 24px", background: "#F0FDFB" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: 72 }}>
          <div style={{
            display: "inline-block", background: "#E6FAF8", color: "#05AD98",
            fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
            letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "6px 16px", borderRadius: 999, marginBottom: 20,
          }}>How It Works</div>
          <h2 style={{
            fontFamily: "var(--font-syne)", fontWeight: 700,
            fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.02em",
            color: "#1F1F1F", maxWidth: 520, margin: "0 auto",
          }}>
            From idea to full campaign in minutes
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 28 }}>
          {HOW_IT_WORKS.map((item, i) => (
            <div key={item.step} style={{
              background: "#FFFFFF", borderRadius: 20, padding: "40px 32px",
              border: "1px solid rgba(5,173,152,0.15)",
              boxShadow: "0 4px 24px rgba(5,173,152,0.06)",
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%", background: "#05AD98",
                color: "#FFFFFF", fontFamily: "var(--font-syne)", fontWeight: 700,
                fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 24,
              }}>{item.step}</div>
              <h3 style={{
                fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 19,
                color: "#1F1F1F", marginBottom: 12, letterSpacing: "-0.01em",
              }}>
                {item.step === 2 ? "Multi-agent system gets to work" : item.title}
              </h3>
              <p style={{
                fontFamily: "var(--font-dm-sans)", fontSize: 15,
                color: "#555555", lineHeight: 1.7, marginBottom: 16,
              }}>{item.body}</p>
              <p style={{
                fontFamily: "var(--font-dm-sans)", fontSize: 13,
                color: "#05AD98", fontWeight: 500, lineHeight: 1.5,
              }}>{BENEFITS[i]}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
