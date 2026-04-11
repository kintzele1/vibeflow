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
};

const TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  campaign:           { label: "Full Campaign",     icon: "⚡", color: "#05AD98" },
  blog:               { label: "Blog Post",          icon: "✍️", color: "#6060CC" },
  newsletter:         { label: "Newsletter",         icon: "📧", color: "#05AD98" },
  twitter:            { label: "Twitter Thread",     icon: "𝕏",  color: "#1F1F1F" },
  linkedin:           { label: "LinkedIn Post",      icon: "in", color: "#0077B5" },
  reddit:             { label: "Reddit Post",        icon: "👾", color: "#FF4500" },
  youtube:            { label: "YouTube Script",     icon: "▶️", color: "#FF0000" },
  email_sequence:     { label: "Email Sequence",     icon: "💌", color: "#05AD98" },
  social_x_post:      { label: "X Posts",            icon: "𝕏",  color: "#1F1F1F" },
  social_linkedin_posts: { label: "LinkedIn Posts",  icon: "in", color: "#0077B5" },
  social_instagram:   { label: "Instagram",          icon: "📸", color: "#E1306C" },
  social_tiktok:      { label: "TikTok Scripts",     icon: "🎵", color: "#010101" },
  social_reddit_posts:{ label: "Reddit Posts",       icon: "👾", color: "#FF4500" },
  social_threads:     { label: "Threads",            icon: "🧵", color: "#1F1F1F" },
  social_carousel:    { label: "Carousel Post",      icon: "🎠", color: "#6060CC" },
};

function getTypeInfo(type: string) {
  return TYPE_LABELS[type] ?? { label: type, icon: "📄", color: "#878787" };
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

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const supabase = createClient();

  useEffect(() => {
    fetchCampaigns();
  }, []);

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

  async function handleDelete(id: string) {
    await supabase.from("campaigns").delete().eq("id", id);
    setCampaigns(prev => prev.filter(c => c.id !== id));
    if (selected?.id === id) setSelected(null);
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

  const types = ["all", ...Array.from(new Set(campaigns.map(c => c.content_type)))];
  const filtered = filter === "all" ? campaigns : campaigns.filter(c => c.content_type === filter);

  if (loading) {
    return (
      <div style={{ padding: "40px 48px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          border: "3px solid #E6FAF8", borderTop: "3px solid #05AD98",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 48px", maxWidth: 1100, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{
            fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 32,
            color: "#1F1F1F", letterSpacing: "-0.02em", marginBottom: 8,
          }}>
            My Campaigns 📁
          </h1>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 16, color: "#878787" }}>
            {campaigns.length} saved {campaigns.length === 1 ? "asset" : "assets"} — all your generated content in one place.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <a href="/dashboard" style={{
            background: "#05AD98", color: "#FFFFFF",
            fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 14,
            padding: "10px 20px", borderRadius: 999, textDecoration: "none",
          }}>
            + New Campaign
          </a>
        </div>
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
            Generate your first campaign from the Vibe Launchpad, or create individual content pieces from the Content and Social tabs.
          </p>
          <a href="/dashboard" style={{
            background: "#05AD98", color: "#FFFFFF",
            fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 15,
            padding: "12px 28px", borderRadius: 999, textDecoration: "none",
            display: "inline-block",
          }}>
            Go to Launchpad →
          </a>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: selected ? "320px 1fr" : "1fr", gap: 20 }}>

          {/* List */}
          <div>
            {/* Filter tabs */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {types.map(t => (
                <button key={t} onClick={() => setFilter(t)} style={{
                  fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
                  padding: "5px 12px", borderRadius: 999, border: "none", cursor: "pointer",
                  background: filter === t ? "#05AD98" : "#EEEEEE",
                  color: filter === t ? "#FFFFFF" : "#878787",
                  transition: "all 0.15s",
                }}>
                  {t === "all" ? `All (${campaigns.length})` : getTypeInfo(t).label}
                </button>
              ))}
            </div>

            {/* Campaign list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.map(campaign => {
                const typeInfo = getTypeInfo(campaign.content_type);
                const isSelected = selected?.id === campaign.id;
                return (
                  <div
                    key={campaign.id}
                    onClick={() => setSelected(isSelected ? null : campaign)}
                    style={{
                      background: isSelected ? "#E6FAF8" : "#FFFFFF",
                      border: `1.5px solid ${isSelected ? "#05AD98" : "#EEEEEE"}`,
                      borderRadius: 14, padding: "16px 18px",
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = "#BBBBBB"; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = "#EEEEEE"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 16 }}>{typeInfo.icon}</span>
                      <span style={{
                        fontFamily: "var(--font-dm-sans)", fontSize: 11, fontWeight: 500,
                        padding: "2px 8px", borderRadius: 999,
                        background: isSelected ? "rgba(5,173,152,0.15)" : "#F0F0F0",
                        color: isSelected ? "#05AD98" : "#878787",
                      }}>{typeInfo.label}</span>
                      <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 11, color: "#AAAAAA", marginLeft: "auto" }}>
                        {timeAgo(campaign.created_at)}
                      </span>
                    </div>
                    <div style={{
                      fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#555555",
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

          {/* Detail view */}
          {selected && (
            <div style={{
              background: "#FFFFFF", borderRadius: 20, border: "1.5px solid #EEEEEE",
              padding: "28px 32px", position: "sticky", top: 24,
              maxHeight: "calc(100vh - 120px)", display: "flex", flexDirection: "column",
            }}>
              {/* Detail header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexShrink: 0 }}>
                <span style={{ fontSize: 20 }}>{getTypeInfo(selected.content_type).icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 16, color: "#1F1F1F" }}>
                    {getTypeInfo(selected.content_type).label}
                  </div>
                  <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#AAAAAA" }}>
                    {timeAgo(selected.created_at)}
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{
                  background: "none", border: "none", cursor: "pointer", color: "#AAAAAA", fontSize: 20,
                }}>×</button>
              </div>

              {/* Prompt */}
              <div style={{
                background: "#F8F8F8", borderRadius: 10, padding: "12px 16px",
                marginBottom: 16, flexShrink: 0,
              }}>
                <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 11, color: "#AAAAAA", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Prompt</div>
                <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#555555", lineHeight: 1.5 }}>
                  {selected.prompt}
                </div>
              </div>

              {/* Content */}
              <div style={{
                flex: 1, overflowY: "auto",
                fontFamily: "var(--font-dm-sans)", fontSize: 14,
                color: "#333333", lineHeight: 1.8, whiteSpace: "pre-wrap",
                marginBottom: 16,
              }}>
                {selected.content}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, flexShrink: 0, flexWrap: "wrap" }}>
                <button onClick={() => handleExport(selected)} style={{
                  background: "#05AD98", color: "#FFFFFF",
                  fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 13,
                  padding: "8px 18px", borderRadius: 999, border: "none", cursor: "pointer",
                }}>Export ↓</button>
                <button onClick={() => navigator.clipboard.writeText(selected.content)} style={{
                  background: "#F8F8F8", color: "#1F1F1F",
                  fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 13,
                  padding: "8px 18px", borderRadius: 999, border: "1px solid #EEEEEE", cursor: "pointer",
                }}>Copy</button>
                <button onClick={() => handleDelete(selected.id)} style={{
                  background: "transparent", color: "#E24B4A",
                  fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 13,
                  padding: "8px 18px", borderRadius: 999, border: "1px solid rgba(226,75,74,0.2)", cursor: "pointer",
                  marginLeft: "auto",
                }}>Delete</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
