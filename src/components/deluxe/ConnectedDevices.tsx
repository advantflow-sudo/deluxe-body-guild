import { useEffect, useState } from "react";
import { Smartphone, Watch, Activity, CheckCircle2, Plug, RefreshCw, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SectionLabel } from "@/components/deluxe/ui";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { isIosNative, syncAppleHealthNow } from "@/lib/healthkit-sync";
import { isAndroidNative, syncHealthConnectNow } from "@/lib/health-connect";
import { connectGoogleFit, syncGoogleFit } from "@/lib/google-fit.functions";
import { connectOAuthProvider, syncOAuthProvider } from "@/lib/oauth-connect.functions";

type Provider = "apple_health" | "fitbit" | "garmin" | "strava" | "oura" | "google_fit";
type OAuthProvider = "fitbit" | "strava" | "oura";

interface ProviderMeta {
  id: Provider;
  name: string;
  icon: typeof Watch;
  blurb: string;
}

const PROVIDERS: ProviderMeta[] = [
  { id: "apple_health", name: "Apple Health", icon: Watch, blurb: "iPhone & Apple Watch" },
  { id: "fitbit", name: "Fitbit", icon: Activity, blurb: "Steps, sleep, heart rate" },
  { id: "garmin", name: "Garmin", icon: Watch, blurb: "Watches & cycling" },
  { id: "strava", name: "Strava", icon: Activity, blurb: "Runs & rides" },
  { id: "oura", name: "Oura Ring", icon: Activity, blurb: "Sleep & recovery" },
  { id: "google_fit", name: "Google Fit", icon: Smartphone, blurb: "Android devices" },
];

interface Device {
  id: string;
  provider: string;
  status: string;
  last_synced_at: string | null;
  display_name: string | null;
}

interface LiveMetric {
  metric_type: string;
  value: number;
  unit: string | null;
  recorded_at: string;
  provider: string;
}

