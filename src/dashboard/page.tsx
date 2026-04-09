import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div style={{
      minHeight: "100vh", background: "#F8F8F8",
      display: "flex", alignItems: "center",
      justifyContent: "center", padding: 24,
    }}>
      <div style={{
        background: "#FFFFFF", borderRadius: 20,
        border: "1px solid #EEEEEE",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        padding: "48px 40px", textAlign: "center", maxWidth: 480,
      }}>
        <div style={{ fontSize: 40, marginBottom: 20 }}>⚡</div>
        <h1 style={{
          fontFamily: "var(--font-syne)", fontWeight: 700, fontSize: 26,
          color: "#1F1F1F", marginBottom: 12, letterSpacing: "-0.02em",
        }}>
          Welcome to VibeFlow
        </h1>
        <p style={{
          fontFamily: "var(--font-dm-sans)", fontSize: 16,
          color: "#878787", lineHeight: 1.6, marginBottom: 8,
        }}>
          Signed in as <strong style={{ color: "#1F1F1F" }}>{user.email}</strong>
        </p>
        <p style={{
          fontFamily: "var(--font-dm-sans)", fontSize: 14,
          color: "#AAAAAA", lineHeight: 1.6,
        }}>
          Dashboard coming in the next step. Auth is working ✓
        </p>
      </div>
    </div>
  );
}
