import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  try {
    const { id, scheduled_date } = await request.json();

    if (!id) return new Response("Campaign ID required", { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { error } = await supabase
      .from("campaigns")
      .update({ scheduled_date: scheduled_date ?? null })
      .eq("id", id)
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
