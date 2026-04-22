"use client";
import { useState, useEffect } from "react";
import { BrandKitToggle } from "@/components/dashboard/BrandKitToggle";
import SuccessBanner from "@/components/dashboard/SuccessBanner";
import { createClient } from "@/lib/supabase/client";

const SECTIONS = [
  "VIBE ANALYSIS", "TAGLINES", "HERO COPY", "TWITTER/X THREAD",
  "LINKEDIN POST", "REDDIT POST", "PRODUCT HUNT",
  "EMAIL SEQUENCE", "SEO KEYWORDS", "AD HEADLINES",
];

export default function DashboardPage() {
  const [prompt, setPrompt] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [applyBrandKit, setApplyBrandKit] = useState(false);
  const [hasBrandKit, setHasBrandKit] = useState(false);
  const [isRefresh, setIsRefresh] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  // Pre-fill from URL params (refresh flow from campaign library)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("prompt");
    const r = params.get("refresh");
    if (p) setPrompt(p);
    if (r === "1") setIsRefresh(true);
  }, []);

  // Show welcome banner for brand-new free users who haven't used any agent yet.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("user_usage")
        .select("plan, free_launchpad_used, free_content_used, free_social_used, free_seo_used, free_ppc_used, free_email_used, free_aso_used, free_community_used")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (!data) return;
          if (data.plan !== "free") return;
          const anyUsed = [
            data.free_launchpad_used, data.free_content_used, data.free_social_used,
            data.free_seo_used, data.free_ppc_used, data.free_email_used, data.free_aso_used,
            data.free_community_used,
          ].some(Boolean);
          if (!anyUsed) setShowWelcome(true);
        });
    });
  }, []);

  useEffect(() => {
    fetch("/api/brand").then(r => r.json()).then(data => {
      const kit = data.brand;
      setHasBrandKit(!!(kit?.app_name || kit?.brand_voice?.length || kit?.primary_color));
      if (kit?.app_name) setApplyBrandKit(true);
    });
  }, []);

  async function handleGenerate() {
    if (!prompt.trim() || loading) return;
    setLoading(true); setDone(false); setOutput(""); setError("");

    try {
      const response = await fetch("/api/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, applyBrandKit }),
      });

      if (response.status === 402) {
        const data = await response.json();
        setError(data.message ?? "No searches remaining.");
        setLoading(false); return;
      }
      if (!response.ok) { setError("Something went wrong."); setLoading(false); return; }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) { setLoading(false); return; }

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        for (const line of decoder.decode(value).split("\n\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) setOutput(prev => prev + data.text);
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
    const blob = new Blob([output], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `vibeflow-campaign-${Date.now()}.md`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ padding: "40px 48px", maxWidth: 900, margin: "0 auto" }}>
      <SuccessBanner />

      {showWelcome && (
        <div style={{
          background: "linear-gradient(135deg, #E6FAF8 0%, #F0F5FF 100%)",
          border: "1px solid rgba(5,173,152,0.2)",
          borderRadius: 16, padding: "20px 24px", marginBottom: 20,
          display: "flex", alignItems: "flex-start", gap: 14,
          position: "relative",
        }}>
          <div style={{ fontSize: 28, flexShrink: 0 }}>✨</div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 16,
              color: "#1F1F1F", marginBottom: 6,
            }}>
              Welcome to VibeFlow — you're on the free tier
            </div>
            <div style={{
              fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#555555",
              lineHeight: 1.6, marginBottom: 10,
            }}>
              You get <strong>1 free generation per agent</strong> — 8 total across the Launchpad, Content, Social, Email, SEO, Paid Ads, ASO, and Community & Launch. Start here with a full campaign, or skip to any agent in the sidebar. Upgrade any time for 100 searches across everything.
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a href="/dashboard/brand" style={{
                fontFamily: "var(--font-dm-sans)", fontSize: 13, fontWeight: 500,
                color: "#05AD98", background: "#FFFFFF",
                padding: "6px 14px", borderRadius: 999, textDecoration: "none",
                border: "1px solid rgba(5,173,152,0.3)",
              }}>Set up Brand Kit first →</a>
              <a href="/#pricing" style={{
                fontFamily: "var(--font-dm-sans)", fontSize: 13, fontWeight: 500,
                color: "#878787", textDecoration: "none",
                padding: "6px 14px",
              }}>See pricing →</a>
            </div>
          </div>
          <button onClick={() => setShowWelcome(false)} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#AAAAAA", fontSize: 20, padding: 4, lineHeight: 1,
            position: "absolute", top: 12, right: 14,
          }}>×</button>
        </div>
      )}

      {isRefresh && (
        <div style={{
          background: "#F0F5FF", border: "1px solid rgba(79,91,239,0.2)",
          borderRadius: 12, padding: "12px 16px", marginBottom: 20,
          fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#4F5BEF",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span>✨</span>
          <span>Regenerating with your latest Brand Kit. Your original campaign is preserved in My Campaigns. Uses 1 search.</span>
        </div>
      )}

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 32, color: "#1F1F1F", letterSpacing: "-0.02em", marginBottom: 8 }}>
          Vibe Launchpad ⚡
        </h1>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 16, color: "#878787" }}>
          Describe your app once. Get a full campaign across every channel.
        </p>
      </div>

      {!loading && !output && (
        <>
          <BrandKitToggle enabled={applyBrandKit} onChange={setApplyBrandKit} hasBrandKit={hasBrandKit} />

          <div style={{
            background: "#FFFFFF", borderRadius: 20, border: "1.5px solid #EEEEEE",
            boxShadow: "0 4px 24px rgba(5,173,152,0.06)", padding: "28px 32px", marginBottom: 24,
          }}>
            <label style={{
              fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
              color: "#AAAAAA", letterSpacing: "0.08em", textTransform: "uppercase",
              display: "block", marginBottom: 12,
            }}>Describe your app</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. A habit tracker that actually works — no streaks, no guilt, just a calm daily check-in that takes 30 seconds. iOS app, free with a $4/mo Pro plan."
              rows={5}
              style={{
                width: "100%", border: "none", outline: "none", resize: "none",
                fontFamily: "var(--font-dm-sans)", fontSize: 16, color: "#1F1F1F",
                lineHeight: 1.65, background: "transparent",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, paddingTop: 20, borderTop: "1px solid #EEEEEE" }}>
              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#AAAAAA" }}>
                {prompt.length} characters · 1 search
                {applyBrandKit && <span style={{ color: "#05AD98", marginLeft: 8 }}>✦ Brand Kit on</span>}
              </span>
              <button onClick={handleGenerate} disabled={!prompt.trim()} style={{
                background: !prompt.trim() ? "#CCCCCC" : "#05AD98", color: "#FFFFFF",
                fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 15,
                padding: "12px 28px", borderRadius: 999, border: "none",
                cursor: !prompt.trim() ? "not-allowed" : "pointer",
              }}>Generate Full Campaign →</button>
            </div>
          </div>
        </>
      )}

      {error && (
        <div style={{
          background: "#FEF2F2", border: "1px solid rgba(226,75,74,0.2)", borderRadius: 12,
          padding: "16px 20px", marginBottom: 24, fontFamily: "var(--font-dm-sans)", fontSize: 14,
          color: "#E24B4A", display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span>{error}</span>
          {error.includes("searches") && <a href="/dashboard/billing" style={{ color: "#05AD98", fontWeight: 500 }}>Upgrade →</a>}
        </div>
      )}

      {loading && !output && (
        <div style={{ background: "#FFFFFF", borderRadius: 20, border: "1.5px solid #EEEEEE", padding: "60px 32px", textAlign: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid #E6FAF8", borderTop: "3px solid #05AD98", margin: "0 auto 20px", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 18, color: "#1F1F1F", marginBottom: 8 }}>
            Generating your campaign{applyBrandKit ? " with Brand Kit applied" : ""}...
          </p>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#878787" }}>Writing content, social posts, SEO keywords, ad copy, and more.</p>
        </div>
      )}

      {output && (
        <div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {SECTIONS.map(s => (
              <span key={s} style={{
                fontFamily: "var(--font-dm-sans)", fontSize: 11, fontWeight: 500,
                padding: "3px 10px", borderRadius: 999,
                background: output.includes(s) ? "#E6FAF8" : "#F0F0F0",
                color: output.includes(s) ? "#05AD98" : "#AAAAAA",
              }}>{s}</span>
            ))}
            {applyBrandKit && <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 999, background: "#E6FAF8", color: "#05AD98" }}>✦ Brand Kit Applied</span>}
          </div>

          <div style={{
            background: "#FFFFFF", borderRadius: 20, border: "1.5px solid #EEEEEE",
            padding: "32px", maxHeight: 560, overflowY: "auto",
            fontFamily: "var(--font-dm-sans)", fontSize: 15, color: "#333333",
            lineHeight: 1.8, whiteSpace: "pre-wrap",
          }}>
            {output}
            {loading && <span style={{ color: "#05AD98" }}>▌</span>}
          </div>

          {done && (
            <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
              <button onClick={handleExport} style={{ background: "#05AD98", color: "#FFFFFF", fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 14, padding: "10px 24px", borderRadius: 999, border: "none", cursor: "pointer" }}>Export as Markdown ↓</button>
              <a href="/dashboard/campaigns" style={{ background: "#F8F8F8", color: "#1F1F1F", fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 14, padding: "10px 24px", borderRadius: 999, textDecoration: "none", border: "1px solid #EEEEEE", display: "inline-block" }}>View in Campaigns →</a>
              <button onClick={() => { setOutput(""); setDone(false); setPrompt(""); }} style={{ background: "transparent", color: "#878787", fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 14, padding: "10px 24px", borderRadius: 999, border: "1px solid #EEEEEE", cursor: "pointer" }}>New campaign</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
