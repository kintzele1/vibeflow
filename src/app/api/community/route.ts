import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBrandKit, formatBrandKitForPrompt } from "@/lib/brand";

const COMMUNITY_TYPES = {
  product_hunt: {
    label: "Product Hunt Launch Kit",
    prompt: (app: string) => `Write a complete Product Hunt launch kit for this app: ${app}

Return eight sections, clearly labeled:

TAGLINE (3 options)
Three taglines, each exactly 60 characters or fewer. This is the single line shown next to the product name on the PH feed. Punchy, curious-making, category-clear.

DESCRIPTION
Exactly 260 characters or fewer. Appears below the tagline. Lead with the specific problem, land on the specific promise. Include one concrete proof point if possible.

FIRST COMMENT (maker's story)
250-400 words from the maker's perspective. Structure: why you built it, the painful moment that made you start, what's inside today, what's coming, explicit ask for feedback. No humble brag, no list of features.

FEATURE IMAGES / GALLERY BRIEF
Shot list for 5-6 gallery images. For each: what it shows, the one-line caption overlay, and why it's included (what viewer takeaway). Cover hero → feature 1 → feature 2 → social proof → pricing → CTA.

HUNTER OUTREACH
Three real (currently active) hunters to approach + the one-line personalized pitch for each. Specify hunters who launch in this category. Include a plain template pitch you can adapt.

UPVOTE MOBILIZATION
24-hour plan to activate supporters: pre-launch day-of-week recommendation (usually Tuesday-Thursday), hour-by-hour checklist for launch day, personal-network pre-alert template, Twitter/LinkedIn launch-day posts, Slack/Discord community posts.

ENGAGEMENT PLAYBOOK
How to respond to the first 10 comments (templates for "cool idea", "how does this compare to X?", "does it do Y?"), how to handle negative feedback gracefully, when to post the maker update.

METRICS TO WATCH
Five real numbers to track during launch (upvotes/hr, commenter-to-upvoter ratio, website referral from PH, signups from PH traffic, quality of early user feedback) + the thresholds that define "this went well."`,
  },

  influencer_outreach: {
    label: "Influencer Outreach",
    prompt: (app: string) => `Build a concrete influencer outreach plan for this app: ${app}

Return four sections, clearly labeled:

TARGET CREATORS (10)
For each: real creator type + follower range + platform + specific angle why this app fits their audience + content format you'd pitch (review / integration / sponsored thread / tutorial). Aim for a mix: 3 micro-creators (5-50k), 4 mid-tier (50-250k), 2 macro (250k+), 1 wildcard outside the obvious category. Include rough pay expectations per tier.

OUTREACH TEMPLATES (3)
Three ready-to-send email/DM templates with subject lines: (1) cold, no relationship, asking for paid review; (2) warm, engaged-with-their-content, asking for honest try-it; (3) product-seeding, free access in exchange for optional coverage. Each under 150 words. Personalized, not spammy.

FOLLOW-UP SEQUENCE
If no response: when to follow up (day 4 + day 10), what to say differently each time, when to let it drop. Exact copy for each follow-up.

TRACKING + ATTRIBUTION
How to track which creator drove which signups (utm_* params by creator, promo codes, dedicated landing pages). Include a short playbook for measuring ROI after the campaign.`,
  },

  reddit_discord: {
    label: "Reddit + Discord Strategy",
    prompt: (app: string) => `Write a Reddit + Discord community launch strategy for this app: ${app}

Return five sections, clearly labeled:

TARGET SUBREDDITS (6)
Six specific subreddits ranked by fit. For each: subreddit, subscriber count, self-promo rules (flair required? days since post? karma threshold?), the angle that works for this community, and a warning if the community is known to be hostile to launches.

TARGET DISCORD SERVERS (4)
Four specific Discord communities (indie hacker / builder / category-specific). For each: how to find + get accepted, the #introduce-yourself norms, and the one channel where a thoughtful launch post is welcome.

READY-TO-POST CONTENT (5)
Five full posts ready to ship: (1) r/SideProject builder story, (2) r/IndieHackers Show IH style, (3) category-specific subreddit value-first post, (4) Discord introduction that doesn't feel like an ad, (5) a follow-up "here's what I learned" post for a week after launch. Each 150-300 words, authentic founder voice, zero marketing speak.

ENGAGEMENT RULES
The five things that will get the post removed (and you shadowbanned): excessive self-promo ratio, posting in off-topic subs, pretending to be a user, copy-paste across subs on the same day, asking for upvotes. With the fix for each.

LONG-GAME COMMUNITY BUILDING
What to do weeks 2-8 after launch to stay present without being spammy. 5 concrete rituals (e.g., "share weekly build update in r/SideProject", "answer 3 questions per week in the category sub", "post monthly metrics transparency").`,
  },

  pr_pitch: {
    label: "PR Pitch Package",
    prompt: (app: string) => `Write a complete PR pitch package for this app: ${app}

Return five sections, clearly labeled:

STORY ANGLE
One specific angle to pitch — the "why now + why this matters" narrative. Not a feature list. Good angles: "indie devs are X", "the tool gap for Y", "what we learned building in public with AI". One paragraph.

TARGET JOURNALISTS (5)
Five real journalists or publications to target. For each: publication, journalist name (use placeholder if unsure but specify the beat), why they specifically would care about this story, and a one-line personalized hook.

PITCH EMAIL TEMPLATES (2)
Two versions of the pitch email: (1) cold pitch, subject + body, under 200 words, quote-ready sentences embedded; (2) warm pitch if there's any prior interaction. Include 2-3 subject line options per version.

PRESS KIT CHECKLIST
Exact list of what should live at /press: one-line description, long description, founder bio + photo, product screenshots (specify 5-6 needed), logo in 3 formats, suggested quotes from the founder, contact email, fact sheet with specific numbers. Explicit so the user can build the page.

FOLLOW-UP + AMPLIFICATION
When to follow up (day 5 + day 12), how to respond if they ask for exclusivity, how to amplify a published piece (X thread, LinkedIn, newsletter, personal network), how to handle no coverage gracefully.`,
  },

  launch_x_thread: {
    label: "Launch X Thread",
    prompt: (app: string) => `Write a complete 15-post launch thread for X (Twitter) for this app: ${app}

Return the plan in this structure:

TIMING RECOMMENDATION
Best day + time to post based on typical category engagement. One paragraph on why.

THE 15 POSTS
Fifteen posts in sequence. Each under 280 characters, labeled 1/15 through 15/15. Arc:

- 1/15: Hook. No "Introducing". Make them curious.
- 2/15-3/15: The problem, emotionally specific.
- 4/15-6/15: The solution, shown in the product, with demo/screenshot cue ([VISUAL: ...]).
- 7/15-9/15: The three most compelling features. One per post.
- 10/15: Social proof or founder moment — specific, not generic.
- 11/15-12/15: Who it's for + who it's not for. The not-for is critical; it earns trust.
- 13/15: Pricing transparency.
- 14/15: The CTA — link to the product + free-tier invitation.
- 15/15: Quote-tweet-bait line that asks for help amplifying ("if this could help a friend, I'd love a share").

Each post must end with a reason to read the next. Number posts with format like 1/15 at the end.

ENGAGEMENT PLAN
The first 60 minutes after posting: what to do on each reply, how many proactive QTs + replies to make, what signals to watch for. Explicit, not vibes.

AMPLIFICATION ASSETS
3 pull-quote graphics to prepare in advance — the specific sentence from the thread + brief visual direction for each. These get DMd to supporters pre-launch for easy retweets.`,
  },
};

