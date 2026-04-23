import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBrandKit, formatBrandKitForPrompt } from "@/lib/brand";
import { logLearningSignal } from "@/lib/learning";

const AFFILIATE_TYPES = {
  program_setup: {
    label: "Program Setup",
    prompt: (app: string) => `Design a complete affiliate / referral program from scratch for this app: ${app}

Return six sections, clearly labeled:

COMMISSION STRUCTURE
Recommended structure for this app's category (tiered vs flat, lifetime vs one-time, percentage vs fixed). Include specific numbers: base commission %, any tier thresholds, and the reasoning. Compare against 2-3 competitor programs in this space.

PAYOUT RULES
Payout frequency (weekly/monthly), minimum payout threshold, supported payout methods (PayPal, Wise, Stripe Connect, bank transfer), refund clawback rules, fraud guardrails.

COOKIE DURATION + ATTRIBUTION
Recommended cookie window with reasoning. Attribution model (first-touch, last-touch, linear). How to handle multi-touch scenarios. Anti-gaming rules (self-referrals, coupon stacking, paid-search bidding on brand terms).

TERMS & CONDITIONS TEMPLATE
A ready-to-ship T&C template covering: acceptance, approved promotional methods, prohibited methods (spam, false claims, trademark bidding, adult traffic), payment terms, termination, IP ownership, warranty disclaimers, dispute resolution. Approximately 400-600 words. Not legal advice — user should get their lawyer's review before publishing.

TRACKING PLATFORM RECOMMENDATION
Three ranked options with pricing, integration complexity, and when to pick each:
- Rewardful (simplest, Stripe-native)
- Tapfiliate (most featured, multi-payment)
- Custom Supabase-based tracker (cheapest, most flexible, needs dev time)
Plus a one-sentence recommendation for this specific app.

DASHBOARD INTEGRATION SPEC
Specific fields + events the affiliate dashboard needs: partner signup form, referral link generator, click tracking, conversion tracking, payout requests, performance analytics. Matched to whichever platform was recommended above.`,
  },

  recruitment: {
    label: "Recruitment Campaign",
    prompt: (app: string) => `Build a complete affiliate recruitment campaign for this app: ${app}

Return five sections, clearly labeled:

IDEAL AFFILIATE PROFILE
Specific traits of a high-performing affiliate for this app's category: audience size range, audience overlap, content style, platform mix, demographics, revenue per follower benchmarks. One concise paragraph + 5 must-have and 3 must-avoid signals.

PROSPECT ARCHETYPES (10)
Ten specific archetypes with where to find them, audience size range, and why-they-fit reasoning. Mix: 3 micro-creators (1k-50k), 4 mid-tier (50k-250k), 2 macro (250k+), 1 wildcard outside the obvious category. For each: archetype name, platform, example accounts or niches (real, discoverable), rough outreach cost/commission expectation.

OUTREACH TEMPLATES (4)
Four ready-to-send templates, each with a subject line and body:
1. Cold email (under 180 words, personal tone)
2. LinkedIn DM (under 500 chars, professional but warm)
3. X / Twitter DM (under 280 chars, punchy)
4. Discord message (under 400 chars, casual builder-to-builder tone)

Each template should leave obvious placeholders like [NAME], [RECENT WORK], [OUR APP], [UNIQUE HOOK FOR THEM].

FOLLOW-UP SEQUENCE
Exact cadence + copy for non-responders: day 4 nudge, day 10 value-add, day 18 final soft close. Three short templates. State when to give up and stop contacting.

FIT-SCORING RUBRIC
A 0-10 scoring rubric a builder can run through in 30 seconds to decide whether to reach out. Cover: audience fit, content quality, engagement rate, past affiliate work, trust signals. Include threshold: "score ≥7 = reach out, 4-6 = maybe, <4 = skip."`,
  },

  asset_kit: {
    label: "Affiliate Asset Kit",
    prompt: (app: string) => `Build a complete affiliate asset kit (text-based) for this app: ${app}

Return seven sections, clearly labeled:

SWIPE COPY (3 lengths)
Three pre-written blurbs affiliates can drop into posts, emails, bios:
- SHORT (under 280 chars, X-ready)
- MEDIUM (400-800 chars, blog intro / LinkedIn-ready)
- LONG (800-1500 chars, newsletter or dedicated review intro)

EMAIL SIGNATURES (2)
Two email-signature-sized promo blocks affiliates can add under their regular signature. One formal, one casual. Under 200 chars each. Include placeholder for their affiliate link.

SOCIAL POST TEMPLATES (4 platforms)
Four ready-to-post templates, all under their platform's limit:
- X post (under 280 chars)
- LinkedIn post (900-1300 chars)
- Instagram caption (300-800 chars + 15 suggested hashtags)
- TikTok script (under 300 chars caption + 15-30s video script with HOOK/DEMO/CTA beats)

REVIEW SCRIPT TEMPLATE
A neutral-sounding review an affiliate can adapt. 600-900 words covering: what the app does, who it's for, one specific benefit they experienced (placeholder), one honest caveat, who it's NOT for, final verdict, affiliate link placement. Feels like an honest review, not an ad.

TUTORIAL SCRIPT TEMPLATE
A "how to use [app] to [outcome]" tutorial an affiliate can record. Structure: intro (30s), the problem (45s), walkthrough (3-5 min with [SCREEN:] cues), the outcome (30s), CTA + affiliate link (15s). Total ~6 minutes.

COMPARISON CHART TEMPLATE
Structure for a "[this app] vs [competitors]" chart. 6-8 feature rows, 3-4 product columns. Specify which features to highlight, which to downplay, and 3 honest "neither app does this" rows for credibility. Placeholder values.

ONE-PAGER: "WHY PARTNER WITH US"
A partner-facing one-pager affiliates receive on signup. 350-500 words: who the app is for, why it converts, commission rates, payout terms, brand assets available, support contact. Ends with a clear "Get your link" CTA.

VIDEO SCRIPT + THUMBNAIL PROMPTS
Bonus: one 60-second video script for YouTube Shorts / TikTok / Reels affiliates can film themselves. Plus 3 thumbnail text prompts (format: specific copy + visual direction) the affiliate can use to generate thumbnails in their own tool.`,
  },

  performance_report: {
    label: "Performance Report Framework",
    prompt: (app: string) => `Build the performance measurement and optimization framework for this app's affiliate program: ${app}

Return six sections, clearly labeled:

METRICS FRAMEWORK
The specific KPIs to track at three levels: program-level (total revenue from affiliates, % of total revenue, CAC blended, avg commission per sale), per-affiliate (clicks, conversions, conversion rate, AOV, revenue, refund rate, EPC), per-channel (traffic source mix, top posts/videos, geo breakdown). For each KPI: the formula, a healthy benchmark for this app category, and what a red flag looks like.

AFFILIATE TIER DEFINITIONS
Tier bands (Platinum / Gold / Silver / Standard) with the specific thresholds for each (monthly revenue generated, conversion rate, retention), the perks attached to each tier (higher commission %, priority support, early product access, custom creative), and the review cadence. Based on the app category's typical affiliate volume.

AI INSIGHT NARRATIVE TEMPLATE
A template for the monthly AI-generated insight report to send affiliates. Sections: headline (one sentence), what's working (2-3 specific bullets with numbers), what's not (2-3 bullets), next 3 experiments to run. Template with placeholders — the Analytics agent fills in the numbers from GA4 + Stripe data.

PAYOUT SIMULATOR OUTPUT
A sample payout simulation table showing what 5 different affiliate performance scenarios would earn (from 2 sales/mo to 100 sales/mo) over 3, 6, and 12 months. Include commission tiers if relevant. Format as a clean table in markdown.

OPTIMIZATION PLAYBOOK
A tiered playbook of 10 specific moves to improve program performance, sorted from lowest-effort/highest-impact down. For each: the move, when to do it, expected lift, effort score (1-5), and which agent in VibeFlow would handle it (SEO / Social / Paid Ads / etc.).

NEXT BEST ACTIONS
Three specific moves the user should take THIS WEEK based on a typical program state. Make them concrete and actionable — e.g., "Email your top 10 affiliates with the Q2 commission bump announcement using the Email Marketing agent's Broadcast template." One week = three moves, each under 20 min of effort.`,
  },
};

