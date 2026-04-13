export function HowItWorks() {
  const calCampaigns = [
    { day: 12, color: "#05AD98", label: "Thread" },
    { day: 13, color: "#6060CC", label: "LinkedIn" },
    { day: 15, color: "#05AD98", label: "Blog" },
    { day: 17, color: "#E24B4A", label: "Email" },
    { day: 19, color: "#6060CC", label: "Ads" },
    { day: 22, color: "#E1306C", label: "IG" },
    { day: 24, color: "#05AD98", label: "Campaign" },
  ];

  return (
    <section id="how-it-works" style={{ padding: "100px 24px", background: "#FFFFFF" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{
            display: "inline-block", background: "#E6FAF8", color: "#05AD98",
            fontFamily: "var(--font-dm-sans)", fontSize: 11, fontWeight: 600,
            letterSpacing: "0.1em", textTransform: "uppercase",
            padding: "5px 16px", borderRadius: 999, marginBottom: 20,
          }}>How It Works</div>
          <h2 style={{
            fontFamily: "var(--font-syne)", fontWeight: 700,
            fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.02em", color: "#1F1F1F",
          }}>Three steps. Full campaign.</h2>
        </div>

        {/* Steps */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 0, maxWidth: 700, margin: "0 auto 64px" }}>
          {[
            { step: "1", title: "Describe your app", desc: "Write one natural-language prompt. Tell us what your app does, who it's for, and what makes it different." },
            { step: "2", title: "Generate everything", desc: "Our multi-agent system creates copy, visuals, ads, email sequences, SEO keywords — all coordinated and on-brand." },
            { step: "3", title: "Schedule & track", desc: "Add campaigns to your calendar, connect analytics, and get AI recommendations as you grow." },
          ].map((s, i) => (
            <div key={s.step} style={{ textAlign: "center", padding: "0 24px", position: "relative" }}>
              {i < 2 && (
                <div style={{
                  position: "absolute", top: 20, right: -1,
                  width: 2, height: 40, background: "#EEEEEE",
                }} />
              )}
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "#E6FAF8", color: "#05AD98",
                fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 18,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 18px",
              }}>{s.step}</div>
              <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 17, color: "#1F1F1F", marginBottom: 10 }}>{s.title}</div>
              <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#878787", lineHeight: 1.65 }}>{s.desc}</div>
            </div>
          ))}
        </div>

        {/* Calendar mockup */}
        <div style={{
          background: "#F8F8F8", borderRadius: 20, border: "1px solid #EEEEEE",
          padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 18, color: "#1F1F1F", marginBottom: 2 }}>Marketing Calendar</div>
              <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787" }}>7 campaigns scheduled · April 2026</div>
            </div>
            <div style={{ background: "#05AD98", color: "#FFFFFF", padding: "7px 16px", borderRadius: 8, fontFamily: "var(--font-dm-sans)", fontSize: 13, fontWeight: 500 }}>
              + Schedule
            </div>
          </div>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
            {["S","M","T","W","T","F","S"].map((d, i) => (
              <div key={i} style={{ fontFamily: "var(--font-dm-sans)", fontSize: 10, color: "#AAAAAA", textAlign: "center", padding: "3px 0", fontWeight: 500 }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {Array.from({ length: 28 }, (_, i) => {
              const day = i + 1;
              const camp = calCampaigns.find(c => c.day === day);
              const isToday = day === 12;
              return (
                <div key={day} style={{
                  minHeight: 52, borderRadius: 8, padding: "6px",
                  background: isToday ? "#E6FAF8" : "#FAFAFA",
                  border: `1px solid ${isToday ? "#05AD98" : "#EEEEEE"}`,
                }}>
                  <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 11, color: isToday ? "#05AD98" : "#878787", fontWeight: isToday ? 700 : 400, marginBottom: 4 }}>{day}</div>
                  {camp && (
                    <div style={{
                      background: camp.color, borderRadius: 4, padding: "2px 5px",
                      fontFamily: "var(--font-dm-sans)", fontSize: 9, color: "#FFFFFF",
                      fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{camp.label}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
