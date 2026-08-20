import { createFileRoute } from "@tanstack/react-router";
import { createHmac } from "node:crypto";
import { verifyCronSecret } from "@/lib/cron-auth.server";

/**
 * Scheduled Stripe test runner.
 * Signs a synthetic event with STRIPE_WEBHOOK_SECRET, posts it to our own
 * webhook endpoint, and records the health outcome into the webhook log.
 */
export const Route = createFileRoute("/api/public/hooks/stripe-webhook-test")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!verifyCronSecret(request)) return new Response("Unauthorized", { status: 401 });

        const { readWebhookSecret, sendWebhookAlert } = await import("@/lib/stripe-webhook.server");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { cleaned: secret, hadWhitespace } = readWebhookSecret();

        const secretValid = !!secret && secret.startsWith("whsec_") && secret.length >= 32;
        const eventId = `evt_healthcheck_${Date.now()}`;

        if (!secretValid) {
          const reason = !secret
            ? "STRIPE_WEBHOOK_SECRET is not set"
            : `Secret format invalid (prefix ${secret.slice(0, 6)}, length ${secret.length})`;
          await supabaseAdmin.from("stripe_webhook_events").insert({
            stripe_event_id: eventId,
            event_type: "health.check",
            status: "error",
            source: "scheduled-test",
            signature_verified: false,
            error_message: reason,
          });
          await sendWebhookAlert({
            kind: "signature_failure",
            requestId: "scheduled-test",
            eventId,
            eventType: "health.check",
            statusCode: 500,
            message: reason,
            source: "scheduled-test",
          });
          return Response.json({ ok: false, secretValid, reason }, { status: 500 });
        }

        const origin = new URL(request.url).origin;
        const payload = JSON.stringify({
          id: eventId,
          object: "event",
          type: "customer.subscription.updated",
          api_version: "2024-11-20.acacia",
          created: Math.floor(Date.now() / 1000),
          livemode: false,
          data: {
            object: {
              id: "sub_healthcheck",
              object: "subscription",
              customer: "cus_healthcheck",
              status: "active",
              cancel_at_period_end: false,
              trial_end: null,
              metadata: { tier: "essential", healthcheck: "true" },
              items: {
                data: [
                  {
                    price: { unit_amount: 2900, currency: "gbp" },
                    current_period_end: Math.floor(Date.now() / 1000) + 2592000,
                  },
                ],
              },
            },
          },
        });

        const ts = Math.floor(Date.now() / 1000);
        const signature = createHmac("sha256", secret!).update(`${ts}.${payload}`).digest("hex");

        let status = 0;
        let bodyText = "";
        const startedAt = Date.now();
        try {
          const res = await fetch(`${origin}/api/public/webhooks/stripe`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "stripe-signature": `t=${ts},v1=${signature}`,
              "user-agent": "Deluxe-Scheduled-Webhook-Test",
            },
            body: payload,
          });
          status = res.status;
          bodyText = (await res.text()).slice(0, 300);
        } catch (err) {
          bodyText = err instanceof Error ? err.message : String(err);
        }

        const ok = status >= 200 && status < 300;
        const ms = Date.now() - startedAt;

        await supabaseAdmin.from("stripe_webhook_events").upsert(
          {
            stripe_event_id: `${eventId}_report`,
            event_type: "health.check",
            status: ok ? "processed" : "error",
            source: "scheduled-test",
            signature_verified: ok,
            processed_at: new Date().toISOString(),
            error_message: ok
              ? null
              : `Scheduled test got HTTP ${status || "network error"}: ${bodyText}`,
            payload: { status, ms, secretValid, hadWhitespace, response: bodyText },
          },
          { onConflict: "stripe_event_id" },
        );

        if (!ok) {
          await sendWebhookAlert({
            kind: "processing_error",
            requestId: "scheduled-test",
            eventId,
            eventType: "health.check",
            statusCode: status || 500,
            message: bodyText || "No response from webhook endpoint",
            source: "scheduled-test",
          });
        }

        return Response.json({ ok, status, ms, secretValid, hadWhitespace, response: bodyText });
      },
    },
  },
});
