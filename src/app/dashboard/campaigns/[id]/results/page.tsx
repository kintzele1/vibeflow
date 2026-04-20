"use client";
import { useEffect, useState, useRef, use } from "react";
import { createClient } from "@/lib/supabase/client";

type Campaign = {
  id: string;
  title: string | null;
  prompt: string;
  content: string;
  content_type: string;
  created_at: string;
  scheduled_date: string | null;
  completed: boolean;
  brand_kit_applied: boolean | null;
};

type Metric = {
  metric_type: string;
  value: number | null;
  value_text: string | null;
  source: string | null;
  recorded_at: string;
};

// Map content_type → the agent route that regenerates it. Used for the "Optimize" actions.
const AGENT_ROUTES: Record<string, { base: string; typeParam?: string; label: string }> = {
  campaign:              { base: "/dashboard",              label: "Full Campaign" },
  blog:                  { base: "/dashboard/content",      typeParam: "blog", label: "Blog Post" },
  newsletter:            { base: "/dashboard/content",      typeParam: "newsletter", label: "Newsletter" },
  twitter:               { base: "/dashboard/content",      typeParam: "twitter", label: "Twitter Thread" },
  linkedin:              { base: "/dashboard/content",      typeParam: "linkedin", label: "LinkedIn Post" },
  reddit:                { base: "/dashboard/content",      typeParam: "reddit", label: "Reddit Post" },
  youtube:               { base: "/dashboard/content",      typeParam: "youtube", label: "YouTube Script" },
  email_sequence:        { base: "/dashboard/content",      typeParam: "email_sequence", label: "Email Sequence" },
};

