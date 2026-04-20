import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBrandKit, formatBrandKitForPrompt } from "@/lib/brand";

const PPC_TYPES = {
  google: {
    label: "Google Ads",
    prompt: (app: string) => `Write a complete Google Search Ads campaign for this app: ${app}

Return eight sections, clearly labeled:

CAMPAIGN STRUCTURE
Single recommended campaign + 3 ad groups with a clear targeting theme for each.

HEADLINES (15)
15 responsive search ad headlines. Each under 30 characters. Mix: 3 brand, 4 benefit, 4 feature, 2 problem-framed, 2 social proof. Label each with its angle in brackets.

DESCRIPTIONS (4)
4 descriptions. Each under 90 characters. End with a specific CTA.

KEYWORDS (15)
15 target keywords with match type noted: [exact], "phrase", or broad. Group by ad group.

NEGATIVE KEYWORDS (10)
Plain list of terms that must NOT trigger the ad (e.g. "free", "jobs", competitor names, irrelevant verticals).

AD EXTENSIONS
4 sitelink extensions (title + description), 3 callout extensions (under 25 chars each), 2 structured snippet categories + values.

BUDGET SPLIT
Recommended daily budget range for a solo-founder launch (with low / realistic / aggressive tiers) and split across the 3 ad groups.

MEASUREMENT
3 conversion actions to set up in Google Ads + expected CTR / CPC benchmarks for this category.`,
  },

  meta: {
    label: "Meta Ads (Facebook + Instagram)",
    prompt: (app: string) => `Write a complete Meta Ads (Facebook + Instagram) campaign for this app: ${app}

Return seven sections, clearly labeled:

CAMPAIGN OBJECTIVE
Recommended objective (Traffic / Leads / App Installs / Conversions) + why.

PRIMARY TEXT (3)
3 primary-text variants, each 100-150 characters. Angles: problem-first, benefit-first, story-first. Hook in the first 25 chars.

HEADLINES (5)
5 headline variants, under 40 characters each. Short, punchy, scroll-stopping.

DESCRIPTIONS (3)
3 descriptions, under 30 characters each.

CREATIVE CONCEPTS (3)
Three distinct ad creative concepts, described in enough detail that a designer or the Visual Assets agent could produce them. For each: format (single image / carousel / short video), visual direction, key copy overlay, emotion to evoke.

AUDIENCE TARGETING
Three audiences to test: (1) cold / interest-based with specific interests, (2) lookalike source recommendation, (3) retargeting custom audience setup. For each: size range, the hypothesis you're testing.

BUDGET + LEARNING
Recommended daily budget (low / realistic / aggressive) and the specific number of conversions per adset needed to exit learning phase + how long that typically takes.`,
  },

  linkedin: {
    label: "LinkedIn Ads",
    prompt: (app: string) => `Write a complete LinkedIn Ads campaign for this app: ${app}

Return six sections, clearly labeled:

CAMPAIGN OBJECTIVE + FORMAT
Recommended objective (Website Visits / Lead Gen Form / Message Ads) and format (Single Image / Carousel / Video / Document / Conversation). Justify the pick for this app and audience.

INTRO TEXT (3)
3 intro-text variants. Each 150-200 characters. Professional but human — LinkedIn hates hype.

HEADLINES (5)
5 headlines. Each under 70 characters.

DESCRIPTIONS (3)
3 descriptions, under 100 characters. Ending with a clear CTA.

TARGETING
Specific targeting parameters: job titles (5-8 examples), seniority (entry / mid / senior / VP+ / C-suite — pick one or two), industries (3-5), company size range, skills (5-8 examples), member groups or interests if relevant. Estimate audience size.

BUDGET + EXPECTATIONS
Recommended daily budget for LinkedIn (realistically higher than Meta/Google), bid type (auto / manual / target cost), and realistic CTR / CPL benchmarks for B2B SaaS.`,
  },

  x: {
    label: "X (Twitter) Ads",
    prompt: (app: string) => `Write a complete X (Twitter) Ads campaign for this app: ${app}

Return six sections, clearly labeled:

CAMPAIGN OBJECTIVE + FORMAT
Recommended objective (Reach / Website Clicks / App Installs / Engagement) and format (Promoted Post / Takeover / Vertical Video / Amplify). Justify the pick.

AD COPY (5)
5 promoted post variants. Each under 250 characters. Mix formats: one with a statement + image suggestion, one with a poll question, one with a short thread tease, one with social proof, one problem-framed. Label each.

TARGETING
Specific targeting: keywords (8-10), follower lookalike handles (6-8 real accounts in this space), interests, locations, device type, conversations. Estimate audience size range.

A/B TEST MATRIX
3 distinct test hypotheses to run in week 1: (1) audience angle, (2) copy angle, (3) visual angle. For each: what you're testing, control variant, test variant, success metric.

NEGATIVE TARGETING
What to exclude: keywords (5), handles (3), topics (2) — to keep spend efficient.

BUDGET + BENCHMARKS
Daily budget range (low / realistic / aggressive) for a launch campaign. Realistic CPM / CPC / engagement rate benchmarks.`,
  },

  tiktok: {
    label: "TikTok Ads",
    prompt: (app: string) => `Write a complete TikTok Ads campaign for this app: ${app}

Return six sections, clearly labeled:

CAMPAIGN OBJECTIVE + FORMAT
Recommended objective (Traffic / App Installs / Conversions / Lead Generation) and placement strategy (In-Feed / Spark Ads / TopView). Justify.

VIDEO SCRIPTS (3)
3 complete 15-30 second scripts. For each: HOOK (first 1-2 seconds, what grabs the thumb), BODY (problem → reveal → demo), CTA (final 2 seconds). Include on-screen text overlays, voiceover / captions, recommended music style (trending audio type vs original), and creator brief (who should star in this — founder, user, character).

DISPLAY COPY (3)
3 display-text variants under 100 characters each.

CTAs
3 recommended CTA button options for the app's stage + format.

TARGETING
Specific: interests (6-8), behaviors, age range, locations, device OS, Spark Ads handles to borrow from (3-5 real creators in this space).

CREATOR STRATEGY
Should this be creator-led or brand-led? If creator: 3 micro-creator archetypes to partner with (follower range, niche, content style, rough pay range). If brand: what the brand account needs to build first.

BUDGET + BENCHMARKS
Daily budget range for a launch, realistic CPM / CPC / completion-rate benchmarks. When to scale, when to kill.`,
  },
};

