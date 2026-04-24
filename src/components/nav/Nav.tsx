"use client";
import { useState, useEffect } from "react";
import { VibeFlowWordmark } from "@/components/logo/SparklerLogo";
import { NAV_LINKS } from "@/lib/constants";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: "0 32px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: scrolled ? "rgba(255,255,255,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid #EEEEEE" : "1px solid transparent",
        transition: "all 0.25s ease",
      }}
    >
      <VibeFlowWordmark size="sm" colorway="teal" animate={false} />

      <div className="nav-right" style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <div className="nav-desktop-links" style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: 14,
                fontWeight: 500,
                color: "#1F1F1F",
                textDecoration: "none",
                opacity: 0.7,
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
            >
              {link.label}
            </a>
          ))}
        </div>
        <a
          href="/login"
          className="nav-login-btn"
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: 14,
            fontWeight: 500,
            color: "#05AD98",
            background: "transparent",
            padding: "8px 20px",
            borderRadius: 999,
            border: "1.5px solid #05AD98",
            textDecoration: "none",
            minWidth: 96,
            textAlign: "center" as const,
            display: "inline-block",
            boxSizing: "border-box" as const,
            whiteSpace: "nowrap" as const,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#E6FAF8";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          Log in
        </a>
        <a
          href="#pricing"
          className="nav-cta-btn"
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: 14,
            fontWeight: 500,
            color: "#FFFFFF",
            background: "#05AD98",
            padding: "8px 20px",
            borderRadius: 999,
            textDecoration: "none",
            whiteSpace: "nowrap" as const,
            transition: "background 0.15s, transform 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#038C7A";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#05AD98";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Get Started
        </a>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .nav-desktop-links { display: none !important; }
          /* Tighten spacing so wordmark + Log in + Get Started fit on narrow viewports */
          .nav-right { gap: 10px !important; }
          .nav-login-btn { min-width: 0 !important; padding: 7px 14px !important; }
          .nav-cta-btn { padding: 7px 14px !important; }
        }
        @media (max-width: 400px) {
          /* Extra-tight for iPhone SE and smaller */
          .nav-login-btn { padding: 6px 10px !important; font-size: 13px !important; }
          .nav-cta-btn { padding: 6px 10px !important; font-size: 13px !important; }
        }
      `}</style>
    </nav>
  );
}
