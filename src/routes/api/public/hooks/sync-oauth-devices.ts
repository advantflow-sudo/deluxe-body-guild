import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getProvider, refreshToken } from "@/lib/oauth-providers.server";

/**
 * Cron endpoint — sync every OAuth-2 provider (Fitbit, Strava, Oura) for every
 * connected user. Scheduled by pg_cron every 15 minutes.
 */
export const Route = createFileRoute("/api/public/hooks/sync-oauth-devices")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provided = request.headers.get("x-cron-secret");
        const expected = process.env.CRON_SECRET;
        if (!expected || provided !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const SUPABASE_URL = process.env.SUPABASE_URL!;
        const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const admin = createClient<Database>(SUPABASE_URL, SERVICE, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: devices, error } = await admin
          .from("connected_devices")
          .select("*")
          .in("provider", ["fitbit", "strava", "oura"])
          .eq("status", "connected");
        if (error) return Response.json({ ok: false, reason: error.message }, { status: 500 });

        let synced = 0;
        let failed = 0;
        const now = new Date();

        for (const device of devices ?? []) {
          const cfg = getProvider(device.provider);
          if (!cfg) continue;
          try {
            let accessToken = device.access_token!;
            const expiresAt = device.token_expires_at ? new Date(device.token_expires_at) : null;
            const needsRefresh = !expiresAt || expiresAt.getTime() - Date.now() < 60_000;
            if (needsRefresh && device.refresh_token) {
              const r = await refreshToken(cfg, device.refresh_token);
              accessToken = r.access_token;
              await admin
                .from("connected_devices")
                .update({
                  access_token: r.access_token,
                  refresh_token: r.refresh_token ?? device.refresh_token,
                  token_expires_at: new Date(Date.now() + r.expires_in * 1000).toISOString(),
                })
                .eq("id", device.id);
            }

            const snapshot = await cfg.fetchToday(accessToken);
            const rows: Array<{
              user_id: string;
              provider: string;
              device_id: string;
              metric_type: string;
              value: number;
              unit: string | null;
              recorded_at: string;
            }> = [];
            const push = (type: string, value: number | undefined, unit: string) => {
              if (typeof value === "number" && value > 0) {
                rows.push({
                  user_id: device.user_id,
                  provider: device.provider,
                  device_id: device.id,
                  metric_type: type,
                  value,
                  unit,
                  recorded_at: now.toISOString(),
                });
              }
            };
            push("steps", snapshot.steps, "count");
            push("calories", snapshot.calories, "kcal");
            push("heart_rate", snapshot.heart_rate, "bpm");

            if (rows.length > 0) await admin.from("device_metrics").insert(rows);
            await admin
              .from("connected_devices")
              .update({ last_synced_at: now.toISOString() })
              .eq("id", device.id);
            synced += 1;
          } catch (e) {
            console.error("[cron sync-oauth-devices] failed", device.provider, device.user_id, e);
            failed += 1;
          }
        }

        return Response.json({ ok: true, synced, failed, total: devices?.length ?? 0 });
      },
    },
  },
});
