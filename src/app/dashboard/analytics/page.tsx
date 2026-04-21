"use client";
import { useEffect, useState } from "react";

type Headline = {
  sessions: number;
  users: number;
  engagedSessions: number;
  engagementSeconds: number;
  conversions: number;
  totalRevenue: number;
};

type Source = { source: string; sessions: number };

type SitewideState =
  | { status: "loading" }
  | { status: "not_connected" }
  | { status: "error"; message: string }
  | { status: "ready"; headline: Headline; topSources: Source[]; accountName: string | null };

function formatSeconds(totalSeconds: number): string {
  const mins = Math.round(totalSeconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  return `${hrs}h`;
}

function formatCurrency(n: number): string {
  if (n === 0) return "$0";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function AnalyticsPage() {
  const [state, setState] = useState<SitewideState>({ status: "loading" });

  useEffect(() => {
    fetch("/api/integrations/ga4/sitewide")
      .then(async r => {
        if (r.status === 404 || r.status === 400) {
          const data = await r.json().catch(() => ({}));
          if (data.error === "not_connected" || data.error === "no_property") {
            setState({ status: "not_connected" });
            return;
          }
          setState({ status: "error", message: data.message ?? "Couldn't load metrics" });
          return;
        }
        if (!r.ok) {
          const data = await r.json().catch(() => ({}));
          setState({ status: "error", message: data.error ?? `HTTP ${r.status}` });
          return;
        }
        const data = await r.json();
        setState({
          status: "ready",
          headline: data.headline,
          topSources: data.topSources,
          accountName: data.accountName,
        });
      })
      .catch(err => setState({ status: "error", message: err.message ?? "Network error" }));
  }, []);

  return (
    <div style={{ padding: "40px 48px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 32, color: "#1F1F1F", letterSpacing: "-0.02em", marginBottom: 8 }}>
          Analytics Hub 📊
        </h1>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 16, color: "#878787" }}>
          Site-wide performance across every channel — last 30 days, refreshed every 5 minutes.
        </p>
        {state.status === "ready" && state.accountName && (
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#05AD98", marginTop: 6 }}>
            Connected to <strong>{state.accountName}</strong>
          </p>
        )}
      </div>

      {state.status === "loading" && (
        <div style={{ padding: "60px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            border: "3px solid #E6FAF8", borderTop: "3px solid #05AD98",
            animation: "spin 0.8s linear infinite",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#878787" }}>Loading GA4 metrics…</span>
        </div>
      )}

      {state.status === "not_connected" && (
        <div style={{
          background: "#FFFFFF", borderRadius: 20, border: "1.5px dashed #DDDDDD",
          padding: "60px 40px", textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>📊</div>
          <h3 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 20, color: "#1F1F1F", marginBottom: 12 }}>
            Connect Google Analytics 4
          </h3>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 15, color: "#878787", marginBottom: 28, maxWidth: 440, margin: "0 auto 28px", lineHeight: 1.6 }}>
            See real traffic, conversions, and AI-powered insights — all tied back to your campaigns.
          </p>
          <a href="/dashboard/integrations" style={{
            background: "#05AD98", color: "#FFFFFF",
            fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 15,
            padding: "12px 28px", borderRadius: 999, textDecoration: "none", display: "inline-block",
          }}>Connect GA4 →</a>
        </div>
      )}

      {state.status === "error" && (
        <div style={{
          background: "#FEF2F2", border: "1px solid rgba(226,75,74,0.2)",
          borderRadius: 16, padding: "20px 24px",
          fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#E24B4A",
        }}>
          Couldn't load GA4 metrics: {state.message}
          <br />
          <a href="/dashboard/integrations" style={{ color: "#05AD98", textDecoration: "underline", fontSize: 13 }}>Check integration →</a>
        </div>
      )}

      {state.status === "ready" && (
        <>
          {/* Headline metric cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 32 }}>
            <MetricCard label="Sessions"          value={state.headline.sessions.toLocaleString()} hint="Last 30 days" />
            <MetricCard label="Users"             value={state.headline.users.toLocaleString()}    hint="Last 30 days" />
            <MetricCard label="Engaged sessions"  value={state.headline.engagedSessions.toLocaleString()} hint={`Of ${state.headline.sessions.toLocaleString()} total`} />
            <MetricCard label="Engagement time"   value={formatSeconds(state.headline.engagementSeconds)} hint="Total across users" />
            <MetricCard label="Conversions"       value={state.headline.conversions.toLocaleString()} hint="Last 30 days" />
            <MetricCard label="Revenue"           value={formatCurrency(state.headline.totalRevenue)} hint="Last 30 days" />
          </div>

          {/* Top traffic sources */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 18, color: "#1F1F1F", marginBottom: 14 }}>
              Top traffic sources
            </h2>
            <div style={{ background: "#FFFFFF", borderRadius: 16, border: "1px solid #EEEEEE", overflow: "hidden" }}>
              {state.topSources.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#AAAAAA" }}>
                  No sessions in the last 30 days.
                </div>
              ) : (
                state.topSources.map((s, i) => {
                  const pct = state.headline.sessions > 0 ? (s.sessions / state.headline.sessions) * 100 : 0;
                  return (
                    <div key={i} style={{
                      padding: "14px 20px",
                      borderBottom: i < state.topSources.length - 1 ? "1px solid #F0F0F0" : "none",
                      display: "flex", alignItems: "center", gap: 16,
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, fontWeight: 500, color: "#1F1F1F", marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {s.source}
                        </div>
                        <div style={{ height: 6, background: "#F0F0F0", borderRadius: 999, overflow: "hidden" }}>
                          <div style={{ height: "100%", background: "#05AD98", width: `${pct}%`, transition: "width 0.3s ease" }} />
                        </div>
                      </div>
                      <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, fontWeight: 500, color: "#1F1F1F", minWidth: 80, textAlign: "right" }}>
                        {s.sessions.toLocaleString()}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#AAAAAA" }}>
            Source: Google Analytics 4 · refreshes every 5 minutes · per-campaign metrics live on each campaign's Results page.
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div style={{
      background: "#FFFFFF", borderRadius: 16, padding: "20px",
      border: "1px solid #EEEEEE",
    }}>
      <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#AAAAAA", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 26, color: "#1F1F1F", marginBottom: 4, letterSpacing: "-0.01em" }}>
        {value}
      </div>
      <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 11, color: "#AAAAAA" }}>
        {hint}
      </div>
    </div>
  );
}
