import { createClient } from "@/lib/supabase/server";

const PLAN_SEARCHES: Record<string, number> = {
  launch: 100,
  annual: 1200,
};

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const sig = request.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Skip signature verification in development if placeholder
    let event: any;
    if (webhookSecret && webhookSecret !== "whsec_placeholder") {
      // In production, verify the signature
      // For now parse directly — we'll add verification at deploy
      event = JSON.parse(body);
    } else {
      event = JSON.parse(body);
    }

    const supabase = await createClient();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
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
      const invoice = event.data.object;
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
