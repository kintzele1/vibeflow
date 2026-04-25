"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const VOICE_OPTIONS = [
  "professional", "friendly", "bold", "calm", "playful",
  "minimal", "technical", "conversational", "inspirational", "direct",
];

type BrandKit = {
  app_name: string;
  tagline: string;
  primary_color: string;
  secondary_color: string;
  brand_voice: string[];
  target_audience: string;
  logo_url: string | null;
  // Optional URLs — when provided, SEO + ASO agents fetch them and inject
  // current on-page state (titles, meta, headings, app metadata) into the
  // generation prompt for specific recommendations vs generic advice.
  website_url: string;
  app_store_url: string;
  play_store_url: string;
};

const DEFAULT: BrandKit = {
  app_name: "",
  tagline: "",
  primary_color: "#05AD98",
  secondary_color: "#BBBBFB",
  brand_voice: [],
  target_audience: "",
  logo_url: null,
  website_url: "",
  app_store_url: "",
  play_store_url: "",
};

export default function BrandPage() {
  const [brand, setBrand] = useState<BrandKit>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetch("/api/brand")
      .then(r => r.json())
      .then(data => {
        if (data.brand) setBrand({ ...DEFAULT, ...data.brand });
        setLoading(false);
      });
  }, []);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Logo must be under 2MB");
      return;
    }

    setUploading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const ext = file.name.split(".").pop();
    const path = `${user.id}/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("brand-logos")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("brand-logos")
      .getPublicUrl(path);

    // Cache-bust so the preview refreshes instantly after re-upload
    const bustedUrl = `${publicUrl}?t=${Date.now()}`;
    setBrand(prev => ({ ...prev, logo_url: bustedUrl }));

    await fetch("/api/brand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...brand, logo_url: bustedUrl }),
    });

    setUploading(false);
  }

  async function handleExtractColors() {
    if (!brand.logo_url) {
      setError("Upload a logo first, then we can extract its colors.");
      return;
    }
    setExtracting(true);
    setError("");
    try {
      const res = await fetch("/api/extract-colors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: brand.logo_url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not extract colors.");
      } else {
        setBrand(prev => ({
          ...prev,
          primary_color: data.primary,
          secondary_color: data.secondary,
        }));
      }
    } catch (err: any) {
      setError(err.message ?? "Extraction failed.");
    }
    setExtracting(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError("");

    const res = await fetch("/api/brand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(brand),
    });

    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError("Failed to save. Please try again.");
    }
    setSaving(false);
  }

  function toggleVoice(v: string) {
    setBrand(prev => ({
      ...prev,
      brand_voice: prev.brand_voice.includes(v)
        ? prev.brand_voice.filter(x => x !== v)
        : prev.brand_voice.length < 5
          ? [...prev.brand_voice, v]
          : prev.brand_voice,
    }));
  }

  if (loading) {
    return (
      <div style={{ padding: "40px 48px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #E6FAF8", borderTop: "3px solid #05AD98", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const displayName = brand.app_name || "Your App";
  const displayTagline = brand.tagline || "Your tagline will appear here.";
  const voiceLine = brand.brand_voice.length > 0
    ? brand.brand_voice.slice(0, 3).join(" · ")
    : "Set your voice to shape this line";

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1280, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 32, color: "#1F1F1F", letterSpacing: "-0.02em", marginBottom: 8 }}>
            Brand Kit 🎨
          </h1>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 16, color: "#878787" }}>
            Set your brand once. Every agent uses it automatically. Preview updates in real time.
          </p>
        </div>
        <button onClick={handleSave} disabled={saving} style={{
          background: saved ? "#E6FAF8" : "#05AD98",
          color: saved ? "#05AD98" : "#FFFFFF",
          fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 15,
          padding: "12px 28px", borderRadius: 999, border: "none", cursor: saving ? "not-allowed" : "pointer",
          transition: "all 0.2s",
        }}>
          {saving ? "Saving..." : saved ? "✓ Saved!" : "Save Brand Kit"}
        </button>
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid rgba(226,75,74,0.2)", borderRadius: 12, padding: "12px 16px", marginBottom: 24, fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#E24B4A" }}>
          {error}
        </div>
      )}

      {/* Split layout */}
      <div data-brand-split style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)",
        gap: 28,
        alignItems: "start",
      }}>

        {/* LEFT — form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>

          {/* Logo upload */}
          <div style={{ background: "#FFFFFF", borderRadius: 20, border: "1.5px solid #EEEEEE", padding: "28px 32px" }}>
            <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 17, color: "#1F1F1F", marginBottom: 4 }}>Logo</div>
            <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#878787", marginBottom: 20 }}>
              PNG or SVG, under 2MB. Used in every visual asset.
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              {brand.logo_url ? (
                <div style={{ position: "relative" }}>
                  <img src={brand.logo_url} alt="Logo" style={{ width: 80, height: 80, borderRadius: 12, objectFit: "contain", border: "1px solid #EEEEEE", background: "#F8F8F8", padding: 8 }} />
                  <button onClick={() => setBrand(prev => ({ ...prev, logo_url: null }))} style={{
                    position: "absolute", top: -8, right: -8, width: 22, height: 22, borderRadius: "50%",
                    background: "#E24B4A", color: "#fff", border: "none", cursor: "pointer",
                    fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>×</button>
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    width: 80, height: 80, borderRadius: 12,
                    border: "2px dashed #DDDDDD", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    cursor: "pointer", background: "#F8F8F8",
                    fontSize: 24, color: "#CCCCCC",
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#05AD98"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "#DDDDDD"}
                >
                  {uploading ? "..." : "+"}
                </div>
              )}

              <div>
                <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{
                  background: "#F8F8F8", color: "#1F1F1F",
                  fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 14,
                  padding: "10px 20px", borderRadius: 999, border: "1px solid #EEEEEE",
                  cursor: "pointer",
                }}>
                  {uploading ? "Uploading..." : brand.logo_url ? "Replace logo" : "Upload logo"}
                </button>
                <input ref={fileRef} type="file" accept="image/png,image/svg+xml,image/jpeg" onChange={handleLogoUpload} style={{ display: "none" }} />
                <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#AAAAAA", marginTop: 6 }}>
                  PNG, SVG, or JPG · Max 2MB
                </div>
              </div>
            </div>
          </div>

          {/* App identity */}
          <div style={{ background: "#FFFFFF", borderRadius: 20, border: "1.5px solid #EEEEEE", padding: "28px 32px" }}>
            <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 17, color: "#1F1F1F", marginBottom: 20 }}>App Identity</div>

            <Field
              label="App Name"
              value={brand.app_name}
              onChange={v => setBrand(p => ({ ...p, app_name: v }))}
              placeholder="e.g. VibeFlow Marketing"
            />
            <Field
              label="Tagline"
              value={brand.tagline}
              onChange={v => setBrand(p => ({ ...p, tagline: v }))}
              placeholder="e.g. One prompt. Full campaign. Perfectly on-brand."
            />
            <Field
              label="Target Audience"
              value={brand.target_audience}
              onChange={v => setBrand(p => ({ ...p, target_audience: v }))}
              placeholder="e.g. Indie hackers, solo founders, vibe coders using Cursor and Lovable"
              last
            />
          </div>

          {/* URLs — optional, but unlock specific SEO + ASO recommendations */}
          <div style={{ background: "#FFFFFF", borderRadius: 20, border: "1.5px solid #EEEEEE", padding: "28px 32px" }}>
            <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 17, color: "#1F1F1F", marginBottom: 6 }}>
              URLs (optional)
            </div>
            <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787", marginBottom: 20, lineHeight: 1.5 }}>
              Add your live website + app store URLs. When set, the SEO and ASO agents fetch these and analyze your current on-page state to give specific recommendations instead of generic advice.
            </p>

            <Field
              label="Website URL"
              value={brand.website_url}
              onChange={v => setBrand(p => ({ ...p, website_url: v.trim() }))}
              placeholder="https://yourapp.com"
            />
            <Field
              label="App Store URL (iOS)"
              value={brand.app_store_url}
              onChange={v => setBrand(p => ({ ...p, app_store_url: v.trim() }))}
              placeholder="https://apps.apple.com/us/app/your-app/id..."
            />
            <Field
              label="Google Play URL (Android)"
              value={brand.play_store_url}
              onChange={v => setBrand(p => ({ ...p, play_store_url: v.trim() }))}
              placeholder="https://play.google.com/store/apps/details?id=com.yourapp"
              last
            />
          </div>

          {/* Colors */}
          <div style={{ background: "#FFFFFF", borderRadius: 20, border: "1.5px solid #EEEEEE", padding: "28px 32px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 17, color: "#1F1F1F" }}>Brand Colors</div>
              <button
                onClick={handleExtractColors}
                disabled={extracting || !brand.logo_url}
                title={brand.logo_url ? "Use Claude Vision to extract colors from your logo" : "Upload a logo first"}
                style={{
                  background: extracting ? "#F0F0F0" : brand.logo_url ? "#F0F5FF" : "#F8F8F8",
                  color: extracting ? "#AAAAAA" : brand.logo_url ? "#4F5BEF" : "#CCCCCC",
                  fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 13,
                  padding: "8px 16px", borderRadius: 999, border: "none",
                  cursor: extracting || !brand.logo_url ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                  transition: "all 0.15s",
                }}>
                {extracting ? "Extracting..." : "✨ Extract from logo"}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <ColorInput
                label="Primary Color"
                value={brand.primary_color}
                onChange={v => setBrand(p => ({ ...p, primary_color: v }))}
              />
              <ColorInput
                label="Secondary Color"
                value={brand.secondary_color}
                onChange={v => setBrand(p => ({ ...p, secondary_color: v }))}
              />
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <div style={{ flex: 1, height: 40, borderRadius: 8, background: brand.primary_color }} />
              <div style={{ flex: 1, height: 40, borderRadius: 8, background: brand.secondary_color }} />
              <div style={{ flex: 1, height: 40, borderRadius: 8, background: "#FFFFFF", border: "1px solid #EEEEEE" }} />
            </div>
          </div>

          {/* Brand voice */}
          <div style={{ background: "#FFFFFF", borderRadius: 20, border: "1.5px solid #EEEEEE", padding: "28px 32px" }}>
            <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 17, color: "#1F1F1F", marginBottom: 4 }}>Brand Voice</div>
            <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#878787", marginBottom: 20 }}>
              Pick up to 5 words that describe how your brand sounds.
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {VOICE_OPTIONS.map(v => {
                const active = brand.brand_voice.includes(v);
                return (
                  <button key={v} onClick={() => toggleVoice(v)} style={{
                    fontFamily: "var(--font-dm-sans)", fontSize: 14, fontWeight: 500,
                    padding: "8px 16px", borderRadius: 999, border: "none", cursor: "pointer",
                    background: active ? "#05AD98" : "#F0F0F0",
                    color: active ? "#FFFFFF" : "#878787",
                    transition: "all 0.15s",
                    opacity: !active && brand.brand_voice.length >= 5 ? 0.4 : 1,
                  }}>
                    {v}
                  </button>
                );
              })}
            </div>

            {brand.brand_voice.length > 0 && (
              <div style={{ marginTop: 16, fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#05AD98" }}>
                Selected: {brand.brand_voice.join(", ")}
              </div>
            )}
          </div>

          {/* Save button (mobile convenience) */}
          <button onClick={handleSave} disabled={saving} style={{
            width: "100%", background: saved ? "#E6FAF8" : "#05AD98",
            color: saved ? "#05AD98" : "#FFFFFF",
            fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 16,
            padding: "14px", borderRadius: 999, border: "none",
            cursor: saving ? "not-allowed" : "pointer", transition: "all 0.2s",
          }}>
            {saving ? "Saving..." : saved ? "✓ Brand Kit Saved!" : "Save & Apply Everywhere"}
          </button>
        </div>

        {/* RIGHT — sticky live preview */}
        <div data-brand-preview style={{ position: "sticky", top: 24, minWidth: 0 }}>
          <div style={{
            background: "#F8F8F8",
            borderRadius: 20,
            padding: "24px",
            border: "1.5px solid #EEEEEE",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 15, color: "#1F1F1F" }}>
                Live Preview
              </div>
              <div style={{
                fontFamily: "var(--font-dm-sans)", fontSize: 11, fontWeight: 500,
                padding: "4px 10px", borderRadius: 999,
                background: "#E6FAF8", color: "#05AD98",
              }}>
                Auto-updating
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Mock 1 — Social post */}
              <PreviewCard label="Social post">
                <div style={{ padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <LogoChip url={brand.logo_url} bg={brand.primary_color} name={displayName} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 600, fontSize: 13, color: "#1F1F1F", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {displayName}
                      </div>
                      <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 11, color: "#878787" }}>
                        @{displayName.toLowerCase().replace(/\s+/g, "")} · 2m
                      </div>
                    </div>
                  </div>
                  <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#1F1F1F", lineHeight: 1.5, marginBottom: 10 }}>
                    {displayTagline}{" "}
                    <span style={{ color: brand.primary_color, fontWeight: 500 }}>#launchday</span>
                  </div>
                  <div style={{
                    height: 120, borderRadius: 10,
                    background: `linear-gradient(135deg, ${brand.primary_color} 0%, ${brand.secondary_color} 100%)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#FFFFFF", fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 18,
                    textShadow: "0 1px 2px rgba(0,0,0,0.15)",
                  }}>
                    {displayName}
                  </div>
                  <div style={{ marginTop: 10, display: "flex", gap: 14, fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#878787" }}>
                    <span>♡ 124</span><span>↻ 38</span><span>💬 12</span>
                  </div>
                </div>
              </PreviewCard>

              {/* Mock 2 — Ad banner */}
              <PreviewCard label="Ad banner">
                <div style={{
                  padding: "18px 16px",
                  background: `linear-gradient(90deg, ${brand.primary_color} 0%, ${brand.primary_color}dd 60%, ${brand.secondary_color} 100%)`,
                  color: "#FFFFFF",
                  display: "flex", alignItems: "center", gap: 14,
                }}>
                  <LogoChip url={brand.logo_url} bg="#FFFFFF" name={displayName} dark />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 14, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {displayName}
                    </div>
                    <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 11, opacity: 0.92, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {displayTagline}
                    </div>
                  </div>
                  <div style={{
                    background: "#FFFFFF", color: brand.primary_color,
                    fontFamily: "var(--font-dm-sans)", fontWeight: 600, fontSize: 12,
                    padding: "7px 14px", borderRadius: 999, whiteSpace: "nowrap",
                  }}>
                    Try free →
                  </div>
                </div>
              </PreviewCard>

              {/* Mock 3 — Email header */}
              <PreviewCard label="Email header">
                <div style={{ padding: 0 }}>
                  <div style={{ height: 4, background: brand.primary_color }} />
                  <div style={{ padding: "22px 18px 18px", textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                      <LogoChip url={brand.logo_url} bg={brand.primary_color} name={displayName} size={48} />
                    </div>
                    <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 18, color: "#1F1F1F", marginBottom: 6, letterSpacing: "-0.01em" }}>
                      Welcome to {displayName}
                    </div>
                    <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, color: "#878787", marginBottom: 14, lineHeight: 1.5 }}>
                      {voiceLine}
                    </div>
                    <div style={{
                      display: "inline-block",
                      background: brand.primary_color, color: "#FFFFFF",
                      fontFamily: "var(--font-dm-sans)", fontWeight: 600, fontSize: 12,
                      padding: "9px 22px", borderRadius: 999,
                    }}>
                      Get started
                    </div>
                  </div>
                </div>
              </PreviewCard>
            </div>

            <div style={{
              marginTop: 16,
              fontFamily: "var(--font-dm-sans)", fontSize: 11, color: "#AAAAAA",
              textAlign: "center", lineHeight: 1.5,
            }}>
              Every generated asset will use these colors, logo, and voice automatically.
            </div>
          </div>
        </div>
      </div>

      {/* Responsive fallback: stack on narrow screens */}
      <style>{`
        @media (max-width: 960px) {
          [data-brand-split] {
            grid-template-columns: 1fr !important;
          }
          [data-brand-preview] {
            position: static !important;
          }
        }
      `}</style>
    </div>
  );
}

