import { createFileRoute } from "@tanstack/react-router";

function describeSecret(raw: string | undefined) {
  if (!raw) return { present: false, valid: false, reason: "STRIPE_WEBHOOK_SECRET is not set" };
  const trimmed = raw.trim();
  const hadWhitespace = trimmed !== raw || /\s/.test(trimmed);
  const cleaned = trimmed.replace(/\s+/g, "");
  const valid = cleaned.startsWith("whsec_") && cleaned.length >= 32;
  return {
    present: true,
    valid,
    hadWhitespace,
    prefix: cleaned.slice(0, 6),
    length: cleaned.length,
    reason: valid
      ? null
      : cleaned.startsWith("whsec_")
        ? "Secret looks too short — copy the full whsec_ value from Stripe"
        : `Secret must start with "whsec_" (found "${cleaned.slice(0, 3)}...")`,
  };
}

async function isOperator(request: Request) {
  // Operational secret (used by monitoring/cron)
  const cronSecret = process.env.CRON_SECRET;
  const provided = request.headers.get("x-cron-secret");
  if (cronSecret && provided && provided === cronSecret) return true;

  // Signed-in admin
  const auth = request.headers.get("authorization");
  const token = auth?.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null;
  if (!token) return false;
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      },
    );
    const { data: userData } = await client.auth.getUser(token);
    if (!userData?.user) return false;
    const { data: isAdmin } = await client.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    return isAdmin === true;
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/public/webhooks/stripe-health")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await isOperator(request))) {
          return new Response(JSON.stringify({ status: "unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json", "cache-control": "no-store" },
          });
        }
        const secret = describeSecret(process.env.STRIPE_WEBHOOK_SECRET);
        const apiKey = process.env.STRIPE_SECRET_KEY?.trim();
        const apiKeyOk = !!apiKey && (apiKey.startsWith("sk_") || apiKey.startsWith("rk_"));

        let recent: unknown[] = [];

        let lastVerificationFailure: unknown = null;
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data } = await supabaseAdmin
            .from("stripe_webhook_events")
            .select("stripe_event_id, event_type, status, error_message, received_at, processed_at")
            .order("received_at", { ascending: false })
            .limit(10);
          recent = data ?? [];
          const { data: fail } = await supabaseAdmin
            .from("stripe_webhook_events")
            .select("event_type, error_message, received_at")
            .eq("status", "error")
            .order("received_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          lastVerificationFailure = fail ?? null;
        } catch (err) {
          recent = [];
          lastVerificationFailure = { error: err instanceof Error ? err.message : String(err) };
        }

        const healthy = secret.valid && apiKeyOk;
        return new Response(
          JSON.stringify(
            {
              status: healthy ? "ok" : "misconfigured",
              endpoint: "/api/public/webhooks/stripe",
              checkedAt: new Date().toISOString(),
              webhookSecret: secret,
              stripeApiKey: { present: !!apiKey, valid: apiKeyOk, prefix: apiKey?.slice(0, 3) ?? null },
              recentEvents: recent,
              lastVerificationFailure,
            },
            null,
            2,
          ),
          {
            status: healthy ? 200 : 503,
            headers: { "content-type": "application/json", "cache-control": "no-store" },
          },
        );
      },
    },
  },
});
