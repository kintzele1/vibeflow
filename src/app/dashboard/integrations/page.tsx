"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Ga4State =
  | { status: "loading" }
  | { status: "disconnected" }
  | { status: "needs_property"; accountName: string | null }
  | { status: "connected"; accountName: string; propertyId: string };

type Property = {
  property_id: string;
  account_name: string;
  property_name: string;
  display: string;
};

export default function IntegrationsPage() {
  const [ga4, setGa4] = useState<Ga4State>({ status: "loading" });
  const [urlError, setUrlError] = useState<string>("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [savingProperty, setSavingProperty] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("ga4_error");
    if (err) {
      setUrlError(err);
      // clear it from the URL after reading
      window.history.replaceState({}, "", window.location.pathname);
    }
    fetchGa4State();
  }, []);

  async function fetchGa4State() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setGa4({ status: "disconnected" }); return; }

    const { data } = await supabase
      .from("integrations")
      .select("property_id, account_name")
      .eq("user_id", user.id)
      .eq("provider", "ga4")
      .maybeSingle();

    if (!data) { setGa4({ status: "disconnected" }); return; }
    if (!data.property_id) {
      setGa4({ status: "needs_property", accountName: data.account_name });
      // auto-load properties so the picker is ready
      loadProperties();
      return;
    }
    setGa4({ status: "connected", accountName: data.account_name ?? "", propertyId: data.property_id });
  }

  async function loadProperties() {
    setPropertiesLoading(true);
    try {
      const res = await fetch("/api/integrations/ga4/properties");
      const data = await res.json();
      if (res.ok) setProperties(data.properties ?? []);
      else setUrlError(data.error ?? "Couldn't list properties");
    } finally {
      setPropertiesLoading(false);
    }
  }

  async function pickProperty(prop: Property) {
    setSavingProperty(prop.property_id);
    try {
      const res = await fetch("/api/integrations/ga4/select-property", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: prop.property_id, accountName: prop.display }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setUrlError(data.error ?? "Couldn't save property");
        return;
      }
      setGa4({ status: "connected", accountName: prop.display, propertyId: prop.property_id });
    } finally {
      setSavingProperty(null);
    }
  }

  async function disconnect() {
    if (!confirm("Disconnect GA4? You'll need to re-authorize to reconnect.")) return;
    setDisconnecting(true);
    try {
      const res = await fetch("/api/integrations/ga4/disconnect", { method: "POST" });
      if (res.ok) setGa4({ status: "disconnected" });
      else setUrlError("Disconnect failed");
    } finally {
      setDisconnecting(false);
    }
  }

  // Auto-disconnect + redirect to reauthorize. Used by the "Try again" primary
  // action on the error banner so the user doesn't have to click two buttons
  // when their connection is in a bad state.
  async function retryConnection() {
    setRetrying(true);
    try {
      // Best-effort disconnect — don't block reauthorize if there's nothing to clear.
      await fetch("/api/integrations/ga4/disconnect", { method: "POST" }).catch(() => {});
      window.location.href = "/api/integrations/ga4/authorize";
    } catch {
      setRetrying(false);
    }
  }

  const friendlyError = (code: string): string => {
    const map: Record<string, string> = {
      state_mismatch: "Security check failed. Please try connecting again — don't share the auth link.",
      token_exchange_failed: "Google rejected the auth code. Please try again.",
      no_access_token: "Google returned no access token. Please try again.",
      server_misconfigured: "Server is missing Google credentials. Contact support.",
      db_write_failed: "Couldn't save your connection. Please try again.",
      missing_code: "Auth flow was interrupted. Please try again.",
      access_denied: "You denied the permission request. No problem — you can try again anytime.",
    };
    return map[code] ?? `Error: ${code}`;
  };

  return (
    <div style={{ padding: "40px 48px", maxWidth: 1040, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 32, color: "#1F1F1F", letterSpacing: "-0.02em", marginBottom: 8 }}>
          Integrations 🔗
        </h1>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 16, color: "#878787" }}>
          Connect your tools. One-click setup for every platform.
        </p>
      </div>

      {urlError && (
        <div style={{
          background: "#FEF2F2", border: "1px solid rgba(226,75,74,0.2)",
          borderRadius: 12, padding: "14px 16px", marginBottom: 20,
          fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#E24B4A",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, flexWrap: "wrap",
        }}>
          <span style={{ flex: 1, minWidth: 200 }}>{friendlyError(urlError)}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={retryConnection}
              disabled={retrying}
              style={{
                background: "#E24B4A", color: "#FFFFFF",
                fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 13,
                padding: "7px 16px", borderRadius: 999, border: "none",
                cursor: retrying ? "not-allowed" : "pointer",
              }}
            >
              {retrying ? "Resetting…" : "Try again"}
            </button>
            <button
              onClick={() => setUrlError("")}
              aria-label="Dismiss"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#E24B4A", fontSize: 18 }}
            >×</button>
          </div>
        </div>
      )}

      {/* GA4 — dynamic card */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          background: "#FFFFFF", borderRadius: 16, padding: "24px",
          border: `1px solid ${ga4.status === "connected" ? "rgba(5,173,152,0.3)" : "#EEEEEE"}`,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: ga4.status === "needs_property" ? 20 : 0 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: ga4.status === "connected" ? "#E6FAF8" : "#F8F8F8",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
            }}>📊</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 8 }}>
                <h3 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 15, color: "#1F1F1F" }}>
                  Google Analytics 4
                </h3>
                <Ga4Badge status={ga4.status} />
              </div>
              <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787", lineHeight: 1.6, marginBottom: 12 }}>
                Real metrics in your Analytics Hub and per-campaign Results page. 5-minute cached refresh.
              </p>

              {ga4.status === "loading" && (
                <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#AAAAAA" }}>Checking connection…</div>
              )}

              {ga4.status === "disconnected" && (
                <a href="/api/integrations/ga4/authorize" style={{
                  background: "#05AD98", color: "#FFFFFF",
                  fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 13,
                  padding: "8px 20px", borderRadius: 999, textDecoration: "none", display: "inline-block",
                }}>Connect with Google →</a>
              )}

              {ga4.status === "connected" && (
                <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#1F1F1F" }}>
                  Property: <strong>{ga4.accountName}</strong>
                </div>
              )}
            </div>
          </div>

          {ga4.status === "connected" && (
            <div style={{
              borderTop: "1px solid #EEEEEE", marginTop: 16, paddingTop: 14,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 8,
            }}>
              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#AAAAAA" }}>
                Need to switch property or reauthorize?
              </span>
              <button onClick={disconnect} disabled={disconnecting} style={{
                background: "#FEF2F2", color: "#E24B4A",
                fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 13,
                padding: "8px 16px", borderRadius: 999,
                border: "1px solid rgba(226,75,74,0.3)",
                cursor: disconnecting ? "not-allowed" : "pointer",
              }}>{disconnecting ? "Disconnecting…" : "Disconnect / Reconnect"}</button>
            </div>
          )}

          {ga4.status === "needs_property" && (
            <div style={{ borderTop: "1px solid #EEEEEE", paddingTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, fontWeight: 500, color: "#1F1F1F" }}>
                  Pick the property to connect
                </div>
                <button onClick={disconnect} disabled={disconnecting} style={{
                  background: "#FEF2F2", color: "#E24B4A",
                  fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 13,
                  padding: "8px 16px", borderRadius: 999,
                  border: "1px solid rgba(226,75,74,0.3)",
                  cursor: disconnecting ? "not-allowed" : "pointer",
                }}>{disconnecting ? "Resetting…" : "Reset / Reconnect"}</button>
              </div>
              {propertiesLoading ? (
                <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787" }}>Loading your properties…</div>
              ) : properties.length === 0 ? (
                <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787" }}>
                  No GA4 properties found on this Google account. Make sure you have at least one GA4 property with read access.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {properties.map(p => (
                    <button key={p.property_id} onClick={() => pickProperty(p)} disabled={savingProperty === p.property_id}
                      style={{
                        textAlign: "left", background: "#F8F8F8",
                        border: "1.5px solid #EEEEEE", borderRadius: 10,
                        padding: "12px 14px", cursor: savingProperty === p.property_id ? "not-allowed" : "pointer",
                        fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#1F1F1F",
                        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                      }}>
                      <span>{p.display}</span>
                      <span style={{ fontSize: 12, color: "#05AD98", fontWeight: 500 }}>
                        {savingProperty === p.property_id ? "Saving…" : "Use this property →"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grouped integrations: Advertising → Social → Other.
          GA4 stays separately on top above this since it's the only dynamic card. */}
      {[
        {
          label: "Advertising",
          items: [
            { icon: "🎯", name: "Google Ads",   desc: "Complete Google Ads campaigns — keywords, headlines, descriptions, targeting.", status: "coming" },
            { icon: "📘", name: "Meta Ads",     desc: "Facebook + Instagram ad campaigns — copy, targeting, creative briefs.",       status: "coming" },
            { icon: "in", name: "LinkedIn Ads", desc: "B2B campaign manager — copy, targeting, audience setup.",                      status: "coming" },
            { icon: "𝕏",  name: "X Ads",        desc: "Promoted posts and ad campaigns directly on X.",                                status: "coming" },
            { icon: "🎵", name: "TikTok Ads",   desc: "Spark Ads, Top View, In-Feed campaigns with on-brand creative.",                status: "coming" },
          ],
        },
        {
          label: "Social",
          items: [
            { icon: "𝕏",  name: "X (Twitter)",                  desc: "Schedule and post social content directly.",                            status: "coming" },
            { icon: "in", name: "LinkedIn",                     desc: "Publish posts to your profile and Company Pages, track engagement.",   status: "coming" },
            { icon: "📘", name: "Meta (Facebook + Instagram)",  desc: "Organic posting to Facebook Pages and Instagram Business accounts.",   status: "coming" },
          ],
        },
        {
          label: "Other",
          items: [
            { icon: "💳", name: "Stripe",  desc: "Payments, usage tracking, and subscription management.",     status: "connected" },
            { icon: "📡", name: "PostHog", desc: "Product analytics — pageviews, events, funnels.",            status: "connected" },
            { icon: "▲",  name: "Vercel",  desc: "Auto-deploy landing page variants directly from VibeFlow.",  status: "coming" },
            { icon: "🐙", name: "GitHub",  desc: "Pull app details and deploy pages from your repos.",         status: "coming" },
          ],
        },
      ].map(section => (
        <div key={section.label} style={{ marginBottom: 32 }}>
          <h2 style={{
            fontFamily: "var(--font-dm-sans)", fontSize: 11, fontWeight: 600,
            letterSpacing: "0.1em", textTransform: "uppercase",
            color: "#AAAAAA", marginBottom: 14, marginTop: 4,
          }}>{section.label}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {section.items.map(item => (
              <div key={item.name} style={{
                background: "#FFFFFF", borderRadius: 16, padding: "24px",
                border: `1px solid ${item.status === "connected" ? "rgba(5,173,152,0.2)" : "#EEEEEE"}`,
                display: "flex", alignItems: "flex-start", gap: 16,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: item.status === "connected" ? "#E6FAF8" : "#F8F8F8",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, gap: 8 }}>
                    <h3 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 15, color: "#1F1F1F" }}>
                      {item.name}
                    </h3>
                    <span style={{
                      fontFamily: "var(--font-dm-sans)", fontSize: 11, fontWeight: 500,
                      padding: "2px 8px", borderRadius: 999, flexShrink: 0,
                      background: item.status === "connected" ? "#E6FAF8" : "#F0F0F0",
                      color: item.status === "connected" ? "#05AD98" : "#AAAAAA",
                    }}>
                      {item.status === "connected" ? "Connected" : "Coming soon"}
                    </span>
                  </div>
                  <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787", lineHeight: 1.6 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Ga4Badge({ status }: { status: Ga4State["status"] }) {
  const config = {
    loading:         { text: "Checking…",       bg: "#F0F0F0", fg: "#AAAAAA" },
    disconnected:    { text: "Not connected",   bg: "#F0F0F0", fg: "#AAAAAA" },
    needs_property:  { text: "Pick property",   bg: "#FFF3CD", fg: "#8B6000" },
    connected:       { text: "Connected",       bg: "#E6FAF8", fg: "#05AD98" },
  }[status];
  return (
    <span style={{
      fontFamily: "var(--font-dm-sans)", fontSize: 11, fontWeight: 500,
      padding: "2px 8px", borderRadius: 999,
      background: config.bg, color: config.fg,
    }}>
      {config.text}
    </span>
  );
}
