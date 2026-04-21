import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runGa4Report, getGa4Integration } from "@/lib/ga4";

/**
 * POST /api/integrations/ga4/campaign
 * Body: { campaignId, utmCampaign, days? = 30 }
 *
 * Returns per-campaign metrics filtered by GA4 sessions where
 * sessionCampaignName equals the utm_campaign tag. Cached in
 * public.results_metrics for 5 minutes to avoid hammering GA4 on every view.
 */
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const { campaignId, utmCampaign, days = 30 } = await request.json();
    if (!campaignId || !utmCampaign) {
      return new Response(JSON.stringify({ error: "campaignId and utmCampaign required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    // Verify the user owns this campaign (RLS enforced via regular client)
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("id")
      .eq("id", campaignId)
      .eq("user_id", user.id)
      .single();
    if (!campaign) {
      return new Response(JSON.stringify({ error: "Campaign not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const integration = await getGa4Integration(user.id);
    if (!integration) {
      return new Response(JSON.stringify({ error: "not_connected", message: "GA4 not connected" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!integration.property_id) {
      return new Response(JSON.stringify({ error: "no_property", message: "GA4 property not selected" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const admin = createAdminClient();

    // Check cache — if we fetched within the last CACHE_TTL_MS for this campaign, return the stored values
    const { data: recent } = await admin
      .from("results_metrics")
      .select("metric_type, value, value_text, recorded_at")
      .eq("campaign_id", campaignId)
      .eq("source", "ga4")
      .order("recorded_at", { ascending: false })
      .limit(6);

    const newestRecordedAt = recent?.[0]?.recorded_at ? new Date(recent[0].recorded_at).getTime() : 0;
    const isFresh = Date.now() - newestRecordedAt < CACHE_TTL_MS;

    if (isFresh && recent && recent.length > 0) {
      const cached: Record<string, number | string> = {};
      for (const row of recent) {
        cached[row.metric_type] = row.value !== null ? row.value : (row.value_text ?? "");
      }
      return new Response(JSON.stringify({
        source: "cache",
        utmCampaign,
        recordedAt: recent[0].recorded_at,
        metrics: {
          sessions:      Number(cached["sessions"] ?? 0),
          users:         Number(cached["users"] ?? 0),
          engagement:    Number(cached["engagement"] ?? 0),  // engaged sessions
          ctr:           Number(cached["ctr"] ?? 0),
          conversions:   Number(cached["conversions"] ?? 0),
          revenue:       Number(cached["revenue"] ?? 0),
        },
      }), { headers: { "Content-Type": "application/json" } });
    }

    // Fresh fetch from GA4, filtered by utm_campaign
    const report = await runGa4Report(user.id, {
      dateRanges: [{ startDate: `${days}daysAgo`, endDate: "today" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "engagedSessions" },
        { name: "conversions" },
        { name: "totalRevenue" },
      ],
      dimensionFilter: {
        filter: {
          fieldName: "sessionCampaignName",
          stringFilter: { matchType: "EXACT", value: utmCampaign },
        },
      },
    });

    const row = report.rows?.[0]?.metricValues ?? [];
    const sessions = parseInt(row[0]?.value ?? "0", 10);
    const users = parseInt(row[1]?.value ?? "0", 10);
    const engagedSessions = parseInt(row[2]?.value ?? "0", 10);
    const conversions = parseInt(row[3]?.value ?? "0", 10);
    const revenue = parseFloat(row[4]?.value ?? "0");

    // Approximate CTR as (engagedSessions / sessions) when we don't have ad-platform click data
    const ctr = sessions > 0 ? Math.round((engagedSessions / sessions) * 10000) / 100 : 0;

    // Store in results_metrics so the Results page can render without re-querying
    const nowIso = new Date().toISOString();
    const rowsToInsert = [
      { user_id: user.id, campaign_id: campaignId, metric_type: "sessions",    value: sessions,        source: "ga4", recorded_at: nowIso },
      { user_id: user.id, campaign_id: campaignId, metric_type: "users",       value: users,           source: "ga4", recorded_at: nowIso },
      { user_id: user.id, campaign_id: campaignId, metric_type: "engagement",  value: engagedSessions, source: "ga4", recorded_at: nowIso },
      { user_id: user.id, campaign_id: campaignId, metric_type: "ctr",         value: ctr,             source: "ga4", recorded_at: nowIso },
      { user_id: user.id, campaign_id: campaignId, metric_type: "conversions", value: conversions,     source: "ga4", recorded_at: nowIso },
      { user_id: user.id, campaign_id: campaignId, metric_type: "revenue",     value: revenue,         source: "ga4", recorded_at: nowIso },
    ];
    await admin.from("results_metrics").insert(rowsToInsert);

    return new Response(JSON.stringify({
      source: "live",
      utmCampaign,
      recordedAt: nowIso,
      metrics: { sessions, users, engagement: engagedSessions, ctr, conversions, revenue },
    }), { headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? "Failed to fetch campaign metrics" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
