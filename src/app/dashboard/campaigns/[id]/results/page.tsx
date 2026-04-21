"use client";
import { useEffect, useState, useRef, use } from "react";
import { createClient } from "@/lib/supabase/client";
import Papa from "papaparse";
import { jsPDF } from "jspdf";

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
  utm_campaign_tag: string | null;
};

type Metric = {
  metric_type: string;
  value: number | null;
  value_text: string | null;
  source: string | null;
  recorded_at: string;
};

type BrandKit = {
  app_name: string;
  tagline: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
};

type Ga4Metrics = {
  sessions: number;
  users: number;
  engagement: number;
  ctr: number;
  conversions: number;
  revenue: number;
};

const RELATED_AGENTS = [
  { label: "Social Media",     href: "/dashboard/social",    desc: "Turn this into X, LinkedIn, Instagram, TikTok posts" },
  { label: "Paid Ads",         href: "/dashboard/ppc",       desc: "Build a Google/Meta/LinkedIn ad campaign from this" },
  { label: "Email Marketing",  href: "/dashboard/email",     desc: "Spin this into a welcome or broadcast sequence" },
  { label: "SEO",              href: "/dashboard/seo",       desc: "Turn this into keyword research or a content brief" },
  { label: "Community & Launch", href: "/dashboard/community", desc: "Wrap this in a Product Hunt kit or launch X thread" },
];

