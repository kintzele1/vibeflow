import { VibeFlowWordmark } from "@/components/logo/SparklerLogo";
import { BRAND } from "@/lib/constants";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#F8F8F8",
        gap: 32,
        padding: 40,
      }}
    >
      <VibeFlowWordmark size="lg" colorway="teal" animate showTagline />

      <p
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: 14,
          color: "#878787",
          textAlign: "center",
          maxWidth: 400,
        }}
      >
        Step 1 complete — brand foundation is live.
        <br />
        Landing page coming next.
      </p>

      {/* Dark version preview */}
      <div
        style={{
          background: "#0F0F0F",
          borderRadius: 16,
          padding: "24px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          alignItems: "center",
        }}
      >
        <VibeFlowWordmark size="md" colorway="white" animate />
        <span
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: 11,
            color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Dark colorway
        </span>
      </div>
    </main>
  );
}
