"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { platformOf, composerInfo, composerUrl, splitIntoPosts, type PostUnit } from "@/lib/platforms";

type Campaign = {
  id: string;
  title: string | null;
  prompt: string;
  content: string;
  content_type: string;
  scheduled_date: string | null;
  completed: boolean;
};

type SuggestedTime = {
  day_of_week: string;
  time_of_day: string;
  confidence: "high" | "medium" | "low";
  rationale: string;
};

const TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  campaign:              { label: "Full Campaign",  icon: "⚡", color: "#05AD98" },
  blog:                  { label: "Blog Post",       icon: "✍️", color: "#6060CC" },
  newsletter:            { label: "Newsletter",      icon: "📧", color: "#05AD98" },
  twitter:               { label: "Twitter",         icon: "𝕏",  color: "#1F1F1F" },
  linkedin:              { label: "LinkedIn",        icon: "in", color: "#0077B5" },
  reddit:                { label: "Reddit",          icon: "👾", color: "#FF4500" },
  youtube:               { label: "YouTube",         icon: "▶️", color: "#E24B4A" },
  email_sequence:        { label: "Email",           icon: "💌", color: "#05AD98" },
  social_x_post:         { label: "X Posts",         icon: "𝕏",  color: "#1F1F1F" },
  social_linkedin_posts: { label: "LinkedIn",        icon: "in", color: "#0077B5" },
  social_instagram:      { label: "Instagram",       icon: "📸", color: "#E1306C" },
  social_tiktok:         { label: "TikTok",          icon: "🎵", color: "#010101" },
  social_reddit_posts:   { label: "Reddit",          icon: "👾", color: "#FF4500" },
  social_threads:        { label: "Threads",         icon: "🧵", color: "#1F1F1F" },
  social_carousel:       { label: "Carousel",        icon: "🎠", color: "#6060CC" },
  seo_keywords:          { label: "Keywords",        icon: "🔑", color: "#8B5CF6" },
  seo_on_page:           { label: "On-Page SEO",     icon: "📄", color: "#8B5CF6" },
  seo_technical:         { label: "Technical SEO",   icon: "⚙️", color: "#8B5CF6" },
  seo_briefs:            { label: "Content Brief",   icon: "📋", color: "#8B5CF6" },
  seo_backlinks:         { label: "Backlinks",       icon: "🔗", color: "#8B5CF6" },
  ppc_google:            { label: "Google Ads",      icon: "🎯", color: "#4285F4" },
  ppc_meta:              { label: "Meta Ads",        icon: "📘", color: "#1877F2" },
  ppc_linkedin:          { label: "LinkedIn Ads",    icon: "in", color: "#0077B5" },
  ppc_x:                 { label: "X Ads",           icon: "𝕏",  color: "#1F1F1F" },
  ppc_tiktok:            { label: "TikTok Ads",      icon: "🎵", color: "#010101" },
  email_welcome:         { label: "Welcome Series",  icon: "👋", color: "#05AD98" },
  email_onboarding:      { label: "Onboarding",      icon: "🚀", color: "#05AD98" },
  email_upsell:          { label: "Upsell",          icon: "💰", color: "#05AD98" },
  email_reengagement:    { label: "Re-engagement",   icon: "💌", color: "#05AD98" },
  email_broadcast:       { label: "Broadcast",       icon: "📢", color: "#05AD98" },
  aso_title_subtitle:    { label: "Title + Subtitle", icon: "🏷️", color: "#FF9500" },
  aso_description:       { label: "Store Desc",      icon: "📄", color: "#FF9500" },
  aso_keywords:          { label: "ASO Keywords",    icon: "🔑", color: "#FF9500" },
  aso_screenshots:       { label: "Screenshots",     icon: "📸", color: "#FF9500" },
  aso_preview_video:     { label: "Preview Video",   icon: "🎬", color: "#FF9500" },
  community_product_hunt:        { label: "Product Hunt Kit", icon: "🚀", color: "#DA552F" },
  community_influencer_outreach: { label: "Influencer",       icon: "🎤", color: "#DA552F" },
  community_reddit_discord:      { label: "Reddit + Discord", icon: "👾", color: "#DA552F" },
  community_pr_pitch:            { label: "PR Pitch",         icon: "📰", color: "#DA552F" },
  community_launch_x_thread:     { label: "Launch X Thread",  icon: "𝕏",  color: "#1F1F1F" },
  affiliate_program_setup:       { label: "Affiliate Program",icon: "🤝", color: "#10B981" },
  affiliate_recruitment:         { label: "Recruitment",      icon: "🎯", color: "#10B981" },
  affiliate_asset_kit:           { label: "Affiliate Assets", icon: "🎁", color: "#10B981" },
  affiliate_performance_report:  { label: "Aff. Performance", icon: "📈", color: "#10B981" },
};

