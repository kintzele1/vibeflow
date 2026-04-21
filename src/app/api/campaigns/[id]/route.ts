import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    // Build a whitelist of updatable fields. Prevents clients from smuggling
    // arbitrary columns (e.g. user_id, content) into the update.
    const patch: Record<string, any> = {};
    if (typeof body.completed === "boolean") patch.completed = body.completed;
    if (typeof body.archived === "boolean")  patch.archived  = body.archived;
    if (typeof body.utm_campaign_tag === "string" || body.utm_campaign_tag === null) {
      patch.utm_campaign_tag = body.utm_campaign_tag;
    }
    if (Object.keys(patch).length === 0) {
      return new Response(JSON.stringify({ error: "No updatable fields in body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { error } = await supabase
      .from("campaigns")
      .update(patch)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { error } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
