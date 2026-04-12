"use client";

type Props = {
  enabled: boolean;
  onChange: (val: boolean) => void;
  hasBrandKit: boolean;
};

export function BrandKitToggle({ enabled, onChange, hasBrandKit }: Props) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: enabled ? "#E6FAF8" : "#F8F8F8",
      border: `1.5px solid ${enabled ? "rgba(5,173,152,0.3)" : "#EEEEEE"}`,
      borderRadius: 12, padding: "12px 16px", marginBottom: 16,
      transition: "all 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>✦</span>
        <div>
          <div style={{
            fontFamily: "var(--font-dm-sans)", fontSize: 14, fontWeight: 500,
            color: enabled ? "#05AD98" : "#1F1F1F",
          }}>
            Apply Brand Kit
          </div>
          <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#878787" }}>
            {hasBrandKit
              ? "Use your brand colors, voice, and identity in generated content"
              : <span>No brand kit set — <a href="/dashboard/brand" style={{ color: "#05AD98", textDecoration: "none" }}>set it up here</a></span>
            }
          </div>
        </div>
      </div>

      <button
        onClick={() => hasBrandKit && onChange(!enabled)}
        disabled={!hasBrandKit}
        style={{
          width: 44, height: 24, borderRadius: 999,
          background: enabled ? "#05AD98" : "#CCCCCC",
          border: "none", cursor: hasBrandKit ? "pointer" : "not-allowed",
          position: "relative", transition: "background 0.2s", flexShrink: 0,
        }}
      >
        <div style={{
          position: "absolute", top: 2,
          left: enabled ? 22 : 2,
          width: 20, height: 20, borderRadius: "50%",
          background: "#FFFFFF",
          transition: "left 0.2s",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }} />
      </button>
    </div>
  );
}
