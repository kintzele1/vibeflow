import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBrandKit, formatBrandKitForPrompt } from "@/lib/brand";

const SEO_TYPES = {
  keywords: {
    label: "Keyword Research",
    prompt: (app: string) => `Run a comprehensive keyword research pass for this app: ${app}

Return five clearly labeled sections, in this order:

PRIMARY KEYWORDS (5)
High-intent, brand-adjacent terms the app should rank for. Each: keyword, monthly search volume estimate (realistic), difficulty (low/med/high), intent (informational/commercial/transactional).

SEMANTIC / LSI KEYWORDS (10)
Related terms Google expects in topical coverage. Plain list.

AI-SEARCH QUERIES (8)
Natural-language questions real users ask ChatGPT, Perplexity, Claude, and Google AI Overviews about this app's category. Each: the question, plus the exact answer snippet the app's site should surface to win the citation.

LONG-TAIL OPPORTUNITIES (10)
Low-volume, low-competition, high-intent phrases — easier quick wins. Plain list.

CONTENT GAPS
3 specific topics competitors cover that this app should too. Each: the topic, the angle to take, and the primary keyword to target.`,
  },

  on_page: {
    label: "On-Page SEO",
    prompt: (app: string) => `Produce an on-page SEO playbook for the homepage and main landing pages of this app: ${app}

Return six sections, clearly labeled:

TITLE TAG
Exact title tag, under 60 characters, primary keyword in first 30 chars, brand at the end.

META DESCRIPTION
Exact meta description, 150-160 characters, includes keyword and clear CTA.

H1
Exact H1 copy. Must be different from the title tag.

H2 STRUCTURE
5-7 H2 section headings in the right order for a high-converting landing page.

INTERNAL LINKING
5 specific anchor-text + target-page pairs the homepage should link to, with brief reasoning.

IMAGE ALT TEXT PATTERN
3 example alt-text strings and the convention/pattern to follow for all future images.`,
  },

  technical: {
    label: "Technical SEO",
    prompt: (app: string) => `Write a technical SEO audit and setup checklist for this app: ${app}

Return six sections, clearly labeled:

SCHEMA MARKUP
Exact JSON-LD Organization + SoftwareApplication + BreadcrumbList snippets ready to paste into the <head>. Use realistic placeholder URLs.

SITEMAP STRUCTURE
The exact URL tree to include in sitemap.xml — which pages, priority values, change frequency.

ROBOTS.TXT
Full robots.txt contents, including sitemap reference and any paths to disallow.

CANONICAL STRATEGY
How canonicals should be set: default rule, edge cases for pricing/feature pages, pagination handling.

CORE WEB VITALS
Top 5 likely issues for a Next.js marketing site + the specific fix for each (LCP/CLS/INP).

INDEXING CHECKLIST
8-item checklist to verify after launch (GSC submission, coverage, noindex audit, etc.).`,
  },

  briefs: {
    label: "Content Brief",
    prompt: (app: string) => `Write a complete content brief for ONE high-priority SEO article for this app: ${app}

Pick the single best article topic based on search intent and the app's category. Return the brief in this exact structure:

ARTICLE TOPIC
The title of the article.

TARGET KEYWORD
Primary keyword + 3 secondary keywords.

SEARCH INTENT
One sentence on what the searcher actually wants.

TARGET WORD COUNT
Number + justification.

H2 / H3 OUTLINE
Full heading structure, in order.

KEY POINTS PER SECTION
2-3 bullets under each H2 covering what the writer must address.

INTERNAL LINK TARGETS
3-5 internal pages to link to with suggested anchor text.

EXTERNAL LINK TARGETS
2-3 authoritative external sources with suggested anchor text.

META TAGS
Exact title tag + meta description.

CTA
Exact CTA copy and the action the reader should take.`,
  },

  backlinks: {
    label: "Backlink Outreach",
    prompt: (app: string) => `Generate a concrete backlink outreach plan for this app: ${app}

Return three sections, clearly labeled:

TARGET SITES (10)
For each: site name, why it's a good fit (audience/authority), the specific page/post to target, and the outreach angle (guest post / resource link / product roundup / tool mention / podcast).

OUTREACH EMAIL TEMPLATES
Three ready-to-send email templates (short, personal, builder-to-builder tone): (1) cold guest post pitch, (2) resource page link request, (3) podcast pitch. Subject lines included.

QUICK WINS
5 backlink opportunities the user can get THIS WEEK with minimal effort (directories, Product Hunt category pages, community roundups, Reddit mentions, forum signatures). Each: the target URL or community, and the exact action to take.`,
  },
};

export async function POST(request: Request) {
  try {
    const { prompt, seoType, applyBrandKit } = await request.json();
    if (!prompt?.trim() || !seoType) return new Response("Prompt and SEO type required", { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return new Response(JSON.stringify({ error: "Missing API key" }), { status: 500 });

    const supabase = await createClient();
    const admin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { data: usage } = await supabase
      .from("user_usage")
      .select("searches_remaining, plan, free_seo_used")
      .eq("user_id", user.id).single();

    if (!usage) {
      return new Response(JSON.stringify({ error: "no_usage_record", message: "Account not set up." }),
        { status: 500, headers: { "Content-Type": "application/json" } });
    }

    if (usage.plan === "free") {
      if (usage.free_seo_used) {
        return new Response(JSON.stringify({
          error: "free_limit",
          agent: "seo",
          message: "You've used your free SEO generation. Upgrade to the Launch Kit ($49) for 100 searches across every agent.",
        }), { status: 402, headers: { "Content-Type": "application/json" } });
      }
    } else if (usage.searches_remaining <= 0) {
      return new Response(JSON.stringify({ error: "no_searches", message: "No searches remaining." }),
        { status: 402, headers: { "Content-Type": "application/json" } });
    }

    const typeConfig = SEO_TYPES[seoType as keyof typeof SEO_TYPES];
    if (!typeConfig) return new Response("Invalid SEO type", { status: 400 });

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
                    content_type: `seo_${seoType}`,
                    title: `${typeConfig.label} — ${prompt.slice(0, 60)}${prompt.length > 60 ? "..." : ""}`,
                    brand_kit_applied: applyBrandKit ?? false,
                  }).select().single();
                  if (usage.plan === "free") {
                    await admin.from("user_usage").update({ free_seo_used: true }).eq("user_id", user.id);
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
