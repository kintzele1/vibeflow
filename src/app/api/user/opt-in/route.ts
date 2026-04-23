import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/user/opt-in
 *   → { ai_learning_opt_in: boolean }
 *
 * POST /api/user/opt-in
 *   body: { ai_learning_opt_in: boolean }
 *   → { success: true, ai_learning_opt_in: boolean }
 *
 * Used by the Settings page toggle. Writes via the service-role admin client
 * because RLS locks writes to user_usage.
 */

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { data, error } = await supabase
      .from("user_usage")
      .select("ai_learning_opt_in")
      .eq("user_id", user.id)
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      // Default to true if the column hasn't been populated yet
      ai_learning_opt_in: data?.ai_learning_opt_in ?? true,
    }), { headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const optIn = Boolean(body.ai_learning_opt_in);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const admin = createAdminClient();
    const { error } = await admin
      .from("user_usage")
      .update({ ai_learning_opt_in: optIn })
      .eq("user_id", user.id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      ai_learning_opt_in: optIn,
    }), { headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
