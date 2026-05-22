import { useEffect, useState } from "react";
import { Smartphone, Watch, Activity, CheckCircle2, Plug, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SectionLabel } from "@/components/deluxe/ui";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { isIosNative, syncAppleHealthNow } from "@/lib/healthkit-sync";

type Provider = "apple_health" | "fitbit" | "garmin" | "strava" | "oura" | "google_fit";

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
  const [devices, setDevices] = useState<Device[]>([]);
  const [latest, setLatest] = useState<Record<string, LiveMetric>>({});

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
                <span className="inline-flex shrink-0 items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-gold">
                  <CheckCircle2 className="h-3 w-3" /> Linked
                </span>
              ) : (
                <button
                  onClick={() => connect(p.id, p.name)}
                  className="shrink-0 inline-flex items-center gap-1 border border-gold/40 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-gold hover:bg-gold/10"
                >
                  <Plug className="h-3 w-3" /> Connect
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-2 text-[10px] italic text-muted-foreground">
        Apple Health needs the iOS app build. Web-based providers (Fitbit, Strava, Garmin, Oura, Google Fit) can be wired via OAuth next.
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
