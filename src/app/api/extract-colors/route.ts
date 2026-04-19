import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/extract-colors
 * Body: { logoUrl: string }
 * Returns: { primary: "#RRGGBB", secondary: "#RRGGBB" } or { error }
 *
 * Uses Claude Vision to pick the two most brand-representative colors
 * from the logo — not just the most common pixel, but the colors a
 * human would identify as "the brand."
 */
export async function POST(request: Request) {
  try {
    const { logoUrl } = await request.json();
    if (!logoUrl || typeof logoUrl !== "string") {
      return new Response(JSON.stringify({ error: "logoUrl is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing ANTHROPIC_API_KEY" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Require an auth session so this can't be abused by anonymous callers.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Fetch the logo and re-send to Claude as base64 (Claude Vision supports URL
    // sources but some CDNs block fetches; base64 is the most reliable path).
    const logoRes = await fetch(logoUrl);
    if (!logoRes.ok) {
      return new Response(JSON.stringify({ error: `Could not fetch logo: ${logoRes.status}` }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const contentType = logoRes.headers.get("content-type") || "image/png";
    if (!contentType.startsWith("image/")) {
      return new Response(JSON.stringify({ error: "URL does not point to an image" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const buf = await logoRes.arrayBuffer();
    const b64 = Buffer.from(buf).toString("base64");

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: contentType, data: b64 },
              },
              {
                type: "text",
                text: `Analyze this logo and identify the two most brand-representative colors.
Pick colors a designer would call "the brand palette" — not just the most common pixels.
Ignore pure white and pure black backgrounds. If the logo is monochrome, pick one brand color and a complementary accent.
Respond with ONLY a JSON object in this exact format, no other text:
{"primary":"#RRGGBB","secondary":"#RRGGBB"}`,
              },
            ],
          },
        ],
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      return new Response(JSON.stringify({ error: `Vision call failed: ${claudeRes.status} ${errText}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await claudeRes.json();
    const text = result?.content?.[0]?.text?.trim() ?? "";

    // Extract JSON from the response (Claude should return pure JSON, but guard anyway)
    const match = text.match(/\{[^}]*\}/);
    if (!match) {
      return new Response(JSON.stringify({ error: "Could not parse color response", raw: text }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(match[0]);

    // Validate hex format
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexRegex.test(parsed.primary) || !hexRegex.test(parsed.secondary)) {
      return new Response(JSON.stringify({ error: "Invalid hex values returned", raw: parsed }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      primary: parsed.primary.toUpperCase(),
      secondary: parsed.secondary.toUpperCase(),
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
