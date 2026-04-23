import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBrandKit, formatBrandKitForImagePrompt } from "@/lib/brand";

const IMAGE_TYPES = {
  social_post:    { label: "Social Post",       size: "square_hd",      template: (app: string, style: string, brand: string) => `${style} abstract digital artwork for a tech startup social media post. The app is about: ${app}. ${brand} Soft geometric shapes, flowing gradients, clean composition. NO TEXT, NO WORDS, NO LETTERS, NO LOGOS anywhere. Pure visual only.` },
  og_image:       { label: "OG / Banner",       size: "landscape_4_3",  template: (app: string, style: string, brand: string) => `${style} wide-format abstract banner for a SaaS product about: ${app}. ${brand} Geometric shapes, subtle gradients, professional tech aesthetic. NO TEXT, NO WORDS, NO LETTERS. Pure abstract visual.` },
  thumbnail:      { label: "YouTube Thumbnail", size: "landscape_16_9", template: (app: string, style: string, brand: string) => `${style} bold YouTube thumbnail background for a tech video about: ${app}. ${brand} High contrast, dynamic diagonal composition, glowing elements. 16:9. NO TEXT, NO WORDS, NO LETTERS. Pure visual background.` },
  hero_image:     { label: "Hero Image",        size: "landscape_4_3",  template: (app: string, style: string, brand: string) => `${style} abstract hero artwork for a startup landing page about: ${app}. ${brand} Floating geometric shapes, light particles, clean minimal atmosphere. NO TEXT, NO WORDS, NO LETTERS, NO UI ELEMENTS. Pure abstract background.` },
  product_mockup: { label: "Product Mockup",    size: "square_hd",      template: (app: string, style: string, brand: string) => `${style} clean minimal product visualization for a mobile app about: ${app}. ${brand} Floating smartphone silhouette with glow on white background. Soft shadows, professional photography style. NO TEXT, NO WORDS, NO LETTERS on screen. Pure visual mockup.` },
  meme:           { label: "Meme / Viral",      size: "square_hd",      template: (app: string, style: string, brand: string) => `${style} funny relatable illustration showing frustration of NOT having an app like: ${app}. ${brand} Simple bold style, expressive character or visual metaphor. NO TEXT, NO WORDS, NO LETTERS. Pure visual storytelling.` },
};

export async function POST(request: Request) {
  try {
    const { prompt, imageType, style, count = 4, applyBrandKit } = await request.json();
    if (!prompt?.trim() || !imageType) return new Response("Prompt and image type required", { status: 400 });

    const apiKey = process.env.FAL_API_KEY;
    if (!apiKey) return new Response(JSON.stringify({ error: "Missing FAL_API_KEY" }), { status: 500 });

    const supabase = await createClient();
    const admin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { data: usage } = await supabase
      .from("user_usage").select("searches_remaining").eq("user_id", user.id).single();
    if (!usage || usage.searches_remaining <= 0) {
      return new Response(JSON.stringify({ error: "no_searches", message: "You've used all your searches. Every generation counts as 1 search. Upgrade to Annual ($299 for 1,200 searches) or buy another Launch Kit ($49 for 100) to keep generating." }),
        { status: 402, headers: { "Content-Type": "application/json" } });
    }

    const typeConfig = IMAGE_TYPES[imageType as keyof typeof IMAGE_TYPES];
    if (!typeConfig) return new Response("Invalid image type", { status: 400 });

    // Fetch brand kit colors for image prompt
    let brandString = "";
    if (applyBrandKit) {
      const brand = await getBrandKit();
      if (brand) brandString = formatBrandKitForImagePrompt(brand);
    }

    const selectedStyle = style ?? "minimalist and clean";
    const imagePrompt = typeConfig.template(prompt, selectedStyle, brandString);

    const falRes = await fetch("https://fal.run/fal-ai/flux/dev", {
      method: "POST",
      headers: { "Authorization": `Key ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: imagePrompt,
        image_size: typeConfig.size,
        num_images: Math.min(count, 4),
        num_inference_steps: 28,
        enable_safety_checker: true,
      }),
    });

    if (!falRes.ok) {
      const errText = await falRes.text();
      return new Response(JSON.stringify({ error: `Image generation failed: ${falRes.status} ${errText}` }),
        { status: 500, headers: { "Content-Type": "application/json" } });
    }

    const result = await falRes.json();
    const images = result.images ?? [];

    await admin.from("user_usage")
      .update({ searches_remaining: usage.searches_remaining - 1 }).eq("user_id", user.id);

    return new Response(JSON.stringify({ images: images.map((img: any) => ({ url: img.url, width: img.width, height: img.height })) }),
      { headers: { "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
