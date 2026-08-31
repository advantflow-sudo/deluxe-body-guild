import type Stripe from "stripe";

export type WebhookSource = "stripe" | "replay" | "scheduled-test";

export function readWebhookSecret() {
  const raw = process.env.STRIPE_WEBHOOK_SECRET;
  const cleaned = raw?.trim().replace(/\s+/g, "");
  return { raw, cleaned, hadWhitespace: !!raw && raw !== cleaned };
}

/**
 * Sends an operational alert when signature verification fails or processing
 * returns a non-2xx status. Delivery targets (all optional, best effort):
 *  - STRIPE_ALERT_WEBHOOK_URL  → generic JSON POST (Slack-compatible)
 *  - RESEND_API_KEY + ALERT_EMAIL_TO → email
 * Always logs, and stamps alerted_at on the delivery row when available.
 */
export async function sendWebhookAlert(alert: {
  kind: "signature_failure" | "processing_error";
  requestId: string;
  eventId?: string | null;
  eventType?: string | null;
  statusCode: number;
  message: string;
  source: WebhookSource;
}) {
  const title = `Stripe webhook ${alert.kind === "signature_failure" ? "signature verification failed" : "processing failed"} (${alert.statusCode})`;
  const text = [
    title,
    `request: ${alert.requestId}`,
    `source: ${alert.source}`,
    `event: ${alert.eventType ?? "unknown"} ${alert.eventId ?? ""}`.trim(),
    `detail: ${alert.message}`,
  ].join("\n");
  console.error(`[stripe alert] ${text.replace(/\n/g, " | ")}`);

  const hookUrl = process.env.STRIPE_ALERT_WEBHOOK_URL?.trim();
  if (hookUrl) {
    try {
      await fetch(hookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, ...alert }),
      });
    } catch (err) {
      console.error("[stripe alert] webhook delivery failed", err);
    }
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.ALERT_EMAIL_TO?.trim();
  if (resendKey && to) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: process.env.ALERT_EMAIL_FROM?.trim() || "alerts@deluxefitness.app",
          to: [to],
          subject: title,
          text,
        }),
      });
    } catch (err) {
      console.error("[stripe alert] email delivery failed", err);
    }
  }

  if (alert.eventId) {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("stripe_webhook_events")
        .update({ alerted_at: new Date().toISOString() })
        .eq("stripe_event_id", alert.eventId);
    } catch {
      /* non-fatal */
    }
  }
}

function tierFromAmount(amount: number | null | undefined): string | null {
  if (!amount) return null;
  // GBP pence — monthly and annual list prices per tier.
  const map: Record<number, string> = {
    1499: "essential", 14999: "essential",
    3999: "signature", 39999: "signature",
    11999: "private",
  };
  return map[amount] ?? null;
}

export interface ProcessResult {
  ok: boolean;
  duplicate: boolean;
  status: number;
  message?: string;
  eventId: string;
}

/**
 * Idempotent processing of a verified Stripe event.
 * The unique stripe_event_id acts as the idempotency key: if a row for this
 * event is already `processed`, we return early so re-deliveries and replays
 * never create duplicate subscription rows.
 */
export async function processStripeEvent(
  event: Stripe.Event,
  opts: { requestId: string; source: WebhookSource; signatureVerified: boolean },
): Promise<ProcessResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { requestId, source, signatureVerified } = opts;
  const log = (msg: string, extra?: Record<string, unknown>) =>
    console.log(`[stripe webhook ${requestId}] ${msg}`, extra ? JSON.stringify(extra) : "");

  // Idempotency check
  const { data: existing } = await supabaseAdmin
    .from("stripe_webhook_events")
    .select("id, status, attempts")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (existing?.status === "processed") {
    await supabaseAdmin
      .from("stripe_webhook_events")
      .update({ attempts: (existing.attempts ?? 1) + 1 })
      .eq("id", existing.id);
    log("duplicate ignored (already processed)", { eventId: event.id });
    return { ok: true, duplicate: true, status: 200, eventId: event.id };
  }

  await supabaseAdmin.from("stripe_webhook_events").upsert(
    {
      stripe_event_id: event.id,
      event_type: event.type,
      status: "received",
      source,
      signature_verified: signatureVerified,
      attempts: (existing?.attempts ?? 0) + 1,
      payload: JSON.parse(JSON.stringify(event.data.object)),
      error_message: null,
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
              .update({ subscription_tier: tierLog })
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
            (status === "active" || status === "trialing") && tier ? tier : "free";
          await supabaseAdmin
            .from("user_profiles_ext")
            .update({ subscription_tier: profileTier })
            .eq("user_id", row.user_id);
        }
        break;
      }
      case "invoice.payment_failed":
      case "charge.failed": {
        const obj = event.data.object as { customer?: string | { id: string } | null; amount_due?: number; amount?: number; currency?: string | null };
        customerId = typeof obj.customer === "string" ? obj.customer : obj.customer?.id ?? null;
        amountTotal = obj.amount_due ?? obj.amount ?? null;
        currency = obj.currency ?? null;

        if (customerId) {
          const { data: row } = await supabaseAdmin
            .from("subscribers")
            .select("user_id, email")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();
          if (row?.user_id) {
            userId = row.user_id;
            await supabaseAdmin
              .from("subscribers")
              .update({ status: "past_due" })
              .eq("user_id", row.user_id);
          }
        }

        const { sendOpsAlert } = await import("@/lib/ops-alert.server");
        await sendOpsAlert({
          kind: "payment_failed",
          title: "Stripe payment failed",
          detail: `${event.type} for customer ${customerId ?? "unknown"}`,
          context: {
            eventId: event.id,
            userId: userId ?? "unknown",
            amount: amountTotal ?? "unknown",
            currency: currency ?? "unknown",
            requestId,
          },
        });
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

    log("processed", { source, userId, customerId, subscriptionId, tier: tierLog });
    return { ok: true, duplicate: false, status: 200, eventId: event.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[stripe webhook ${requestId}] handler error`, {
      eventId: event.id,
      type: event.type,
      message: msg,
      stack: err instanceof Error ? err.stack : undefined,
    });
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

    await sendWebhookAlert({
      kind: "processing_error",
      requestId,
      eventId: event.id,
      eventType: event.type,
      statusCode: 500,
      message: msg,
      source,
    });
    return { ok: false, duplicate: false, status: 500, message: msg, eventId: event.id };
  }
}