function formatCurrency(n: number): string {
  if (n === 0) return "$0";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [brand, setBrand] = useState<BrandKit | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // UTM tag + metrics
  const [utmTag, setUtmTag] = useState("");
  const [utmDraft, setUtmDraft] = useState("");
  const [savingUtm, setSavingUtm] = useState(false);
  const [metrics, setMetrics] = useState<Ga4Metrics | null>(null);
  const [metricsState, setMetricsState] = useState<"idle" | "loading" | "not_connected" | "error" | "ready">("idle");
  const [metricsError, setMetricsError] = useState("");

  // AI narrative
  const [narrative, setNarrative] = useState("");
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [narrativeDone, setNarrativeDone] = useState(false);
  const [narrativeError, setNarrativeError] = useState("");
  const narrativeRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  // Initial load: campaign + brand kit + kick off metrics fetch if UTM already set
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: c } = await supabase
        .from("campaigns")
        .select("id, title, prompt, content, content_type, created_at, scheduled_date, completed, brand_kit_applied, utm_campaign_tag")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      if (!c) { setNotFound(true); setLoading(false); return; }
      setCampaign(c);
      setUtmTag(c.utm_campaign_tag ?? "");
      setUtmDraft(c.utm_campaign_tag ?? "");

      // Brand kit for PDF export branding
      fetch("/api/brand").then(r => r.json()).then(data => {
        if (data.brand) setBrand(data.brand);
      });

      setLoading(false);

      // If a UTM tag is already saved, fetch metrics immediately
      if (c.utm_campaign_tag) {
        fetchMetrics(c.utm_campaign_tag);
      }
    })();
  }, [id]);

  async function fetchMetrics(tag: string) {
    if (!tag) return;
    setMetricsState("loading");
    setMetricsError("");
    try {
      const res = await fetch("/api/integrations/ga4/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: id, utmCampaign: tag }),
      });
      if (res.status === 404 || res.status === 400) {
        const data = await res.json().catch(() => ({}));
        if (data.error === "not_connected" || data.error === "no_property") {
          setMetricsState("not_connected");
          return;
        }
        setMetricsState("error");
        setMetricsError(data.error ?? "Couldn't load metrics");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMetricsState("error");
        setMetricsError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      const data = await res.json();
      setMetrics(data.metrics);
      setMetricsState("ready");
    } catch (err: any) {
      setMetricsState("error");
      setMetricsError(err.message ?? "Network error");
    }
  }

  async function saveUtmTag() {
    const normalized = utmDraft.trim();
    if (normalized === utmTag) return;
    setSavingUtm(true);
    try {
      const { error } = await supabase
        .from("campaigns")
        .update({ utm_campaign_tag: normalized || null })
        .eq("id", id);
      if (error) {
        alert("Couldn't save UTM tag: " + error.message);
        return;
      }
      setUtmTag(normalized);
      if (normalized) fetchMetrics(normalized);
      else { setMetrics(null); setMetricsState("idle"); }
    } finally {
      setSavingUtm(false);
    }
  }

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

  function handleCsvExport() {
    if (!campaign) return;
    const rows: Array<Record<string, any>> = [
      { section: "Campaign", field: "title", value: campaign.title ?? "" },
      { section: "Campaign", field: "type", value: campaign.content_type },
      { section: "Campaign", field: "created_at", value: campaign.created_at },
      { section: "Campaign", field: "scheduled_date", value: campaign.scheduled_date ?? "" },
      { section: "Campaign", field: "brand_kit_applied", value: campaign.brand_kit_applied ? "yes" : "no" },
      { section: "Campaign", field: "utm_campaign_tag", value: utmTag || "" },
      { section: "Campaign", field: "prompt", value: campaign.prompt },
    ];
    if (metrics) {
      rows.push(
        { section: "Metrics", field: "sessions",    value: metrics.sessions },
        { section: "Metrics", field: "users",       value: metrics.users },
        { section: "Metrics", field: "engagement",  value: metrics.engagement },
        { section: "Metrics", field: "ctr_percent", value: metrics.ctr },
        { section: "Metrics", field: "conversions", value: metrics.conversions },
        { section: "Metrics", field: "revenue_usd", value: metrics.revenue },
      );
    }
    if (narrative) {
      rows.push({ section: "AI Narrative", field: "text", value: narrative });
    }
    rows.push({ section: "Content", field: "body", value: campaign.content });

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vibeflow-results-${campaign.content_type}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function hexToRgb(hex: string): [number, number, number] {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return [5, 173, 152]; // fallback teal
    const int = parseInt(m[1], 16);
    return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
  }

  function handlePdfExport() {
    if (!campaign) return;
    const doc = new jsPDF({ unit: "pt", format: "letter" }); // 612 x 792 pt
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 48;
    const primary = brand?.primary_color ?? "#05AD98";
    const [pr, pg, pb] = hexToRgb(primary);
    let y = 60;

    // Header accent bar
    doc.setFillColor(pr, pg, pb);
    doc.rect(0, 0, pageWidth, 8, "F");

    // Brand + app name
    y = 44;
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text((brand?.app_name ?? "VibeFlow") + " — Campaign Results", marginX, y);

    // Title
    y += 34;
    doc.setFontSize(22);
    doc.setTextColor(31, 31, 31);
    const titleText = campaign.title ?? "Campaign Results";
    doc.text(doc.splitTextToSize(titleText, pageWidth - marginX * 2), marginX, y);

    // Meta line
    y += 24;
    doc.setFontSize(10);
    doc.setTextColor(135);
    const metaBits = [
      `Type: ${campaign.content_type}`,
      `Created: ${new Date(campaign.created_at).toLocaleDateString()}`,
      campaign.scheduled_date ? `Scheduled: ${new Date(campaign.scheduled_date).toLocaleDateString()}` : null,
      campaign.brand_kit_applied ? "Brand Kit applied" : null,
      utmTag ? `UTM: ${utmTag}` : null,
    ].filter(Boolean);
    doc.text(metaBits.join("  ·  "), marginX, y);

    // Section: Metrics
    y += 30;
    doc.setDrawColor(230);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 20;
    doc.setFontSize(14);
    doc.setTextColor(31, 31, 31);
    doc.text("Metrics", marginX, y);

    y += 18;
    doc.setFontSize(10);
    if (!metrics) {
      doc.setTextColor(170);
      doc.text("No GA4 metrics available. Connect GA4 and tag this campaign with a UTM to populate.", marginX, y);
      y += 16;
    } else {
      const cards: Array<[string, string]> = [
        ["Sessions",     metrics.sessions.toLocaleString()],
        ["Users",        metrics.users.toLocaleString()],
        ["Engagement",   metrics.engagement.toLocaleString()],
        ["CTR",          `${metrics.ctr}%`],
        ["Conversions",  metrics.conversions.toLocaleString()],
        ["Revenue",      formatCurrency(metrics.revenue)],
      ];
      const colW = (pageWidth - marginX * 2) / 3;
      cards.forEach(([label, value], idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const cx = marginX + col * colW;
        const cy = y + row * 50;
        doc.setDrawColor(230);
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(cx, cy, colW - 8, 42, 4, 4, "FD");
        doc.setTextColor(170);
        doc.setFontSize(8);
        doc.text(label.toUpperCase(), cx + 10, cy + 14);
        doc.setTextColor(31, 31, 31);
        doc.setFontSize(14);
        doc.text(value, cx + 10, cy + 32);
      });
      y += Math.ceil(cards.length / 3) * 50 + 8;
    }

    // Section: AI Narrative
    if (narrative) {
      y += 14;
      doc.setDrawColor(230);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 20;
      doc.setFontSize(14);
      doc.setTextColor(31, 31, 31);
      doc.text("AI Narrative", marginX, y);
      y += 18;
      doc.setFontSize(10);
      doc.setTextColor(60);
      const wrapped = doc.splitTextToSize(narrative, pageWidth - marginX * 2);
      // Pagination
      wrapped.forEach((line: string) => {
        if (y > 740) { doc.addPage(); y = 60; }
        doc.text(line, marginX, y);
        y += 14;
      });
    }

    // Section: Campaign Content
    y += 14;
    if (y > 700) { doc.addPage(); y = 60; }
    doc.setDrawColor(230);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 20;
    doc.setFontSize(14);
    doc.setTextColor(31, 31, 31);
    doc.text("Campaign Content", marginX, y);
    y += 18;
    doc.setFontSize(9);
    doc.setTextColor(80);
    const contentWrapped = doc.splitTextToSize(campaign.content, pageWidth - marginX * 2);
    contentWrapped.forEach((line: string) => {
      if (y > 740) { doc.addPage(); y = 60; }
      doc.text(line, marginX, y);
      y += 12;
    });

    // Footer on every page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(170);
      doc.text(`Generated by VibeFlow Marketing · ${new Date().toLocaleDateString()} · Page ${i} of ${pageCount}`, marginX, 780);
    }

    doc.save(`vibeflow-results-${campaign.content_type}-${Date.now()}.pdf`);
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
        <a href="/dashboard/campaigns" style={{
          background: "#05AD98", color: "#FFFFFF",
          fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 15,
          padding: "12px 28px", borderRadius: 999, textDecoration: "none", display: "inline-block",
        }}>← Back to My Campaigns</a>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 48px", maxWidth: 1100, margin: "0 auto" }}>

      {/* Breadcrumb */}
      <div style={{ marginBottom: 16 }}>
        <a href="/dashboard/campaigns" style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787", textDecoration: "none" }}>← My Campaigns</a>
      </div>

      {/* Header + export buttons */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 32, color: "#1F1F1F", letterSpacing: "-0.02em", marginBottom: 8 }}>
            {campaign.title ?? "Campaign Results"} 📊
          </h1>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 15, color: "#878787", lineHeight: 1.6 }}>
            Created {new Date(campaign.created_at).toLocaleDateString()} · {campaign.content_type} · {campaign.brand_kit_applied ? "Brand Kit applied" : "No Brand Kit"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={handleCsvExport} style={{
            background: "#F8F8F8", color: "#1F1F1F",
            fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 13,
            padding: "8px 16px", borderRadius: 999, border: "1px solid #EEEEEE", cursor: "pointer",
          }}>Export CSV ↓</button>
          <button onClick={handlePdfExport} style={{
            background: "#1F1F1F", color: "#FFFFFF",
            fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 13,
            padding: "8px 16px", borderRadius: 999, border: "none", cursor: "pointer",
          }}>Export PDF ↓</button>
        </div>
      </div>

      {/* UTM tag input */}
      <div style={{
        background: "#FFFFFF", borderRadius: 16, border: "1.5px solid #EEEEEE",
        padding: "20px 24px", marginBottom: 24,
      }}>
        <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500, color: "#AAAAAA", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
          Track this campaign in GA4
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 240, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#AAAAAA" }}>utm_campaign=</span>
            <input
              type="text"
              value={utmDraft}
              onChange={e => setUtmDraft(e.target.value.replace(/\s+/g, "_"))}
              placeholder="vibeflow_launch_mar26"
              style={{
                flex: 1, padding: "10px 14px", borderRadius: 10,
                border: "1.5px solid #EEEEEE", fontFamily: "var(--font-dm-sans)",
                fontSize: 14, color: "#1F1F1F", outline: "none", minWidth: 0,
              }}
            />
          </div>
          <button onClick={saveUtmTag} disabled={savingUtm || utmDraft.trim() === utmTag} style={{
            background: utmDraft.trim() === utmTag ? "#F0F0F0" : "#05AD98",
            color: utmDraft.trim() === utmTag ? "#AAAAAA" : "#FFFFFF",
            fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 13,
            padding: "10px 20px", borderRadius: 999, border: "none",
            cursor: savingUtm || utmDraft.trim() === utmTag ? "not-allowed" : "pointer",
          }}>
            {savingUtm ? "Saving…" : utmTag ? "Update" : "Save + Fetch"}
          </button>
        </div>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#878787", marginTop: 10, lineHeight: 1.6 }}>
          Add this tag to every link you share for this campaign (e.g., <code style={{ background: "#F0F0F0", padding: "1px 6px", borderRadius: 4 }}>yoursite.com/?utm_campaign={utmTag || "your_tag"}&utm_source=twitter</code>). We'll pull matching GA4 sessions every 5 min.
        </p>
      </div>

      {/* Overview — metric cards */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 18, color: "#1F1F1F", marginBottom: 14 }}>Overview</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          <ResultCard label="Sessions"    value={metrics?.sessions?.toLocaleString()    ?? "—"} state={metricsState} />
          <ResultCard label="Users"       value={metrics?.users?.toLocaleString()       ?? "—"} state={metricsState} />
          <ResultCard label="Engagement"  value={metrics?.engagement?.toLocaleString()  ?? "—"} state={metricsState} />
          <ResultCard label="CTR"         value={metrics ? `${metrics.ctr}%` : "—"}              state={metricsState} />
          <ResultCard label="Conversions" value={metrics?.conversions?.toLocaleString() ?? "—"} state={metricsState} />
          <ResultCard label="Revenue"     value={metrics ? formatCurrency(metrics.revenue) : "—"} state={metricsState} />
        </div>

        {metricsState === "not_connected" && (
          <div style={{
            marginTop: 16, background: "#FAFAFA", borderRadius: 16,
            border: "1.5px dashed #DDDDDD", padding: "24px", textAlign: "center",
          }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>📡</div>
            <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 15, color: "#1F1F1F", marginBottom: 6 }}>
              Connect GA4 to see real numbers
            </div>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787", maxWidth: 420, margin: "0 auto 14px", lineHeight: 1.6 }}>
              Tag your links + connect Google Analytics 4 and this section populates automatically.
            </p>
            <a href="/dashboard/integrations" style={{
              background: "#05AD98", color: "#FFFFFF",
              fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 13,
              padding: "8px 20px", borderRadius: 999, textDecoration: "none", display: "inline-block",
            }}>Connect GA4 →</a>
          </div>
        )}

        {metricsState === "error" && (
          <div style={{
            marginTop: 16, background: "#FEF2F2", border: "1px solid rgba(226,75,74,0.2)",
            borderRadius: 12, padding: "12px 16px",
            fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#E24B4A",
          }}>
            Couldn't fetch GA4 metrics: {metricsError}
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
          }}>{narrativeError}</div>
        )}

        {!narrative && !narrativeLoading && !narrativeError && (
          <div style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid #EEEEEE", padding: "28px", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#878787", maxWidth: 460, margin: "0 auto", lineHeight: 1.6 }}>
              Click <strong>Generate insight</strong> for a narrative read on this campaign — what's working, what isn't, and the single next best action.
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

      {/* Optimize this campaign */}
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

    </div>
  );
}

function ResultCard({ label, value, state }: { label: string; value: string; state: string }) {
  const showLoading = state === "loading";
  return (
    <div style={{
      background: "#FFFFFF", borderRadius: 16, padding: "20px",
      border: "1px solid #EEEEEE", position: "relative",
    }}>
      <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#AAAAAA", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 26, color: "#1F1F1F", marginBottom: 4, letterSpacing: "-0.01em" }}>
        {showLoading ? "…" : value}
      </div>
      <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 11, color: "#AAAAAA" }}>
        {state === "ready"          && "From GA4"}
        {state === "loading"        && "Fetching from GA4…"}
        {state === "not_connected"  && "Connect GA4"}
        {state === "error"          && "Error"}
        {state === "idle"           && "Add UTM tag above"}
      </div>
    </div>
  );
}
