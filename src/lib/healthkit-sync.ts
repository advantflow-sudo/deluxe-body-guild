/**
 * Apple HealthKit bridge.
 *
 * Runs only inside the native iOS shell (Capacitor). On the web it's a no-op.
 *
 * Native setup (one-time, on your Mac):
 *   npm i @capacitor/core @capacitor/cli @capacitor/ios @perfood/capacitor-healthkit
 *   npx cap init "Deluxe Fitness" "app.deluxefitness" --web-dir=dist
 *   npm run build && npx cap add ios && npx cap sync && npx cap open ios
 *
 * In Xcode: Signing & Capabilities → + HealthKit
 * In Info.plist: add NSHealthShareUsageDescription
 */
import { supabase } from "@/integrations/supabase/client";

type Cap = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
};

export function isIosNative(): boolean {
  const cap = (globalThis as unknown as { Capacitor?: Cap }).Capacitor;
  return !!cap?.isNativePlatform?.() && cap?.getPlatform?.() === "ios";
}

type HealthKitPlugin = {
  requestAuthorization: (opts: {
    all: string[];
    read: string[];
    write: string[];
  }) => Promise<{ success: boolean }>;
  queryHKitSampleType: (opts: {
    sampleName: string;
    startDate: string;
    endDate: string;
    limit: number;
  }) => Promise<{ resultData: Array<{ value: number; unitName: string; startDate: string; endDate: string }> }>;
};

async function loadPlugin(): Promise<HealthKitPlugin | null> {
  if (!isIosNative()) return null;
  try {
    // Dynamic import so the web bundle doesn't require the package.
    const mod = (await import(/* @vite-ignore */ "@perfood/capacitor-healthkit")) as {
      CapacitorHealthkit: HealthKitPlugin;
    };
    return mod.CapacitorHealthkit;
  } catch (err) {
    console.warn("[HealthKit] plugin not available", err);
    return null;
  }
}

const READ_TYPES = ["steps", "calories", "activity", "heart-rate"];

export async function requestHealthKitPermissions(): Promise<boolean> {
  const plugin = await loadPlugin();
  if (!plugin) return false;
  try {
    const res = await plugin.requestAuthorization({
      all: [...READ_TYPES],
      read: [...READ_TYPES],
      write: [],
    });
    return !!res.success;
  } catch (err) {
    console.error("[HealthKit] auth failed", err);
    return false;
  }
}

/**
 * Pull today's steps / calories / heart rate from HealthKit and push them
 * into the `device_metrics` table. RLS on the table scopes rows to the
 * authenticated user, and the realtime channel in <ConnectedDevices /> will
 * push the new rows into the dashboard instantly.
 */
export async function syncAppleHealthNow(): Promise<{ ok: boolean; written: number; reason?: string }> {
  const plugin = await loadPlugin();
  if (!plugin) return { ok: false, written: 0, reason: "Not running inside the iOS app" };

  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) return { ok: false, written: 0, reason: "Not signed in" };

  const granted = await requestHealthKitPermissions();
  if (!granted) return { ok: false, written: 0, reason: "HealthKit permission denied" };

  const end = new Date();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const range = { startDate: start.toISOString(), endDate: end.toISOString(), limit: 500 };

  const rows: Array<{
    user_id: string;
    provider: string;
    metric_type: string;
    value: number;
    unit: string | null;
    recorded_at: string;
  }> = [];

  const pull = async (sampleName: string, metric_type: string) => {
    try {
      const res = await plugin.queryHKitSampleType({ sampleName, ...range });
      if (metric_type === "heart_rate") {
        // Use most recent reading
        const latest = res.resultData.at(-1);
        if (latest) rows.push({
          user_id: user.id, provider: "apple_health", metric_type,
          value: latest.value, unit: latest.unitName, recorded_at: latest.endDate,
        });
      } else {
        // Sum daily totals (steps, calories)
        const total = res.resultData.reduce((s, r) => s + (r.value || 0), 0);
        if (total > 0) rows.push({
          user_id: user.id, provider: "apple_health", metric_type,
          value: total, unit: res.resultData[0]?.unitName ?? null, recorded_at: end.toISOString(),
        });
      }
    } catch (err) {
      console.warn(`[HealthKit] ${sampleName} read failed`, err);
    }
  };

  await Promise.all([
    pull("stepCount", "steps"),
    pull("activeEnergyBurned", "calories"),
    pull("heartRate", "heart_rate"),
  ]);

  if (rows.length === 0) return { ok: true, written: 0, reason: "No data available today" };

  const { error } = await supabase.from("device_metrics").insert(rows);
  if (error) return { ok: false, written: 0, reason: error.message };

  await supabase
    .from("connected_devices")
    .upsert(
      {
        user_id: user.id,
        provider: "apple_health",
        display_name: "Apple Health",
        status: "connected",
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" }
    );

  return { ok: true, written: rows.length };
}
