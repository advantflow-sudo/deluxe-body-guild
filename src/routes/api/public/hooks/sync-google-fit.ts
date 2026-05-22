import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { fetchFitnessAggregate, refreshAccessToken } from "@/lib/google-fit.server";

/**
 * Cron endpoint — called every 15 minutes by pg_cron.
 *
 * Auth: caller must pass the project's anon/publishable key in the `apikey`
 * header. Lovable's edge bypass for `/api/public/*` paths handles the rest.
 */
export const Route = createFileRoute("/api/public/hooks/sync-google-fit")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!expected || apikey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const SUPABASE_URL = process.env.SUPABASE_URL!;
        const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const clientId = process.env.GOOGLE_FIT_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_FIT_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
          return Response.json({ ok: false, reason: "google_credentials_missing" }, { status: 500 });
        }

        const admin = createClient<Database>(SUPABASE_URL, SERVICE, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: devices, error } = await admin
          .from("connected_devices")
          .select("*")
          .eq("provider", "google_fit")
          .eq("status", "connected");

        if (error) return Response.json({ ok: false, reason: error.message }, { status: 500 });

        let synced = 0;
        let failed = 0;

        for (const device of devices ?? []) {
          try {
            let accessToken = device.access_token!;
            const expiresAt = device.token_expires_at ? new Date(device.token_expires_at) : null;
            const needsRefresh = !expiresAt || expiresAt.getTime() - Date.now() < 60_000;
            if (needsRefresh && device.refresh_token) {
              const refreshed = await refreshAccessToken({
                clientId,
                clientSecret,
                refreshToken: device.refresh_token,
              });
              accessToken = refreshed.access_token;
              await admin
                .from("connected_devices")
                .update({
                  access_token: refreshed.access_token,
                  token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
                })
                .eq("id", device.id);
            }

            const now = new Date();
            const start = new Date();
            start.setHours(0, 0, 0, 0);

            const [steps, calories, heart] = await Promise.all([
              fetchFitnessAggregate({
                accessToken,
                dataType: "com.google.step_count.delta",
                dataSourceId:
                  "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps",
                start,
                end: now,
              }),
              fetchFitnessAggregate({
                accessToken,
                dataType: "com.google.calories.expended",
                start,
                end: now,
              }),
              fetchFitnessAggregate({
                accessToken,
                dataType: "com.google.heart_rate.bpm",
                start,
                end: now,
              }),
            ]);

            const rows: Array<{
              user_id: string;
              provider: string;
              device_id: string;
              metric_type: string;
              value: number;
              unit: string | null;
              recorded_at: string;
            }> = [];
            if (steps != null) rows.push({ user_id: device.user_id, provider: "google_fit", device_id: device.id, metric_type: "steps", value: steps, unit: "count", recorded_at: now.toISOString() });
            if (calories != null) rows.push({ user_id: device.user_id, provider: "google_fit", device_id: device.id, metric_type: "calories", value: calories, unit: "kcal", recorded_at: now.toISOString() });
            if (heart != null) rows.push({ user_id: device.user_id, provider: "google_fit", device_id: device.id, metric_type: "heart_rate", value: heart, unit: "bpm", recorded_at: now.toISOString() });

            if (rows.length > 0) await admin.from("device_metrics").insert(rows);
            await admin
              .from("connected_devices")
              .update({ last_synced_at: now.toISOString() })
              .eq("id", device.id);

            synced += 1;
          } catch (e) {
            console.error("[cron sync-google-fit] failed for", device.user_id, e);
            failed += 1;
          }
        }

        return Response.json({ ok: true, synced, failed, total: devices?.length ?? 0 });
      },
    },
  },
});