const RELATED_AGENTS = [
  { label: "Social Media",    href: "/dashboard/social",     desc: "Turn this into X, LinkedIn, Instagram, TikTok posts" },
  { label: "Paid Ads",        href: "/dashboard/ppc",        desc: "Build a Google/Meta/LinkedIn ad campaign from this" },
  { label: "Email Marketing", href: "/dashboard/email",      desc: "Spin this into a welcome or broadcast sequence" },
  { label: "SEO",             href: "/dashboard/seo",        desc: "Turn this into keyword research or a content brief" },
  { label: "Community & Launch", href: "/dashboard/community", desc: "Wrap this in a Product Hunt kit or launch X thread" },
];

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [narrative, setNarrative] = useState("");
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [narrativeDone, setNarrativeDone] = useState(false);
  const [narrativeError, setNarrativeError] = useState("");
  const narrativeRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: c } = await supabase
        .from("campaigns")
        .select("id, title, prompt, content, content_type, created_at, scheduled_date, completed, brand_kit_applied")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      if (!c) { setNotFound(true); setLoading(false); return; }
      setCampaign(c);

      const { data: m } = await supabase
        .from("results_metrics")
        .select("metric_type, value, value_text, source, recorded_at")
        .eq("campaign_id", id)
        .order("recorded_at", { ascending: false });
      setMetrics(m ?? []);
      setLoading(false);
    })();
  }, [id]);

  async function generateNarrative() {
    if (narrativeLoading) return;
    setNarrativeLoading(true);
    setNarrativeDone(false);
    setNarrative("");
    setNarrativeError("");

    try {
      const res = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: id }),
      });

      if (res.status === 402) {
        const data = await res.json();
        setNarrativeError(data.message ?? "No searches remaining.");
        setNarrativeLoading(false);
        return;
      }
      if (!res.ok) {
        setNarrativeError("Couldn't generate insight. Please try again.");
        setNarrativeLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) { setNarrativeLoading(false); return; }

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        for (const line of decoder.decode(value).split("\n\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) {
              setNarrative(prev => {
                const next = prev + data.text;
                setTimeout(() => {
                  if (narrativeRef.current) narrativeRef.current.scrollTop = narrativeRef.current.scrollHeight;
                }, 10);
                return next;
              });
            }
            if (data.done) setNarrativeDone(true);
            if (data.error) setNarrativeError(data.error);
          } catch {}
        }
      }
    } catch (err: any) {
      setNarrativeError(err.message ?? "Something went wrong.");
    } finally {
      setNarrativeLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "40px 48px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #E6FAF8", borderTop: "3px solid #05AD98", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (notFound || !campaign) {
    return (
      <div style={{ padding: "40px 48px", maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🔎</div>
        <h2 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 24, color: "#1F1F1F", marginBottom: 12 }}>
          Campaign not found
        </h2>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 15, color: "#878787", marginBottom: 28 }}>
          It may have been deleted, or you don't have access to it.
        </p>
        <a href="/dashboard/campaigns" style={{
          background: "#05AD98", color: "#FFFFFF",
          fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 15,
          padding: "12px 28px", borderRadius: 999, textDecoration: "none", display: "inline-block",
        }}>← Back to My Campaigns</a>
      </div>
    );
  }

  const metricsConnected = metrics.length > 0;

  return (
    <div style={{ padding: "40px 48px", maxWidth: 1100, margin: "0 auto" }}>

      {/* Breadcrumb */}
      <div style={{ marginBottom: 16 }}>
        <a href="/dashboard/campaigns" style={{
          fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787", textDecoration: "none",
        }}>← My Campaigns</a>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 32, color: "#1F1F1F", letterSpacing: "-0.02em", marginBottom: 8 }}>
          {campaign.title ?? "Campaign Results"} 📊
        </h1>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 15, color: "#878787", lineHeight: 1.6 }}>
          Created {new Date(campaign.created_at).toLocaleDateString()} · {campaign.content_type} · {campaign.brand_kit_applied ? "Brand Kit applied" : "No Brand Kit"}
        </p>
      </div>

      {/* Overview — metric cards */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 18, color: "#1F1F1F", marginBottom: 14 }}>Overview</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {[
            { label: "Reach",      key: "reach" },
            { label: "Engagement", key: "engagement" },
            { label: "CTR",        key: "ctr" },
            { label: "Conversions", key: "conversions" },
            { label: "Revenue",    key: "revenue" },
          ].map(card => {
            const found = metrics.find(m => m.metric_type === card.key);
            const displayValue = found
              ? (found.value !== null ? found.value.toLocaleString() : found.value_text ?? "—")
              : "—";
            return (
              <div key={card.key} style={{
                background: "#FFFFFF", borderRadius: 16, padding: "20px",
                border: "1px solid #EEEEEE",
              }}>
                <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#AAAAAA", marginBottom: 8 }}>
                  {card.label}
                </div>
                <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 28, color: "#1F1F1F", marginBottom: 4 }}>
                  {displayValue}
                </div>
                <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 11, color: "#AAAAAA" }}>
                  {found ? `Source: ${found.source ?? "unknown"}` : "Awaiting GA4"}
                </div>
              </div>
            );
          })}
        </div>

        {!metricsConnected && (
          <div style={{
            marginTop: 16,
            background: "#FAFAFA", borderRadius: 16,
            border: "1.5px dashed #DDDDDD",
            padding: "28px 24px", textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📡</div>
            <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 16, color: "#1F1F1F", marginBottom: 6 }}>
              Connect Google Analytics 4 to see real numbers
            </div>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787", maxWidth: 420, margin: "0 auto 16px", lineHeight: 1.6 }}>
              GA4 integration goes live shortly. Until then, the AI narrative below still reads your campaign content and scheduling to give you a strategic take.
            </p>
            <a href="/dashboard/integrations" style={{
              background: "#05AD98", color: "#FFFFFF",
              fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 13,
              padding: "8px 20px", borderRadius: 999, textDecoration: "none", display: "inline-block",
            }}>Connect GA4 →</a>
          </div>
        )}
      </div>

      {/* AI Narrative */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
          <h2 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 18, color: "#1F1F1F" }}>AI Narrative</h2>
          {!narrative && !narrativeLoading && (
            <button onClick={generateNarrative} style={{
              background: "#05AD98", color: "#FFFFFF",
              fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 13,
              padding: "8px 18px", borderRadius: 999, border: "none", cursor: "pointer",
            }}>✨ Generate insight</button>
          )}
        </div>

        {narrativeError && (
          <div style={{
            background: "#FEF2F2", border: "1px solid rgba(226,75,74,0.2)",
            borderRadius: 12, padding: "12px 16px", marginBottom: 16,
            fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#E24B4A",
          }}>
            {narrativeError}
          </div>
        )}

        {!narrative && !narrativeLoading && !narrativeError && (
          <div style={{
            background: "#FFFFFF", borderRadius: 16,
            border: "1px solid #EEEEEE", padding: "28px",
            textAlign: "center",
          }}>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#878787", maxWidth: 460, margin: "0 auto", lineHeight: 1.6 }}>
              Click <strong>Generate insight</strong> to get a narrative read on this campaign —
              what's working, what isn't, and the single next best action. Updates as your metrics grow.
            </p>
          </div>
        )}

        {(narrative || narrativeLoading) && (
          <div ref={narrativeRef} style={{
            background: "#FFFFFF", borderRadius: 16,
            border: "1px solid #EEEEEE", padding: "28px",
            maxHeight: 480, overflowY: "auto",
            fontFamily: "var(--font-dm-sans)", fontSize: 14,
            color: "#333333", lineHeight: 1.8, whiteSpace: "pre-wrap",
          }}>
            {narrative || <span style={{ color: "#AAAAAA" }}>Thinking...</span>}
            {narrativeLoading && <span style={{ color: "#05AD98" }}>▌</span>}
            {narrativeDone && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #EEEEEE" }}>
                <button onClick={generateNarrative} style={{
                  background: "#F8F8F8", color: "#1F1F1F",
                  fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 13,
                  padding: "6px 16px", borderRadius: 999, border: "1px solid #EEEEEE", cursor: "pointer",
                }}>↻ Regenerate</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Optimize this campaign — related actions */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 18, color: "#1F1F1F", marginBottom: 6 }}>
          Optimize this campaign
        </h2>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#878787", marginBottom: 16 }}>
          Run related agents against this campaign's prompt — prompt auto-fills, Brand Kit auto-applies.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
          {RELATED_AGENTS.map(agent => (
            <a
              key={agent.href}
              href={`${agent.href}?prompt=${encodeURIComponent(campaign.prompt)}&refresh=1`}
              style={{
                background: "#FFFFFF", borderRadius: 12, padding: "14px 16px",
                border: "1.5px solid #EEEEEE", textDecoration: "none",
                display: "block", transition: "all 0.15s",
              }}
            >
              <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 14, color: "#05AD98", marginBottom: 4 }}>
                {agent.label} →
              </div>
              <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#878787", lineHeight: 1.5 }}>
                {agent.desc}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Historical comparison — shell */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 18, color: "#1F1F1F", marginBottom: 14 }}>
          Historical comparison
        </h2>
        <div style={{
          background: "#FAFAFA", borderRadius: 16,
          border: "1.5px dashed #DDDDDD",
          padding: "28px 24px", textAlign: "center",
        }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>📈</div>
          <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 15, color: "#1F1F1F", marginBottom: 6 }}>
            Comparison coming once GA4 is connected
          </div>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787", maxWidth: 440, margin: "0 auto", lineHeight: 1.6 }}>
            After two or more campaigns have metrics, this section will show how this one stacks up — by channel, by timing, by brand consistency.
          </p>
        </div>
      </div>
    </div>
  );
}
