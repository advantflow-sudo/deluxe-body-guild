import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface WebhookDelivery {
  id: string;
  stripe_event_id: string | null;
  event_type: string;
  status: string;
  source: string | null;
  signature_verified: boolean | null;
  attempts: number | null;
  error_message: string | null;
  user_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  tier: string | null;
  amount_total: number | null;
  currency: string | null;
  received_at: string;
  processed_at: string | null;
  alerted_at: string | null;
}

export interface DeliveryFilters {
  eventType?: string;
  status?: string;
  onlyVerificationFailures?: boolean;
  onlySource?: string;
  limit?: number;
}

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

export const listWebhookDeliveries = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: DeliveryFilters | undefined) => input ?? {})
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let q = supabaseAdmin
      .from("stripe_webhook_events")
      .select("*")
      .order("received_at", { ascending: false })
      .limit(Math.min(data.limit ?? 100, 300));

    if (data.eventType && data.eventType !== "all") q = q.eq("event_type", data.eventType);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    if (data.onlySource && data.onlySource !== "all") q = q.eq("source", data.onlySource);
    if (data.onlyVerificationFailures) q = q.eq("signature_verified", false);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const deliveries = (rows ?? []) as unknown as WebhookDelivery[];
    const stats = {
      total: deliveries.length,
      processed: deliveries.filter((d) => d.status === "processed").length,
      errors: deliveries.filter((d) => d.status === "error").length,
      signatureFailures: deliveries.filter((d) => d.signature_verified === false).length,
    };
    const eventTypes = Array.from(new Set(deliveries.map((d) => d.event_type))).sort();
    return { deliveries, stats, eventTypes };
  });

/**
 * Admin-only replay. Provide the Stripe event_id; the raw payload is optional —
 * when omitted we re-fetch the event from Stripe. Processing is idempotent, so
 * replaying an already-processed event is a no-op unless `force` is set.
 */
export const replayWebhookEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { eventId: string; rawPayload?: string; force?: boolean }) => {
    const eventId = (input?.eventId ?? "").trim();
    if (!eventId || eventId.length > 200) throw new Error("A valid Stripe event_id is required");
    if (input.rawPayload && input.rawPayload.length > 500_000) throw new Error("Payload too large");
    return { eventId, rawPayload: input.rawPayload?.trim() || undefined, force: !!input.force };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { processStripeEvent } = await import("@/lib/stripe-webhook.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const requestId = `replay-${crypto.randomUUID().slice(0, 6)}`;

    let event: any;
    if (data.rawPayload) {
      try {
        event = JSON.parse(data.rawPayload);
      } catch {
        throw new Error("Raw payload is not valid JSON");
      }
      if (!event?.type || !event?.data?.object) {
        throw new Error("Payload must be a full Stripe event object (with type and data.object)");
      }
      event.id = data.eventId;
    } else {
      const { getStripe } = await import("@/lib/stripe.server");
      event = await getStripe().events.retrieve(data.eventId);
    }

    if (data.force) {
      // Clear the processed marker so the idempotency guard allows a re-run.
      await supabaseAdmin
        .from("stripe_webhook_events")
        .update({ status: "replaying", processed_at: null })
        .eq("stripe_event_id", data.eventId);
    }

    const result = await processStripeEvent(event, {
      requestId,
      source: "replay",
      signatureVerified: true,
    });
    return { ...result, requestId };
  });
