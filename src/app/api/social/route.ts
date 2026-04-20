import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBrandKit, formatBrandKitForPrompt } from "@/lib/brand";

const SOCIAL_TYPES = {
  x_post:         { label: "X Posts",         prompt: (app: string) => `Write 3 standalone X posts for this app: ${app}\n\nEach under 280 chars, different angles (problem/benefit/social proof), 2-3 hashtags, human not corporate. Label POST 1, POST 2, POST 3.` },
  linkedin_posts: { label: "LinkedIn Posts",   prompt: (app: string) => `Write 3 LinkedIn posts for this app: ${app}\n\nPOST 1 - Founder story. POST 2 - Problem/solution. POST 3 - Results/value. Each: scroll-stopping first line, 150-250 words, end with CTA.` },
  instagram:      { label: "Instagram",        prompt: (app: string) => `Write 3 Instagram captions for this app: ${app}\n\nCAPTION 1 - Launch announcement. CAPTION 2 - Behind the scenes. CAPTION 3 - User benefit. Each: caption + 15-20 hashtags + emoji suggestions.` },
  tiktok:         { label: "TikTok Scripts",   prompt: (app: string) => `Write 3 TikTok scripts for this app: ${app}\n\nSCRIPT 1 - POV format (15-30s). SCRIPT 2 - Tutorial (30-60s). SCRIPT 3 - Storytime (30-60s). Each: [HOOK], [VISUAL], [VOICEOVER], [CTA], music style.` },
  reddit_posts:   { label: "Reddit Posts",     prompt: (app: string) => `Write 3 Reddit posts for this app: ${app}\n\nPOST 1 - r/SideProject builder story. POST 2 - r/IndieHackers Show HN style. POST 3 - Niche subreddit value-first. No hype, real person.` },
  threads:        { label: "Threads Posts",    prompt: (app: string) => `Write 5 Threads posts for this app: ${app}\n\nPOST 1 - Hot take. POST 2 - Behind the scenes. POST 3 - Relatable moment. POST 4 - Plain English explanation. POST 5 - Engagement question. 1-4 sentences each, no hashtags.` },
  carousel:       { label: "Carousel Post",    prompt: (app: string) => `Write a 7-slide carousel for this app: ${app}\n\nSLIDE 1 - Hook. SLIDE 2 - Problem. SLIDE 3 - Why existing solutions fail. SLIDE 4 - Solution. SLIDE 5 - Feature 1. SLIDE 6 - Feature 2 + proof. SLIDE 7 - CTA. Each: headline (under 10 words) + body (2-3 sentences) + visual suggestion.` },
};

export async function POST(request: Request) {
  try {
    const { prompt, socialType, applyBrandKit } = await request.json();
    if (!prompt?.trim() || !socialType) return new Response("Prompt and social type required", { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return new Response(JSON.stringify({ error: "Missing API key" }), { status: 500 });

    const supabase = await createClient();
    const admin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { data: usage } = await supabase
      .from("user_usage")
      .select("searches_remaining, plan, free_social_used")
      .eq("user_id", user.id).single();

    if (!usage) {
      return new Response(JSON.stringify({ error: "no_usage_record", message: "Account not set up." }),
        { status: 500, headers: { "Content-Type": "application/json" } });
    }

    if (usage.plan === "free") {
      if (usage.free_social_used) {
        return new Response(JSON.stringify({
          error: "free_limit",
          agent: "social",
          message: "You've used your free Social Media generation. Upgrade to the Launch Kit ($49) for 100 searches across every agent.",
        }), { status: 402, headers: { "Content-Type": "application/json" } });
      }
    } else if (usage.searches_remaining <= 0) {
      return new Response(JSON.stringify({ error: "no_searches", message: "No searches remaining." }),
        { status: 402, headers: { "Content-Type": "application/json" } });
    }

    const typeConfig = SOCIAL_TYPES[socialType as keyof typeof SOCIAL_TYPES];
    if (!typeConfig) return new Response("Invalid social type", { status: 400 });

    let brandKitSection = "";
    if (applyBrandKit) {
      const brand = await getBrandKit();
      if (brand) brandKitSection = formatBrandKitForPrompt(brand) + "\n\n";
    }

    const userPrompt = brandKitSection + typeConfig.prompt(prompt);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
            body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 3000, stream: true, messages: [{ role: "user", content: userPrompt }] }),
          });

          if (!res.ok) {
            const errText = await res.text();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: `${res.status}: ${errText}` })}\n\n`));
            controller.close(); return;
          }

          const reader = res.body?.getReader();
          const decoder = new TextDecoder();
          let fullContent = "";
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
                  fullContent += parsed.delta.text;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`));
                }
                if (parsed.type === "message_stop") {
                  const { data: campaign } = await supabase.from("campaigns").insert({
                    user_id: user.id, prompt, content: fullContent,
                    content_type: `social_${socialType}`,
                    title: `${typeConfig.label} — ${prompt.slice(0, 60)}${prompt.length > 60 ? "..." : ""}`,
                    brand_kit_applied: applyBrandKit ?? false,
                  }).select().single();
                  if (usage.plan === "free") {
                    await admin.from("user_usage").update({ free_social_used: true }).eq("user_id", user.id);
                  } else {
                    await admin.from("user_usage").update({ searches_remaining: usage.searches_remaining - 1 }).eq("user_id", user.id);
                  }
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, campaignId: campaign?.id })}\n\n`));
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
