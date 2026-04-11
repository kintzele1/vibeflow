import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { plan } = await request.json();

    const priceId = plan === "annual"
      ? process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID
      : process.env.NEXT_PUBLIC_STRIPE_LAUNCH_PRICE_ID;

    if (!priceId) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const stripeBody: Record<string, any> = {
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: plan === "annual" ? "subscription" : "payment",
      success_url: `${appUrl}/dashboard?success=true`,
      cancel_url: `${appUrl}/#pricing`,
      allow_promotion_codes: true,
    };

    // Attach customer email if logged in
    if (user?.email) {
      stripeBody.customer_email = user.email;
      stripeBody.metadata = { user_id: user.id, plan };
    } else {
      stripeBody.metadata = { plan };
    }

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(flattenObject(stripeBody)).toString(),
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error("Stripe error:", session);
      return new Response(JSON.stringify({ error: session.error?.message ?? "Stripe error" }), {
        status: 400, headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
}

// Flatten nested object for Stripe's form-encoded API
function flattenObject(obj: Record<string, any>, prefix = ""): Record<string, string> {
  return Object.keys(obj).reduce((acc: Record<string, string>, key) => {
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    const val = obj[key];
    if (typeof val === "object" && !Array.isArray(val) && val !== null) {
      Object.assign(acc, flattenObject(val, fullKey));
    } else if (Array.isArray(val)) {
      val.forEach((item, idx) => {
        if (typeof item === "object") {
          Object.assign(acc, flattenObject(item, `${fullKey}[${idx}]`));
        } else {
          acc[`${fullKey}[${idx}]`] = String(item);
        }
      });
    } else {
      acc[fullKey] = String(val);
    }
    return acc;
  }, {});
}
