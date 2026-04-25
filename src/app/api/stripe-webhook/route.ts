import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

const PLAN_SEARCHES: Record<string, number> = {
  launch: 100,
  annual: 1200,
};

// Stripe SDK instance for signature verification. Initialized once at module
// load — STRIPE_SECRET_KEY must be set in production env.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const sig = request.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Verify the Stripe signature. Without this, anyone could POST a fake
    // checkout.session.completed event and grant themselves searches/upgrade.
    // constructEvent throws if the body doesn't match the signature → 400.
    if (!webhookSecret || webhookSecret === "whsec_placeholder") {
      console.error("Stripe webhook called but STRIPE_WEBHOOK_SECRET is not configured");
      return new Response("Webhook secret not configured", { status: 500 });
    }
    if (!sig) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
      console.error("Stripe webhook signature verification failed:", err.message);
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
    }

    // Stripe has no user session — use service-role client so the upsert bypasses RLS.
    const supabase = createAdminClient();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const plan = session.metadata?.plan ?? "launch";

      if (!userId) {
        console.log("No user_id in metadata — skipping usage update");
        return new Response("OK", { status: 200 });
      }

      const searches = PLAN_SEARCHES[plan] ?? 100;

      // Upsert user usage
      const { error } = await supabase
        .from("user_usage")
        .upsert({
          user_id: userId,
          plan,
          searches_remaining: searches,
          searches_total: searches,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (error) {
        console.error("Supabase upsert error:", error);
        return new Response("DB error", { status: 500 });
      }

      console.log(`✓ Updated usage for user ${userId}: plan=${plan}, searches=${searches}`);
    }

    if (event.type === "invoice.payment_succeeded") {
      // Handle annual renewal — reset searches
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer;

      // Look up user by stripe customer ID if stored
      // For now log — we'll wire this at deploy
      console.log("Invoice paid for customer:", customerId);
    }

    return new Response("OK", { status: 200 });

  } catch (err: any) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
}
