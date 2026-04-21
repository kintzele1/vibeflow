import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/integrations/ga4/select-property
 * Body: { propertyId: "properties/123456789", accountName: "My Account › My Property" }
 *
 * Saves the user's chosen GA4 property to their integrations row.
 */
export async function POST(request: Request) {
  try {
    const { propertyId, accountName } = await request.json();
    if (!propertyId || typeof propertyId !== "string" || !propertyId.startsWith("properties/")) {
      return new Response(JSON.stringify({ error: "propertyId must be a string like 'properties/123456789'" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const admin = createAdminClient();
    const { error } = await admin
      .from("integrations")
      .update({
        property_id: propertyId,
        account_name: accountName ?? null,
        updated_at: new Date().toISOString(),
      })
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
    return new Response(JSON.stringify({ error: err.message ?? "Failed to save property" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
