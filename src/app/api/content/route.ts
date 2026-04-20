import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBrandKit, formatBrandKitForPrompt } from "@/lib/brand";

const CONTENT_TYPES = {
  blog:           { label: "Blog Post",       prompt: (app: string) => `Write a complete, SEO-optimized blog post for this app: ${app}\n\nInclude: compelling H1 headline, meta description (under 160 chars), hook introduction, 4-5 H2 sections with detail, strong conclusion with CTA. Aim for 800-1000 words. Make it genuinely useful, not promotional.` },
  newsletter:     { label: "Newsletter",      prompt: (app: string) => `Write a launch newsletter email for this app: ${app}\n\nInclude: subject line (under 50 chars), preview text (under 90 chars), personal opening, problem being solved, what makes this different, 3 key benefits, CTA button text, P.S. line. Under 400 words. Feels like a founder, not a corporation.` },
  twitter:        { label: "Twitter/X Thread",prompt: (app: string) => `Write a high-engagement Twitter/X launch thread for this app: ${app}\n\nTweet 1: Hook (no "Introducing"). Tweets 2-6: problem → solution → features → social proof. Tweet 7: CTA. Each tweet under 280 chars, numbered (1/, 2/...). Human, not corporate.` },
  linkedin:       { label: "LinkedIn Post",   prompt: (app: string) => `Write a LinkedIn launch post for this app: ${app}\n\nFirst line: scroll-stopping hook. 3-4 short paragraphs: founder story, problem, solution, who it's for. CTA at end. Authentic and personal. Under 300 words.` },
  reddit:         { label: "Reddit Post",     prompt: (app: string) => `Write a Reddit launch post for r/SideProject or r/IndieHackers for this app: ${app}\n\nHonest title, real story of how long it took and what was hard, plain English description, current state, ask for feedback. No marketing speak.` },
  youtube:        { label: "YouTube Script",  prompt: (app: string) => `Write a YouTube video script for this app: ${app}\n\nInclude hook (15 sec), problem setup (30 sec), demo outline (2-3 min with [SCREEN:] cues), features, pricing/CTA, outro. Conversational tone.` },
  email_sequence: { label: "Email Sequence",  prompt: (app: string) => `Write a 5-email onboarding sequence for this app: ${app}\n\nEmail 1 - Welcome (immediate), Email 2 - Getting started (Day 1), Email 3 - Key feature (Day 3), Email 4 - Social proof (Day 7), Email 5 - Upsell (Day 14). Each: subject + preview text + body (under 200 words) + CTA.` },
};

export async function POST(request: Request) {
  try {
    const { prompt, contentType, applyBrandKit } = await request.json();
    if (!prompt?.trim() || !contentType) return new Response("Prompt and content type required", { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return new Response(JSON.stringify({ error: "Missing API key" }), { status: 500 });

    const supabase = await createClient();
    const admin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { data: usage } = await supabase
      .from("user_usage")
      .select("searches_remaining, plan, free_content_used")
      .eq("user_id", user.id).single();

    if (!usage) {
      return new Response(JSON.stringify({ error: "no_usage_record", message: "Account not set up." }),
        { status: 500, headers: { "Content-Type": "application/json" } });
    }

    if (usage.plan === "free") {
      if (usage.free_content_used) {
        return new Response(JSON.stringify({
          error: "free_limit",
          agent: "content",
          message: "You've used your free Content Marketing generation. Upgrade to the Launch Kit ($49) for 100 searches across every agent.",
        }), { status: 402, headers: { "Content-Type": "application/json" } });
      }
    } else if (usage.searches_remaining <= 0) {
      return new Response(JSON.stringify({ error: "no_searches", message: "No searches remaining." }),
        { status: 402, headers: { "Content-Type": "application/json" } });
    }

    const typeConfig = CONTENT_TYPES[contentType as keyof typeof CONTENT_TYPES];
    if (!typeConfig) return new Response("Invalid content type", { status: 400 });

    // Fetch brand kit if requested
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
                    user_id: user.id, prompt, content: fullContent, content_type: contentType,
                    title: `${typeConfig.label} — ${prompt.slice(0, 60)}${prompt.length > 60 ? "..." : ""}`,
                    brand_kit_applied: applyBrandKit ?? false,
                  }).select().single();
                  if (usage.plan === "free") {
                    await admin.from("user_usage").update({ free_content_used: true }).eq("user_id", user.id);
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
