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
        const requestId = crypto.randomUUID().slice(0, 8);
        const startedAt = Date.now();
        const log = (msg: string, extra?: Record<string, unknown>) =>
          console.log(`[stripe webhook ${requestId}] ${msg}`, extra ? JSON.stringify(extra) : "");

        const { getStripe } = await import("@/lib/stripe.server");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const stripe = getStripe();

        const sig = request.headers.get("stripe-signature");
        const rawSecret = process.env.STRIPE_WEBHOOK_SECRET;
        const webhookSecret = rawSecret?.trim().replace(/\s+/g, "");
        log("received request", {
          hasSignature: !!sig,
          signaturePreview: sig ? sig.slice(0, 24) + "..." : null,
          secretPresent: !!webhookSecret,
          secretPrefix: webhookSecret?.slice(0, 6) ?? null,
          secretLength: webhookSecret?.length ?? 0,
          secretHadWhitespace: !!rawSecret && rawSecret !== webhookSecret,
          userAgent: request.headers.get("user-agent"),
        });

        if (!sig || !webhookSecret) {
          const reason = !sig ? "Missing stripe-signature header" : "Missing STRIPE_WEBHOOK_SECRET";
          console.error(`[stripe webhook ${requestId}] ${reason}`);
          await supabaseAdmin.from("stripe_webhook_events").insert({
            event_type: "unknown",
            status: "error",
            error_message: reason,
          });
          return new Response("Missing signature", { status: 400 });
        }

        const body = await request.text();
        let event: Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
          log("signature verified");
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[stripe webhook ${requestId}] signature verify FAILED`, {
            message: msg,
            bodyBytes: body.length,
            bodyPreview: body.slice(0, 200),
            secretPrefix: webhookSecret.slice(0, 6),
            secretLength: webhookSecret.length,
            signatureHeader: sig,
          });
          await supabaseAdmin.from("stripe_webhook_events").insert({
            event_type: "signature_failed",
            status: "error",
            error_message: `[${requestId}] ${msg} (secret ${webhookSecret.slice(0, 6)}…len${webhookSecret.length}, body ${body.length}B)`,
          });
          return new Response("Invalid signature", { status: 400 });
        }

        log("event parsed", {
          id: event.id,
          type: event.type,
          livemode: event.livemode,
          apiVersion: event.api_version,
        });

        // Log the received event immediately (idempotent on stripe_event_id)
        await supabaseAdmin
          .from("stripe_webhook_events")
          .upsert(
            {
              stripe_event_id: event.id,
              event_type: event.type,
              status: "received",
              payload: JSON.parse(JSON.stringify(event.data.object)),
            },
            { onConflict: "stripe_event_id" },
          );




        let userId: string | null = null;
        let customerId: string | null = null;
        let subscriptionId: string | null = null;
        let tierLog: string | null = null;
        let amountTotal: number | null = null;
        let currency: string | null = null;

        try {
          switch (event.type) {
            case "checkout.session.completed": {
              const s = event.data.object as Stripe.Checkout.Session;
              userId = (s.metadata?.user_id || s.client_reference_id) ?? null;
              customerId = typeof s.customer === "string" ? s.customer : s.customer?.id ?? null;
              subscriptionId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id ?? null;
              tierLog = s.metadata?.tier ?? null;
              amountTotal = s.amount_total ?? null;
              currency = s.currency ?? null;
              const email = s.customer_details?.email ?? s.customer_email ?? "";
              if (userId && customerId) {
                await supabaseAdmin.from("subscribers").upsert(
                  {
                    user_id: userId,
                    email,
                    stripe_customer_id: customerId,
                    stripe_subscription_id: subscriptionId ?? null,
                    tier: tierLog,
                    status: "active",
                  },
                  { onConflict: "user_id" },
                );
                if (tierLog) {
                  await supabaseAdmin
                    .from("user_profiles_ext")
                    .update({ subscription_tier: tierLog === "essential" ? "premium" : "deluxe" })
                    .eq("user_id", userId);
                }
              }
              break;
            }
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
              const sub = event.data.object as Stripe.Subscription;
              customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
              subscriptionId = sub.id;
              const item = sub.items.data[0];
              const tier = sub.metadata?.tier ?? tierFromAmount(item?.price.unit_amount);
              tierLog = tier;
              amountTotal = item?.price.unit_amount ?? null;
              currency = item?.price.currency ?? null;
              const status = event.type === "customer.subscription.deleted" ? "canceled" : sub.status;

              const { data: row } = await supabaseAdmin
                .from("subscribers")
                .select("user_id")
                .eq("stripe_customer_id", customerId)
                .maybeSingle();

              if (row?.user_id) {
                userId = row.user_id;
                await supabaseAdmin
                  .from("subscribers")
                  .update({
                    stripe_subscription_id: sub.id,
                    tier,
                    status,
                    current_period_end: item?.current_period_end
                      ? new Date(item.current_period_end * 1000).toISOString()
                      : null,
                    cancel_at_period_end: sub.cancel_at_period_end,
                    trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
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

          await supabaseAdmin
            .from("stripe_webhook_events")
            .update({
              status: "processed",
              processed_at: new Date().toISOString(),
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              tier: tierLog,
              amount_total: amountTotal,
              currency,
            })
            .eq("stripe_event_id", event.id);

          log("processed", { userId, customerId, subscriptionId, tier: tierLog, amountTotal, currency, ms: Date.now() - startedAt });

          return new Response(JSON.stringify({ received: true, requestId, eventId: event.id }), {
            headers: { "content-type": "application/json" },
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[stripe webhook ${requestId}] handler error`, { eventId: event.id, type: event.type, message: msg, stack: err instanceof Error ? err.stack : undefined });
          await supabaseAdmin
            .from("stripe_webhook_events")
            .update({
              status: "error",
              error_message: msg,
              processed_at: new Date().toISOString(),
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              tier: tierLog,
            })
            .eq("stripe_event_id", event.id);
          return new Response("Handler error", { status: 500 });
        }
      },
    },
  },
});

