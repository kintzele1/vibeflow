import { createAdminClient } from "@/lib/supabase/admin";
import { encrypt, decrypt } from "@/lib/crypto";

/**
 * GA4 helper — shared logic for fetching a usable (refreshed if needed) access token
 * for a given user, and running Data API queries.
 *
 * Every external caller goes through getValidAccessToken() which transparently refreshes
 * expired tokens and persists the new ones (encrypted).
 */

type IntegrationRow = {
  user_id: string;
  provider: string;
  access_token: string | null;    // encrypted
  refresh_token: string | null;   // encrypted
  property_id: string | null;
  account_name: string | null;
  expires_at: string | null;
  scope: string | null;
};

export async function getGa4Integration(userId: string): Promise<IntegrationRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("integrations")
    .select("user_id, provider, access_token, refresh_token, property_id, account_name, expires_at, scope")
    .eq("user_id", userId)
    .eq("provider", "ga4")
    .single();
  return data ?? null;
}

/**
 * Returns a valid (unexpired) access token. Refreshes via the refresh_token if the
 * stored access_token is expired or will expire in the next 60 seconds. Persists
 * the refreshed token encrypted.
 *
 * Throws if the integration row is missing, tokens can't be decrypted, or the
 * refresh call fails.
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const integration = await getGa4Integration(userId);
  if (!integration || !integration.access_token) {
    throw new Error("GA4 integration not found. User must connect first.");
  }

  const expiresAt = integration.expires_at ? new Date(integration.expires_at).getTime() : 0;
  const bufferMs = 60 * 1000; // refresh if expires in next 60s
  const isExpired = Date.now() + bufferMs >= expiresAt;

  if (!isExpired) {
    return decrypt(integration.access_token);
  }

  // Need to refresh
  if (!integration.refresh_token) {
    throw new Error("GA4 access token expired and no refresh token is stored. User must reconnect.");
  }

  const refreshToken = decrypt(integration.refresh_token);

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured.");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`GA4 token refresh failed: ${res.status} ${errText}`);
  }

  const tokens = await res.json() as { access_token: string; expires_in: number; scope?: string; };

  // Persist the new access token + expiry (encrypted). Refresh token stays the same.
  const admin = createAdminClient();
  await admin.from("integrations").update({
    access_token: encrypt(tokens.access_token),
    expires_at: new Date(Date.now() + (tokens.expires_in * 1000)).toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId).eq("provider", "ga4");

  return tokens.access_token;
}

/**
 * Lists the GA4 properties (across all accounts) that the connected Google user has
 * read access to. Used by the property picker step after OAuth.
 */
export async function listGa4Properties(userId: string): Promise<Array<{ property_id: string; account_name: string; property_name: string; display: string; }>> {
  const accessToken = await getValidAccessToken(userId);

  // Admin API to list accounts + properties. https://analyticsadmin.googleapis.com/v1beta/accountSummaries
  const res = await fetch("https://analyticsadmin.googleapis.com/v1beta/accountSummaries", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`GA4 listAccountSummaries failed: ${res.status} ${errText}`);
  }

  const data = await res.json() as {
    accountSummaries?: Array<{
      name: string;  // "accountSummaries/123456789"
      displayName: string;
      propertySummaries?: Array<{
        property: string;         // "properties/987654321"
        displayName: string;
        propertyType: string;
      }>;
    }>;
  };

  const results: Array<{ property_id: string; account_name: string; property_name: string; display: string; }> = [];
  for (const account of data.accountSummaries ?? []) {
    for (const prop of account.propertySummaries ?? []) {
      if (prop.propertyType !== "PROPERTY_TYPE_ORDINARY") continue;
      results.push({
        property_id: prop.property,              // "properties/987654321"
        account_name: account.displayName,
        property_name: prop.displayName,
        display: `${account.displayName} › ${prop.displayName}`,
      });
    }
  }
  return results;
}

/**
 * Runs a GA4 Data API `runReport` call against the user's selected property.
 * Returns the raw response — callers shape it into specific widgets.
 *
 * Docs: https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport
 */
export async function runGa4Report(userId: string, report: {
  dateRanges: Array<{ startDate: string; endDate: string }>;
  metrics: Array<{ name: string }>;
  dimensions?: Array<{ name: string }>;
  dimensionFilter?: any;
  limit?: number;
  orderBys?: any[];
}): Promise<any> {
  const integration = await getGa4Integration(userId);
  if (!integration?.property_id) {
    throw new Error("GA4 property not selected. User must pick a property.");
  }

  const accessToken = await getValidAccessToken(userId);

  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/${integration.property_id}:runReport`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(report),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`GA4 runReport failed: ${res.status} ${errText}`);
  }

  return res.json();
}