function getTypeInfo(type: string) {
  return TYPE_LABELS[type] ?? { label: type, icon: "📄", color: "#878787" };
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function CalendarPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"month" | "week">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed">("all");
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [suggestingId, setSuggestingId] = useState<string | null>(null);
  const [suggestionFor, setSuggestionFor] = useState<{ id: string; data: SuggestedTime } | null>(null);
  const [copyToast, setCopyToast] = useState<string>("");
  const [picker, setPicker] = useState<{ campaign: Campaign; units: PostUnit[] } | null>(null);
  const supabase = createClient();

  useEffect(() => { fetchCampaigns(); }, []);

  async function fetchCampaigns() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("campaigns")
      .select("id, title, prompt, content, content_type, scheduled_date, completed")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setCampaigns(data ?? []);
    setLoading(false);
  }

  async function handleCopyToComposer(campaign: Campaign) {
    // If the campaign body contains multiple posts (POST 1 / TWEET 1/ / etc),
    // show a picker so the user copies ONE at a time instead of pasting the
    // whole blob into a single platform composer.
    const units = splitIntoPosts(campaign.content);
    if (units.length > 1) {
      setPicker({ campaign, units });
      return;
    }

    // Single-asset: behave as before.
    await copyAndOpen(campaign, campaign.content);
  }

  async function copyAndOpen(campaign: Campaign, textToCopy: string) {
    const platform = platformOf(campaign.content_type);
    const info = composerInfo(platform);
    const title = campaign.title ?? undefined;

    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch {
      // Graceful: some browsers block writeText without a user gesture
    }

    const url = composerUrl(platform, textToCopy, title);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }

    const msg = info.supportsPrefill
      ? `Copied — and ${info.platformName} composer opened prefilled.`
      : `Copied. ${info.platformName} opened — paste with Cmd/Ctrl+V.`;
    setCopyToast(msg);
    setTimeout(() => setCopyToast(""), 4000);
  }

  async function handleSuggestTime(campaign: Campaign) {
    setSuggestingId(campaign.id);
    try {
      const res = await fetch("/api/calendar/suggest-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: campaign.id }),
      });
      if (!res.ok) {
        setCopyToast("Couldn't get a suggestion. Try again.");
        setTimeout(() => setCopyToast(""), 3000);
        return;
      }
      const data: SuggestedTime = await res.json();
      setSuggestionFor({ id: campaign.id, data });
    } finally {
      setSuggestingId(null);
    }
  }

  function handleExport(format: "csv" | "ics") {
    window.location.href = `/api/calendar/export?format=${format}`;
  }

  async function handleSchedule(id: string, date: string | null) {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, scheduled_date: date } : c));
    setSchedulingId(null);
    await fetch("/api/campaigns/schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, scheduled_date: date }),
    });
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)); }
  function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)); }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Build calendar grid
  const calendarDays: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to complete last week
  while (calendarDays.length % 7 !== 0) calendarDays.push(null);

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function getCampaignsForDate(day: number) {
    const ds = dateStr(day);
    return campaigns.filter(c => {
      if (c.scheduled_date !== ds) return false;
      if (filterType !== "all" && c.content_type !== filterType) return false;
      if (filterStatus === "completed" && !c.completed) return false;
      if (filterStatus === "active" && c.completed) return false;
      return true;
    });
  }

  const unscheduled = campaigns.filter(c => !c.scheduled_date);
  const scheduled = campaigns.filter(c => !!c.scheduled_date);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  const types = ["all", ...Array.from(new Set(campaigns.map(c => c.content_type)))];

  if (loading) {
    return (
      <div style={{ padding: "40px 48px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #E6FAF8", borderTop: "3px solid #05AD98", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 48px", maxWidth: 1100, margin: "0 auto" }}>

      {/* Schedule modal */}
      {schedulingId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "32px 36px", maxWidth: 400, width: "100%", margin: "0 24px" }}>
            <h3 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 18, color: "#1F1F1F", marginBottom: 8 }}>
              Schedule campaign
            </h3>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#878787", marginBottom: 24 }}>
              Pick a publish date for this campaign.
            </p>
            <input
              type="date"
              min={todayStr}
              defaultValue={campaigns.find(c => c.id === schedulingId)?.scheduled_date ?? ""}
              onChange={e => {}} // controlled below
              id="date-picker"
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 10,
                border: "1.5px solid #EEEEEE", fontFamily: "var(--font-dm-sans)",
                fontSize: 15, color: "#1F1F1F", marginBottom: 20,
                outline: "none",
              }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setSchedulingId(null)} style={{
                flex: 1, padding: "11px", borderRadius: 10, border: "1.5px solid #EEEEEE",
                background: "#FFFFFF", fontFamily: "var(--font-dm-sans)", fontSize: 14,
                color: "#878787", cursor: "pointer",
              }}>Cancel</button>
              <button
                onClick={() => {
                  const val = (document.getElementById("date-picker") as HTMLInputElement)?.value;
                  if (val) handleSchedule(schedulingId, val);
                }}
                style={{
                  flex: 1, padding: "11px", borderRadius: 10, border: "none",
                  background: "#05AD98", fontFamily: "var(--font-dm-sans)", fontSize: 14,
                  color: "#FFFFFF", cursor: "pointer",
                }}>
                Schedule
              </button>
              {campaigns.find(c => c.id === schedulingId)?.scheduled_date && (
                <button
                  onClick={() => handleSchedule(schedulingId, null)}
                  style={{
                    padding: "11px 16px", borderRadius: 10,
                    border: "1px solid rgba(226,75,74,0.2)", background: "transparent",
                    fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#E24B4A", cursor: "pointer",
                  }}>
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 32, color: "#1F1F1F", letterSpacing: "-0.02em", marginBottom: 8 }}>
            Marketing Calendar 📅
          </h1>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 15, color: "#878787" }}>
            {scheduled.length} scheduled · {unscheduled.length} unscheduled
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {/* Export menu */}
          <button onClick={() => handleExport("csv")} disabled={scheduled.length === 0} style={{
            background: "#F8F8F8", color: scheduled.length === 0 ? "#CCCCCC" : "#1F1F1F",
            fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 13,
            padding: "8px 16px", borderRadius: 999, border: "1px solid #EEEEEE",
            cursor: scheduled.length === 0 ? "not-allowed" : "pointer",
          }}>Export CSV</button>
          <button onClick={() => handleExport("ics")} disabled={scheduled.length === 0} style={{
            background: "#F8F8F8", color: scheduled.length === 0 ? "#CCCCCC" : "#1F1F1F",
            fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 13,
            padding: "8px 16px", borderRadius: 999, border: "1px solid #EEEEEE",
            cursor: scheduled.length === 0 ? "not-allowed" : "pointer",
          }} title="Import into Google / Apple / Outlook calendar">Export .ics</button>

          {/* View toggle */}
          <div style={{ display: "flex", background: "#F0F0F0", borderRadius: 10, padding: 3, gap: 2 }}>
            {(["month", "week"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer",
                background: view === v ? "#FFFFFF" : "transparent",
                fontFamily: "var(--font-dm-sans)", fontSize: 13, fontWeight: 500,
                color: view === v ? "#1F1F1F" : "#878787",
                boxShadow: view === v ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                textTransform: "capitalize",
              }}>{v}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Copy toast */}
      {copyToast && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 2000,
          background: "#1F1F1F", color: "#FFFFFF",
          padding: "12px 20px", borderRadius: 12,
          fontFamily: "var(--font-dm-sans)", fontSize: 14,
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          maxWidth: 360,
        }}>{copyToast}</div>
      )}

      {/* Multi-post picker modal */}
      {picker && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1500,
          padding: 24,
        }}>
          <div style={{
            background: "#FFFFFF", borderRadius: 20, padding: "28px 32px",
            maxWidth: 560, width: "100%", maxHeight: "85vh", display: "flex", flexDirection: "column",
            boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
          }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 18, color: "#1F1F1F", marginBottom: 6 }}>
                This campaign has {picker.units.length} posts
              </div>
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787", lineHeight: 1.6, margin: 0 }}>
                Pick the one you want to copy. We'll copy just that post and open {composerInfo(platformOf(picker.campaign.content_type)).platformName} — don't paste the whole campaign into one composer.
              </p>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
              {picker.units.map((unit, idx) => {
                // Naively enforce platform limits visually so over-limit posts are flagged.
                const platform = platformOf(picker.campaign.content_type);
                const limit =
                  platform === "x" || platform === "twitter" ? 280 :
                  platform === "threads" ? 500 :
                  platform === "linkedin" ? 3000 :
                  platform === "instagram" ? 2200 :
                  platform === "tiktok" ? 2200 :
                  null;
                const overLimit = limit !== null && unit.charCount > limit;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      const c = picker.campaign;
                      setPicker(null);
                      copyAndOpen(c, unit.fullText);
                    }}
                    style={{
                      textAlign: "left",
                      background: "#FAFAFA",
                      border: `1.5px solid ${overLimit ? "rgba(226,75,74,0.3)" : "#EEEEEE"}`,
                      borderRadius: 12, padding: "14px 16px",
                      fontFamily: "var(--font-dm-sans)", cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1F1F1F" }}>
                        {unit.label || `Post ${idx + 1}`}
                      </div>
                      <div style={{
                        fontSize: 11, fontWeight: 500,
                        color: overLimit ? "#E24B4A" : "#878787",
                      }}>
                        {unit.charCount}{limit !== null ? ` / ${limit}` : ""} chars
                        {overLimit && " · over limit"}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 13, color: "#555555", lineHeight: 1.5,
                      overflow: "hidden", display: "-webkit-box",
                      WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    }}>
                      {unit.preview}
                    </div>
                    <div style={{
                      marginTop: 10, fontSize: 12, fontWeight: 500, color: "#05AD98",
                    }}>
                      Copy this post & open composer →
                    </div>
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={() => setPicker(null)} style={{
                flex: 1, padding: "12px", borderRadius: 10,
                border: "1.5px solid #EEEEEE", background: "#FFFFFF",
                fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 14,
                color: "#878787", cursor: "pointer",
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Suggested-time modal */}
      {suggestionFor && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1500,
        }}>
          <div style={{
            background: "#FFFFFF", borderRadius: 20, padding: "28px 32px",
            maxWidth: 460, width: "100%", margin: "0 24px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
          }}>
            <div style={{ fontSize: 32, marginBottom: 12, textAlign: "center" }}>⏰</div>
            <h3 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 20, color: "#1F1F1F", textAlign: "center", marginBottom: 6 }}>
              Suggested posting time
            </h3>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 28, color: "#05AD98", marginBottom: 4 }}>
                {suggestionFor.data.day_of_week} · {suggestionFor.data.time_of_day}
              </div>
              <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#AAAAAA", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Confidence: {suggestionFor.data.confidence}
              </div>
            </div>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#555555", textAlign: "center", lineHeight: 1.6, marginBottom: 20 }}>
              {suggestionFor.data.rationale}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setSuggestionFor(null)} style={{
                flex: 1, padding: "12px", borderRadius: 10,
                border: "1.5px solid #EEEEEE", background: "#FFFFFF",
                fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 14,
                color: "#878787", cursor: "pointer",
              }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {(["all", "active", "completed"] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
            padding: "5px 12px", borderRadius: 999, border: "none", cursor: "pointer",
            background: filterStatus === s ? "#1F1F1F" : "#EEEEEE",
            color: filterStatus === s ? "#FFFFFF" : "#878787",
            textTransform: "capitalize",
          }}>{s}</button>
        ))}
        <div style={{ width: 1, background: "#EEEEEE", margin: "0 4px" }} />
        {types.map(t => (
          <button key={t} onClick={() => setFilterType(t)} style={{
            fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
            padding: "5px 12px", borderRadius: 999, border: "none", cursor: "pointer",
            background: filterType === t ? "#05AD98" : "#EEEEEE",
            color: filterType === t ? "#FFFFFF" : "#878787",
          }}>{t === "all" ? "All types" : getTypeInfo(t).label}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>

        {/* Calendar */}
        <div>
          {/* Month nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#878787", padding: "4px 8px" }}>‹</button>
            <span style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 18, color: "#1F1F1F" }}>
              {MONTHS[month]} {year}
            </span>
            <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#878787", padding: "4px 8px" }}>›</button>
          </div>

          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
            {DAYS.map(d => (
              <div key={d} style={{ fontFamily: "var(--font-dm-sans)", fontSize: 11, fontWeight: 500, color: "#AAAAAA", textAlign: "center", padding: "4px 0" }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {calendarDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;
              const ds = dateStr(day);
              const dayCampaigns = getCampaignsForDate(day);
              const isToday = ds === todayStr;
              const isPast = new Date(ds) < today && !isToday;
              const isHover = hoverDate === ds;

              return (
                <div
                  key={ds}
                  onMouseEnter={() => setHoverDate(ds)}
                  onMouseLeave={() => setHoverDate(null)}
                  style={{
                    minHeight: 80, borderRadius: 10, padding: "8px",
                    background: isToday ? "#E6FAF8" : isHover ? "#F8F8F8" : "#FFFFFF",
                    border: `1.5px solid ${isToday ? "#05AD98" : "#EEEEEE"}`,
                    transition: "all 0.15s", cursor: "default",
                  }}
                >
                  <div style={{
                    fontFamily: "var(--font-dm-sans)", fontSize: 12,
                    fontWeight: isToday ? 700 : 400,
                    color: isToday ? "#05AD98" : isPast ? "#CCCCCC" : "#1F1F1F",
                    marginBottom: 4,
                  }}>{day}</div>

                  {dayCampaigns.slice(0, 3).map(c => {
                    const info = getTypeInfo(c.content_type);
                    return (
                      <div
                        key={c.id}
                        title={c.prompt.slice(0, 80)}
                        style={{
                          background: c.completed ? "#F0F0F0" : "#E6FAF8",
                          borderRadius: 4, padding: "2px 6px", marginBottom: 2,
                          fontFamily: "var(--font-dm-sans)", fontSize: 10,
                          color: c.completed ? "#AAAAAA" : "#05AD98",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          display: "flex", alignItems: "center", gap: 3,
                        }}
                      >
                        <span style={{ fontSize: 9 }}>{info.icon}</span>
                        {info.label}
                        {c.completed && " ✓"}
                      </div>
                    );
                  })}
                  {dayCampaigns.length > 3 && (
                    <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 10, color: "#AAAAAA" }}>
                      +{dayCampaigns.length - 3} more
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Unscheduled sidebar */}
        <div>
          <div style={{
            fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
            color: "#AAAAAA", letterSpacing: "0.08em", textTransform: "uppercase",
            marginBottom: 12,
          }}>
            Unscheduled ({unscheduled.length})
          </div>

          {unscheduled.length === 0 ? (
            <div style={{
              background: "#F8F8F8", borderRadius: 14, padding: "24px 16px",
              textAlign: "center", fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#AAAAAA",
            }}>
              All campaigns scheduled! 🎉
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {unscheduled.map(c => {
                const info = getTypeInfo(c.content_type);
                return (
                  <div key={c.id} style={{
                    background: "#FFFFFF", borderRadius: 12, padding: "12px 14px",
                    border: "1.5px solid #EEEEEE",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 14 }}>{info.icon}</span>
                      <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 11, fontWeight: 500, color: "#878787" }}>
                        {info.label}
                      </span>
                    </div>
                    <div style={{
                      fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#555555",
                      lineHeight: 1.5, marginBottom: 10,
                      overflow: "hidden", display: "-webkit-box",
                      WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    }}>
                      {c.prompt}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button
                        onClick={() => setSchedulingId(c.id)}
                        style={{
                          flex: 1, padding: "7px", borderRadius: 8,
                          border: "1.5px solid #05AD98", background: "transparent",
                          fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
                          color: "#05AD98", cursor: "pointer", minWidth: 100,
                        }}
                      >
                        + Schedule
                      </button>
                      <button
                        onClick={() => handleCopyToComposer(c)}
                        title={composerInfo(platformOf(c.content_type)).buttonLabel}
                        style={{
                          padding: "7px 10px", borderRadius: 8,
                          border: "1px solid #EEEEEE", background: "#F8F8F8",
                          fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#555",
                          cursor: "pointer",
                        }}
                      >📋</button>
                      <button
                        onClick={() => handleSuggestTime(c)}
                        disabled={suggestingId === c.id}
                        title="Suggest best posting time"
                        style={{
                          padding: "7px 10px", borderRadius: 8,
                          border: "1px solid #EEEEEE", background: "#F8F8F8",
                          fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#555",
                          cursor: suggestingId === c.id ? "not-allowed" : "pointer",
                        }}
                      >{suggestingId === c.id ? "…" : "⏰"}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Scheduled summary */}
          {scheduled.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{
                fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
                color: "#AAAAAA", letterSpacing: "0.08em", textTransform: "uppercase",
                marginBottom: 12,
              }}>
                Scheduled ({scheduled.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {scheduled
                  .sort((a, b) => (a.scheduled_date ?? "").localeCompare(b.scheduled_date ?? ""))
                  .map(c => {
                    const info = getTypeInfo(c.content_type);
                    const d = new Date(c.scheduled_date + "T00:00:00");
                    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    return (
                      <div key={c.id} style={{
                        background: c.completed ? "#FAFAFA" : "#FFFFFF",
                        borderRadius: 10, padding: "10px 12px",
                        border: "1px solid #EEEEEE",
                        display: "flex", alignItems: "center", gap: 8,
                        opacity: c.completed ? 0.7 : 1,
                      }}>
                        <span style={{
                          background: "#E6FAF8", color: "#05AD98",
                          fontFamily: "var(--font-dm-sans)", fontSize: 11, fontWeight: 500,
                          padding: "2px 8px", borderRadius: 6, flexShrink: 0,
                        }}>{label}</span>
                        <span style={{ fontSize: 12 }}>{info.icon}</span>
                        <span style={{
                          fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#555",
                          flex: 1, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                        }}>{info.label}</span>
                        <button
                          onClick={() => handleCopyToComposer(c)}
                          title={composerInfo(platformOf(c.content_type)).buttonLabel}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#AAAAAA", fontSize: 13, padding: 2 }}
                        >📋</button>
                        <button
                          onClick={() => handleSuggestTime(c)}
                          disabled={suggestingId === c.id}
                          title="Suggest best posting time"
                          style={{ background: "none", border: "none", cursor: suggestingId === c.id ? "not-allowed" : "pointer", color: "#AAAAAA", fontSize: 13, padding: 2 }}
                        >{suggestingId === c.id ? "…" : "⏰"}</button>
                        <button
                          onClick={() => setSchedulingId(c.id)}
                          title="Reschedule"
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#AAAAAA", fontSize: 14, padding: 2 }}
                        >✎</button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
