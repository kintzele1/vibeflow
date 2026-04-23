import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBrandKit, formatBrandKitForPrompt } from "@/lib/brand";

/**
 * POST /api/analytics
 * Body: { campaignId: string }
 * Returns: streamed AI narrative insight for the given campaign.
 *
 * Today (Day 4): works primarily against campaign content + any metrics already recorded.
 * Day 5 onward: metrics come from GA4 via results_metrics table and feed the prompt.
 *
 * Free-plan users: this endpoint does NOT count against the free tier. It's auxiliary
 * to whatever agent they already ran. Paid users: decrements searches_remaining by 1 per
 * narrative (analytics narration is priced as a light agent).
 */
export async function POST(request: Request) {
  try {
    const { campaignId } = await request.json();
    if (!campaignId) return new Response("campaignId required", { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return new Response(JSON.stringify({ error: "Missing API key" }), { status: 500 });

    const supabase = await createClient();
    const admin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    // Pull the campaign — RLS confirms ownership
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("id, title, prompt, content, content_type, brand_kit_applied, scheduled_date, completed, created_at")
      .eq("id", campaignId)
      .eq("user_id", user.id)
      .single();
    if (!campaign) return new Response("Campaign not found", { status: 404 });

    // Pull any metrics recorded against this campaign (populated starting Day 5 via GA4)
    const { data: metrics } = await supabase
      .from("results_metrics")
      .select("metric_type, value, value_text, source, recorded_at")
      .eq("campaign_id", campaignId)
      .order("recorded_at", { ascending: false });

    // Usage check — paid users spend 1 search for an analytics narrative. Free users skip.
    const { data: usage } = await supabase
      .from("user_usage")
      .select("searches_remaining, plan")
      .eq("user_id", user.id).single();
    if (!usage) {
      return new Response(JSON.stringify({ error: "no_usage_record", message: "Account not set up." }),
        { status: 500, headers: { "Content-Type": "application/json" } });
    }
    if (usage.plan !== "free" && usage.searches_remaining <= 0) {
      return new Response(JSON.stringify({ error: "no_searches", message: "You've used all your searches. Every generation counts as 1 search. Upgrade to Annual ($299 for 1,200 searches) or buy another Launch Kit ($49 for 100) to keep generating." }),
        { status: 402, headers: { "Content-Type": "application/json" } });
    }

    // Brand kit context makes the narrative voice-matched
    const brand = await getBrandKit();
    const brandKitSection = brand ? formatBrandKitForPrompt(brand) + "\n\n" : "";

    // Shape metrics into a readable block (empty note if no metrics yet)
    const metricsBlock = metrics && metrics.length > 0
      ? metrics.map(m => `- ${m.metric_type}: ${m.value ?? m.value_text} (source: ${m.source ?? "unknown"}, ${new Date(m.recorded_at).toLocaleDateString()})`).join("\n")
      : "NO METRICS RECORDED YET. GA4 and Stripe integrations come online Day 5+. Today, generate insight from the campaign content and scheduling alone.";

    const systemPrompt = `You are VibeFlow's Analytics agent. Your job is to narrate what's working, what isn't, and what the user should do next — based on what we know about this campaign.

${brandKitSection}Never invent numbers. If metrics are absent, say so plainly and focus the narrative on content quality, strategic positioning, and the smartest next action. Always speak as a candid strategic partner, never as a corporate dashboard.`;

    const userPrompt = `Here is a campaign to analyze:

TITLE: ${campaign.title ?? "(untitled)"}
TYPE: ${campaign.content_type}
PROMPT (what the user described to generate it): ${campaign.prompt}
CREATED: ${new Date(campaign.created_at).toLocaleDateString()}
SCHEDULED: ${campaign.scheduled_date ? new Date(campaign.scheduled_date).toLocaleDateString() : "not scheduled"}
BRAND KIT APPLIED: ${campaign.brand_kit_applied ? "yes" : "no"}

CONTENT:
${campaign.content}

METRICS:
${metricsBlock}

Produce a narrative insight with these exact sections:

HEADLINE
One sentence, under 100 characters, capturing the single most important observation. If metrics exist, lead with the number. If not, lead with the strategic read.

WHAT'S WORKING
2-3 bullets on strengths of this specific campaign (content, timing, channel fit, brand alignment).

WHAT'S NOT WORKING (or: what we can't tell yet)
2-3 bullets on weaknesses or gaps. If metrics are missing, explicitly note what signals the user should watch for to know if this campaign is succeeding.

NEXT BEST ACTION
One specific thing the user should do next. Must be concrete enough to act on today. Examples: "Regenerate the Twitter thread with a stronger hook", "Schedule a Reddit post for r/SideProject tomorrow at 9am ET", "Run the Paid Ads agent on this prompt and test $20/day on Meta".

CONFIDENCE
One line: how confident you are in this read and what would increase your confidence. E.g., "Low — we need at least 48h of GA4 data", or "High — the content is clearly off-brand relative to the Brand Kit".`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
            body: JSON.stringify({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 2000,
              stream: true,
              system: systemPrompt,
              messages: [{ role: "user", content: userPrompt }],
            }),
          });

          if (!res.ok) {
            const errText = await res.text();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: `${res.status}: ${errText}` })}\n\n`));
            controller.close(); return;
          }

          const reader = res.body?.getReader();
          const decoder = new TextDecoder();
          if (!reader) { controller.close(); return; }

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            for (const line of decoder.decode(value).split("\n")) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (!data || data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`));
                }
                if (parsed.type === "message_stop") {
                  // Decrement usage only for paid plans. Free plan gets analytics for free on any campaign they own.
                  if (usage.plan !== "free") {
                    await admin.from("user_usage").update({ searches_remaining: usage.searches_remaining - 1 }).eq("user_id", user.id);
                  }
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
                  controller.close(); return;
                }
              } catch {}
            }
          }
          controller.close();
        } catch (err: any) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
