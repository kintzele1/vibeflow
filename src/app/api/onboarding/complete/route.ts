import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/onboarding/complete
 *
 * Flips user_usage.onboarded = true for the authenticated user.
 * Called from the Welcome modal's "Save" and "Skip for now" flows.
 *
 * Uses the service-role admin client to update user_usage because RLS
 * locks writes to that table (existing pattern in this codebase).
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const admin = createAdminClient();
    const { error } = await admin
      .from("user_usage")
      .update({ onboarded: true })
      .eq("user_id", user.id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
