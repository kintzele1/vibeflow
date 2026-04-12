import { createClient } from "@/lib/supabase/server";
import { getBrandKit, formatBrandKitForPrompt } from "@/lib/brand";

export async function POST(request: Request) {
  try {
    const { prompt, applyBrandKit } = await request.json();
    if (!prompt?.trim()) return new Response("Prompt is required", { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return new Response(JSON.stringify({ error: "Missing API key" }), { status: 500 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { data: usage } = await supabase
      .from("user_usage").select("searches_remaining").eq("user_id", user.id).single();

    if (!usage || usage.searches_remaining <= 0) {
      return new Response(JSON.stringify({ error: "no_searches", message: "No searches remaining." }),
        { status: 402, headers: { "Content-Type": "application/json" } });
    }

    // Fetch brand kit if requested
    let brandKitSection = "";
    if (applyBrandKit) {
      const brand = await getBrandKit();
      if (brand) brandKitSection = "\n\n" + formatBrandKitForPrompt(brand);
    }

    const systemPrompt = `You are VibeFlow's AI marketing director — an expert at creating complete marketing campaigns for indie hackers and vibe coders.${brandKitSection}

Generate a full campaign with these exact sections:

1. VIBE ANALYSIS
Brand personality, target audience, tone of voice, and 3 key differentiators.

2. TAGLINES
3 punchy tagline options.

3. HERO COPY
A landing page headline and subheadline.

4. TWITTER/X THREAD
A 5-tweet launch thread. Number each tweet.

5. LINKEDIN POST
A professional launch announcement.

6. REDDIT POST
An authentic post for r/SideProject or r/IndieHackers.

7. PRODUCT HUNT
Tagline (under 60 chars), description (under 260 chars), and first comment.

8. EMAIL SEQUENCE
Subject line + preview text for: Welcome email, Day 3 follow-up, Day 7 upsell.

9. SEO KEYWORDS
10 target keywords with search intent (informational/commercial/transactional).

10. AD HEADLINES
5 Google/Meta ad headlines under 30 characters each.

Be specific to the app described. No generic filler copy. Format each section clearly.`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
              "content-type": "application/json",
            },
            body: JSON.stringify({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 4000,
              stream: true,
              system: systemPrompt,
              messages: [{ role: "user", content: `Generate a complete marketing campaign for:\n\n${prompt}` }],
            }),
          });

          if (!res.ok) {
            const errText = await res.text();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: `${res.status}: ${errText}` })}\n\n`));
            controller.close();
            return;
          }

          const reader = res.body?.getReader();
          const decoder = new TextDecoder();
          let fullContent = "";
          if (!reader) { controller.close(); return; }

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const lines = decoder.decode(value).split("\n");
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (!data || data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                  fullContent += parsed.delta.text;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`));
                }
                if (parsed.type === "message_stop") {
                  const { data: campaign } = await supabase.from("campaigns")
                    .insert({ user_id: user.id, prompt, content: fullContent, content_type: "campaign", brand_kit_applied: applyBrandKit ?? false })
                    .select().single();
                  await supabase.from("user_usage")
                    .update({ searches_remaining: usage.searches_remaining - 1 }).eq("user_id", user.id);
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, campaignId: campaign?.id })}\n\n`));
                  controller.close();
                  return;
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

    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
