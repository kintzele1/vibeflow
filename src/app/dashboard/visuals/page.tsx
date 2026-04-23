"use client";
import { useState } from "react";

const IMAGE_TYPES = [
  { id: "social_post",    label: "Social Post",       icon: "📱", desc: "Square image for X, LinkedIn, Instagram" },
  { id: "og_image",       label: "OG / Banner",       icon: "🖼️", desc: "Link preview & social banner (4:3)" },
  { id: "thumbnail",      label: "YouTube Thumbnail", icon: "▶️", desc: "16:9 eye-catching thumbnail bg" },
  { id: "hero_image",     label: "Hero Image",        icon: "🌟", desc: "Landing page hero background" },
  { id: "product_mockup", label: "Product Mockup",    icon: "📲", desc: "Clean app/product visualization" },
  { id: "meme",           label: "Meme / Viral",      icon: "😂", desc: "Shareable, relatable image" },
];

const STYLES = [
  { id: "minimalist and clean",    label: "Minimalist" },
  { id: "bold and vibrant",        label: "Bold & Vibrant" },
  { id: "dark and moody",          label: "Dark & Moody" },
  { id: "soft and pastel",         label: "Soft Pastel" },
  { id: "3D rendered",             label: "3D Rendered" },
  { id: "flat illustration",       label: "Flat Illustration" },
  { id: "photorealistic",          label: "Photorealistic" },
  { id: "abstract geometric",      label: "Abstract Geometric" },
];

type GeneratedImage = {
  url: string;
  width: number;
  height: number;
};