export async function POST(request: Request) {
  try {
    const { prompt, ppcPlatform, applyBrandKit } = await request.json();
    if (!prompt?.trim() || !ppcPlatform) return new Response("Prompt and platform required", { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return new Response(JSON.stringify({ error: "Missing API key" }), { status: 500 });

    const supabase = await createClient();
    const admin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { data: usage } = await supabase
      .from("user_usage")
      .select("searches_remaining, plan, free_ppc_used")
      .eq("user_id", user.id).single();

    if (!usage) {
      return new Response(JSON.stringify({ error: "no_usage_record", message: "Account not set up." }),
        { status: 500, headers: { "Content-Type": "application/json" } });
    }

    if (usage.plan === "free") {
      if (usage.free_ppc_used) {
        return new Response(JSON.stringify({
          error: "free_limit",
          agent: "ppc",
          message: "You've used your free Paid Ads generation. Upgrade to the Launch Kit ($49) for 100 searches across every agent.",
        }), { status: 402, headers: { "Content-Type": "application/json" } });
      }
    } else if (usage.searches_remaining <= 0) {
      return new Response(JSON.stringify({ error: "no_searches", message: "No searches remaining." }),
        { status: 402, headers: { "Content-Type": "application/json" } });
    }

    const typeConfig = PPC_TYPES[ppcPlatform as keyof typeof PPC_TYPES];
    if (!typeConfig) return new Response("Invalid PPC platform", { status: 400 });

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
                    content_type: `ppc_${ppcPlatform}`,
                    title: `${typeConfig.label} — ${prompt.slice(0, 60)}${prompt.length > 60 ? "..." : ""}`,
                    brand_kit_applied: applyBrandKit ?? false,
                  }).select().single();
                  if (usage.plan === "free") {
                    await admin.from("user_usage").update({ free_ppc_used: true }).eq("user_id", user.id);
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
