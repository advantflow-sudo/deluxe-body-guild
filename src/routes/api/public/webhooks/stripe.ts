import { createFileRoute } from "@tanstack/react-router";
import type Stripe from "stripe";

function tierFromAmount(amount: number | null | undefined): string | null {
  if (!amount) return null;
  // Match to nearest configured tier (monthly or yearly)
  const map: Record<number, string> = {
    2900: "essential", 27600: "essential",
    7900: "signature", 75600: "signature",
    24900: "private", 238800: "private",
  };
  return map[amount] ?? null;
}

export const Route = createFileRoute("/api/public/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { getStripe } = await import("@/lib/stripe.server");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const stripe = getStripe();

        const sig = request.headers.get("stripe-signature");
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!sig || !webhookSecret) return new Response("Missing signature", { status: 400 });

        const body = await request.text();
        let event: Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
        } catch (err) {
          console.error("[stripe webhook] signature verify failed", err);
          return new Response("Invalid signature", { status: 400 });
        }

        try {
          switch (event.type) {
            case "checkout.session.completed": {
              const s = event.data.object as Stripe.Checkout.Session;
              const userId = s.metadata?.user_id || s.client_reference_id;
              const customerId = typeof s.customer === "string" ? s.customer : s.customer?.id;
              const subId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
              const email = s.customer_details?.email ?? s.customer_email ?? "";
              if (userId && customerId) {
                await supabaseAdmin.from("subscribers").upsert(
                  {
                    user_id: userId,
                    email,
                    stripe_customer_id: customerId,
                    stripe_subscription_id: subId ?? null,
                    tier: s.metadata?.tier ?? null,
                    status: "active",
                  },
                  { onConflict: "user_id" },
                );
                if (s.metadata?.tier) {
                  await supabaseAdmin
                    .from("user_profiles_ext")
                    .update({ subscription_tier: s.metadata.tier === "essential" ? "premium" : "deluxe" })
                    .eq("user_id", userId);
                }
              }
              break;
            }
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
              const sub = event.data.object as Stripe.Subscription;
              const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
              const item = sub.items.data[0];
              const tier = sub.metadata?.tier ?? tierFromAmount(item?.price.unit_amount);
              const status = event.type === "customer.subscription.deleted" ? "canceled" : sub.status;

              const { data: row } = await supabaseAdmin
                .from("subscribers")
                .select("user_id")
                .eq("stripe_customer_id", customerId)
                .maybeSingle();

              if (row?.user_id) {
                await supabaseAdmin
                  .from("subscribers")
                  .update({
                    stripe_subscription_id: sub.id,
                    tier,
                    status,
                    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
                    cancel_at_period_end: sub.cancel_at_period_end,
                  })
                  .eq("user_id", row.user_id);

                const profileTier =
                  status === "active" || status === "trialing"
                    ? tier === "essential" ? "premium" : "deluxe"
                    : "free";
                await supabaseAdmin
                  .from("user_profiles_ext")
                  .update({ subscription_tier: profileTier })
                  .eq("user_id", row.user_id);
              }
              break;
            }
          }
          return new Response(JSON.stringify({ received: true }), {
            headers: { "content-type": "application/json" },
          });
        } catch (err) {
          console.error("[stripe webhook] handler error", err);
          return new Response("Handler error", { status: 500 });
        }
      },
    },
  },
});
