"use client";

type Props = {
  enabled: boolean;
  onChange: (val: boolean) => void;
  hasBrandKit: boolean;
};

export function BrandKitToggle({ enabled, onChange, hasBrandKit }: Props) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: enabled && hasBrandKit ? "#E6FAF8" : "#F8F8F8",
        border: `1.5px solid ${enabled && hasBrandKit ? "rgba(5,173,152,0.3)" : "#EEEEEE"}`,
        borderRadius: hasBrandKit ? 12 : "12px 12px 0 0",
        padding: "12px 16px",
        transition: "all 0.2s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>✦</span>
          <div>
            <div style={{
              fontFamily: "var(--font-dm-sans)", fontSize: 14, fontWeight: 500,
              color: enabled && hasBrandKit ? "#05AD98" : "#1F1F1F",
            }}>
              Apply Brand Kit
            </div>
            <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#878787" }}>
              {hasBrandKit
                ? "Use your brand colors, voice, and identity in all generated content"
                : "Set up your brand once — colors, tone, audience — and apply it to everything"
              }
            </div>
          </div>
        </div>

        <button
          onClick={() => onChange(!enabled)}
          style={{
            width: 44, height: 24, borderRadius: 999,
            background: enabled && hasBrandKit ? "#05AD98" : "#CCCCCC",
            border: "none", cursor: "pointer",
            position: "relative", transition: "background 0.2s", flexShrink: 0,
          }}
        >
          <div style={{
            position: "absolute", top: 2,
            left: enabled ? 22 : 2,
            width: 20, height: 20, borderRadius: "50%",
            background: "#FFFFFF", transition: "left 0.2s",
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          }} />
        </button>
      </div>

      {/* Inline guidance when toggled on without brand kit */}
      {enabled && !hasBrandKit && (
        <div style={{
          background: "#FFFBEA", border: "1.5px solid rgba(255,180,0,0.25)",
          borderTop: "none", borderRadius: "0 0 12px 12px",
          padding: "12px 16px",
          display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, fontWeight: 500, color: "#8B6000", marginBottom: 3 }}>
              Your Brand Kit isn't set up yet
            </div>
            <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#8B6000", opacity: 0.85, lineHeight: 1.5 }}>
              Go to <strong>Brand Kit</strong> in the left sidebar to add your app name, colors, and brand voice.
              Once saved, toggle this on and every campaign will automatically match your brand.
            </div>
            <a href="/dashboard/brand" style={{
              display: "inline-block", marginTop: 8,
              fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
              color: "#05AD98", textDecoration: "none",
              background: "#E6FAF8", padding: "4px 12px", borderRadius: 999,
            }}>
              Set up Brand Kit →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
