import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { data } = await supabase
      .from("brand_kit")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return new Response(JSON.stringify({ brand: data ?? null }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { error } = await supabase
      .from("brand_kit")
      .upsert({
        user_id: user.id,
        app_name: body.app_name ?? null,
        tagline: body.tagline ?? null,
        primary_color: body.primary_color ?? "#05AD98",
        secondary_color: body.secondary_color ?? "#BBBBFB",
        brand_voice: body.brand_voice ?? [],
        target_audience: body.target_audience ?? null,
        logo_url: body.logo_url ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

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
