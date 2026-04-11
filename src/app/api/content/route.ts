import { createClient } from "@/lib/supabase/server";

const CONTENT_TYPES = {
  blog: {
    label: "Blog Post",
    prompt: (app: string) => `Write a complete, SEO-optimized blog post for this app: ${app}

Include:
- A compelling headline (H1)
- Meta description (under 160 chars)
- Introduction that hooks the reader
- 4-5 subheadings (H2) with detailed sections
- A strong conclusion with CTA
- Target keyword used naturally throughout

Make it genuinely useful, not promotional fluff. Aim for 800-1000 words.`,
  },
  newsletter: {
    label: "Newsletter",
    prompt: (app: string) => `Write a launch newsletter email for this app: ${app}

Include:
- Subject line (under 50 chars, high open rate)
- Preview text (under 90 chars)
- Personal, conversational opening
- The problem you're solving
- What makes this different
- 3 key benefits
- Clear CTA button text
- P.S. line

Keep it under 400 words. Feels like it's from a founder, not a corporation.`,
  },
  twitter: {
    label: "Twitter/X Thread",
    prompt: (app: string) => `Write a high-engagement Twitter/X launch thread for this app: ${app}

Format:
- Tweet 1: Hook that stops the scroll (no "Introducing" — start with the problem or a bold claim)
- Tweets 2-6: Build the story — problem, solution, key features, social proof
- Tweet 7: CTA with link

Rules:
- Each tweet under 280 chars
- Number each tweet (1/, 2/, etc.)
- Use line breaks for readability
- Make it feel human, not corporate`,
  },
  linkedin: {
    label: "LinkedIn Post",
    prompt: (app: string) => `Write a LinkedIn launch post for this app: ${app}

Format:
- First line: scroll-stopping hook (shown before "see more")
- 3-4 short paragraphs telling the founder story
- What problem you kept running into
- How you built the solution
- What it does + who it's for
- CTA at the end

Keep it authentic and personal. Under 300 words.`,
  },
  reddit: {
    label: "Reddit Post",
    prompt: (app: string) => `Write a Reddit launch post for r/SideProject or r/IndieHackers for this app: ${app}

Format:
- Title: Honest, specific, not salesy
- Body: Tell the real story — how long it took, what was hard, what you learned
- What it does in plain English
- Current state (beta, free tier, etc.)
- Ask for genuine feedback

Reddit hates marketing speak. Sound like a real person.`,
  },
  youtube: {
    label: "YouTube Script",
    prompt: (app: string) => `Write a YouTube video script for launching this app: ${app}

Include:
- Hook (first 15 seconds)
- Problem setup (30 seconds)
- Solution demo outline (2-3 minutes)
- Key features walkthrough
- Pricing/CTA
- Outro

Format with [SCREEN: describe what's on screen] for visual cues.`,
  },
  email_sequence: {
    label: "Email Sequence",
    prompt: (app: string) => `Write a 5-email onboarding sequence for this app: ${app}

Email 1 — Welcome (sent immediately)
Email 2 — Getting started (Day 1)
Email 3 — Key feature highlight (Day 3)
Email 4 — Social proof / use case (Day 7)
Email 5 — Upgrade/upsell (Day 14)

For each email include:
- Subject line
- Preview text
- Full email body (under 200 words each)
- CTA`,
  },
};

export async function POST(request: Request) {
  try {
    const { prompt, contentType } = await request.json();

    if (!prompt?.trim() || !contentType) {
      return new Response("Prompt and content type are required", { status: 400 });
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

    const typeConfig = CONTENT_TYPES[contentType as keyof typeof CONTENT_TYPES];
    if (!typeConfig) return new Response("Invalid content type", { status: 400 });

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
                  // Save to campaigns table
                  const { data: campaign } = await supabase
                    .from("campaigns")
                    .insert({
                      user_id: user.id,
                      prompt,
                      content: fullContent,
                      content_type: contentType,
                      title: `${typeConfig.label} — ${prompt.slice(0, 60)}${prompt.length > 60 ? "..." : ""}`,
                    })
                    .select()
                    .single();

                  // Deduct search
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