export function ConnectedDevices() {
  const { user } = useAuth();
  const startGoogleFit = useServerFn(connectGoogleFit);
  const runGoogleFitSync = useServerFn(syncGoogleFit);
  const [devices, setDevices] = useState<Device[]>([]);
  const [latest, setLatest] = useState<Record<string, LiveMetric>>({});
  const [healthConnectMode, setHealthConnectMode] = useState(false);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const [{ data: d }, { data: m }] = await Promise.all([
        supabase.from("connected_devices").select("*").eq("user_id", user.id),
        supabase
          .from("device_metrics")
          .select("metric_type,value,unit,recorded_at,provider")
          .eq("user_id", user.id)
          .order("recorded_at", { ascending: false })
          .limit(50),
      ]);
      if (d) setDevices(d as Device[]);
      if (m) {
        const byType: Record<string, LiveMetric> = {};
        for (const row of m as LiveMetric[]) if (!byType[row.metric_type]) byType[row.metric_type] = row;
        setLatest(byType);
      }
    };
    load();

    // Realtime: new metric rows push into the dashboard instantly
    const channel = supabase
      .channel(`device-metrics-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "device_metrics", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as LiveMetric;
          setLatest((prev) => ({ ...prev, [row.metric_type]: row }));
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "connected_devices", filter: `user_id=eq.${user.id}` },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const [syncing, setSyncing] = useState<string | null>(null);

  // Surface the Google Fit OAuth result the user is redirected back with.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const result = params.get("google_fit");
    if (!result) return;
    if (result === "ok") toast.success("Google Fit connected", { description: "Tap Sync to pull today's data." });
    else toast.error("Google Fit connection failed", { description: params.get("reason") ?? undefined });
    params.delete("google_fit");
    params.delete("reason");
    const qs = params.toString();
    window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
  }, []);

  const connect = async (provider: Provider, name: string) => {
    if (!user) return;

    // Apple Health on native iOS: trigger real HealthKit sync.
    if (provider === "apple_health" && isIosNative()) {
      setSyncing(provider);
      const res = await syncAppleHealthNow();
      setSyncing(null);
      if (res.ok) toast.success(`Apple Health synced`, { description: `${res.written} metric(s) updated` });
      else toast.error("Sync failed", { description: res.reason });
      return;
    }
    if (provider === "apple_health") {
      toast.info("Apple Health requires the iOS app", {
        description: "Available once installed from the App Store on iPhone.",
      });
      return;
    }

    // Google Fit: real OAuth + sync flow.
    if (provider === "google_fit") {
      const linked = byProvider["google_fit"];
      if (linked?.status === "connected") {
        setSyncing(provider);
        try {
          const res = await runGoogleFitSync();
          if (res.ok) toast.success("Google Fit synced", { description: `${res.written} metric(s) updated` });
          else toast.error("Sync failed", { description: res.reason });
        } catch (e) {
          toast.error("Sync failed", { description: e instanceof Error ? e.message : "unknown error" });
        } finally {
          setSyncing(null);
        }
        return;
      }
      setSyncing(provider);
      try {
        const { url } = await startGoogleFit();
        window.location.href = url;
      } catch (e) {
        setSyncing(null);
        toast.error("Could not start Google Fit auth", {
          description: e instanceof Error ? e.message : "Server not configured",
        });
      }
      return;
    }

    const { error } = await supabase
      .from("connected_devices")
      .upsert(
        { user_id: user.id, provider, display_name: name, status: "pending" },
        { onConflict: "user_id,provider" }
      );
    if (error) return toast.error(error.message);
    toast.success(`${name} link requested`, {
      description: "OAuth flow for this provider is not wired yet. Coming next.",
    });
  };

  const byProvider = Object.fromEntries(devices.map((d) => [d.provider, d]));
  const liveSteps = latest["steps"];
  const liveCalories = latest["calories"];
  const liveHeartRate = latest["heart_rate"];

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between">
        <SectionLabel>Connected Devices</SectionLabel>
        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <RefreshCw className="h-3 w-3 text-gold" /> Real-time
        </span>
      </div>

      {/* Live readouts */}
      <div className="mt-3 grid grid-cols-3 gap-2.5">
        <LiveCard label="Steps (live)" value={liveSteps ? Math.round(liveSteps.value).toLocaleString() : "—"} src={liveSteps?.provider} ts={liveSteps?.recorded_at} />
        <LiveCard label="Calories (live)" value={liveCalories ? Math.round(liveCalories.value).toLocaleString() : "—"} src={liveCalories?.provider} ts={liveCalories?.recorded_at} />
        <LiveCard label="Heart rate" value={liveHeartRate ? `${Math.round(liveHeartRate.value)} bpm` : "—"} src={liveHeartRate?.provider} ts={liveHeartRate?.recorded_at} />
      </div>

      {/* Provider list */}
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {PROVIDERS.map((p) => {
          const linked = byProvider[p.id];
          const connected = linked?.status === "connected";
          return (
            <div key={p.id} className="flex items-center justify-between border border-gold/15 bg-deluxe-forest/20 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <p.icon className="h-4 w-4 shrink-0 text-gold" />
                <div className="min-w-0">
                  <div className="text-sm text-foreground">{p.name}</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground truncate">
                    {connected && linked?.last_synced_at
                      ? `Synced ${formatDistanceToNow(new Date(linked.last_synced_at), { addSuffix: true })}`
                      : linked?.status === "pending"
                      ? "Awaiting authorization"
                      : p.blurb}
                  </div>
                </div>
              </div>
              {connected ? (
                <button
                  onClick={() => connect(p.id, p.name)}
                  disabled={syncing === p.id}
                  className="shrink-0 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-gold hover:opacity-80 disabled:opacity-50"
                >
                  {syncing === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                  {(p.id === "apple_health" && isIosNative()) || p.id === "google_fit" ? "Sync" : "Linked"}
                </button>
              ) : (
                <button
                  onClick={() => connect(p.id, p.name)}
                  disabled={syncing === p.id}
                  className="shrink-0 inline-flex items-center gap-1 border border-gold/40 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-gold hover:bg-gold/10 disabled:opacity-50"
                >
                  {syncing === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plug className="h-3 w-3" />}
                  {p.id === "apple_health" && isIosNative() ? "Sync now" : "Connect"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Health Connect migration toggle (Google Fit REST → Health Connect, 2026) */}
      <div className="mt-3 flex items-start justify-between gap-3 border border-gold/15 bg-deluxe-black/40 p-3">
        <div className="min-w-0">
          <div className="text-sm text-foreground">Use Health Connect (Android native)</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Migration path · Google Fit REST shuts down 2026
          </div>
          <div className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
            {healthConnectMode
              ? "When the Android app build ships, your phone will read steps and heart rate directly via Health Connect — same dashboard, no Google sign-in needed."
              : "Stay on the Google Fit OAuth flow for now. Toggle on to opt into the native Android pipeline once the app ships."}
          </div>
        </div>
        <button
          role="switch"
          aria-checked={healthConnectMode}
          onClick={() => setHealthConnectMode((v) => !v)}
          className={`relative mt-1 h-5 w-9 shrink-0 border transition ${
            healthConnectMode ? "border-gold bg-gold-gradient" : "border-gold/40 bg-deluxe-black"
          }`}
        >
          <span
            className={`absolute top-0.5 h-3.5 w-3.5 bg-deluxe-black transition-transform ${
              healthConnectMode ? "translate-x-[18px] bg-deluxe-black" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      <p className="mt-2 text-[10px] italic text-muted-foreground">
        Google Fit syncs live via OAuth. Apple Health requires the iOS app build. Fitbit, Strava, Garmin & Oura wire in next.
      </p>
    </div>
  );
}

function LiveCard({ label, value, src, ts }: { label: string; value: string; src?: string; ts?: string }) {
  return (
    <div className="border border-gold/20 bg-deluxe-forest/30 p-3">
      <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-lg text-foreground">{value}</div>
      <div className="mt-1 text-[9px] uppercase tracking-[0.18em] text-muted-foreground truncate">
        {src ? `${src.replace("_", " ")} · ${ts ? formatDistanceToNow(new Date(ts), { addSuffix: true }) : ""}` : "Not synced"}
      </div>
    </div>
  );
}
