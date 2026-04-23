import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBrandKit, formatBrandKitForPrompt } from "@/lib/brand";

const EMAIL_TYPES = {
  welcome: {
    label: "Welcome Sequence",
    prompt: (app: string) => `Write a complete 3-email welcome sequence for this app: ${app}

Return three emails, each in this exact structure:

EMAIL 1 — Immediate (sent on signup)
SUBJECT:
PREVIEW TEXT:
BODY:
CTA BUTTON COPY:
P.S. LINE:

EMAIL 2 — Day 2
SUBJECT:
PREVIEW TEXT:
BODY:
CTA BUTTON COPY:

EMAIL 3 — Day 5
SUBJECT:
PREVIEW TEXT:
BODY:
CTA BUTTON COPY:

Guidelines: Email 1 sets expectations + one quick-win action. Email 2 reinforces value with a small milestone or tip. Email 3 prompts a specific deeper engagement. Subjects under 50 chars, preview text under 90 chars, body under 200 words per email. Human tone, not corporate.`,
  },

  onboarding: {
    label: "Onboarding Sequence",
    prompt: (app: string) => `Write a 7-day onboarding email sequence for this app: ${app}

Return seven emails, each in this structure:

DAY 1 — Welcome + first quick win
DAY 2 — Core feature introduction
DAY 3 — Second core feature + template/example
DAY 4 — Social proof / case study
DAY 5 — Power user tip / advanced feature
DAY 6 — Address common objection or FAQ
DAY 7 — Upgrade prompt or deeper engagement CTA

For each day: SUBJECT / PREVIEW TEXT / BODY / CTA BUTTON COPY. Subjects under 50 chars, preview under 90 chars, body 150-200 words each. Include a progression — users who follow along reach a specific outcome by Day 7. Specify that outcome at the top of the sequence.`,
  },

  upsell: {
    label: "Upsell Sequence",
    prompt: (app: string) => `Write a 5-email upsell sequence that converts free users to paid for this app: ${app}

Return the sequence labeled:

TRIGGER + TIMING
When this sequence fires (e.g. "free user hits 80% of limit", "day 14 of free trial", "completes 3 actions but hasn't upgraded"). State the trigger + delay between emails.

EMAIL 1 — Celebrate the progress they've already made
EMAIL 2 — Show them what they're missing (specific paid-only capability)
EMAIL 3 — Social proof — users who upgraded got [specific outcome]
EMAIL 4 — Limited-time offer or special incentive
EMAIL 5 — Last chance before downgrade / trial ends

For each email: SUBJECT / PREVIEW TEXT / BODY / CTA BUTTON COPY. Include 1-2 objection-handling lines per email (price, learning curve, timing). Don't be pushy — frame as genuine value, not manipulation.`,
  },

  reengagement: {
    label: "Re-engagement Sequence",
    prompt: (app: string) => `Write a 3-email win-back sequence for lapsed users of this app: ${app}

Return three emails targeting users who haven't logged in for 30+ days.

EMAIL 1 — Day 30 since last login: "We miss you" — lead with empathy, remind of their past progress, single click back-in CTA.
EMAIL 2 — Day 60 since last login: "Here's what's new" — announce 2-3 specific updates shipped since they left that directly address common reasons users churn in this category.
EMAIL 3 — Day 90 since last login: "Keep or delete" — explicit "we'll stop emailing unless you click here" boundary. Friendly tone.

For each email: SUBJECT / PREVIEW TEXT / BODY / CTA BUTTON COPY. Avoid guilt trips. Subjects under 45 chars. Body under 150 words each.`,
  },

  broadcast: {
    label: "Broadcast Email",
    prompt: (app: string) => `Write a single high-conversion broadcast email for this app: ${app}

Return the email in this exact structure:

EMAIL TYPE
Pick the most appropriate: Launch announcement, Milestone ("we just shipped X"), Product update, Newsletter, Special offer, Event invite. State the type at the top.

SUBJECT LINE (3 variants)
Three subject-line A/B options, each under 50 characters.

PREVIEW TEXT
Under 90 characters, complements (doesn't repeat) the subject line.

BODY
Full email body, 200-350 words. Structure: hook → context → what's new → why it matters to them → CTA. Conversational, human.

PRIMARY CTA
The single most important action.

SECONDARY CTA (optional)
A lighter-touch action for readers who aren't ready for the primary CTA.

P.S. LINE
One postscript — this is statistically the second-most-read part of an email. Make it count.`,
  },
};

export async function POST(request: Request) {
  try {
    const { prompt, emailType, applyBrandKit } = await request.json();
    if (!prompt?.trim() || !emailType) return new Response("Prompt and email type required", { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return new Response(JSON.stringify({ error: "Missing API key" }), { status: 500 });

    const supabase = await createClient();
    const admin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { data: usage } = await supabase
      .from("user_usage")
      .select("searches_remaining, plan, free_email_used")
      .eq("user_id", user.id).single();

    if (!usage) {
      return new Response(JSON.stringify({ error: "no_usage_record", message: "Account not set up." }),
        { status: 500, headers: { "Content-Type": "application/json" } });
    }

    if (usage.plan === "free") {
      if (usage.free_email_used) {
        return new Response(JSON.stringify({
          error: "free_limit",
          agent: "email",
          message: "You've used your free Email Marketing generation. Upgrade to the Launch Kit ($49) for 100 searches across every agent.",
        }), { status: 402, headers: { "Content-Type": "application/json" } });
      }
    } else if (usage.searches_remaining <= 0) {
      return new Response(JSON.stringify({ error: "no_searches", message: "You've used all your searches. Every generation counts as 1 search. Upgrade to Annual ($299 for 1,200 searches) or buy another Launch Kit ($49 for 100) to keep generating." }),
        { status: 402, headers: { "Content-Type": "application/json" } });
    }

    const typeConfig = EMAIL_TYPES[emailType as keyof typeof EMAIL_TYPES];
    if (!typeConfig) return new Response("Invalid email type", { status: 400 });

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
                    content_type: `email_${emailType}`,
                    title: `${typeConfig.label} — ${prompt.slice(0, 60)}${prompt.length > 60 ? "..." : ""}`,
                    brand_kit_applied: applyBrandKit ?? false,
                  }).select().single();
                  if (usage.plan === "free") {
                    await admin.from("user_usage").update({ free_email_used: true }).eq("user_id", user.id);
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
