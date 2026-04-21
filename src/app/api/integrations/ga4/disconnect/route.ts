import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGa4Integration } from "@/lib/ga4";
import { decrypt } from "@/lib/crypto";

/**
 * POST /api/integrations/ga4/disconnect
 *
 * Disconnects GA4 for the signed-in user:
 *   1. Attempts to revoke the refresh_token at Google (best-effort, non-fatal if it fails).
 *   2. Deletes the integrations row.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const integration = await getGa4Integration(user.id);

    // Best-effort: tell Google to invalidate the refresh token too
    if (integration?.refresh_token) {
      try {
        const token = decrypt(integration.refresh_token);
        await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
      } catch {
        // swallow — we still want to delete our DB row even if Google's revoke endpoint fails
      }
    }

    // Delete our DB row (via admin client, service-role bypasses RLS for writes)
    const admin = createAdminClient();
    const { error } = await admin
      .from("integrations")
      .delete()
      .eq("user_id", user.id)
      .eq("provider", "ga4");

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? "Failed to disconnect" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
