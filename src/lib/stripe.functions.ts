import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const CheckoutSchema = z.object({
  tier: z.enum(["essential", "signature", "private"]),
  cycle: z.enum(["monthly", "yearly"]),
  origin: z.string().url(),
});

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => CheckoutSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { getStripe, TIER_CONFIG } = await import("./stripe.server");
    const stripe = getStripe();
    const cfg = TIER_CONFIG[data.tier];
    const email = context.claims?.email as string | undefined;

    // Reuse existing customer if we have one
    let customerId: string | undefined;
    if (email) {
      const existing = await stripe.customers.list({ email, limit: 1 });
      customerId = existing.data[0]?.id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      customer_email: customerId ? undefined : email,
      client_reference_id: context.userId,
      metadata: { user_id: context.userId, tier: data.tier, cycle: data.cycle },
      line_items: [
        {
          price_data: {
            currency: "gbp",
            recurring: { interval: data.cycle === "yearly" ? "year" : "month" },
            product_data: { name: `Deluxe Fitness — ${cfg.name} (${data.cycle})` },
            unit_amount: data.cycle === "yearly" ? cfg.yearly : cfg.monthly,
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
        metadata: { user_id: context.userId, tier: data.tier },
      },
      allow_promotion_codes: true,
      success_url: `${data.origin}/app?checkout=success`,
      cancel_url: `${data.origin}/pricing?checkout=cancelled`,
    });

    return { url: session.url };
  });

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { origin: string }) => z.object({ origin: z.string().url() }).parse(data))
  .handler(async ({ data, context }) => {
    const { getStripe } = await import("./stripe.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const stripe = getStripe();

    const { data: sub } = await supabaseAdmin
      .from("subscribers")
      .select("stripe_customer_id")
      .eq("user_id", context.userId)
      .maybeSingle();

    let customerId = sub?.stripe_customer_id;
    if (!customerId) {
      const email = context.claims?.email as string | undefined;
      if (email) {
        const list = await stripe.customers.list({ email, limit: 1 });
        customerId = list.data[0]?.id;
      }
    }
    if (!customerId) throw new Error("No billing account found. Please subscribe first.");

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${data.origin}/app/profile`,
    });
    return { url: portal.url };
  });

export const getMySubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("subscribers")
      .select("tier, status, current_period_end, cancel_at_period_end, stripe_customer_id")
      .eq("user_id", context.userId)
      .maybeSingle();
    return data ?? null;
  });