export async function POST(request: Request) {
  try {
    const { prompt, affiliateType, applyBrandKit } = await request.json();
    if (!prompt?.trim() || !affiliateType) return new Response("Prompt and affiliate type required", { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return new Response(JSON.stringify({ error: "Missing API key" }), { status: 500 });

    const supabase = await createClient();
    const admin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    // Fire-and-forget Learning Engine telemetry (respects user's opt-in flag).
    logLearningSignal({
      userId: user.id, agentType: "affiliate",
      contentType: affiliateType ?? null, promptLen: (prompt ?? "").length,
      signalType: "generation_attempted",
    }).catch(() => {});

    const { data: usage } = await supabase
      .from("user_usage")
      .select("searches_remaining, plan, free_affiliate_used")
      .eq("user_id", user.id).single();

    if (!usage) {
      return new Response(JSON.stringify({ error: "no_usage_record", message: "Account not set up." }),
        { status: 500, headers: { "Content-Type": "application/json" } });
    }

    if (usage.plan === "free") {
      if (usage.free_affiliate_used) {
        return new Response(JSON.stringify({
          error: "free_limit",
          agent: "affiliate",
          message: "You've used your free Affiliate Marketing generation. Upgrade to the Launch Kit ($49) for 100 searches across every agent.",
        }), { status: 402, headers: { "Content-Type": "application/json" } });
      }
    } else if (usage.searches_remaining <= 0) {
      return new Response(JSON.stringify({ error: "no_searches", message: "You've used all your searches. Every generation counts as 1 search. Upgrade to Annual ($299 for 1,200 searches) or buy another Launch Kit ($49 for 100) to keep generating." }),
        { status: 402, headers: { "Content-Type": "application/json" } });
    }

    const typeConfig = AFFILIATE_TYPES[affiliateType as keyof typeof AFFILIATE_TYPES];
    if (!typeConfig) return new Response("Invalid affiliate type", { status: 400 });

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
            body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 4000, stream: true, messages: [{ role: "user", content: userPrompt }] }),
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
                    content_type: `affiliate_${affiliateType}`,
                    title: `${typeConfig.label} — ${prompt.slice(0, 60)}${prompt.length > 60 ? "..." : ""}`,
                    brand_kit_applied: applyBrandKit ?? false,
                  }).select().single();
                  if (usage.plan === "free") {
                    await admin.from("user_usage").update({ free_affiliate_used: true }).eq("user_id", user.id);
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
