import { createFileRoute } from "@tanstack/react-router";
import type Stripe from "stripe";

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
        const { processStripeEvent, sendWebhookAlert, readWebhookSecret } = await import(
          "@/lib/stripe-webhook.server"
        );
        const stripe = getStripe();

        const sig = request.headers.get("stripe-signature");
        const { raw: rawSecret, cleaned: webhookSecret, hadWhitespace } = readWebhookSecret();
        log("received request", {
          hasSignature: !!sig,
          signaturePreview: sig ? sig.slice(0, 24) + "..." : null,
          secretPresent: !!webhookSecret,
          secretPrefix: webhookSecret?.slice(0, 6) ?? null,
          secretLength: webhookSecret?.length ?? 0,
          secretHadWhitespace: hadWhitespace,
          userAgent: request.headers.get("user-agent"),
        });

        if (!sig || !webhookSecret) {
          const reason = !sig ? "Missing stripe-signature header" : "Missing STRIPE_WEBHOOK_SECRET";
          console.error(`[stripe webhook ${requestId}] ${reason}`);
          await supabaseAdmin.from("stripe_webhook_events").insert({
            event_type: "signature_failed",
            status: "error",
            source: "stripe",
            signature_verified: false,
            error_message: `[${requestId}] ${reason}`,
          });
          await sendWebhookAlert({
            kind: "signature_failure",
            requestId,
            statusCode: 400,
            message: reason,
            source: "stripe",
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
            source: "stripe",
            signature_verified: false,
            error_message: `[${requestId}] ${msg} (secret ${webhookSecret.slice(0, 6)}…len${webhookSecret.length}, body ${body.length}B)`,
          });
          await sendWebhookAlert({
            kind: "signature_failure",
            requestId,
            statusCode: 400,
            message: msg,
            source: "stripe",
          });
          return new Response("Invalid signature", { status: 400 });
        }

        log("event parsed", {
          id: event.id,
          type: event.type,
          livemode: event.livemode,
          apiVersion: event.api_version,
        });

        const result = await processStripeEvent(event, {
          requestId,
          source: "stripe",
          signatureVerified: true,
        });

        if (!result.ok) return new Response("Handler error", { status: 500 });

        log("done", { ms: Date.now() - startedAt, duplicate: result.duplicate });
        return new Response(
          JSON.stringify({
            received: true,
            requestId,
            eventId: event.id,
            duplicate: result.duplicate,
          }),
          { headers: { "content-type": "application/json" } },
        );
      },
    },
  },
});