// ---------- small local components ----------

function Field({
  label, value, onChange, placeholder, last,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  last?: boolean;
}) {
  return (
    <div style={{ marginBottom: last ? 0 : 20 }}>
      <label style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500, color: "#AAAAAA", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "12px 16px", borderRadius: 10,
          border: "1.5px solid #EEEEEE", fontFamily: "var(--font-dm-sans)",
          fontSize: 15, color: "#1F1F1F", outline: "none",
          transition: "border-color 0.15s",
        }}
        onFocus={e => e.currentTarget.style.borderColor = "#05AD98"}
        onBlur={e => e.currentTarget.style.borderColor = "#EEEEEE"}
      />
    </div>
  );
}

function ColorInput({
  label, value, onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500, color: "#AAAAAA", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
        {label}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ width: 48, height: 48, borderRadius: 10, border: "1.5px solid #EEEEEE", cursor: "pointer", padding: 2 }}
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            flex: 1, padding: "12px 16px", borderRadius: 10,
            border: "1.5px solid #EEEEEE", fontFamily: "var(--font-dm-sans)",
            fontSize: 15, color: "#1F1F1F", outline: "none", minWidth: 0,
          }}
        />
      </div>
    </div>
  );
}

function PreviewCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "#FFFFFF", borderRadius: 14,
      border: "1px solid #EEEEEE",
      overflow: "hidden",
    }}>
      <div style={{
        padding: "8px 14px",
        fontFamily: "var(--font-dm-sans)", fontSize: 10, fontWeight: 600,
        color: "#AAAAAA", letterSpacing: "0.1em", textTransform: "uppercase",
        background: "#FAFAFA", borderBottom: "1px solid #EEEEEE",
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function LogoChip({
  url, bg, name, size = 36, dark,
}: {
  url: string | null;
  bg: string;
  name: string;
  size?: number;
  dark?: boolean;
}) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={{
          width: size, height: size, borderRadius: 8,
          objectFit: "contain", background: "#FFFFFF",
          padding: 4, flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: 8,
      background: bg, color: dark ? "#1F1F1F" : "#FFFFFF",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: size * 0.4,
      flexShrink: 0,
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
