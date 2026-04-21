import { createClient } from "@/lib/supabase/server";
import { listGa4Properties } from "@/lib/ga4";

/**
 * GET /api/integrations/ga4/properties
 *
 * Returns the list of GA4 properties the connected Google account has read access to.
 * Used by the property picker on /dashboard/integrations after the OAuth callback.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const properties = await listGa4Properties(user.id);
    return new Response(JSON.stringify({ properties }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? "Failed to list properties" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