export async function POST(request: Request) {
  try {
    const { prompt, communityType, applyBrandKit } = await request.json();
    if (!prompt?.trim() || !communityType) return new Response("Prompt and community type required", { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return new Response(JSON.stringify({ error: "Missing API key" }), { status: 500 });

    const supabase = await createClient();
    const admin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { data: usage } = await supabase
      .from("user_usage")
      .select("searches_remaining, plan, free_community_used")
      .eq("user_id", user.id).single();

    if (!usage) {
      return new Response(JSON.stringify({ error: "no_usage_record", message: "Account not set up." }),
        { status: 500, headers: { "Content-Type": "application/json" } });
    }

    if (usage.plan === "free") {
      if (usage.free_community_used) {
        return new Response(JSON.stringify({
          error: "free_limit",
          agent: "community",
          message: "You've used your free Community & Launch generation. Upgrade to the Launch Kit ($49) for 100 searches across every agent.",
        }), { status: 402, headers: { "Content-Type": "application/json" } });
      }
    } else if (usage.searches_remaining <= 0) {
      return new Response(JSON.stringify({ error: "no_searches", message: "No searches remaining." }),
        { status: 402, headers: { "Content-Type": "application/json" } });
    }

    const typeConfig = COMMUNITY_TYPES[communityType as keyof typeof COMMUNITY_TYPES];
    if (!typeConfig) return new Response("Invalid community type", { status: 400 });

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
                    content_type: `community_${communityType}`,
                    title: `${typeConfig.label} — ${prompt.slice(0, 60)}${prompt.length > 60 ? "..." : ""}`,
                    brand_kit_applied: applyBrandKit ?? false,
                  }).select().single();
                  if (usage.plan === "free") {
                    await admin.from("user_usage").update({ free_community_used: true }).eq("user_id", user.id);
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
