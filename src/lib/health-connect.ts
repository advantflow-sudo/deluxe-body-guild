/**
 * Android Health Connect bridge.
 *
 * Mirror of `healthkit-sync.ts` but for Android. Runs only inside the Capacitor
 * Android shell — on the web it's a no-op so the bundle stays tree-shake-clean.
 *
 * Native setup (one-time, on your dev machine):
 *   npm i @capacitor/core @capacitor/cli @capacitor/android @kiwi-health/capacitor-health-connect
 *   npx cap add android && npx cap sync android
 *
 * AndroidManifest.xml needs:
 *   <queries>
 *     <package android:name="com.google.android.apps.healthdata" />
 *   </queries>
 *   And the health permissions:
 *   <uses-permission android:name="android.permission.health.READ_STEPS" />
 *   <uses-permission android:name="android.permission.health.READ_HEART_RATE" />
 *   <uses-permission android:name="android.permission.health.READ_ACTIVE_CALORIES_BURNED" />
 *
 * This is the recommended migration target before Google Fit REST shuts down in 2026.
 */
import { supabase } from "@/integrations/supabase/client";

type Cap = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
};

export function isAndroidNative(): boolean {
  const cap = (globalThis as unknown as { Capacitor?: Cap }).Capacitor;
  return !!cap?.isNativePlatform?.() && cap?.getPlatform?.() === "android";
}

type HealthConnectPlugin = {
  checkAvailability: () => Promise<{ availability: string }>;
  requestHealthPermissions: (opts: {
    readPermissions: string[];
    writePermissions: string[];
  }) => Promise<{ grantedPermissions: string[] }>;
  readRecords: (opts: {
    type: string;
    timeRangeFilter: { type: "between"; startTime: string; endTime: string };
  }) => Promise<{
    records: Array<{
      count?: number;
      energy?: { inKilocalories?: number };
      samples?: Array<{ beatsPerMinute: number; time: string }>;
    }>;
  }>;
};

async function loadPlugin(): Promise<HealthConnectPlugin | null> {
  if (!isAndroidNative()) return null;
  try {
    const pkg = "@kiwi-health/capacitor-health-connect";
    const mod = (await import(/* @vite-ignore */ pkg)) as {
      HealthConnect: HealthConnectPlugin;
    };
    return mod.HealthConnect;
  } catch (err) {
    console.warn("[HealthConnect] plugin not available", err);
    return null;
  }
}

const READ_PERMS = ["Steps", "HeartRate", "ActiveCaloriesBurned"];

export async function requestHealthConnectPermissions(): Promise<boolean> {
  const plugin = await loadPlugin();
  if (!plugin) return false;
  try {
    const res = await plugin.requestHealthPermissions({
      readPermissions: READ_PERMS,
      writePermissions: [],
    });
    return res.grantedPermissions.length > 0;
  } catch (err) {
    console.error("[HealthConnect] auth failed", err);
    return false;
  }
}

/**
 * Read today's Steps / ActiveCaloriesBurned / HeartRate from Health Connect and
 * push into `device_metrics`. RLS scopes rows to the authenticated user, and
 * the realtime channel in <ConnectedDevices /> updates the dashboard instantly.
 */
export async function syncHealthConnectNow(): Promise<{ ok: boolean; written: number; reason?: string }> {
  const plugin = await loadPlugin();
  if (!plugin) return { ok: false, written: 0, reason: "Not running inside the Android app" };

  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) return { ok: false, written: 0, reason: "Not signed in" };

  const granted = await requestHealthConnectPermissions();
  if (!granted) return { ok: false, written: 0, reason: "Health Connect permission denied" };

  const end = new Date();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const range = { type: "between" as const, startTime: start.toISOString(), endTime: end.toISOString() };

  const pull = async (type: string) => {
    try {
      return await plugin.readRecords({ type, timeRangeFilter: range });
    } catch (err) {
      console.warn(`[HealthConnect] ${type} read failed`, err);
      return null;
    }
  };

  const [steps, calories, heart] = await Promise.all([
    pull("Steps"),
    pull("ActiveCaloriesBurned"),
    pull("HeartRate"),
  ]);

  const rows: Array<{
    user_id: string;
    provider: string;
    metric_type: string;
    value: number;
    unit: string | null;
    recorded_at: string;
  }> = [];

  const stepTotal = (steps?.records ?? []).reduce((s, r) => s + (r.count ?? 0), 0);
  if (stepTotal > 0) {
    rows.push({ user_id: user.id, provider: "health_connect", metric_type: "steps", value: stepTotal, unit: "count", recorded_at: end.toISOString() });
  }

  const calTotal = (calories?.records ?? []).reduce((s, r) => s + (r.energy?.inKilocalories ?? 0), 0);
  if (calTotal > 0) {
    rows.push({ user_id: user.id, provider: "health_connect", metric_type: "calories", value: calTotal, unit: "kcal", recorded_at: end.toISOString() });
  }

  const hrSamples = (heart?.records ?? []).flatMap((r) => r.samples ?? []);
  if (hrSamples.length > 0) {
    const latest = hrSamples[hrSamples.length - 1];
    rows.push({ user_id: user.id, provider: "health_connect", metric_type: "heart_rate", value: latest.beatsPerMinute, unit: "bpm", recorded_at: latest.time });
  }

  if (rows.length === 0) return { ok: true, written: 0, reason: "No data available today" };

  const { error } = await supabase.from("device_metrics").insert(rows);
  if (error) return { ok: false, written: 0, reason: error.message };

  await supabase
    .from("connected_devices")
    .upsert(
      {
        user_id: user.id,
        provider: "health_connect",
        display_name: "Health Connect",
        status: "connected",
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" },
    );

  return { ok: true, written: rows.length };
}