export default function VisualsPage() {
  const [prompt, setPrompt] = useState("");
  const [imageType, setImageType] = useState<string | null>(null);
  const [style, setStyle] = useState("minimalist and clean");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  async function handleGenerate() {
    if (!prompt.trim() || !imageType || loading) return;
    setLoading(true);
    setImages([]);
    setError("");
    setSelectedImage(null);

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, imageType, style, count: 4 }),
      });

      if (res.status === 402) {
        const data = await res.json();
        setError(data.message ?? "You've used all your searches. Every generation counts as 1 search. Upgrade to Annual ($299 for 1,200 searches) or buy another Launch Kit ($49 for 100) to keep generating.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setImages(data.images ?? []);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(url: string, index: number) {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `vibeflow-image-${index + 1}-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  }

  const selectedType = IMAGE_TYPES.find(t => t.id === imageType);

  return (
    <div style={{ padding: "40px 48px", maxWidth: 1000, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 32,
          color: "#1F1F1F", letterSpacing: "-0.02em", marginBottom: 8,
        }}>
          Visual Assets 🎨
        </h1>
        <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 16, color: "#878787" }}>
          Generate on-brand images for every channel — social posts, thumbnails, hero images, and more.
        </p>
      </div>

      {!images.length && (
        <>
          {/* Image type selector */}
          <div style={{ marginBottom: 24 }}>
            <div style={{
              fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
              color: "#AAAAAA", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12,
            }}>Choose image type</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
              {IMAGE_TYPES.map(type => (
                <button key={type.id} onClick={() => setImageType(type.id)} style={{
                  background: imageType === type.id ? "#E6FAF8" : "#FFFFFF",
                  border: `1.5px solid ${imageType === type.id ? "#05AD98" : "#EEEEEE"}`,
                  borderRadius: 12, padding: "14px 16px",
                  cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{type.icon}</div>
                  <div style={{
                    fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 13,
                    color: imageType === type.id ? "#05AD98" : "#1F1F1F", marginBottom: 3,
                  }}>{type.label}</div>
                  <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 11, color: "#AAAAAA" }}>
                    {type.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Style selector */}
          <div style={{ marginBottom: 24 }}>
            <div style={{
              fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
              color: "#AAAAAA", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12,
            }}>Visual style</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {STYLES.map(s => (
                <button key={s.id} onClick={() => setStyle(s.id)} style={{
                  fontFamily: "var(--font-dm-sans)", fontSize: 13, fontWeight: 500,
                  padding: "7px 14px", borderRadius: 999, border: "none", cursor: "pointer",
                  background: style === s.id ? "#05AD98" : "#EEEEEE",
                  color: style === s.id ? "#FFFFFF" : "#878787",
                  transition: "all 0.15s",
                }}>{s.label}</button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div style={{
            background: "#FFFFFF", borderRadius: 20, border: "1.5px solid #EEEEEE",
            boxShadow: "0 4px 24px rgba(5,173,152,0.06)", padding: "28px 32px",
          }}>
            <label style={{
              fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
              color: "#AAAAAA", letterSpacing: "0.08em", textTransform: "uppercase",
              display: "block", marginBottom: 12,
            }}>Describe your app</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. A habit tracker that actually works — no streaks, no guilt, just a calm daily check-in. iOS app, teal and white brand colors."
              rows={3}
              style={{
                width: "100%", border: "none", outline: "none", resize: "none",
                fontFamily: "var(--font-dm-sans)", fontSize: 16, color: "#1F1F1F",
                lineHeight: 1.65, background: "transparent",
              }}
            />
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginTop: 20, paddingTop: 20, borderTop: "1px solid #EEEEEE",
            }}>
              <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#AAAAAA" }}>
                Generates 4 variations · 1 search
              </span>
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || !imageType || loading}
                style={{
                  background: !prompt.trim() || !imageType ? "#CCCCCC" : "#05AD98",
                  color: "#FFFFFF",
                  fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 15,
                  padding: "12px 28px", borderRadius: 999, border: "none",
                  cursor: !prompt.trim() || !imageType ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Generating..." : `Generate ${selectedType?.label ?? "Images"} →`}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: "#FEF2F2", border: "1px solid rgba(226,75,74,0.2)",
          borderRadius: 12, padding: "16px 20px", marginTop: 24,
          fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#E24B4A",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span>{error}</span>
          <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#E24B4A", fontSize: 18 }}>×</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{
          background: "#FFFFFF", borderRadius: 20, border: "1.5px solid #EEEEEE",
          padding: "80px 32px", textAlign: "center", marginTop: 24,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            border: "3px solid #E6FAF8", borderTop: "3px solid #05AD98",
            margin: "0 auto 20px", animation: "spin 0.8s linear infinite", display: "inline-block",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 18, color: "#1F1F1F", marginBottom: 8 }}>
            Generating 4 images...
          </p>
          <p style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#878787" }}>
            This takes about 10-20 seconds. Hang tight.
          </p>
        </div>
      )}

      {/* Results */}
      {images.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>{selectedType?.icon}</span>
              <span style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 20, color: "#1F1F1F" }}>
                {selectedType?.label} — {images.length} variations
              </span>
              <span style={{
                background: "#E6FAF8", color: "#05AD98",
                fontFamily: "var(--font-dm-sans)", fontSize: 12, fontWeight: 500,
                padding: "3px 10px", borderRadius: 999,
              }}>Complete</span>
            </div>
            <button onClick={() => { setImages([]); setSelectedImage(null); }} style={{
              background: "transparent", color: "#878787",
              fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 14,
              padding: "8px 18px", borderRadius: 999, border: "1px solid #EEEEEE", cursor: "pointer",
            }}>Generate more</button>
          </div>

          {/* Image grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {images.map((img, i) => (
              <div
                key={i}
                style={{
                  background: "#FFFFFF", borderRadius: 16,
                  border: `2px solid ${selectedImage === img.url ? "#05AD98" : "#EEEEEE"}`,
                  overflow: "hidden", cursor: "pointer",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                  boxShadow: selectedImage === img.url ? "0 4px 24px rgba(5,173,152,0.15)" : "none",
                }}
                onClick={() => setSelectedImage(selectedImage === img.url ? null : img.url)}
              >
                <img
                  src={img.url}
                  alt={`Generated image ${i + 1}`}
                  style={{ width: "100%", display: "block", aspectRatio: "1 / 1", objectFit: "cover" }}
                />
                <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "var(--font-dm-sans)", fontSize: 13, color: "#878787" }}>
                    Variation {i + 1}
                  </span>
                  <button
                    onClick={e => { e.stopPropagation(); handleDownload(img.url, i); }}
                    style={{
                      background: "#05AD98", color: "#FFFFFF",
                      fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 12,
                      padding: "6px 14px", borderRadius: 999, border: "none", cursor: "pointer",
                    }}
                  >
                    Download ↓
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Selected image full view */}
          {selectedImage && (
            <div style={{
              marginTop: 20, background: "#FFFFFF", borderRadius: 20,
              border: "1.5px solid #EEEEEE", padding: "24px",
              display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
            }}>
              <img
                src={selectedImage}
                alt="Selected"
                style={{ width: 160, borderRadius: 12, display: "block" }}
              />
              <div>
                <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 16, color: "#1F1F1F", marginBottom: 8 }}>
                  Selected image
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => handleDownload(selectedImage, 0)}
                    style={{
                      background: "#05AD98", color: "#FFFFFF",
                      fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 14,
                      padding: "10px 24px", borderRadius: 999, border: "none", cursor: "pointer",
                    }}
                  >
                    Download Full Size ↓
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(selectedImage)}
                    style={{
                      background: "#F8F8F8", color: "#1F1F1F",
                      fontFamily: "var(--font-dm-sans)", fontWeight: 500, fontSize: 14,
                      padding: "10px 24px", borderRadius: 999, border: "1px solid #EEEEEE", cursor: "pointer",
                    }}
                  >
                    Copy URL
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
