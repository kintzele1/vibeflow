import { createClient } from "@/lib/supabase/server";
import { runGa4Report, getGa4Integration } from "@/lib/ga4";

/**
 * GET /api/integrations/ga4/sitewide
 *
 * Returns site-wide GA4 metrics for the Analytics Hub page.
 * Pulls last 30 days: sessions, users, engaged sessions, avg engagement time,
 * conversions, total revenue, plus top 5 traffic sources.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

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

    // Headline metrics — last 30 days
    const headlineReport = await runGa4Report(user.id, {
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "engagedSessions" },
        { name: "userEngagementDuration" },
        { name: "conversions" },
        { name: "totalRevenue" },
      ],
    });

    const row = headlineReport.rows?.[0]?.metricValues ?? [];
    const headline = {
      sessions:          parseInt(row[0]?.value ?? "0", 10),
      users:             parseInt(row[1]?.value ?? "0", 10),
      engagedSessions:   parseInt(row[2]?.value ?? "0", 10),
      engagementSeconds: parseInt(row[3]?.value ?? "0", 10),
      conversions:       parseInt(row[4]?.value ?? "0", 10),
      totalRevenue:      parseFloat(row[5]?.value ?? "0"),
    };

    // Top 5 traffic sources — last 30 days
    const sourcesReport = await runGa4Report(user.id, {
      dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
      dimensions: [{ name: "sessionSource" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 5,
    });

    const topSources = (sourcesReport.rows ?? []).map((r: any) => ({
      source: r.dimensionValues?.[0]?.value ?? "(not set)",
      sessions: parseInt(r.metricValues?.[0]?.value ?? "0", 10),
    }));

    return new Response(JSON.stringify({
      headline,
      topSources,
      accountName: integration.account_name,
      propertyId: integration.property_id,
    }), { headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? "Failed to fetch GA4 metrics" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
