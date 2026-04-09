"use client";

import { useEffect, useRef } from "react";

interface SparklerLogoProps {
  /** Size in px — the canvas renders as a square at this size */
  size?: number;
  /** "teal" = #05AD98 sparks on light bg  |  "white" = white sparks on dark bg */
  colorway?: "teal" | "white";
  /** Background color — defaults to match colorway */
  bg?: string;
  /** Play animation on mount */
  animate?: boolean;
  /** Optional className for the wrapper */
  className?: string;
}

function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}

export function SparklerLogo({
  size = 64,
  colorway = "teal",
  bg,
  animate = true,
  className = "",
}: SparklerLogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);

  const sparkColor = colorway === "teal" ? "#05AD98" : "#FFFFFF";
  const bgColor =
    bg ??
    (colorway === "teal" ? "#E6FAF8" : "#0F0F0F");

  function buildSparkler(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const scale = W / 80;

    // ── Generate organic rays ─────────────────────
    const rays: Array<{
      a: number;
      len: number;
      width: number;
      delay: number;
      secondary?: boolean;
    }> = [];

    const mainCount = 7 + Math.floor(Math.random() * 3); // 7–9
    let angle = rand(0, Math.PI * 2);
    for (let i = 0; i < mainCount; i++) {
      rays.push({
        a: angle + rand(-0.18, 0.18),
        len: rand(0.32, 0.48) * W,
        width: rand(0.9, 1.7) * scale,
        delay: rand(0, 0.18),
      });
      angle += (Math.PI * 2) / mainCount + rand(-0.08, 0.08);
    }

    const secCount = 5 + Math.floor(Math.random() * 4); // 5–8
    angle = rand(0, Math.PI * 2);
    for (let i = 0; i < secCount; i++) {
      rays.push({
        a: angle + rand(-0.25, 0.25),
        len: rand(0.16, 0.28) * W,
        width: rand(0.5, 1.1) * scale,
        delay: rand(0.1, 0.35),
        secondary: true,
      });
      angle += (Math.PI * 2) / secCount + rand(-0.1, 0.1);
    }

    // ── Flying spark particles ────────────────────
    const particles = Array.from({ length: 28 }, () => ({
      a: rand(0, Math.PI * 2),
      speed: rand(0.4, 1.1) * scale,
      len: rand(3, 9) * scale,
      maxLife: rand(0.55, 1.0),
      startDelay: rand(0.0, 0.5),
      drift: rand(-0.06, 0.06),
      width: rand(0.4, 1.0) * scale,
    }));

    const duration = 1400;
    let startTime: number | null = null;

    function draw(ts: number) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const t = Math.min(elapsed / duration, 1);

      ctx!.clearRect(0, 0, W, H);

      // Background with rounded rect
      ctx!.fillStyle = bgColor;
      ctx!.beginPath();
      const r = 8 * scale;
      ctx!.roundRect(0, 0, W, H, r);
      ctx!.fill();

      // Core glow
      const coreT = Math.min(t / 0.15, 1);
      if (coreT > 0) {
        ctx!.beginPath();
        ctx!.arc(cx, cy, 2.5 * scale * coreT, 0, Math.PI * 2);
        ctx!.fillStyle = sparkColor;
        ctx!.fill();
        if (coreT > 0.3) {
          const haloAlpha = Math.min((coreT - 0.3) / 0.5, 1) * 0.14;
          ctx!.beginPath();
          ctx!.arc(cx, cy, 8 * scale * coreT, 0, Math.PI * 2);
          ctx!.fillStyle =
            colorway === "teal"
              ? `rgba(5,173,152,${haloAlpha})`
              : `rgba(255,255,255,${haloAlpha})`;
          ctx!.fill();
        }
      }

      // Rays
      ctx!.lineCap = "round";
      for (const r of rays) {
        const rt = Math.max(
          0,
          Math.min((t - r.delay * 0.3) / (0.6 + r.delay * 0.2), 1)
        );
        if (rt <= 0) continue;
        const e = 1 - Math.pow(1 - rt, 2.5);
        ctx!.beginPath();
        ctx!.moveTo(cx, cy);
        ctx!.lineTo(cx + Math.cos(r.a) * r.len * e, cy + Math.sin(r.a) * r.len * e);
        ctx!.strokeStyle = sparkColor;
        ctx!.lineWidth = r.width;
        ctx!.globalAlpha = r.secondary ? 0.55 : 0.95;
        ctx!.stroke();
        ctx!.globalAlpha = 1;
      }

      // Flying sparks
      for (const p of particles) {
        const pt = Math.max(0, (t - p.startDelay * 0.6) / (p.maxLife * 0.9));
        if (pt <= 0 || pt >= 1) continue;
        const dist = p.speed * pt * (duration / 16);
        const px = cx + Math.cos(p.a + p.drift * pt) * dist;
        const py = cy + Math.sin(p.a + p.drift * pt) * dist;
        const alpha = pt < 0.2 ? pt / 0.2 : 1 - (pt - 0.2) / 0.8;
        ctx!.beginPath();
        ctx!.moveTo(px, py);
        ctx!.lineTo(
          px + Math.cos(p.a) * p.len * (1 - pt * 0.4),
          py + Math.sin(p.a) * p.len * (1 - pt * 0.4)
        );
        ctx!.strokeStyle = sparkColor;
        ctx!.lineWidth = p.width * (1 - pt * 0.6);
        ctx!.globalAlpha = alpha * 0.85;
        ctx!.stroke();
        ctx!.globalAlpha = 1;
      }

      if (t < 1) {
        animRef.current = requestAnimationFrame(draw);
      }
    }

    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(draw);
  }

  // Draw static (final frame) version for non-animated use
  function drawStatic(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const sc = W / 80;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 8 * sc);
    ctx.fill();

    // Core
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5 * sc, 0, Math.PI * 2);
    ctx.fillStyle = sparkColor;
    ctx.fill();

    // 8 main rays at fixed angles
    const angles = Array.from({ length: 8 }, (_, i) => (i * Math.PI * 2) / 8 + 0.1);
    ctx.lineCap = "round";
    for (const a of angles) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * 0.4 * W, cy + Math.sin(a) * 0.4 * W);
      ctx.strokeStyle = sparkColor;
      ctx.lineWidth = 1.2 * sc;
      ctx.globalAlpha = 0.95;
      ctx.stroke();
    }

    // 8 secondary rays
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8 + Math.PI / 8;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * 0.25 * W, cy + Math.sin(a) * 0.25 * W);
      ctx.strokeStyle = sparkColor;
      ctx.lineWidth = 0.8 * sc;
      ctx.globalAlpha = 0.55;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (animate) {
      buildSparkler(canvas);
    } else {
      drawStatic(canvas);
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, colorway, animate]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      style={{ display: "block", borderRadius: 8 * (size / 80) }}
      aria-label="VibeFlow sparkler logo mark"
    />
  );
}

