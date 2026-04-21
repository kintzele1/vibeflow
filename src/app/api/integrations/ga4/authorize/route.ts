import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * GET /api/integrations/ga4/authorize
 *
 * Starts the Google OAuth flow. Redirects the signed-in user to Google's consent
 * screen with the scopes we need (Analytics read-only + basic profile). On return,
 * Google sends them to /api/integrations/ga4/callback.
 *
 * We generate a cryptographically random `state` token, stash it in a short-lived
 * HTTP-only cookie, and require Google to echo it back in the callback — this
 * protects against CSRF on the OAuth flow.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return new Response("Missing GOOGLE_CLIENT_ID env var", { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/integrations/ga4/callback`;

  // CSRF protection: random state, stored in a short-lived cookie, checked on callback.
  const state = crypto.randomBytes(32).toString("hex");

  const scope = [
    "https://www.googleapis.com/auth/analytics.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
  ].join(" ");

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("access_type", "offline");  // so we get a refresh_token
  authUrl.searchParams.set("prompt", "consent");       // ensures refresh_token is issued every time

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set("ga4_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,  // 10 minutes to complete OAuth
    path: "/",
  });
  return response;
}
