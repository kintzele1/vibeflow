import { createClient } from "@/lib/supabase/server";

const SOCIAL_TYPES = {
  x_post: {
    label: "X (Twitter) Post",
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

POST 1 — Founder story angle:
Tell the personal story of why you built this. Vulnerable, real, relatable.

POST 2 — Problem/solution angle:
Start with a pain point your audience recognizes. Build to the solution.

POST 3 — Results/value angle:
Lead with a specific outcome or benefit. Use numbers if possible.

Each post:
- First line must stop the scroll (shown before "see more")
- 150-250 words
- Line breaks for readability
- End with a question or CTA

Label each clearly.`,
  },
  instagram: {
    label: "Instagram Caption",
    prompt: (app: string) => `Write 3 Instagram captions for this app: ${app}

CAPTION 1 — Launch announcement:
Exciting, visual, story-driven. Describe what someone would see/feel using this.

CAPTION 2 — Behind the scenes:
How was it built? What was the hardest part? People love the process.

CAPTION 3 — User benefit:
Paint a picture of life before vs after using this app.

For each caption include:
- Main caption text (under 150 words)
- 15-20 relevant hashtags grouped at the end
- Suggested emoji placement

Label each clearly.`,
  },
  tiktok: {
    label: "TikTok Script",
    prompt: (app: string) => `Write 3 TikTok video scripts for this app: ${app}

SCRIPT 1 — "POV" format (15-30 seconds):
"POV: You just launched your app and..." Show the transformation.

SCRIPT 2 — Tutorial/demo format (30-60 seconds):
Walk through the app in a fast, engaging way. Hook in first 2 seconds.

SCRIPT 3 — Storytime format (30-60 seconds):
"I built an app in 2 weeks and here's what happened..." Real founder story.

For each script:
- [HOOK]: First line spoken (must stop the scroll)
- [VISUAL]: What's shown on screen
- [VOICEOVER/TEXT]: What's said/shown as text
- [CTA]: End call to action
- Suggested trending sounds/music style

Label each clearly.`,
  },
  reddit_posts: {
    label: "Reddit Posts",
    prompt: (app: string) => `Write 3 Reddit posts for this app: ${app}

POST 1 — r/SideProject:
Title: "Built X in Y weeks — here's what I learned"
Body: Honest builder story. What worked, what didn't, what you'd do differently.

POST 2 — r/IndieHackers:
Title: "Show HN style — I made X because Y kept happening to me"
Body: Personal pain point → solution → current traction/status.

POST 3 — r/startups or niche subreddit:
Title: More value-focused — "How I automated X using AI"
Body: Teach something useful, then mention your app naturally at the end.

Reddit rules: No hype, no buzzwords, be genuinely helpful. Sound like a real person.

Label each clearly with the subreddit and title.`,
  },
  threads: {
    label: "Threads Posts",
    prompt: (app: string) => `Write 5 Threads posts for this app: ${app}

Threads is conversational, casual, and text-first. Think short observations, hot takes, and relatable moments.

POST 1 — Hot take about the problem your app solves
POST 2 — Behind the scenes of building it  
POST 3 — Relatable moment your target user will recognize
POST 4 — Simple explanation of what your app does (no jargon)
POST 5 — Engagement post — ask a question your audience will answer

Each post: 1-4 sentences max. Conversational tone. No hashtags needed.

Label each clearly.`,
  },
  carousel: {
    label: "Carousel Post",
    prompt: (app: string) => `Write a 7-slide carousel post for LinkedIn or Instagram for this app: ${app}

SLIDE 1 — Hook slide:
Bold headline that makes people want to swipe. Use a number or bold claim.

SLIDE 2 — The problem:
Describe the pain point in vivid detail. Make them feel it.

SLIDE 3 — Why existing solutions fail:
What's wrong with how people solve this today?

SLIDE 4 — The solution (your app):
Introduce your app. What it does in one clear sentence.

SLIDE 5 — Key feature 1:
Most important feature with a specific benefit.

SLIDE 6 — Key feature 2 + social proof:
Second feature + early results or testimonial.

SLIDE 7 — CTA slide:
Clear next step. Link, offer, or question.

For each slide provide:
- Headline (under 10 words)
- Body text (2-3 sentences)
- Visual suggestion (what image/graphic to use)`,
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
                  await supabase.from("user_usage")
                    .update({ searches_remaining: usage.searches_remaining - 1 })
                    .eq("user_id", user.id);
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
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
