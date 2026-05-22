import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  GOOGLE_FIT_SCOPES,
  REDIRECT_URI,
  buildAuthorizeUrl,
  refreshAccessToken,
  fetchFitnessAggregate,
} from "./google-fit.server";

/**
 * Step 1 — user clicks "Connect Google Fit".
 * Generates a one-time state token, stores it scoped to the user, and returns
 * the Google authorize URL the browser should be redirected to.
 */
export const connectGoogleFit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const clientId = process.env.GOOGLE_FIT_CLIENT_ID;
    if (!clientId) throw new Error("GOOGLE_FIT_CLIENT_ID is not configured");

    const SUPABASE_URL = process.env.SUPABASE_URL!;
    const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const admin = createClient<Database>(SUPABASE_URL, SERVICE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const state = crypto.randomUUID() + "." + crypto.randomUUID();
    const { error } = await admin.from("oauth_states").insert({
      user_id: userId,
      provider: "google_fit",
      state,
    });
    if (error) throw new Error(error.message);

    return { url: buildAuthorizeUrl({ clientId, state }) };
  });

/**
 * Step 3 — pull today's Google Fit metrics and write them into device_metrics.
 * Refreshes the access token first if it has expired.
 */
export const syncGoogleFit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: device } = await supabase
      .from("connected_devices")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", "google_fit")
      .maybeSingle();

    if (!device || device.status !== "connected") {
      return { ok: false, written: 0, reason: "Google Fit not connected" };
    }

    const clientId = process.env.GOOGLE_FIT_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_FIT_CLIENT_SECRET!;
    if (!clientId || !clientSecret) {
      return { ok: false, written: 0, reason: "Server missing Google credentials" };
    }

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
      await supabase
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

    if (steps != null) rows.push({ user_id: userId, provider: "google_fit", device_id: device.id, metric_type: "steps", value: steps, unit: "count", recorded_at: now.toISOString() });
    if (calories != null) rows.push({ user_id: userId, provider: "google_fit", device_id: device.id, metric_type: "calories", value: calories, unit: "kcal", recorded_at: now.toISOString() });
    if (heart != null) rows.push({ user_id: userId, provider: "google_fit", device_id: device.id, metric_type: "heart_rate", value: heart, unit: "bpm", recorded_at: now.toISOString() });

    if (rows.length > 0) {
      const { error } = await supabase.from("device_metrics").insert(rows);
      if (error) return { ok: false, written: 0, reason: error.message };
    }

    await supabase
      .from("connected_devices")
      .update({ last_synced_at: now.toISOString() })
      .eq("id", device.id);

    return { ok: true, written: rows.length };
  });

export { GOOGLE_FIT_SCOPES, REDIRECT_URI };
