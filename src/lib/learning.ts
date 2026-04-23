import { createAdminClient } from "@/lib/supabase/admin";
import { createHash } from "crypto";

/**
 * Learning & Improvement Engine — Launch-phase telemetry helper.
 *
 * Called fire-and-forget from every agent route to log anonymized metadata
 * about a generation. Honors the user's `ai_learning_opt_in` flag — if false,
 * silently skips.
 *
 * STRICTLY metadata only. NEVER prompt content, NEVER campaign content,
 * NEVER Brand Kit text. This is enforced by the function signature — there's
 * no field for content. If you find yourself wanting to pass content, stop
 * and reconsider.
 *
 * Phase 1 logs signal_type='generation_attempted'. Phase 2+ will add
 * 'generation_completed', 'rating_positive', 'rating_negative',
 * 'copy_to_composer', 'ga4_click_recorded'.
 */

export type AgentType =
  | "launchpad"
  | "content"
  | "social"
  | "seo"
  | "ppc"
  | "email"
  | "aso"
  | "community"
  | "affiliate";

export type SignalType =
  | "generation_attempted"
  | "generation_completed"
  | "rating_positive"
  | "rating_negative"
  | "copy_to_composer"
  | "ga4_click_recorded";

export type LearningSignal = {
  userId: string;
  agentType: AgentType;
  contentType?: string | null;
  promptLen?: number | null;
  outputLen?: number | null;
  signalType?: SignalType;
};

/**
 * One-way hash of a Brand Kit. Lets Phase-2 clustering group "similar brand
 * kits" without ever seeing the kit itself.
 */
export function hashBrandKit(brandKit: unknown): string | null {
  if (!brandKit) return null;
  try {
    // Stable stringify the relevant fields. We only hash what exists.
    const kit = brandKit as Record<string, unknown>;
    const stable = JSON.stringify({
      app_name: kit.app_name ?? null,
      tagline: kit.tagline ?? null,
      primary_color: kit.primary_color ?? null,
      secondary_color: kit.secondary_color ?? null,
      brand_voice: kit.brand_voice ?? null,
      target_audience: kit.target_audience ?? null,
    });
    return createHash("sha256").update(stable).digest("hex").slice(0, 16);
  } catch {
    return null;
  }
}

/**
 * Fire-and-forget signal logger. Errors are swallowed — this must NEVER
 * break the user's actual generation flow.
 *
 * Callers pattern:
 *   logLearningSignal({ ... }).catch(() => {});
 *
 * The function itself also catches its own errors internally, so the
 * .catch on the call site is belt-and-suspenders.
 */
export async function logLearningSignal(s: LearningSignal): Promise<void> {
  try {
    const admin = createAdminClient();

    // Check opt-in — respect the user's preference
    const { data: usage } = await admin
      .from("user_usage")
      .select("ai_learning_opt_in")
      .eq("user_id", s.userId)
      .single();

    if (!usage?.ai_learning_opt_in) return;

    // Fetch brand kit for hashing (optional — if no kit, hash is null)
    const { data: brandKit } = await admin
      .from("brand_kit")
      .select("app_name, tagline, primary_color, secondary_color, brand_voice, target_audience")
      .eq("user_id", s.userId)
      .maybeSingle();

    const brand_kit_hash = hashBrandKit(brandKit);

    await admin.from("learning_signals").insert({
      user_id: s.userId,
      agent_type: s.agentType,
      content_type: s.contentType ?? null,
      prompt_len: s.promptLen ?? null,
      output_len: s.outputLen ?? null,
      brand_kit_hash,
      signal_type: s.signalType ?? "generation_attempted",
    });
  } catch {
    // Silently swallow. Telemetry MUST NOT break generation.
  }
}