// ── Wordmark (logo + text) ──────────────────────────────
interface WordmarkProps {
  size?: "sm" | "md" | "lg";
  colorway?: "teal" | "white";
  animate?: boolean;
  showTagline?: boolean;
}

const SIZES = {
  sm: { canvas: 26, wordmark: 16, sub: 8 },
  md: { canvas: 36, wordmark: 20, sub: 9 },
  lg: { canvas: 52, wordmark: 28, sub: 10 },
};

export function VibeFlowWordmark({
  size = "md",
  colorway = "teal",
  animate = true,
  showTagline = false,
}: WordmarkProps) {
  const s = SIZES[size];
  const textColor = colorway === "white" ? "#FFFFFF" : "#1F1F1F";
  const subColor = colorway === "white" ? "rgba(255,255,255,0.4)" : "#878787";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <SparklerLogo size={s.canvas} colorway={colorway} animate={animate} />
      <div>
        <div
          style={{
            fontFamily: "var(--font-syne)",
            fontWeight: 700,
            fontSize: s.wordmark,
            letterSpacing: "-0.02em",
            color: textColor,
            lineHeight: 1.1,
          }}
        >
          Vibe
          <span style={{ color: "#05AD98" }}>Flow</span>
          <span
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontWeight: 400,
              fontSize: s.sub,
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              color: subColor,
              marginLeft: 6,
              verticalAlign: "middle",
            }}
          >
            Marketing
          </span>
        </div>
        {showTagline && (
          <div
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: 11,
              color: subColor,
              marginTop: 3,
              letterSpacing: "0.01em",
            }}
          >
            One prompt. Full campaign. Perfectly on-brand.
          </div>
        )}
      </div>
    </div>
  );
}
