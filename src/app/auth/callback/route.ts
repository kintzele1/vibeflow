import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Validate that a redirect path stays inside our origin and doesn't trigger
 * an open redirect via user-info credentials (`@evil.com`), protocol-relative
 * URLs (`//evil.com`), or backslash tricks. If the path looks even slightly
 * weird, fall back to /dashboard.
 */
function safeNext(raw: string | null): string {
  const fallback = "/dashboard";
  if (!raw) return fallback;
  if (!raw.startsWith("/")) return fallback;       // must be absolute path on our origin
  if (raw.startsWith("//")) return fallback;       // protocol-relative URL
  if (raw.includes("\\")) return fallback;         // backslash trick
  if (raw.includes("@")) return fallback;          // user-info / credentials trick
  return raw;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong — send back to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
