import { createClient } from "@/lib/supabase/server";

const SOCIAL_TYPES = {
  x_post: {
    label: "X Posts",
    prompt: (app: string) => `Write 3 different standalone X (Twitter) posts for this app: ${app}

Each post should:
- Be under 280 characters
- Have a different angle (problem-focused, benefit-focused, social proof)
- Include relevant hashtags (2-3 max)
- Have a clear CTA or hook
- Feel human, not corporate

Label each as POST 1, POST 2, POST 3.`,
  },
  linkedin_posts: {
    label: "LinkedIn Posts",
    prompt: (app: string) => `Write 3 LinkedIn posts for this app: ${app}

POST 1 — Founder story angle
POST 2 — Problem/solution angle  
POST 3 — Results/value angle

Each post: first line must stop the scroll, 150-250 words, end with CTA.`,
  },
  instagram: {
    label: "Instagram Captions",
    prompt: (app: string) => `Write 3 Instagram captions for this app: ${app}

CAPTION 1 — Launch announcement
CAPTION 2 — Behind the scenes
CAPTION 3 — User benefit

Each: main caption text + 15-20 hashtags + emoji suggestions.`,
  },
  tiktok: {
    label: "TikTok Scripts",
    prompt: (app: string) => `Write 3 TikTok video scripts for this app: ${app}

SCRIPT 1 — POV format (15-30 seconds)
SCRIPT 2 — Tutorial/demo format (30-60 seconds)
SCRIPT 3 — Storytime format (30-60 seconds)

For each: [HOOK], [VISUAL], [VOICEOVER], [CTA], suggested music style.`,
  },
  reddit_posts: {
    label: "Reddit Posts",
    prompt: (app: string) => `Write 3 Reddit posts for this app: ${app}

POST 1 — r/SideProject: Builder story
POST 2 — r/IndieHackers: Show HN style
POST 3 — Niche subreddit: Value-first, app mentioned naturally

No hype, no buzzwords, sound like a real person.`,
  },
  threads: {
    label: "Threads Posts",
    prompt: (app: string) => `Write 5 Threads posts for this app: ${app}

POST 1 — Hot take about the problem
POST 2 — Behind the scenes of building
POST 3 — Relatable moment for target user
POST 4 — Plain English explanation
POST 5 — Engagement question

Each: 1-4 sentences, conversational, no hashtags.`,
  },
  carousel: {
    label: "Carousel Post",
    prompt: (app: string) => `Write a 7-slide carousel for LinkedIn or Instagram for this app: ${app}

SLIDE 1 — Hook
SLIDE 2 — The problem
SLIDE 3 — Why existing solutions fail
SLIDE 4 — Your solution
SLIDE 5 — Key feature 1
SLIDE 6 — Key feature 2 + social proof
SLIDE 7 — CTA

Each slide: headline (under 10 words) + body (2-3 sentences) + visual suggestion.`,
  },
};

export async function POST(request: Request) {
  try {
    const { prompt, socialType } = await request.json();

    if (!prompt?.trim() || !socialType) {
      return new Response("Prompt and social type are required", { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing API key" }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { data: usage } = await supabase
      .from("user_usage")
      .select("searches_remaining")
      .eq("user_id", user.id)
      .single();

    if (!usage || usage.searches_remaining <= 0) {
      return new Response(
        JSON.stringify({ error: "no_searches", message: "No searches remaining." }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      );
    }

    const typeConfig = SOCIAL_TYPES[socialType as keyof typeof SOCIAL_TYPES];
    if (!typeConfig) return new Response("Invalid social type", { status: 400 });

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
              max_tokens: 3000,
              stream: true,
              messages: [{ role: "user", content: typeConfig.prompt(prompt) }],
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
                  // Save to campaigns
                  const { data: campaign } = await supabase
                    .from("campaigns")
                    .insert({
                      user_id: user.id,
                      prompt,
                      content: fullContent,
                      content_type: `social_${socialType}`,
                      title: `${typeConfig.label} — ${prompt.slice(0, 60)}${prompt.length > 60 ? "..." : ""}`,
                    })
                    .select()
                    .single();

                  await supabase
                    .from("user_usage")
                    .update({ searches_remaining: usage.searches_remaining - 1 })
                    .eq("user_id", user.id);

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
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
}
