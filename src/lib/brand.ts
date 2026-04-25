import { createClient } from "@/lib/supabase/server";

export type BrandKit = {
  app_name: string | null;
  tagline: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  brand_voice: string[] | null;
  target_audience: string | null;
  logo_url: string | null;
  website_url: string | null;
  app_store_url: string | null;
  play_store_url: string | null;
};

export async function getBrandKit(): Promise<BrandKit | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("brand_kit")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return data ?? null;
  } catch {
    return null;
  }
}

export function formatBrandKitForPrompt(brand: BrandKit): string {
  const lines: string[] = ["BRAND KIT (apply this to all generated content):"];

  if (brand.app_name) lines.push(`- App Name: ${brand.app_name}`);
  if (brand.tagline) lines.push(`- Tagline: "${brand.tagline}"`);
  if (brand.target_audience) lines.push(`- Target Audience: ${brand.target_audience}`);
  if (brand.brand_voice?.length) lines.push(`- Brand Voice/Tone: ${brand.brand_voice.join(", ")}`);
  if (brand.primary_color) lines.push(`- Primary Color: ${brand.primary_color}`);
  if (brand.secondary_color) lines.push(`- Secondary Color: ${brand.secondary_color}`);

  lines.push("");
  lines.push("Instructions: Use the app name, tone, and audience details throughout all generated content. Match the brand voice exactly. Reference the target audience specifically.");

  return lines.join("\n");
}

export function formatBrandKitForImagePrompt(brand: BrandKit): string {
  const parts: string[] = [];
  if (brand.primary_color) parts.push(`primary brand color ${brand.primary_color}`);
  if (brand.secondary_color) parts.push(`secondary color ${brand.secondary_color}`);
  if (brand.brand_voice?.length) parts.push(`${brand.brand_voice.slice(0, 2).join(" and ")} aesthetic`);
  return parts.length > 0 ? `Brand colors: ${parts.join(", ")}.` : "";
}
