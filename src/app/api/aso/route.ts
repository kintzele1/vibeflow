import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBrandKit, formatBrandKitForPrompt } from "@/lib/brand";
import { logLearningSignal } from "@/lib/learning";
import { checkAgentRateLimit, rateLimitedResponse } from "@/lib/rate-limit";

const ASO_TYPES = {
  title_subtitle: {
    label: "Title + Subtitle",
    prompt: (app: string) => `Write App Store + Google Play title, subtitle, and short promotional copy for this app: ${app}

Return six sections, clearly labeled:

APP STORE TITLE (3 options)
3 title variants, each exactly 30 characters or fewer. Include the primary keyword in the first 15 characters. Label each with the keyword it targets.

APP STORE SUBTITLE (3 options)
3 subtitle variants, each exactly 30 characters or fewer. Should complement (not repeat) the title and surface a secondary keyword. Label each.

APP STORE PROMOTIONAL TEXT
1 recommended promotional text variant, under 170 characters. This is editable without a new app submission — use it for launch news, time-limited offers, or seasonal positioning.

GOOGLE PLAY TITLE (3 options)
3 title variants, each exactly 30 characters or fewer. Note: Google Play rewards keyword density in the title differently than Apple; adjust tone accordingly.

GOOGLE PLAY SHORT DESCRIPTION
1 short description variant, exactly 80 characters or fewer. This appears above the "Read more" fold on store listings.

RECOMMENDATION
Which specific combo of title + subtitle + short description you'd ship, and why. One paragraph.`,
  },

  description: {
    label: "Long-form Description",
    prompt: (app: string) => `Write a complete, conversion-optimized App Store + Google Play long-form description for this app: ${app}

Return six sections, clearly labeled:

HOOK (first 3 lines)
The text above the "more" fold — the only text 70% of visitors ever read. First three lines, each under 80 characters. Lead with the single most compelling promise.

CORE BENEFITS (3-5)
3-5 benefit-led bullet points. Each: bold one-line claim + one sentence of supporting detail. Lead with outcome, not feature.

FEATURES (5-8)
Feature list. Each: short feature name in bold + one line describing the benefit. Keep it scannable.

SOCIAL PROOF
1-2 specific stats, quotes, or recognitions (placeholder-friendly — e.g., "[X] creators use this daily" or "Featured in [Publication]"). Flag any that need real numbers plugged in.

WHO IT'S FOR
One short paragraph explicitly describing the target user. Helps both conversion and ASO algorithm relevance signals.

CALL-TO-ACTION
Final paragraph, 2-3 sentences, ending with a download/install CTA. Friendly not pushy.

Full description should land in the 2000-3500 character range. Note: App Store caps at 4000 characters including line breaks; Google Play caps at 4000 characters. Write once, works for both.`,
  },

  keywords: {
    label: "Keyword Strategy",
    prompt: (app: string) => `Run a complete ASO keyword strategy for this app: ${app}

Return six sections, clearly labeled:

APP STORE KEYWORDS FIELD (100 characters)
Exactly 100 characters or fewer of comma-separated keywords. No spaces after commas. This is the single keyword field visible only to Apple's algorithm, not to users. Prioritize 1-3 word high-intent terms. Don't repeat words from your title/subtitle (those are already indexed). Show the character count at the end.

PLAY STORE KEYWORD DENSITY PLAN
Google Play has no separate keywords field — it indexes from your title, short description, and long description. Return a list of 8-12 keywords to weave into those three fields with target density (mentions per 1000 characters). Flag which 3-4 should appear in the title.

LONG-TAIL OPPORTUNITIES (10)
10 specific long-tail phrases competitors aren't targeting but that match real user intent. Plain list, one per line.

LOCALIZATION PRIORITIES (top 3 markets)
Based on the app's category, the top 3 non-English markets to localize to first and the specific keyword translation nuances for each (not just literal translation — cultural/usage differences that change keyword choice).

COMPETITOR KEYWORD GAPS
3 specific keywords that top competitors in this category rank for but could be taken with good optimization. Name the competitor and the keyword for each.

BRAND VS CATEGORY BIDDING
One paragraph on whether this app should fight for brand terms or focus entirely on category-driven discovery at launch. Defensible recommendation.`,
  },

  screenshots: {
    label: "Screenshot Captions",
    prompt: (app: string) => `Design the screenshot sequence and captions for this app's App Store + Google Play listing: ${app}

Return the full plan in this structure:

SEQUENCE STRATEGY
One paragraph on the narrative arc of the 7-screenshot sequence (App Store allows up to 10, Google Play up to 8; we plan for 7 as the high-conversion norm). Describe the emotional and informational journey from screenshot 1 to 7.

SCREENSHOT 1 — Hero
CAPTION: headline-style, under 40 characters, benefit-led.
SUBCAPTION: one supporting line, under 60 characters.
VISUAL BRIEF: what the mockup shows — screen, focal element, background treatment, any characters or hands shown.

SCREENSHOTS 2-7
Same structure for each: caption, subcaption, visual brief. Each should advance the narrative. Cover: core feature demo, second feature, social proof moment, "a day in the life" showing integration, differentiator / what-makes-this-different, and a final screenshot that serves as a visual CTA.

COMMON MISTAKES TO AVOID
3-5 specific mistakes you see in this category (e.g., "showing settings screens early", "using stock photos", "testimonials without specificity"). Brief, direct.

VISUAL DIRECTION
One paragraph on color palette, type treatment, device frame choice, and background style — consistent with brand kit if applied. Include a specific recommendation on whether to use real device frames, stylized illustrations, or abstract backgrounds.`,
  },

  preview_video: {
    label: "App Preview Video",
    prompt: (app: string) => `Write a complete 30-second App Store + Google Play app preview video script for: ${app}

Return the plan in this structure:

VIDEO CONCEPT
One paragraph capturing the one idea this video is selling. Don't list every feature — pick the single most compelling thing.

TIMELINE (second-by-second)
Full 30-second script with second-by-second beats in this format:

0-3s — HOOK
What: on-screen visual. Voiceover / caption text (App Store preview videos must be captioned; voiceover is optional on Apple but required on Google Play).

3-8s — PROBLEM
Same structure.

8-18s — SOLUTION / DEMO
Same structure. This is the 10-second middle beat — the core feature demo.

18-25s — OUTCOME / PROOF
What the user's life looks like after.

25-30s — CTA
Logo lockup + install prompt.

VOICEOVER SCRIPT
Clean paste-able voiceover copy with timing cues. Under 75 words total (30s budget).

CAPTIONS
The exact on-screen caption text for each beat. Short, readable, high-contrast.

MUSIC DIRECTION
Style, BPM range, emotional arc. Reference 2-3 specific track types or libraries (Artlist, Musicbed, Epidemic Sound).

APPLE VS GOOGLE PLAY VARIATIONS
Note: App Store previews must show actual app UI (Apple rejects "marketing-feel" videos). Google Play is more flexible. Call out any shots that need adjustment between the two platforms.`,
  },
};

