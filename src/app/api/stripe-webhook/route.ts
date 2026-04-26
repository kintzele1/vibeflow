import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Stripe webhook handler — idempotent, signature-verified, atomic.
 *
 * Two events are handled:
 *   1. checkout.session.completed   — initial purchase (Launch Kit or Annual)
 *   2. invoice.payment_succeeded    — annual renewal (recurring)
 *
 * Idempotency: every successful event.id is recorded in stripe_webhook_events
 * via a Postgres function (process_stripe_event) that does the dedup INSERT
 * and the searches grant in a single transaction. Stripe retries (network
 * blips, slow responses, redrives from the dashboard) are safely no-ops.
 *
 * Search increment: add_searches() ADDS to remaining/total instead of
 * overwriting. Stacking purchases work correctly (buy two Launch Kits = 200
 * searches, not 100). Renewals add to whatever remaining count the user had.
 */

const PLAN_SEARCHES: Record<string, number> = {
  launch: 100,
  annual: 1200,
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const sig = request.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret || webhookSecret === "whsec_placeholder") {
      console.error("Stripe webhook called but STRIPE_WEBHOOK_SECRET is not configured");
      return new Response("Webhook secret not configured", { status: 500 });
    }
    if (!sig) return new Response("Missing stripe-signature header", { status: 400 });

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      console.error("Stripe webhook signature verification failed:", err.message);
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
    }

    const supabase = createAdminClient();

    // ─────────────────────────────────────────────────────────────────────
    // Initial purchase — one-time Launch Kit OR first-month Annual
    // ─────────────────────────────────────────────────────────────────────
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const plan = session.metadata?.plan ?? "launch";
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;

      if (!userId) {
        // Pay-before-account flow leftover — log + ack so Stripe stops retrying.
        // The user will get their searches when they create their account
        // and a manual reconciliation script runs.
        console.warn(`No user_id in checkout.session.completed metadata (event ${event.id})`);
        return new Response("OK (no user_id)", { status: 200 });
      }

      const searches = PLAN_SEARCHES[plan] ?? 100;

      const { data: result, error } = await supabase.rpc("process_stripe_event", {
        p_event_id: event.id,
        p_event_type: event.type,
        p_user_id: userId,
        p_searches: searches,
        p_plan: plan,
        p_stripe_customer_id: customerId,
      });

      if (error) {
        console.error("process_stripe_event RPC error:", error);
        // Return 500 so Stripe retries.
        return new Response("DB error", { status: 500 });
      }

      console.log(`✓ checkout.session.completed for user ${userId}: status=${result}, plan=${plan}, +${searches} searches`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Annual renewal — recurring subscription invoice
    // ─────────────────────────────────────────────────────────────────────
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id ?? null;
      // billing_reason = "subscription_create" fires once at first subscription
      // creation alongside checkout.session.completed — skip it to avoid double-grant.
      // We only want "subscription_cycle" (renewals).
      const billingReason = (invoice as any).billing_reason as string | undefined;

      if (billingReason === "subscription_create") {
        console.log(`Skipping invoice.payment_succeeded with billing_reason=subscription_create (event ${event.id}) — already handled by checkout.session.completed`);
        return new Response("OK (initial — handled elsewhere)", { status: 200 });
      }

      if (!customerId) {
        console.warn(`No customer_id on invoice.payment_succeeded (event ${event.id})`);
        return new Response("OK (no customer_id)", { status: 200 });
      }

      // Look up the user by their Stripe customer_id (set on first checkout).
      const { data: userId, error: lookupError } = await supabase.rpc("find_user_by_stripe_customer", {
        p_customer_id: customerId,
      });

      if (lookupError) {
        console.error("find_user_by_stripe_customer RPC error:", lookupError);
        return new Response("DB error", { status: 500 });
      }

      if (!userId) {
        // Customer exists in Stripe but we have no record. Log + ack so Stripe
        // doesn't retry. Likely needs manual reconciliation.
        console.warn(`invoice.payment_succeeded for unknown stripe customer ${customerId} (event ${event.id})`);
        return new Response("OK (unknown customer)", { status: 200 });
      }

      const searches = PLAN_SEARCHES.annual;

      const { data: result, error } = await supabase.rpc("process_stripe_event", {
        p_event_id: event.id,
        p_event_type: event.type,
        p_user_id: userId,
        p_searches: searches,
        p_plan: "annual",
        p_stripe_customer_id: customerId,
      });

      if (error) {
        console.error("process_stripe_event RPC error (renewal):", error);
        return new Response("DB error", { status: 500 });
      }

      console.log(`✓ invoice.payment_succeeded renewal for user ${userId}: status=${result}, +${searches} searches`);
    }

    return new Response("OK", { status: 200 });

  } catch (err: any) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
}
