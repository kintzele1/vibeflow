"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessBanner() {
  const params = useSearchParams();
  const success = params.get("success");

  if (!success) return null;

  return (
    <div style={{
      background: "#E6FAF8", border: "1px solid rgba(5,173,152,0.2)",
      borderRadius: 14, padding: "16px 24px", marginBottom: 24,
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <span style={{ fontSize: 24 }}>🎉</span>
      <div>
        <div style={{ fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 16, color: "#05AD98", marginBottom: 2 }}>
          Payment successful! Welcome to VibeFlow.
        </div>
        <div style={{ fontFamily: "var(--font-dm-sans)", fontSize: 14, color: "#05AD98", opacity: 0.8 }}>
          Your searches have been added. Start generating your first campaign below.
        </div>
      </div>
    </div>
  );
}

export default function SuccessWrapper() {
  return (
    <Suspense fallback={null}>
      <SuccessBanner />
    </Suspense>
  );
}
