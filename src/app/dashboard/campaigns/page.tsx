"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Campaign = {
  id: string;
  title: string | null;
  prompt: string;
  content: string;
  content_type: string;
  created_at: string;
  completed: boolean;
  brand_kit_applied: boolean | null;
  archived: boolean | null;
};

// Maps a saved campaign's content_type to the agent page that can regenerate it.
// Image generations and anything unmapped fall back to the main Launchpad.
const CONTENT_TYPE_ROUTES: Record<string, string> = {
  campaign:              "/dashboard",
  blog:                  "/dashboard/content",
  newsletter:            "/dashboard/content",
  twitter:               "/dashboard/content",
  linkedin:              "/dashboard/content",
  reddit:                "/dashboard/content",
  youtube:               "/dashboard/content",
  email_sequence:        "/dashboard/content",
  social_x_post:         "/dashboard/social",
  social_linkedin_posts: "/dashboard/social",
  social_instagram:      "/dashboard/social",
  social_tiktok:         "/dashboard/social",
  social_reddit_posts:   "/dashboard/social",
  social_threads:        "/dashboard/social",
  social_carousel:       "/dashboard/social",
  seo_keywords:          "/dashboard/seo",
  seo_on_page:           "/dashboard/seo",
  seo_technical:         "/dashboard/seo",
  seo_briefs:            "/dashboard/seo",
  seo_backlinks:         "/dashboard/seo",
  ppc_google:            "/dashboard/ppc",
  ppc_meta:              "/dashboard/ppc",
  ppc_linkedin:          "/dashboard/ppc",
  ppc_x:                 "/dashboard/ppc",
  ppc_tiktok:            "/dashboard/ppc",
  email_welcome:         "/dashboard/email",
  email_onboarding:      "/dashboard/email",
  email_upsell:          "/dashboard/email",
  email_reengagement:    "/dashboard/email",
  email_broadcast:       "/dashboard/email",
  aso_title_subtitle:    "/dashboard/aso",
  aso_description:       "/dashboard/aso",
  aso_keywords:          "/dashboard/aso",
  aso_screenshots:       "/dashboard/aso",
  aso_preview_video:     "/dashboard/aso",
  community_product_hunt:        "/dashboard/community",
  community_influencer_outreach: "/dashboard/community",
  community_reddit_discord:      "/dashboard/community",
  community_pr_pitch:            "/dashboard/community",
  community_launch_x_thread:     "/dashboard/community",
};

function refreshHref(campaign: Campaign): string {
  const base = CONTENT_TYPE_ROUTES[campaign.content_type] ?? "/dashboard";
  const params = new URLSearchParams({ prompt: campaign.prompt, refresh: "1" });
  if (base === "/dashboard/content") {
    params.set("type", campaign.content_type);
  } else if (base === "/dashboard/social") {
    // social_x_post → x_post. The social page expects the bare key.
    params.set("type", campaign.content_type.replace(/^social_/, ""));
  } else if (base === "/dashboard/seo") {
    params.set("type", campaign.content_type.replace(/^seo_/, ""));
  } else if (base === "/dashboard/ppc") {
    params.set("type", campaign.content_type.replace(/^ppc_/, ""));
  } else if (base === "/dashboard/email") {
    params.set("type", campaign.content_type.replace(/^email_/, ""));
  } else if (base === "/dashboard/aso") {
    params.set("type", campaign.content_type.replace(/^aso_/, ""));
  } else if (base === "/dashboard/community") {
    params.set("type", campaign.content_type.replace(/^community_/, ""));
  }
  return `${base}?${params.toString()}`;
}

const TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  campaign:              { label: "Full Campaign",     icon: "⚡" },
  blog:                  { label: "Blog Post",          icon: "✍️" },
  newsletter:            { label: "Newsletter",         icon: "📧" },
  twitter:               { label: "Twitter Thread",     icon: "𝕏"  },
  linkedin:              { label: "LinkedIn Post",      icon: "in" },
  reddit:                { label: "Reddit Post",        icon: "👾" },
  youtube:               { label: "YouTube Script",     icon: "▶️" },
  email_sequence:        { label: "Email Sequence",     icon: "💌" },
  social_x_post:         { label: "X Posts",            icon: "𝕏"  },
  social_linkedin_posts: { label: "LinkedIn Posts",     icon: "in" },
  social_instagram:      { label: "Instagram",          icon: "📸" },
  social_tiktok:         { label: "TikTok Scripts",     icon: "🎵" },
  social_reddit_posts:   { label: "Reddit Posts",       icon: "👾" },
  social_threads:        { label: "Threads",            icon: "🧵" },
  social_carousel:       { label: "Carousel Post",      icon: "🎠" },
  seo_keywords:          { label: "Keyword Research",   icon: "🔑" },
  seo_on_page:           { label: "On-Page SEO",        icon: "📄" },
  seo_technical:         { label: "Technical SEO",      icon: "⚙️" },
  seo_briefs:            { label: "Content Brief",      icon: "📋" },
  seo_backlinks:         { label: "Backlink Outreach",  icon: "🔗" },
  ppc_google:            { label: "Google Ads",         icon: "🎯" },
  ppc_meta:              { label: "Meta Ads",           icon: "📘" },
  ppc_linkedin:          { label: "LinkedIn Ads",       icon: "in" },
  ppc_x:                 { label: "X Ads",              icon: "𝕏"  },
  ppc_tiktok:            { label: "TikTok Ads",         icon: "🎵" },
  email_welcome:         { label: "Welcome Series",     icon: "👋" },
  email_onboarding:      { label: "Onboarding",         icon: "🚀" },
  email_upsell:          { label: "Upsell",             icon: "💰" },
  email_reengagement:    { label: "Re-engagement",      icon: "💌" },
  email_broadcast:       { label: "Broadcast Email",    icon: "📢" },
  aso_title_subtitle:    { label: "Title + Subtitle",   icon: "🏷️" },
  aso_description:       { label: "Store Description",  icon: "📄" },
  aso_keywords:          { label: "ASO Keywords",       icon: "🔑" },
  aso_screenshots:       { label: "Screenshots",        icon: "📸" },
  aso_preview_video:     { label: "Preview Video",      icon: "🎬" },
  community_product_hunt:       { label: "Product Hunt Kit",    icon: "🚀" },
  community_influencer_outreach:{ label: "Influencer Outreach", icon: "🎤" },
  community_reddit_discord:     { label: "Reddit + Discord",    icon: "👾" },
  community_pr_pitch:           { label: "PR Pitch",            icon: "📰" },
  community_launch_x_thread:    { label: "Launch X Thread",     icon: "𝕏"  },
};

