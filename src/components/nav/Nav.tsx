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

      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
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
          Log in
        </a>
        <a
          href="#pricing"
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: 14,
            fontWeight: 500,
            color: "#FFFFFF",
            background: "#05AD98",
            padding: "8px 20px",
            borderRadius: 999,
            textDecoration: "none",
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
        }
      `}</style>
    </nav>
  );
}
