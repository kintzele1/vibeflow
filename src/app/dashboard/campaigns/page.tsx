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
};

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

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");
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

  const types = ["all", ...Array.from(new Set(campaigns.map(c => c.content_type)))];

  const filtered = campaigns.filter(c => {
    const typeMatch = filter === "all" || c.content_type === filter;
    const statusMatch =
      statusFilter === "all" ? true :
      statusFilter === "completed" ? c.completed :
      !c.completed;
    return typeMatch && statusMatch;
  });

  const completedCount = campaigns.filter(c => c.completed).length;
  const activeCount = campaigns.filter(c => !c.completed).length;

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
              {campaigns.length} total
            </span>
            <span style={{ color: "#DDDDDD" }}>·</span>
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#05AD98" }}>
              {activeCount} active
            </span>
            <span style={{ color: "#DDDDDD" }}>·</span>
            <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#878787" }}>
              {completedCount} completed
            </span>
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
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {(["all", "active", "completed"] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s)} style={{
                  fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
                  padding: "5px 12px", borderRadius: 999, border: "none", cursor: "pointer",
                  background: statusFilter === s ? "#1F1F1F" : "#EEEEEE",
                  color: statusFilter === s ? "#FFFFFF" : "#878787",
                  textTransform: "capitalize",
                }}>
                  {s === "all" ? `All (${campaigns.length})` :
                   s === "active" ? `Active (${activeCount})` :
                   `Completed (${completedCount})`}
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

          {/* Right — detail */}
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

                {/* Complete toggle */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggleComplete(selected); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 14px", borderRadius: 999, border: "none", cursor: "pointer",
                    background: selected.completed ? "#E6FAF8" : "#F0F0F0",
                    color: selected.completed ? "#05AD98" : "#878787",
                    fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
                    transition: "all 0.15s",
                  }}
                >
                  {selected.completed ? "✓ Completed" : "Mark complete"}
                </button>

                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#AAAAAA", fontSize: 20 }}>×</button>
              </div>

              {/* Prompt */}
              <div style={{ background: "#F8F8F8", borderRadius: 10, padding: "12px 16px", marginBottom: 16, flexShrink: 0 }}>
                <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 11, color: "#AAAAAA", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Prompt</div>
                <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#555555", lineHeight: 1.5 }}>{selected.prompt}</div>
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
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteConfirm(selected.id); }}
                  style={{
                    background: "transparent", color: "#E24B4A",
                    fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 13,
                    padding: "8px 18px", borderRadius: 999,
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
