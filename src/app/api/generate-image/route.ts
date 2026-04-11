import { createClient } from "@/lib/supabase/server";

const IMAGE_TYPES = {
  social_post: {
    label: "Social Post Image",
    size: "square_hd",
    promptTemplate: (app: string, style: string) =>
      `${style} abstract digital artwork for a tech startup social media post. The app is about: ${app}. Teal (#05AD98) and white color palette. Soft geometric shapes, flowing gradients, clean composition. NO TEXT, NO WORDS, NO LETTERS, NO LOGOS anywhere in the image. Pure visual, no typography.`,
  },
  og_image: {
    label: "OG / Banner Image",
    size: "landscape_4_3",
    promptTemplate: (app: string, style: string) =>
      `${style} wide-format abstract banner artwork for a SaaS product about: ${app}. Teal and dark navy color palette. Geometric shapes, subtle gradients, professional tech aesthetic. Horizontal composition. NO TEXT, NO WORDS, NO LETTERS, NO LOGOS. Pure abstract visual only.`,
  },
  thumbnail: {
    label: "YouTube Thumbnail",
    size: "landscape_16_9",
    promptTemplate: (app: string, style: string) =>
      `${style} bold eye-catching YouTube thumbnail background for a tech video about: ${app}. High contrast, vibrant teal and dark colors. Dynamic diagonal composition, glowing elements. 16:9 widescreen. NO TEXT, NO WORDS, NO LETTERS anywhere. Pure visual background only.`,
  },
  hero_image: {
    label: "Hero / Landing Page",
    size: "landscape_4_3",
    promptTemplate: (app: string, style: string) =>
      `${style} abstract hero artwork for a startup landing page about: ${app}. Soft teal gradient background with floating geometric shapes, light particles, clean minimal atmosphere. Professional and calming. NO TEXT, NO WORDS, NO LETTERS, NO UI ELEMENTS. Pure abstract background.`,
  },
  product_mockup: {
    label: "Product Mockup",
    size: "square_hd",
    promptTemplate: (app: string, style: string) =>
      `${style} clean minimal product visualization for a mobile app about: ${app}. Floating smartphone silhouette with teal glow on white background. Soft shadows, professional product photography style. NO TEXT, NO WORDS, NO LETTERS on screen or anywhere. Pure visual mockup.`,
  },
  meme: {
    label: "Meme / Viral Image",
    size: "square_hd",
    promptTemplate: (app: string, style: string) =>
      `${style} funny relatable illustration showing the frustration of NOT having an app like: ${app}. Simple bold style, expressive character or visual metaphor. Bright colors, shareable. NO TEXT, NO WORDS, NO LETTERS. Pure visual storytelling only.`,
  },
};

const STYLES = [
  "minimalist and clean",
  "bold and vibrant",
  "dark and moody",
  "soft and pastel",
  "3D rendered",
  "flat illustration",
  "photorealistic",
  "abstract geometric",
];

export async function POST(request: Request) {
  try {
    const { prompt, imageType, style, count = 4 } = await request.json();

    if (!prompt?.trim() || !imageType) {
      return new Response("Prompt and image type required", { status: 400 });
    }

    const apiKey = process.env.FAL_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing FAL_API_KEY" }), {
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

    const typeConfig = IMAGE_TYPES[imageType as keyof typeof IMAGE_TYPES];
    if (!typeConfig) return new Response("Invalid image type", { status: 400 });

    const selectedStyle = style ?? STYLES[0];
    const imagePrompt = typeConfig.promptTemplate(prompt, selectedStyle);

    // Call fal.ai API directly
    const falRes = await fetch("https://fal.run/fal-ai/flux/dev", {
      method: "POST",
      headers: {
        "Authorization": `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
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
      console.error("FAL error:", falRes.status, errText);
      return new Response(
        JSON.stringify({ error: `Image generation failed: ${falRes.status}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await falRes.json();
    const images = result.images ?? [];

    // Deduct one search
    await supabase
      .from("user_usage")
      .update({ searches_remaining: usage.searches_remaining - 1 })
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify({
        images: images.map((img: any) => ({
          url: img.url,
          width: img.width,
          height: img.height,
        })),
        prompt: imagePrompt,
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("Generate image error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
}
