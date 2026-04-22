import { createClient } from "@/lib/supabase/server";
import { getBrandKit, formatBrandKitForPrompt } from "@/lib/brand";

/**
 * POST /api/calendar/suggest-time
 * Body: { campaignId: string }
 *
 * Returns a recommended posting day + time for this campaign's channel, with
 * a one-paragraph rationale. Free for all plans — it's a single small Claude
 * call and a meaningful user delight moment, not a metered "generation".
 */
export async function POST(request: Request) {
  try {
    const { campaignId } = await request.json();
    if (!campaignId) {
      return new Response(JSON.stringify({ error: "campaignId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing ANTHROPIC_API_KEY" }), { status: 500 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { data: campaign } = await supabase
      .from("campaigns")
      .select("id, title, prompt, content_type, scheduled_date, content")
      .eq("id", campaignId)
      .eq("user_id", user.id)
      .single();
    if (!campaign) return new Response("Campaign not found", { status: 404 });

    const brand = await getBrandKit();
    const brandSection = brand ? formatBrandKitForPrompt(brand) + "\n\n" : "";

    const userPrompt = `${brandSection}Suggest the best day of the week and time of day (user's local time) to publish this campaign. Base your recommendation on typical engagement patterns for the channel + audience.

Campaign type: ${campaign.content_type}
Campaign title: ${campaign.title ?? "(none)"}
Campaign prompt / description:
${campaign.prompt}

Content preview (first 400 chars):
${(campaign.content ?? "").slice(0, 400)}

Return ONLY a JSON object in this exact format (no preamble, no markdown fences):
{
  "day_of_week": "<one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday>",
  "time_of_day": "<HH:MM in 24-hour format, local time>",
  "confidence": "<high|medium|low>",
  "rationale": "<one sentence, under 160 characters, explaining why this day + time>"
}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ error: `Claude error: ${res.status} ${errText}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const text = data?.content?.[0]?.text?.trim() ?? "";
    // Extract the JSON object even if Claude adds whitespace or stray text
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return new Response(JSON.stringify({ error: "Could not parse suggestion", raw: text }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(match[0]);

    return new Response(JSON.stringify(parsed), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? "Failed to suggest time" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
