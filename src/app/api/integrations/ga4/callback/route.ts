import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encrypt } from "@/lib/crypto";
import { NextResponse } from "next/server";

/**
 * GET /api/integrations/ga4/callback
 *
 * Google redirects here after the user completes OAuth consent. We:
 *   1. Verify the state token matches what we set in the authorize step (CSRF protection).
 *   2. Exchange the authorization code for access + refresh tokens.
 *   3. Encrypt both tokens and upsert into public.integrations for this user.
 *   4. Clear the state cookie.
 *   5. Redirect to /dashboard/integrations where they pick a property.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // User denied consent on Google's screen
  if (error) {
    return NextResponse.redirect(new URL(`/dashboard/integrations?ga4_error=${encodeURIComponent(error)}`, url.origin));
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL("/dashboard/integrations?ga4_error=missing_code", url.origin));
  }

  // Verify state cookie matches — CSRF protection
  const cookieState = request.headers.get("cookie")?.match(/ga4_oauth_state=([^;]+)/)?.[1];
  if (!cookieState || cookieState !== state) {
    return NextResponse.redirect(new URL("/dashboard/integrations?ga4_error=state_mismatch", url.origin));
  }

  // Require a logged-in user to tie the tokens to
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login?next=/dashboard/integrations", url.origin));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/dashboard/integrations?ga4_error=server_misconfigured", url.origin));
  }

  const redirectUri = `${url.origin}/api/integrations/ga4/callback`;

  // Exchange the authorization code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.error("GA4 token exchange failed:", errText);
    return NextResponse.redirect(new URL("/dashboard/integrations?ga4_error=token_exchange_failed", url.origin));
  }

  const tokens = await tokenRes.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
    token_type: string;
  };

  if (!tokens.access_token) {
    return NextResponse.redirect(new URL("/dashboard/integrations?ga4_error=no_access_token", url.origin));
  }

  // Encrypt + upsert
  const admin = createAdminClient();
  const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000)).toISOString();

  const row: Record<string, any> = {
    user_id: user.id,
    provider: "ga4",
    access_token: encrypt(tokens.access_token),
    scope: tokens.scope,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  };

  // refresh_token is only returned on first consent (or when prompt=consent). Store it if present;
  // otherwise preserve whatever we previously had.
  if (tokens.refresh_token) {
    row.refresh_token = encrypt(tokens.refresh_token);
  }

  const { error: upsertError } = await admin.from("integrations").upsert(row, { onConflict: "user_id,provider" });
  if (upsertError) {
    console.error("GA4 integrations upsert failed:", upsertError);
    return NextResponse.redirect(new URL("/dashboard/integrations?ga4_error=db_write_failed", url.origin));
  }

  // Clear the state cookie + send them to the property picker step
  const response = NextResponse.redirect(new URL("/dashboard/integrations?ga4_connected=1&step=pick_property", url.origin));
  response.cookies.delete("ga4_oauth_state");
  return response;
}
