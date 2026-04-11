import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.redirect("/login");
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Get customer by email from Stripe
    const searchRes = await fetch(
      `https://api.stripe.com/v1/customers?email=${encodeURIComponent(user.email!)}&limit=1`,
      {
        headers: { "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}` },
      }
    );

    const customers = await searchRes.json();
    const customer = customers.data?.[0];

    if (!customer) {
      // No Stripe customer yet — redirect to pricing
      return Response.redirect(`${appUrl}/#pricing`);
    }

    // Create portal session
    const portalRes = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        customer: customer.id,
        return_url: `${appUrl}/dashboard/billing`,
      }).toString(),
    });

    const portal = await portalRes.json();

    if (!portalRes.ok) {
      console.error("Portal error:", portal);
      return Response.redirect(`${appUrl}/dashboard/billing`);
    }

    return Response.redirect(portal.url);

  } catch (err: any) {
    console.error("Portal error:", err);
    return Response.redirect("/dashboard/billing");
  }
}