export async function POST(request: Request) {
  try {
    const { prompt, asoType, applyBrandKit } = await request.json();
    if (!prompt?.trim() || !asoType) return new Response("Prompt and ASO type required", { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return new Response(JSON.stringify({ error: "Missing API key" }), { status: 500 });

    const supabase = await createClient();
    const admin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    // Per-user rate limit: 10 agent-generation requests per 60 seconds
    const rl = await checkAgentRateLimit(user.id);
    if (!rl.allowed) return rateLimitedResponse(rl);

    logLearningSignal({ userId: user.id, agentType: "aso", contentType: asoType ?? null, promptLen: (prompt ?? "").length, signalType: "generation_attempted" }).catch(() => {});

    const { data: usage } = await supabase
      .from("user_usage")
      .select("searches_remaining, plan, free_aso_used")
      .eq("user_id", user.id).single();

    if (!usage) {
      return new Response(JSON.stringify({ error: "no_usage_record", message: "Account not set up." }),
        { status: 500, headers: { "Content-Type": "application/json" } });
    }

    if (usage.plan === "free") {
      if (usage.free_aso_used) {
        return new Response(JSON.stringify({
          error: "free_limit",
          agent: "aso",
          message: "You've used your free ASO generation. Upgrade to the Launch Kit ($49) for 100 searches across every agent.",
        }), { status: 402, headers: { "Content-Type": "application/json" } });
      }
    } else if (usage.searches_remaining <= 0) {
      return new Response(JSON.stringify({ error: "no_searches", message: "You've used all your searches. Every generation counts as 1 search. Upgrade to Annual ($299 for 1,200 searches) or buy another Launch Kit ($49 for 100) to keep generating." }),
        { status: 402, headers: { "Content-Type": "application/json" } });
    }

    const typeConfig = ASO_TYPES[asoType as keyof typeof ASO_TYPES];
    if (!typeConfig) return new Response("Invalid ASO type", { status: 400 });

    let brandKitSection = "";
    if (applyBrandKit) {
      const brand = await getBrandKit();
      if (brand) {
        brandKitSection = formatBrandKitForPrompt(brand) + "\n\n";
        // If user has app store URL(s) on file, fetch + parse current listing(s)
        // so the ASO agent can give SPECIFIC recommendations vs generic advice.
        // Both stores are fetched in parallel; either or both may be present.
        if (brand.app_store_url || brand.play_store_url) {
          const { analyzeAppStore, formatAppStoreAnalysisForPrompt } = await import("@/lib/url-analysis");
          const [appleAnalysis, googleAnalysis] = await Promise.all([
            brand.app_store_url ? analyzeAppStore(brand.app_store_url) : null,
            brand.play_store_url ? analyzeAppStore(brand.play_store_url) : null,
          ]);
          if (appleAnalysis) brandKitSection += formatAppStoreAnalysisForPrompt(appleAnalysis) + "\n\n";
          if (googleAnalysis) brandKitSection += formatAppStoreAnalysisForPrompt(googleAnalysis) + "\n\n";
        }
      }
    }

    const userPrompt = brandKitSection + typeConfig.prompt(prompt);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
            body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 3500, stream: true, messages: [{ role: "user", content: userPrompt }] }),
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
                    content_type: `aso_${asoType}`,
                    title: `${typeConfig.label} — ${prompt.slice(0, 60)}${prompt.length > 60 ? "..." : ""}`,
                    brand_kit_applied: applyBrandKit ?? false,
                  }).select().single();
                  if (usage.plan === "free") {
                    await admin.from("user_usage").update({ free_aso_used: true }).eq("user_id", user.id);
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
