import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logLearningSignal, type AgentType } from "@/lib/learning";

/**
 * POST /api/campaigns/[id]/rate
 * Body: { rating: "up" | "down" }
 *
 * Records a thumbs-up/down rating on a campaign owned by the authenticated
 * user. Upserts so users can change their mind. Also fires a Learning
 * Engine signal (rating_positive | rating_negative) for Phase-2
 * personalization.
 */

function agentTypeFromContentType(contentType: string): AgentType {
  if (contentType === "campaign") return "launchpad";
  if (contentType.startsWith("seo_")) return "seo";
  if (contentType.startsWith("ppc_")) return "ppc";
  if (contentType.startsWith("aso_")) return "aso";
  if (contentType.startsWith("email_") || contentType === "newsletter") return "email";
  if (contentType.startsWith("community_")) return "community";
  if (contentType.startsWith("affiliate_")) return "affiliate";
  if (contentType.startsWith("social_")) return "social";
  // Content-marketing types fall through: blog, twitter, linkedin, reddit, youtube
  return "content";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const body = await request.json();
    const rating = body?.rating;
    if (rating !== "up" && rating !== "down") {
      return new Response(JSON.stringify({ error: "rating must be 'up' or 'down'" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    // Verify the campaign belongs to this user before rating it.
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("id, content_type")
      .eq("id", campaignId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!campaign) {
      return new Response(JSON.stringify({ error: "Campaign not found" }), {
        status: 404, headers: { "Content-Type": "application/json" },
      });
    }

    // Upsert rating via admin client (RLS allows user inserts/updates,
    // but admin keeps it simple regardless of policy quirks).
    const admin = createAdminClient();
    const { error } = await admin
      .from("campaign_ratings")
      .upsert({
        user_id: user.id,
        campaign_id: campaignId,
        rating,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,campaign_id" });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }

    // Fire Learning Engine signal (fire-and-forget, opt-in gated inside).
    logLearningSignal({
      userId: user.id,
      agentType: agentTypeFromContentType(campaign.content_type),
      contentType: campaign.content_type,
      signalType: rating === "up" ? "rating_positive" : "rating_negative",
    }).catch(() => {});

    return new Response(JSON.stringify({ success: true, rating }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

/**
 * GET /api/campaigns/[id]/rate
 * Returns: { rating: "up" | "down" | null }
 *
 * The Results page reads this on load to show the current rating state.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { data } = await supabase
      .from("campaign_ratings")
      .select("rating")
      .eq("user_id", user.id)
      .eq("campaign_id", campaignId)
      .maybeSingle();

    return new Response(JSON.stringify({ rating: data?.rating ?? null }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
