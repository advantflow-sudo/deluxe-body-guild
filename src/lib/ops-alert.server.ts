/**
 * Generic operational alerting used by production monitoring.
 *
 * Delivery targets (all optional, best effort):
 *  - STRIPE_ALERT_WEBHOOK_URL  → generic JSON POST (Slack-compatible)
 *  - RESEND_API_KEY + ALERT_EMAIL_TO → email
 * Always logs to the server console so the incident is visible in logs even
 * when no delivery target is configured.
 */
export type OpsAlertKind =
  | "crash"
  | "server_error"
  | "payment_failed"
  | "webhook_signature_failure"
  | "webhook_processing_error";

export async function sendOpsAlert(alert: {
  kind: OpsAlertKind;
  title: string;
  detail: string;
  context?: Record<string, unknown>;
}) {
  const text = [
    alert.title,
    `kind: ${alert.kind}`,
    `detail: ${alert.detail}`,
    ...Object.entries(alert.context ?? {}).map(([k, v]) => `${k}: ${String(v)}`),
  ].join("\n");
  console.error(`[ops alert] ${text.replace(/\n/g, " | ")}`);

  const hookUrl = process.env["STRIPE_ALERT_WEBHOOK_URL"]?.trim();
  if (hookUrl) {
    try {
      await fetch(hookUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, ...alert }),
      });
    } catch (err) {
      console.error("[ops alert] webhook delivery failed", err);
    }
  }

  const resendKey = process.env["RESEND_API_KEY"]?.trim();
  const to = process.env["ALERT_EMAIL_TO"]?.trim();
  if (resendKey && to) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: process.env["ALERT_EMAIL_FROM"]?.trim() || "alerts@deluxefitness.app",
          to: [to],
          subject: alert.title,
          text,
        }),
      });
    } catch (err) {
      console.error("[ops alert] email delivery failed", err);
    }
  }
}
