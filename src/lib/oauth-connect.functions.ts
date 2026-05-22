import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  buildAuthorizeUrl,
  getProvider,
  refreshToken,
  type SupportedProvider,
} from "./oauth-providers.server";

const ProviderSchema = z.object({
  provider: z.enum(["fitbit", "strava", "oura"]),
});

/**
 * Begin OAuth for any supported provider. Returns the authorize URL the
 * browser should be redirected to.
 */
export const connectOAuthProvider = createServerFn({ method: "POST" })
  .inputValidator((input) => ProviderSchema.parse(input))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const cfg = getProvider(data.provider);
    if (!cfg) throw new Error(`Unsupported provider: ${data.provider}`);

    const SUPABASE_URL = process.env.SUPABASE_URL!;
    const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const admin = createClient<Database>(SUPABASE_URL, SERVICE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const state = crypto.randomUUID() + "." + crypto.randomUUID();
    const { error } = await admin.from("oauth_states").insert({
      user_id: userId,
      provider: data.provider,
      state,
    });
    if (error) throw new Error(error.message);

    return { url: buildAuthorizeUrl(cfg, state) };
  });

/**
 * Pull today's snapshot for a given OAuth provider and write into device_metrics.
 */
export const syncOAuthProvider = createServerFn({ method: "POST" })
  .inputValidator((input) => ProviderSchema.parse(input))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const cfg = getProvider(data.provider);
    if (!cfg) return { ok: false, written: 0, reason: "unsupported_provider" };

    const { data: device } = await supabase
      .from("connected_devices")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", data.provider)
      .maybeSingle();

    if (!device || device.status !== "connected") {
      return { ok: false, written: 0, reason: `${data.provider} not connected` };
    }

    let accessToken = device.access_token!;
    const expiresAt = device.token_expires_at ? new Date(device.token_expires_at) : null;
    const needsRefresh = !expiresAt || expiresAt.getTime() - Date.now() < 60_000;

    if (needsRefresh && device.refresh_token) {
      try {
        const refreshed = await refreshToken(cfg, device.refresh_token);
        accessToken = refreshed.access_token;
        await supabase
          .from("connected_devices")
          .update({
            access_token: refreshed.access_token,
            refresh_token: refreshed.refresh_token ?? device.refresh_token,
            token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
          })
          .eq("id", device.id);
      } catch (e) {
        return { ok: false, written: 0, reason: e instanceof Error ? e.message : "refresh_failed" };
      }
    }

    let snapshot;
    try {
      snapshot = await cfg.fetchToday(accessToken);
    } catch (e) {
      return { ok: false, written: 0, reason: e instanceof Error ? e.message : "fetch_failed" };
    }

    const now = new Date();
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
          user_id: userId,
          provider: data.provider,
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

export type { SupportedProvider };
