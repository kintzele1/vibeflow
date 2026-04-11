"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { VibeFlowWordmark } from "@/components/logo/SparklerLogo";

const TABS = [
  { label: "Vibe Launchpad",    href: "/dashboard",                icon: "⚡" },
  { label: "Content Marketing", href: "/dashboard/content",        icon: "✍️" },
  { label: "Social Media",      href: "/dashboard/social",         icon: "📱" },
  { label: "Visual Assets",     href: "/dashboard/visuals",        icon: "🎨" },
  { label: "My Campaigns",      href: "/dashboard/campaigns",      icon: "📁" },
  { label: "Calendar",          href: "/dashboard/calendar",       icon: "📅" },
  { label: "Brand Kit",         href: "/dashboard/brand",          icon: "✦" },
  { label: "Agents",            href: "/dashboard/agents",         icon: "🤖" },
  { label: "Integrations",      href: "/dashboard/integrations",   icon: "🔗" },
  { label: "Analytics Hub",     href: "/dashboard/analytics",      icon: "📊" },
  { label: "Usage & Billing",   href: "/dashboard/billing",        icon: "💳" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [searches, setSearches] = useState<number | null>(null);
  const [plan, setPlan] = useState<string>("free");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      setUser(user);
      fetchUsage(user.id);
    });
  }, []);

  async function fetchUsage(userId: string) {
    const { data } = await supabase
      .from("user_usage")
      .select("searches_remaining, plan")
      .eq("user_id", userId)
      .single();
    if (data) {
      setSearches(data.searches_remaining);
      setPlan(data.plan);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8F8F8" }}>
      <aside style={{
        width: 240, flexShrink: 0,
        background: "#FFFFFF", borderRight: "1px solid #EEEEEE",
        display: "flex", flexDirection: "column",
        padding: "24px 0",
        position: "sticky", top: 0, height: "100vh",
      }}>
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid #EEEEEE" }}>
          <VibeFlowWordmark size="sm" colorway="teal" animate={false} />
        </div>

        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" }}>
          {TABS.map(tab => {
            const active = isActive(tab.href);
            return (
              <a key={tab.href} href={tab.href} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10, textDecoration: "none",
                background: active ? "#E6FAF8" : "transparent",
                border: active ? "1px solid rgba(5,173,152,0.15)" : "1px solid transparent",
                transition: "background 0.15s",
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#F8F8F8"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: 16 }}>{tab.icon}</span>
                <span style={{
                  fontFamily: "var(--font-dm-sans)", fontSize: 14,
                  fontWeight: active ? 500 : 400,
                  color: active ? "#05AD98" : "#555555",
                }}>{tab.label}</span>
              </a>
            );
          })}
        </nav>

        <div style={{ padding: "16px", borderTop: "1px solid #EEEEEE" }}>
          {searches !== null && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#878787" }}>Searches</span>
                <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500, color: "#1F1F1F" }}>
                  {searches} left
                </span>
              </div>
              <div style={{ height: 4, background: "#EEEEEE", borderRadius: 999, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 999,
                  background: searches < 10 ? "#E24B4A" : "#05AD98",
                  width: `${Math.min((searches / 100) * 100, 100)}%`,
                  transition: "width 0.3s ease",
                }} />
              </div>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "#E6FAF8", display: "flex", alignItems: "center",
              justifyContent: "center", fontFamily: "var(--font-syne)",
              fontWeight: 700, fontSize: 13, color: "#05AD98", flexShrink: 0,
            }}>
              {user?.email?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#1F1F1F", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.email}
              </div>
              <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 11, color: "#05AD98", textTransform: "capitalize" }}>
                {plan} plan
              </div>
            </div>
          </div>

          <button onClick={handleSignOut} style={{
            width: "100%", padding: "8px", borderRadius: 8,
            border: "1px solid #EEEEEE", background: "transparent",
            fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787",
            cursor: "pointer", transition: "color 0.15s, border-color 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.color = "#E24B4A"; e.currentTarget.style.borderColor = "#E24B4A"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#878787"; e.currentTarget.style.borderColor = "#EEEEEE"; }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: "auto" }}>
        {children}
      </main>
    </div>
  );
}
