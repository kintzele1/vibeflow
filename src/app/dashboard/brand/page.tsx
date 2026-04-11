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
};

const DEFAULT: BrandKit = {
  app_name: "",
  tagline: "",
  primary_color: "#05AD98",
  secondary_color: "#BBBBFB",
  brand_voice: [],
  target_audience: "",
  logo_url: null,
};

export default function BrandPage() {
  const [brand, setBrand] = useState<BrandKit>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
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

    setBrand(prev => ({ ...prev, logo_url: publicUrl }));

    // Immediately save the logo URL to the database
    await fetch("/api/brand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...brand, logo_url: publicUrl }),
    });

    setUploading(false);
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

  return (
    <div style={{ padding: "40px 48px", maxWidth: 760, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 32, color: "#1F1F1F", letterSpacing: "-0.02em", marginBottom: 8 }}>
            Brand Kit 🎨
          </h1>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 16, color: "#878787" }}>
            Set your brand once. Every agent uses it automatically.
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

      {/* Logo upload */}
      <div style={{ background: "#FFFFFF", borderRadius: 20, border: "1.5px solid #EEEEEE", padding: "28px 32px", marginBottom: 20 }}>
        <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 17, color: "#1F1F1F", marginBottom: 4 }}>Logo</div>
        <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#878787", marginBottom: 20 }}>
          PNG or SVG, under 2MB. Used in visual assets and templates.
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

      {/* App name + tagline */}
      <div style={{ background: "#FFFFFF", borderRadius: 20, border: "1.5px solid #EEEEEE", padding: "28px 32px", marginBottom: 20 }}>
        <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 17, color: "#1F1F1F", marginBottom: 20 }}>App Identity</div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500, color: "#AAAAAA", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
            App Name
          </label>
          <input
            type="text"
            value={brand.app_name}
            onChange={e => setBrand(prev => ({ ...prev, app_name: e.target.value }))}
            placeholder="e.g. VibeFlow Marketing"
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

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500, color: "#AAAAAA", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
            Tagline
          </label>
          <input
            type="text"
            value={brand.tagline}
            onChange={e => setBrand(prev => ({ ...prev, tagline: e.target.value }))}
            placeholder="e.g. One prompt. Full campaign. Perfectly on-brand."
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

        <div>
          <label style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500, color: "#AAAAAA", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
            Target Audience
          </label>
          <input
            type="text"
            value={brand.target_audience}
            onChange={e => setBrand(prev => ({ ...prev, target_audience: e.target.value }))}
            placeholder="e.g. Indie hackers, solo founders, vibe coders using Cursor and Lovable"
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
      </div>

      {/* Colors */}
      <div style={{ background: "#FFFFFF", borderRadius: 20, border: "1.5px solid #EEEEEE", padding: "28px 32px", marginBottom: 20 }}>
        <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 17, color: "#1F1F1F", marginBottom: 20 }}>Brand Colors</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <label style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500, color: "#AAAAAA", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
              Primary Color
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="color"
                value={brand.primary_color}
                onChange={e => setBrand(prev => ({ ...prev, primary_color: e.target.value }))}
                style={{ width: 48, height: 48, borderRadius: 10, border: "1.5px solid #EEEEEE", cursor: "pointer", padding: 2 }}
              />
              <input
                type="text"
                value={brand.primary_color}
                onChange={e => setBrand(prev => ({ ...prev, primary_color: e.target.value }))}
                style={{
                  flex: 1, padding: "12px 16px", borderRadius: 10,
                  border: "1.5px solid #EEEEEE", fontFamily: "var(--font-dm-sans)",
                  fontSize: 15, color: "#1F1F1F", outline: "none",
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500, color: "#AAAAAA", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
              Secondary Color
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="color"
                value={brand.secondary_color}
                onChange={e => setBrand(prev => ({ ...prev, secondary_color: e.target.value }))}
                style={{ width: 48, height: 48, borderRadius: 10, border: "1.5px solid #EEEEEE", cursor: "pointer", padding: 2 }}
              />
              <input
                type="text"
                value={brand.secondary_color}
                onChange={e => setBrand(prev => ({ ...prev, secondary_color: e.target.value }))}
                style={{
                  flex: 1, padding: "12px 16px", borderRadius: 10,
                  border: "1.5px solid #EEEEEE", fontFamily: "var(--font-dm-sans)",
                  fontSize: 15, color: "#1F1F1F", outline: "none",
                }}
              />
            </div>
          </div>
        </div>

        {/* Color preview */}
        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <div style={{ flex: 1, height: 40, borderRadius: 8, background: brand.primary_color }} />
          <div style={{ flex: 1, height: 40, borderRadius: 8, background: brand.secondary_color }} />
          <div style={{ flex: 1, height: 40, borderRadius: 8, background: "#FFFFFF", border: "1px solid #EEEEEE" }} />
        </div>
      </div>

      {/* Brand voice */}
      <div style={{ background: "#FFFFFF", borderRadius: 20, border: "1.5px solid #EEEEEE", padding: "28px 32px", marginBottom: 20 }}>
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

      {/* Preview */}
      {(brand.app_name || brand.primary_color !== "#05AD98") && (
        <div style={{ background: "#F8F8F8", borderRadius: 20, border: "1.5px solid #EEEEEE", padding: "28px 32px", marginBottom: 20 }}>
          <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 17, color: "#1F1F1F", marginBottom: 16 }}>Preview</div>
          <div style={{
            background: "#FFFFFF", borderRadius: 16, padding: "24px",
            border: `2px solid ${brand.primary_color}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              {brand.logo_url && (
                <img src={brand.logo_url} alt="Logo" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "contain" }} />
              )}
              <div>
                <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 18, color: "#1F1F1F" }}>
                  {brand.app_name || "Your App Name"}
                </div>
                {brand.tagline && (
                  <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787" }}>
                    {brand.tagline}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ background: brand.primary_color, color: "#fff", fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500, padding: "6px 14px", borderRadius: 999 }}>
                Primary CTA
              </div>
              <div style={{ background: brand.secondary_color, color: "#1F1F1F", fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500, padding: "6px 14px", borderRadius: 999 }}>
                Secondary
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save button bottom */}
      <button onClick={handleSave} disabled={saving} style={{
        width: "100%", background: saved ? "#E6FAF8" : "#05AD98",
        color: saved ? "#05AD98" : "#FFFFFF",
        fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 16,
        padding: "14px", borderRadius: 999, border: "none",
        cursor: saving ? "not-allowed" : "pointer", transition: "all 0.2s",
      }}>
        {saving ? "Saving..." : saved ? "✓ Brand Kit Saved!" : "Save Brand Kit"}
      </button>
    </div>
  );
}
