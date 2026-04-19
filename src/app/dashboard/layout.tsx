"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { VibeFlowWordmark } from "@/components/logo/SparklerLogo";
import {
  Zap, PenLine, Share2, Image, Folder, Calendar,
  Sparkles, Bot, Link, BarChart2, CreditCard, LogOut, Menu, X,
  Search, Target
} from "lucide-react";

const TABS = [
  { label: "Vibe Launchpad",    href: "/dashboard",              icon: Zap },
  { label: "Content Marketing", href: "/dashboard/content",      icon: PenLine },
  { label: "Social Media",      href: "/dashboard/social",       icon: Share2 },
  { label: "SEO",               href: "/dashboard/seo",          icon: Search },
  { label: "Paid Ads",          href: "/dashboard/ppc",          icon: Target },
  { label: "My Campaigns",      href: "/dashboard/campaigns",    icon: Folder },
  { label: "Calendar",          href: "/dashboard/calendar",     icon: Calendar },
  { label: "Brand Kit",         href: "/dashboard/brand",        icon: Sparkles },
  { label: "Agents",            href: "/dashboard/agents",       icon: Bot },
  { label: "Integrations",      href: "/dashboard/integrations", icon: Link },
  { label: "Analytics Hub",     href: "/dashboard/analytics",    icon: BarChart2 },
  { label: "Usage & Billing",   href: "/dashboard/billing",      icon: CreditCard },
];
// Visual Assets tab removed at end of Day 2 — tool parked, backend code
// (/dashboard/visuals + /api/generate-image) kept dormant for later revival.
// See BACKLOG.md item #16 for the four revival options.

const MOBILE_TABS = [
  { label: "Launch",   href: "/dashboard",         icon: Zap },
  { label: "Content",  href: "/dashboard/content", icon: PenLine },
  { label: "Social",   href: "/dashboard/social",  icon: Share2 },
  { label: "More",     href: null,                 icon: Menu },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [searches, setSearches] = useState<number | null>(null);
  const [plan, setPlan] = useState<string>("free");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      setUser(user);
      fetchUsage(user.id);
    });
  }, []);

  async function fetchUsage(userId: string) {
    const { data } = await supabase
      .from("user_usage").select("searches_remaining, plan").eq("user_id", userId).single();
    if (data) { setSearches(data.searches_remaining); setPlan(data.plan); }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const SidebarContent = () => (
    <>
      <div style={{ padding: "0 20px 24px", borderBottom: "1px solid #EEEEEE" }}>
        <VibeFlowWordmark size="sm" colorway="teal" animate={false} />
      </div>

      <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        {TABS.map(tab => {
          const active = isActive(tab.href);
          const Icon = tab.icon;
          return (
            <a key={tab.href} href={tab.href}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 10, textDecoration: "none",
                background: active ? "#E6FAF8" : "transparent",
                border: active ? "1px solid rgba(5,173,152,0.15)" : "1px solid transparent",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#F8F8F8"; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon size={16} color={active ? "#05AD98" : "#878787"} strokeWidth={active ? 2.5 : 1.75} />
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
              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500, color: "#1F1F1F" }}>{searches} left</span>
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
            width: 32, height: 32, borderRadius: "50%", background: "#E6FAF8",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 13, color: "#05AD98", flexShrink: 0,
          }}>
            {user?.email?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#1F1F1F", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.email}
            </div>
            <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 11, color: "#05AD98", textTransform: "capitalize" }}>{plan} plan</div>
          </div>
        </div>

        <button onClick={handleSignOut} style={{
          width: "100%", padding: "8px", borderRadius: 8,
          border: "1px solid #EEEEEE", background: "transparent",
          fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          transition: "color 0.15s, border-color 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.color = "#E24B4A"; e.currentTarget.style.borderColor = "#E24B4A"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#878787"; e.currentTarget.style.borderColor = "#EEEEEE"; }}
        >
          <LogOut size={13} />Sign out
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F8F8F8" }}>

      {/* Desktop sidebar */}
      <aside className="desktop-sidebar" style={{
        width: 240, flexShrink: 0,
        background: "#FFFFFF", borderRight: "1px solid #EEEEEE",
        display: "flex", flexDirection: "column", padding: "24px 0",
        position: "sticky", top: 0, height: "100vh",
      }}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex" }}>
          <div style={{
            width: 260, background: "#FFFFFF", height: "100%",
            display: "flex", flexDirection: "column", padding: "24px 0",
            boxShadow: "4px 0 24px rgba(0,0,0,0.1)",
          }}>
            <SidebarContent />
          </div>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.4)" }} onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main */}
      <main style={{ flex: 1, overflow: "auto", paddingBottom: 80 }}>

        {/* Mobile top bar */}
        <div className="mobile-topbar" style={{
          display: "none", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", background: "#FFFFFF", borderBottom: "1px solid #EEEEEE",
          position: "sticky", top: 0, zIndex: 50,
        }}>
          <VibeFlowWordmark size="sm" colorway="teal" animate={false} />
          <button onClick={() => setMobileMenuOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <Menu size={22} color="#1F1F1F" />
          </button>
        </div>

        {children}

        {/* Mobile bottom nav */}
        <div className="mobile-bottomnav" style={{
          display: "none", position: "fixed", bottom: 0, left: 0, right: 0,
          background: "#FFFFFF", borderTop: "1px solid #EEEEEE",
          padding: "8px 0 12px", zIndex: 50, justifyContent: "space-around",
        }}>
          {MOBILE_TABS.map(tab => {
            const Icon = tab.icon;
            const active = tab.href ? isActive(tab.href) : false;
            return (
              <button key={tab.label}
                onClick={() => tab.href ? router.push(tab.href) : setMobileMenuOpen(true)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  background: "none", border: "none", cursor: "pointer", padding: "4px 16px",
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: active ? "#E6FAF8" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={18} color={active ? "#05AD98" : "#878787"} strokeWidth={active ? 2.5 : 1.75} />
                </div>
                <span style={{
                  fontFamily: "var(--font-dm-sans)", fontSize: 10,
                  fontWeight: active ? 500 : 400,
                  color: active ? "#05AD98" : "#878787",
                }}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-topbar { display: flex !important; }
          .mobile-bottomnav { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
