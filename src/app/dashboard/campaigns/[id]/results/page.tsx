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

  // User rating (thumbs up/down) — Phase-1 Learning Engine signal
  const [userRating, setUserRating] = useState<"up" | "down" | null>(null);
  const [ratingSaving, setRatingSaving] = useState(false);

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

      // Load existing rating (if user has rated this campaign before)
      fetch(`/api/campaigns/${id}/rate`)
        .then(r => r.json())
        .then(data => { if (data?.rating) setUserRating(data.rating); })
        .catch(() => { /* fail silent — no rating shown */ });
    })();
  }, [id]);

  async function submitRating(rating: "up" | "down") {
    // Optimistic — update UI immediately, then fire API. If API fails, revert.
    const previous = userRating;
    setUserRating(rating);
    setRatingSaving(true);
    try {
      const res = await fetch(`/api/campaigns/${id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      if (!res.ok) {
        setUserRating(previous);
      }
    } catch {
      setUserRating(previous);
    } finally {
      setRatingSaving(false);
    }
  }

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
        setNarrativeError(data.message ?? "You've used all your searches. Every generation counts as 1 search. Upgrade to Annual ($299 for 1,200 searches) or buy another Launch Kit ($49 for 100) to keep generating.");
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
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 48;
    const contentW = pageWidth - marginX * 2;
    const primary = brand?.primary_color ?? "#05AD98";
    const [pr, pg, pb] = hexToRgb(primary);
    const FOOTER_Y = pageHeight - 28;           // reserved footer zone
    const BOTTOM_LIMIT = pageHeight - 48;       // when body Y exceeds this, new page

    let y = 60;

    const ensureSpace = (needed: number) => {
      if (y + needed > BOTTOM_LIMIT) {
        doc.addPage();
        y = 60;
      }
    };

    // --- Helpers for rendering prose with inline **bold** runs ---
    // jsPDF doesn't support rich text spans in a single call. To render mixed
    // bold/regular, we split by **...** and emit segments side by side,
    // wrapping manually based on width.
    const renderInline = (text: string, startX: number, startY: number, width: number, lineHeight: number): number => {
      // Tokenize into runs: { text, bold }
      const runs: Array<{ text: string; bold: boolean }> = [];
      const parts = text.split(/\*\*(.+?)\*\*/g);
      parts.forEach((part, idx) => {
        if (!part) return;
        runs.push({ text: part, bold: idx % 2 === 1 });
      });

      let cursorX = startX;
      let cursorY = startY;

      const spaceW = doc.getTextWidth(" ");

      for (const run of runs) {
        doc.setFont("helvetica", run.bold ? "bold" : "normal");
        // Break each run into words so we can wrap at word boundaries.
        const words = run.text.split(/(\s+)/);
        for (const word of words) {
          if (!word) continue;
          const wordW = doc.getTextWidth(word);
          if (cursorX + wordW > startX + width) {
            cursorY += lineHeight;
            cursorX = startX;
            if (cursorY > BOTTOM_LIMIT) {
              doc.addPage();
              cursorY = 60;
            }
            // Skip leading whitespace on new line
            if (/^\s+$/.test(word)) continue;
          }
          doc.text(word, cursorX, cursorY);
          cursorX += wordW;
        }
      }
      doc.setFont("helvetica", "normal");
      return cursorY;
    };

    // Render campaign markdown content with heading + bullet + divider handling
    const renderMarkdown = (md: string) => {
      const lines = md.split("\n");
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60);

      for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        const line = raw.trimEnd();

        // Blank line — small gap
        if (!line.trim()) {
          y += 6;
          continue;
        }

        // Horizontal rule
        if (/^---+$/.test(line.trim())) {
          ensureSpace(14);
          y += 4;
          doc.setDrawColor(230);
          doc.line(marginX, y, pageWidth - marginX, y);
          y += 10;
          continue;
        }

        // H1 / H2 / H3
        const hMatch = /^(#{1,3})\s+(.*)$/.exec(line);
        if (hMatch) {
          const level = hMatch[1].length;
          const text = hMatch[2].trim();
          const sizes: Record<number, number> = { 1: 15, 2: 13, 3: 11 };
          const size = sizes[level];
          ensureSpace(size + 12);
          y += level === 1 ? 12 : 8;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(size);
          doc.setTextColor(31, 31, 31);
          const wrapped = doc.splitTextToSize(text, contentW);
          wrapped.forEach((wl: string) => {
            ensureSpace(size + 2);
            doc.text(wl, marginX, y);
            y += size + 2;
          });
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(60);
          y += 4;
          continue;
        }

        // Bullet (- or *)
        const bMatch = /^\s*[-*]\s+(.*)$/.exec(line);
        if (bMatch) {
          const text = bMatch[1];
          ensureSpace(14);
          doc.setFontSize(10);
          doc.setTextColor(60);
          doc.text("•", marginX, y);
          const endY = renderInline(text, marginX + 14, y, contentW - 14, 14);
          y = endY + 14;
          continue;
        }

        // Numbered list (1. 2. etc)
        const nMatch = /^\s*(\d+)\.\s+(.*)$/.exec(line);
        if (nMatch) {
          const num = nMatch[1];
          const text = nMatch[2];
          ensureSpace(14);
          doc.setFontSize(10);
          doc.setTextColor(60);
          doc.text(`${num}.`, marginX, y);
          const endY = renderInline(text, marginX + 22, y, contentW - 22, 14);
          y = endY + 14;
          continue;
        }

        // Normal paragraph line — inline bold handling
        ensureSpace(14);
        doc.setFontSize(10);
        doc.setTextColor(60);
        const endY = renderInline(line, marginX, y, contentW, 14);
        y = endY + 14;
      }
    };

    // Header accent bar
    doc.setFillColor(pr, pg, pb);
    doc.rect(0, 0, pageWidth, 8, "F");

    // Top strip: brand on the left, export date on the right
    y = 44;
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.setFont("helvetica", "normal");
    doc.text((brand?.app_name ?? "VibeFlow") + " — Campaign Results", marginX, y);
    // Date pinned to the right edge
    const exportDate = new Date().toLocaleDateString();
    const dateW = doc.getTextWidth(exportDate);
    doc.text(exportDate, pageWidth - marginX - dateW, y);

    // Title — correctly advance Y based on how many lines the title wrapped into
    y += 32;
    doc.setFontSize(20);
    doc.setTextColor(31, 31, 31);
    doc.setFont("helvetica", "bold");
    const titleText = campaign.title ?? "Campaign Results";
    const titleLines = doc.splitTextToSize(titleText, contentW);
    titleLines.forEach((line: string) => {
      doc.text(line, marginX, y);
      y += 24;
    });
    doc.setFont("helvetica", "normal");

    // Meta line (no date — date lives in top-right now)
    y += 4;
    doc.setFontSize(10);
    doc.setTextColor(135);
    const metaBits = [
      `Type: ${campaign.content_type}`,
      `Created: ${new Date(campaign.created_at).toLocaleDateString()}`,
      campaign.scheduled_date ? `Scheduled: ${new Date(campaign.scheduled_date).toLocaleDateString()}` : null,
      campaign.brand_kit_applied ? "Brand Kit applied" : null,
      utmTag ? `UTM: ${utmTag}` : null,
    ].filter(Boolean) as string[];
    const metaWrapped = doc.splitTextToSize(metaBits.join("  ·  "), contentW);
    metaWrapped.forEach((line: string) => {
      doc.text(line, marginX, y);
      y += 14;
    });

    // Section: Metrics
    y += 14;
    ensureSpace(80);
    doc.setDrawColor(230);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(31, 31, 31);
    doc.text("Metrics", marginX, y);
    doc.setFont("helvetica", "normal");

    y += 18;
    doc.setFontSize(10);
    if (!metrics) {
      doc.setTextColor(170);
      const lines = doc.splitTextToSize(
        utmTag
          ? `No data yet for utm_campaign=${utmTag}. Metrics will populate as GA4 records sessions against that tag.`
          : "Add a UTM tag to this campaign and connect GA4 to populate these metrics.",
        contentW,
      );
      lines.forEach((line: string) => {
        doc.text(line, marginX, y);
        y += 14;
      });
    } else {
      const cards: Array<[string, string]> = [
        ["Sessions",     metrics.sessions.toLocaleString()],
        ["Users",        metrics.users.toLocaleString()],
        ["Engagement",   metrics.engagement.toLocaleString()],
        ["CTR",          `${metrics.ctr}%`],
        ["Conversions",  metrics.conversions.toLocaleString()],
        ["Revenue",      formatCurrency(metrics.revenue)],
      ];
      const colW = contentW / 3;
      ensureSpace(Math.ceil(cards.length / 3) * 54);
      cards.forEach(([label, value], idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const cx = marginX + col * colW;
        const cy = y + row * 52;
        doc.setDrawColor(230);
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(cx, cy, colW - 10, 44, 4, 4, "FD");
        doc.setFont("helvetica", "normal");
        doc.setTextColor(150);
        doc.setFontSize(8);
        doc.text(label.toUpperCase(), cx + 10, cy + 15);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(31, 31, 31);
        doc.setFontSize(14);
        doc.text(value, cx + 10, cy + 34);
      });
      y += Math.ceil(cards.length / 3) * 52 + 6;
      doc.setFont("helvetica", "normal");
    }

    // Section: AI Narrative
    if (narrative) {
      y += 14;
      ensureSpace(60);
      doc.setDrawColor(230);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 20;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(31, 31, 31);
      doc.text("AI Narrative", marginX, y);
      doc.setFont("helvetica", "normal");
      y += 18;
      renderMarkdown(narrative);
    }

    // Section: Campaign Content
    y += 14;
    ensureSpace(40);
    doc.setDrawColor(230);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(31, 31, 31);
    doc.text("Campaign Content", marginX, y);
    doc.setFont("helvetica", "normal");
    y += 18;
    renderMarkdown(campaign.content);

    // Footer on every page — paint white rect first in case body text was drawn underneath
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(255, 255, 255);
      doc.rect(0, FOOTER_Y - 8, pageWidth, 40, "F");
      doc.setDrawColor(240);
      doc.line(marginX, FOOTER_Y - 8, pageWidth - marginX, FOOTER_Y - 8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(170);
      doc.text(
        `Generated by ${brand?.app_name ?? "VibeFlow Marketing"} · ${new Date().toLocaleDateString()} · Page ${i} of ${pageCount}`,
        marginX,
        FOOTER_Y + 6,
      );
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
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {/* Rating buttons — thumbs up/down */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#F8F8F8", border: "1px solid #EEEEEE",
            borderRadius: 999, padding: "4px 6px 4px 12px",
          }}>
            <span style={{
              fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#878787",
              marginRight: 4,
            }}>Useful?</span>
            <button
              onClick={() => submitRating("up")}
              disabled={ratingSaving}
              aria-label="Thumbs up"
              title="Yes, this was useful"
              style={{
                width: 30, height: 30, borderRadius: "50%",
                background: userRating === "up" ? "#E6FAF8" : "transparent",
                border: userRating === "up" ? "1.5px solid #05AD98" : "1.5px solid transparent",
                cursor: ratingSaving ? "wait" : "pointer", padding: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, lineHeight: 1,
                color: userRating === "up" ? "#05AD98" : "#878787",
                transition: "all 0.15s",
              }}
            >👍</button>
            <button
              onClick={() => submitRating("down")}
              disabled={ratingSaving}
              aria-label="Thumbs down"
              title="No, this missed the mark"
              style={{
                width: 30, height: 30, borderRadius: "50%",
                background: userRating === "down" ? "rgba(226,75,74,0.1)" : "transparent",
                border: userRating === "down" ? "1.5px solid #E24B4A" : "1.5px solid transparent",
                cursor: ratingSaving ? "wait" : "pointer", padding: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, lineHeight: 1,
                color: userRating === "down" ? "#E24B4A" : "#878787",
                transition: "all 0.15s",
              }}
            >👎</button>
          </div>
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
