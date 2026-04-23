import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBrandKit, formatBrandKitForPrompt } from "@/lib/brand";
import { logLearningSignal } from "@/lib/learning";

// Hard platform character limits. Injected into every prompt so the model
// doesn't generate content the user physically can't publish.
const PLATFORM_LIMITS_PREAMBLE = `CRITICAL — PLATFORM CHARACTER LIMITS ARE HARD CAPS:
- You MUST count characters and keep every output within the stated limit for its platform.
- If a draft exceeds the limit, REWRITE before outputting — do not ship over-limit content.
- Hashtags, emoji, line breaks all count. URLs count as their full length.
- At the end of each post or caption, include a line in this exact format: "(xxx / LIMIT chars)"
  where xxx is the true character count including hashtags and emoji. This lets the user verify.

`;

const SOCIAL_TYPES = {
  x_post: { label: "X Posts", prompt: (app: string) => `${PLATFORM_LIMITS_PREAMBLE}Write 3 standalone X posts for this app: ${app}

PLATFORM: X (Twitter)
HARD LIMIT: 280 characters per post — INCLUDING hashtags, handles, emoji.

Each post: different angles (problem / benefit / social proof), 2-3 hashtags, human not corporate voice.
Label each POST 1, POST 2, POST 3. After each, include the char count line as instructed.` },

  linkedin_posts: { label: "LinkedIn Posts", prompt: (app: string) => `${PLATFORM_LIMITS_PREAMBLE}Write 3 LinkedIn posts for this app: ${app}

PLATFORM: LinkedIn
HARD LIMIT: 3,000 characters per post.
ENGAGEMENT SWEET SPOT: 1,000-1,300 characters. LinkedIn posts above ~1,500 chars see engagement drop sharply.
TARGET LENGTH FOR THIS TASK: 900-1,300 characters per post. DO NOT exceed 1,500.

POST 1 — Founder story.
POST 2 — Problem / solution.
POST 3 — Results / value.

Each: scroll-stopping first line (under 150 chars, appears above the "see more" fold), short paragraphs (1-3 sentences each), end with a clear CTA. Label each POST 1, POST 2, POST 3. After each, include the char count line.` },

  instagram: { label: "Instagram", prompt: (app: string) => `${PLATFORM_LIMITS_PREAMBLE}Write 3 Instagram captions for this app: ${app}

PLATFORM: Instagram
HARD LIMITS: 2,200 characters per caption; maximum 30 hashtags per post (Instagram silently ignores posts with more).
ENGAGEMENT SWEET SPOT: 300-800 characters of caption body, hashtags in a separate block below.

CAPTION 1 — Launch announcement.
CAPTION 2 — Behind the scenes.
CAPTION 3 — User benefit.

Each: caption body (300-800 chars) + 15-20 hashtags (separate block) + 1-2 suggested emoji for the caption opener. Label each CAPTION 1/2/3. After each, include the char count line covering caption + hashtags combined.` },

  tiktok: { label: "TikTok Scripts", prompt: (app: string) => `${PLATFORM_LIMITS_PREAMBLE}Write 3 TikTok scripts for this app: ${app}

PLATFORM: TikTok (scripts + captions)
HARD LIMIT FOR CAPTION: 2,200 characters.
CAPTION SWEET SPOT: 100-300 characters (TikTok audiences scroll fast).
VIDEO LENGTH: scripts should fit the stated duration.

SCRIPT 1 — POV format (15-30s).
SCRIPT 2 — Tutorial (30-60s).
SCRIPT 3 — Storytime (30-60s).

Each: [HOOK], [VISUAL], [VOICEOVER], [CTA], music style. Then a short TikTok CAPTION (under 300 chars) and 3-5 hashtags. After the caption, include the char count line.` },

  reddit_posts: { label: "Reddit Posts", prompt: (app: string) => `${PLATFORM_LIMITS_PREAMBLE}Write 3 Reddit posts for this app: ${app}

PLATFORM: Reddit
HARD LIMITS: Title 300 characters; body 40,000 characters.
ENGAGEMENT SWEET SPOT: Title under 100 chars; self-post body 400-1,500 chars.
VOICE: no hype, no emoji, builder-to-community tone. Marketing speak gets removed by mods.

POST 1 — r/SideProject builder story.
POST 2 — r/IndieHackers Show IH style.
POST 3 — Niche subreddit value-first.

For each: TITLE (under 100 chars), BODY (400-1,500 chars), suggested SUBREDDIT. After the body, include the char count line for title and body separately.` },

  threads: { label: "Threads Posts", prompt: (app: string) => `${PLATFORM_LIMITS_PREAMBLE}Write 5 Threads posts for this app: ${app}

PLATFORM: Threads (Meta)
HARD LIMIT: 500 characters per post.
TONE: conversational, no hashtags (Threads audiences dislike them).

POST 1 — Hot take.
POST 2 — Behind the scenes.
POST 3 — Relatable moment.
POST 4 — Plain English explanation.
POST 5 — Engagement question.

1-4 sentences each, no hashtags. Label each POST 1/2/3/4/5. After each, include the char count line.` },

  carousel: { label: "Carousel Post", prompt: (app: string) => `${PLATFORM_LIMITS_PREAMBLE}Write a 7-slide carousel for this app: ${app}

PLATFORM: LinkedIn or Instagram carousel.
HARD LIMITS: Each slide headline under 60 characters, body under 200 characters (carousels are read fast — space is tight).
OVERALL CAROUSEL CAPTION (the caption that accompanies the carousel post): 500-1200 chars for LinkedIn, 300-800 for Instagram.

SLIDE 1 — Hook.
SLIDE 2 — Problem.
SLIDE 3 — Why existing solutions fail.
SLIDE 4 — Solution.
SLIDE 5 — Feature 1.
SLIDE 6 — Feature 2 + proof.
SLIDE 7 — CTA.

For each slide: HEADLINE (<60 chars), BODY (<200 chars), VISUAL SUGGESTION. Then a CAROUSEL CAPTION block. After each slide and the caption, include the char count line.` },
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

    logLearningSignal({ userId: user.id, agentType: "social", contentType: socialType ?? null, promptLen: (prompt ?? "").length, signalType: "generation_attempted" }).catch(() => {});

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
      return new Response(JSON.stringify({ error: "no_searches", message: "You've used all your searches. Every generation counts as 1 search. Upgrade to Annual ($299 for 1,200 searches) or buy another Launch Kit ($49 for 100) to keep generating." }),
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
