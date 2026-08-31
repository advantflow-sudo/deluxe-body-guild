import { buildPushPayload, type PushSubscription, type VapidKeys } from "@block65/webcrypto-web-push";

export interface PushRow {
  id: string;
  endpoint: string;
  p256dh: string | null;
  auth_key: string | null;
}

export interface PushContent {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export type PushOutcome = "sent" | "gone" | "skipped" | "failed";

function vapid(): VapidKeys | null {
  const publicKey = process.env["VAPID_PUBLIC_KEY"]?.trim();
  const privateKey = process.env["VAPID_PRIVATE_KEY"]?.trim();
  const subject = process.env["VAPID_SUBJECT"]?.trim() || "mailto:support@deluxefitness.app";
  if (!publicKey || !privateKey) return null;
  return { subject, publicKey, privateKey };
}

export function pushConfigured(): boolean {
  return vapid() !== null;
}

/**
 * Sends one encrypted Web Push message.
 * Returns "gone" when the endpoint is dead and the row should be deleted,
 * "skipped" when the row isn't a real browser subscription or VAPID is missing.
 */
export async function sendPush(row: PushRow, content: PushContent): Promise<PushOutcome> {
  const keys = vapid();
  if (!keys) return "skipped";
  if (!row.endpoint.startsWith("http") || !row.p256dh || !row.auth_key) return "skipped";
  if (row.p256dh === "pending" || row.auth_key === "pending") return "skipped";

  const subscription: PushSubscription = {
    endpoint: row.endpoint,
    expirationTime: null,
    keys: { p256dh: row.p256dh, auth: row.auth_key },
  };

  try {
    const payload = await buildPushPayload(
      {
        data: JSON.stringify({
          title: content.title,
          body: content.body,
          url: content.url ?? "/app?mission=1",
          tag: content.tag ?? "df-notif",
        }),
        options: { ttl: 3600, urgency: "normal" },
      },
      subscription,
      keys,
    );

    const res = await fetch(row.endpoint, payload);
    if (res.status === 404 || res.status === 410) return "gone";
    return res.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}
