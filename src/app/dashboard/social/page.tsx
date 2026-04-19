"use client";
import { useState, useRef, useEffect } from "react";
import { BrandKitToggle } from "@/components/dashboard/BrandKitToggle";

const SOCIAL_TYPES = [
  { id: "x_post",        label: "X Posts",          icon: "𝕏",  desc: "3 posts, different angles" },
  { id: "linkedin_posts",label: "LinkedIn Posts",    icon: "in", desc: "3 posts, founder to results" },
  { id: "instagram",     label: "Instagram",         icon: "📸", desc: "3 captions + hashtags" },
  { id: "tiktok",        label: "TikTok Scripts",    icon: "🎵", desc: "3 video scripts with hooks" },
  { id: "reddit_posts",  label: "Reddit Posts",      icon: "👾", desc: "3 posts for key subreddits" },
  { id: "threads",       label: "Threads",           icon: "🧵", desc: "5 conversational posts" },
  { id: "carousel",      label: "Carousel Post",     icon: "🎠", desc: "7-slide LinkedIn/Instagram" },
];

export default function SocialPage() {
  const [prompt, setPrompt] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [applyBrandKit, setApplyBrandKit] = useState(false);
  const [hasBrandKit, setHasBrandKit] = useState(false);
  const [isRefresh, setIsRefresh] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("prompt");
    const t = params.get("type");
    const r = params.get("refresh");
    if (p) setPrompt(p);
    if (t && SOCIAL_TYPES.some(s => s.id === t)) setSelected(t);
    if (r === "1") setIsRefresh(true);
  }, []);

  useEffect(() => {
    fetch("/api/brand").then(r => r.json()).then(data => {
      const kit = data.brand;
      const has = !!(kit?.app_name || kit?.brand_voice?.length || kit?.primary_color);
      setHasBrandKit(has);
      if (has) setApplyBrandKit(true);
    });
  }, []);

  async function handleGenerate() {
    if (!prompt.trim() || !selected || loading) return;
    setLoading(true);
    setDone(false);
    setOutput("");
    setError("");

    try {
      const response = await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, socialType: selected, applyBrandKit }),
      });

      if (response.status === 402) {
        const data = await response.json();
        setError(data.message ?? "No searches remaining.");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setError("Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) { setLoading(false); return; }

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        const lines = decoder.decode(value).split("\n\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) {
              setOutput(prev => {
                const next = prev + data.text;
                setTimeout(() => {
                  if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
                }, 10);
                return next;
              });
            }
            if (data.done) setDone(true);
            if (data.error) setError(data.error);
          } catch {}
        }
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    const label = SOCIAL_TYPES.find(t => t.id === selected)?.label ?? "social";
    const blob = new Blob([output], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vibeflow-${label.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const selectedType = SOCIAL_TYPES.find(t => t.id === selected);

  return (
    <div style={{ padding: "40px 48px", maxWidth: 900, margin: "0 auto" }}>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 32,
          color: "#1F1F1F", letterSpacing: "-0.02em", marginBottom: 8,
        }}>
          Social Media 📱
        </h1>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 16, color: "#878787" }}>
          Platform-native posts for every channel — ready to copy, schedule, or publish.
        </p>
      </div>

      {isRefresh && (
        <div style={{
          background: "#F0F5FF", border: "1px solid rgba(79,91,239,0.2)",
          borderRadius: 12, padding: "12px 16px", marginBottom: 20,
          fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#4F5BEF",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span>✨</span>
          <span>Regenerating with your latest Brand Kit. Your original is preserved in My Campaigns. Uses 1 search.</span>
        </div>
      )}

      {!output && (
        <>
          {/* Brand Kit toggle */}
          <BrandKitToggle
            enabled={applyBrandKit}
            onChange={setApplyBrandKit}
            hasBrandKit={hasBrandKit}
          />

          {/* Platform selector */}
          <div style={{ marginBottom: 24 }}>
            <div style={{
              fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
              color: "#AAAAAA", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12,
            }}>Choose platform</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
              {SOCIAL_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setSelected(type.id)}
                  style={{
                    background: selected === type.id ? "#E6FAF8" : "#FFFFFF",
                    border: `1.5px solid ${selected === type.id ? "#05AD98" : "#EEEEEE"}`,
                    borderRadius: 12, padding: "14px 16px",
                    cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{type.icon}</div>
                  <div style={{
                    fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 14,
                    color: selected === type.id ? "#05AD98" : "#1F1F1F", marginBottom: 3,
                  }}>{type.label}</div>
                  <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#AAAAAA" }}>
                    {type.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div style={{
            background: "#FFFFFF", borderRadius: 20, border: "1.5px solid #EEEEEE",
            boxShadow: "0 4px 24px rgba(5,173,152,0.06)", padding: "28px 32px",
          }}>
            <label style={{
              fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
              color: "#AAAAAA", letterSpacing: "0.08em", textTransform: "uppercase",
              display: "block", marginBottom: 12,
            }}>Describe your app</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. A habit tracker that actually works — no streaks, no guilt, just a calm daily check-in. iOS app, free with $4/mo Pro plan."
              rows={4}
              style={{
                width: "100%", border: "none", outline: "none", resize: "none",
                fontFamily: "var(--font-dm-sans)", fontSize: 16, color: "#1F1F1F",
                lineHeight: 1.65, background: "transparent",
              }}
            />
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginTop: 20, paddingTop: 20, borderTop: "1px solid #EEEEEE",
            }}>
              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#AAAAAA" }}>
                {selected ? `Generating: ${selectedType?.label}` : "Select a platform above"} · 1 search
              </span>
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || !selected || loading}
                style={{
                  background: !prompt.trim() || !selected ? "#CCCCCC" : "#05AD98",
                  color: "#FFFFFF",
                  fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 15,
                  padding: "12px 28px", borderRadius: 999, border: "none",
                  cursor: !prompt.trim() || !selected ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Generating..." : `Generate ${selectedType?.label ?? "Posts"} →`}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: "#FEF2F2", border: "1px solid rgba(226,75,74,0.2)",
          borderRadius: 12, padding: "16px 20px", marginBottom: 24,
          fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#E24B4A",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span>{error}</span>
          <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#E24B4A", fontSize: 18 }}>×</button>
        </div>
      )}

      {/* Loading */}
      {loading && !output && (
        <div style={{
          background: "#FFFFFF", borderRadius: 20, border: "1.5px solid #EEEEEE",
          padding: "60px 32px", textAlign: "center",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            border: "3px solid #E6FAF8", borderTop: "3px solid #05AD98",
            margin: "0 auto 20px", animation: "spin 0.8s linear infinite", display: "inline-block",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 18, color: "#1F1F1F", marginBottom: 8 }}>
            Writing your {selectedType?.label}...
          </p>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#878787" }}>
            Creating platform-native content that sounds like you.
          </p>
        </div>
      )}

      {/* Output */}
      {output && (
        <div>
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap",
          }}>
            <span style={{ fontSize: 20 }}>{selectedType?.icon}</span>
            <span style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 18, color: "#1F1F1F" }}>
              {selectedType?.label}
            </span>
            {done && (
              <span style={{
                background: "#E6FAF8", color: "#05AD98",
                fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
                padding: "3px 10px", borderRadius: 999,
              }}>Complete</span>
            )}
          </div>

          <div ref={outputRef} style={{
            background: "#FFFFFF", borderRadius: 20, border: "1.5px solid #EEEEEE",
            padding: "32px", maxHeight: 560, overflowY: "auto",
            fontFamily: "var(--font-dm-sans)", fontSize: 15,
            color: "#333333", lineHeight: 1.8, whiteSpace: "pre-wrap",
            boxShadow: "0 4px 24px rgba(5,173,152,0.06)",
          }}>
            {output}
            {loading && <span style={{ color: "#05AD98" }}>▌</span>}
          </div>

          {done && (
            <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
              <button onClick={handleExport} style={{
                background: "#05AD98", color: "#FFFFFF",
                fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 14,
                padding: "10px 24px", borderRadius: 999, border: "none", cursor: "pointer",
              }}>Export as Markdown ↓</button>
              <button onClick={() => navigator.clipboard.writeText(output)} style={{
                background: "#F8F8F8", color: "#1F1F1F",
                fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 14,
                padding: "10px 24px", borderRadius: 999, border: "1px solid #EEEEEE", cursor: "pointer",
              }}>Copy to clipboard</button>
              <button onClick={() => { setOutput(""); setDone(false); setSelected(null); }} style={{
                background: "transparent", color: "#878787",
                fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 14,
                padding: "10px 24px", borderRadius: 999, border: "1px solid #EEEEEE", cursor: "pointer",
              }}>Generate another</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