function getTypeInfo(type: string) {
  return TYPE_LABELS[type] ?? { label: type, icon: "📄" };
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

type StatusFilter = "all" | "active" | "completed" | "archived";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => { fetchCampaigns(); }, []);

  async function fetchCampaigns() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("campaigns")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setCampaigns(data ?? []);
    setLoading(false);
  }

  async function handleToggleComplete(campaign: Campaign) {
    const newValue = !campaign.completed;
    // Optimistic update
    setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, completed: newValue } : c));
    if (selected?.id === campaign.id) setSelected(prev => prev ? { ...prev, completed: newValue } : null);

    await fetch(`/api/campaigns/${campaign.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: newValue }),
    });
  }

  async function handleToggleArchive(campaign: Campaign) {
    const newValue = !campaign.archived;
    setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, archived: newValue } : c));
    if (selected?.id === campaign.id) {
      // When archiving, collapse the detail panel so the list view comes back
      if (newValue) setSelected(null);
      else setSelected(prev => prev ? { ...prev, archived: newValue } : null);
    }

    await fetch(`/api/campaigns/${campaign.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: newValue }),
    });
  }

  async function handleDelete(id: string) {
    await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
    setCampaigns(prev => prev.filter(c => c.id !== id));
    if (selected?.id === id) setSelected(null);
    setDeleteConfirm(null);
  }

  function handleExport(campaign: Campaign) {
    const typeInfo = getTypeInfo(campaign.content_type);
    const blob = new Blob([campaign.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vibeflow-${typeInfo.label.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }


  const types = ["all", ...Array.from(new Set(campaigns.filter(c => !c.archived).map(c => c.content_type)))];

  const filtered = campaigns.filter(c => {
    const typeMatch = filter === "all" || c.content_type === filter;
    const statusMatch =
      statusFilter === "archived" ? !!c.archived :
      c.archived ? false :                              // hide archived from all/active/completed views
      statusFilter === "all" ? true :
      statusFilter === "completed" ? c.completed :
      !c.completed;
    return typeMatch && statusMatch;
  });

  const activeCampaigns = campaigns.filter(c => !c.archived);
  const completedCount = activeCampaigns.filter(c => c.completed).length;
  const activeCount = activeCampaigns.filter(c => !c.completed).length;
  const archivedCount = campaigns.filter(c => c.archived).length;

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

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "#FFFFFF", borderRadius: 20, padding: "36px 40px",
            maxWidth: 420, width: "100%", margin: "0 24px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
          }}>
            <div style={{ fontSize: 36, marginBottom: 16, textAlign: "center" }}>🗑️</div>
            <h3 style={{
              fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 20,
              color: "#1F1F1F", textAlign: "center", marginBottom: 12,
            }}>
              Delete this campaign?
            </h3>
            <p style={{
              fontFamily: "var(--font-dm-sans)", fontSize: 15, color: "#878787",
              textAlign: "center", lineHeight: 1.6, marginBottom: 28,
            }}>
              This action cannot be undone. The campaign and all its content will be permanently removed.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  flex: 1, padding: "12px", borderRadius: 12,
                  border: "1.5px solid #EEEEEE", background: "#FFFFFF",
                  fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 15,
                  color: "#878787", cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                style={{
                  flex: 1, padding: "12px", borderRadius: 12,
                  border: "none", background: "#E24B4A",
                  fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 15,
                  color: "#FFFFFF", cursor: "pointer",
                }}
              >
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 32, color: "#1F1F1F", letterSpacing: "-0.02em", marginBottom: 8 }}>
            My Campaigns 📁
          </h1>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#878787" }}>
              {activeCampaigns.length} total
            </span>
            <span style={{ color: "#DDDDDD" }}>·</span>
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#05AD98" }}>
              {activeCount} active
            </span>
            <span style={{ color: "#DDDDDD" }}>·</span>
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#878787" }}>
              {completedCount} completed
            </span>
            {archivedCount > 0 && (
              <>
                <span style={{ color: "#DDDDDD" }}>·</span>
                <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#AAAAAA" }}>
                  {archivedCount} archived
                </span>
              </>
            )}
          </div>
        </div>
        <a href="/dashboard" style={{
          background: "#05AD98", color: "#FFFFFF",
          fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 14,
          padding: "10px 20px", borderRadius: 999, textDecoration: "none",
        }}>
          + New Campaign
        </a>
      </div>

      {campaigns.length === 0 ? (
        <div style={{
          background: "#FFFFFF", borderRadius: 20, border: "1.5px dashed #DDDDDD",
          padding: "80px 40px", textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>📭</div>
          <h3 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 20, color: "#1F1F1F", marginBottom: 12 }}>
            No saved assets yet
          </h3>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 15, color: "#878787", marginBottom: 28, maxWidth: 360, margin: "0 auto 28px" }}>
            Generate your first campaign from the Vibe Launchpad, or create individual pieces from Content and Social.
          </p>
          <a href="/dashboard" style={{
            background: "#05AD98", color: "#FFFFFF",
            fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 15,
            padding: "12px 28px", borderRadius: 999, textDecoration: "none", display: "inline-block",
          }}>Go to Launchpad →</a>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: selected ? "320px 1fr" : "1fr", gap: 20 }}>

          {/* Left — list */}
          <div>
            {/* Status filter */}
            <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
              {(["all", "active", "completed", "archived"] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} style={{
                  fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
                  padding: "5px 12px", borderRadius: 999, border: "none", cursor: "pointer",
                  background: statusFilter === s ? "#1F1F1F" : "#EEEEEE",
                  color: statusFilter === s ? "#FFFFFF" : "#878787",
                  textTransform: "capitalize",
                }}>
                  {s === "all"       ? `All (${activeCampaigns.length})` :
                   s === "active"    ? `Active (${activeCount})` :
                   s === "completed" ? `Completed (${completedCount})` :
                                        `Archived (${archivedCount})`}
                </button>
              ))}
            </div>

            {/* Type filter */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {types.map(t => (
                <button key={t} onClick={() => setFilter(t)} style={{
                  fontFamily: "var(--font-dm-sans)", fontSize: 11, fontWeight: 500,
                  padding: "4px 10px", borderRadius: 999, border: "none", cursor: "pointer",
                  background: filter === t ? "#05AD98" : "#F0F0F0",
                  color: filter === t ? "#FFFFFF" : "#878787",
                }}>
                  {t === "all" ? "All types" : getTypeInfo(t).label}
                </button>
              ))}
            </div>

            {/* Campaign list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {filtered.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", color: "#AAAAAA", fontFamily: "var(--font-dm-sans)", fontSize: 14 }}>
                  No campaigns match this filter.
                </div>
              ) : filtered.map(campaign => {
                const typeInfo = getTypeInfo(campaign.content_type);
                const isSelected = selected?.id === campaign.id;
                return (
                  <div
                    key={campaign.id}
                    onClick={() => setSelected(isSelected ? null : campaign)}
                    style={{
                      background: campaign.completed ? "#FAFAFA" : (isSelected ? "#E6FAF8" : "#FFFFFF"),
                      border: `1.5px solid ${isSelected ? "#05AD98" : "#EEEEEE"}`,
                      borderRadius: 14, padding: "14px 16px",
                      cursor: "pointer", transition: "all 0.15s",
                      opacity: campaign.completed ? 0.75 : 1,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                      <span style={{ fontSize: 14 }}>{typeInfo.icon}</span>
                      <span style={{
                        fontFamily: "var(--font-dm-sans)", fontSize: 11, fontWeight: 500,
                        padding: "2px 8px", borderRadius: 999,
                        background: isSelected ? "rgba(5,173,152,0.12)" : "#F0F0F0",
                        color: isSelected ? "#05AD98" : "#878787",
                      }}>{typeInfo.label}</span>

                      {campaign.completed && (
                        <span style={{
                          fontFamily: "var(--font-dm-sans)", fontSize: 11, fontWeight: 500,
                          padding: "2px 8px", borderRadius: 999,
                          background: "#E6FAF8", color: "#05AD98",
                          display: "flex", alignItems: "center", gap: 3,
                        }}>✓ Complete</span>
                      )}

                      <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 11, color: "#AAAAAA", marginLeft: "auto" }}>
                        {timeAgo(campaign.created_at)}
                      </span>
                    </div>
                    <div style={{
                      fontFamily: "var(--font-dm-sans)", fontSize: 13, color: campaign.completed ? "#AAAAAA" : "#555555",
                      lineHeight: 1.5, overflow: "hidden",
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    }}>
                      {campaign.prompt}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right — detail (minimal preview + prominent CTAs) */}
          {selected && (
            <div style={{
              background: "#FFFFFF", borderRadius: 20, border: "1.5px solid #EEEEEE",
              padding: "28px 32px", position: "sticky", top: 24,
              display: "flex", flexDirection: "column", gap: 20,
            }}>
              {/* Header row */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ fontSize: 22, lineHeight: 1 }}>{getTypeInfo(selected.content_type).icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{
                      fontFamily: "var(--font-dm-sans)", fontSize: 11, fontWeight: 500,
                      padding: "2px 8px", borderRadius: 999,
                      background: "#F0F0F0", color: "#878787",
                    }}>{getTypeInfo(selected.content_type).label}</span>
                    {selected.completed && (
                      <span style={{
                        fontFamily: "var(--font-dm-sans)", fontSize: 11, fontWeight: 500,
                        padding: "2px 8px", borderRadius: 999,
                        background: "#E6FAF8", color: "#05AD98",
                      }}>✓ Complete</span>
                    )}
                    {selected.brand_kit_applied && (
                      <span style={{
                        fontFamily: "var(--font-dm-sans)", fontSize: 11, fontWeight: 500,
                        padding: "2px 8px", borderRadius: 999,
                        background: "#F0F5FF", color: "#4F5BEF",
                      }}>✨ Brand Kit applied</span>
                    )}
                  </div>
                  <div style={{
                    fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 20,
                    color: "#1F1F1F", letterSpacing: "-0.01em", lineHeight: 1.2, marginBottom: 6,
                  }}>
                    {selected.title ?? getTypeInfo(selected.content_type).label}
                  </div>
                  <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#AAAAAA" }}>
                    Generated {timeAgo(selected.created_at)}
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#AAAAAA", fontSize: 24, lineHeight: 1, padding: 0,
                }}>×</button>
              </div>

              {/* Content preview — first paragraph, truncated */}
              <div style={{ background: "#FAFAFA", borderRadius: 12, padding: "16px 18px" }}>
                <div style={{
                  fontFamily: "var(--font-dm-sans)", fontSize: 11,
                  color: "#AAAAAA", marginBottom: 8,
                  textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500,
                }}>
                  Preview
                </div>
                <div style={{
                  fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#555555",
                  lineHeight: 1.6, whiteSpace: "pre-wrap",
                  display: "-webkit-box", WebkitLineClamp: 5, WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}>
                  {selected.content.replace(/^#+\s+/gm, "").replace(/\*\*/g, "").trim()}
                </div>
                <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 11, color: "#AAAAAA", marginTop: 8 }}>
                  Full content available via View Results, Export, or Copy.
                </div>
              </div>

              {/* Primary CTA — Download content as a text file they can paste anywhere */}
              <button onClick={() => handleExport(selected)} style={{
                display: "block", width: "100%", textAlign: "center",
                background: "#05AD98", color: "#FFFFFF",
                fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 15,
                padding: "14px 28px", borderRadius: 999, border: "none",
                cursor: "pointer",
              }}>
                📥 Export Campaign
              </button>
              <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#AAAAAA", textAlign: "center", marginTop: -10 }}>
                Downloads a .md file you can paste into any editor, CMS, or social tool.
              </div>

              {/* Secondary options */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => navigator.clipboard.writeText(selected.content)} style={{
                  background: "#F8F8F8", color: "#1F1F1F",
                  fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 13,
                  padding: "8px 16px", borderRadius: 999, border: "1px solid #EEEEEE", cursor: "pointer",
                }}>Copy to clipboard</button>
                {selected.brand_kit_applied && (
                  <a
                    href={refreshHref(selected)}
                    title="Regenerate this with your current Brand Kit. Costs 1 search. Original is preserved."
                    style={{
                      background: "#F0F5FF", color: "#4F5BEF",
                      fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 13,
                      padding: "8px 16px", borderRadius: 999,
                      border: "none", cursor: "pointer", textDecoration: "none",
                      display: "inline-flex", alignItems: "center", gap: 6,
                    }}
                  >✨ Refresh brand</a>
                )}
                <a href={`/dashboard/campaigns/${selected.id}/results`} style={{
                  fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 13,
                  padding: "8px 16px", color: "#878787", textDecoration: "none",
                  marginLeft: "auto",
                }}>
                  View analytics →
                </a>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "#F0F0F0" }} />

              {/* Secondary actions row 2 — status management */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <button onClick={() => handleToggleComplete(selected)} style={{
                  background: selected.completed ? "#E6FAF8" : "#F0F0F0",
                  color: selected.completed ? "#05AD98" : "#878787",
                  fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
                  padding: "6px 14px", borderRadius: 999, border: "none", cursor: "pointer",
                }}>
                  {selected.completed ? "✓ Completed (click to undo)" : "Mark complete"}
                </button>
                <button onClick={() => handleToggleArchive(selected)} style={{
                  background: selected.archived ? "#FFF3CD" : "#F0F0F0",
                  color: selected.archived ? "#8B6000" : "#878787",
                  fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
                  padding: "6px 14px", borderRadius: 999, border: "none", cursor: "pointer",
                }}>
                  {selected.archived ? "📦 Unarchive" : "📦 Archive"}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteConfirm(selected.id); }}
                  style={{
                    background: "transparent", color: "#E24B4A",
                    fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 12,
                    padding: "6px 14px", borderRadius: 999,
                    border: "1px solid rgba(226,75,74,0.2)", cursor: "pointer",
                    marginLeft: "auto",
                  }}
                >Delete</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
