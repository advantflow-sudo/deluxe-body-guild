import { useCallback, useEffect, useRef, useState } from "react";
import { CloudOff, Loader2, Moon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SectionLabel } from "@/components/deluxe/ui";
import { Slider } from "@/components/ui/slider";
import { enqueueOrApply, useOnline, useQueueSize } from "@/lib/offlineQueue";

const TARGET = 7.5;
const todayIso = () => new Date().toISOString().slice(0, 10);

export function SleepLogger() {
  const { user } = useAuth();
  const [hours, setHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const lastSaved = useRef(0);
  const online = useOnline();
  const queued = useQueueSize();

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("daily_stats").select("sleep_hours")
      .eq("user_id", user.id).eq("stat_date", todayIso()).maybeSingle();
    if (error && online) toast.error(error.message);
    const val = Number(data?.sleep_hours ?? lastSaved.current);
    setHours(val);
    lastSaved.current = val;
    setLoading(false);
  }, [user, online]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (online && queued === 0 && !loading) void load(); }, [online, queued, loading, load]);

  const persist = async (val: number) => {
    if (!user) return;
    const previous = lastSaved.current;
    setSaving(true);
    const result = await enqueueOrApply({
      kind: "dailyStats", userId: user.id, date: todayIso(),
      patch: { sleep_hours: val },
    });
    setSaving(false);
    if (!result.ok) {
      setHours(previous);
      toast.error(`Couldn't save sleep: ${result.error}`);
    } else {
      lastSaved.current = val;
      if (result.queued) toast("Saved offline — will sync when reconnected", { icon: <CloudOff className="h-4 w-4" /> });
    }
  };

  const pct = Math.min(100, (hours / TARGET) * 100);

  return (
    <section className="mt-5 border border-gold/20 bg-deluxe-forest/20 p-4 sm:p-5" aria-labelledby="sleep-heading">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Moon className="h-3.5 w-3.5 text-gold" aria-hidden />
          <SectionLabel id="sleep-heading">Sleep Last Night</SectionLabel>
          {saving && <Loader2 className="h-3 w-3 animate-spin text-gold/70" aria-label="Saving sleep" />}
          {!online && <CloudOff className="h-3 w-3 text-amber-400" aria-label="Offline — changes queued" />}
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground tabular-nums" aria-live="polite">
          {hours.toFixed(1)}h <span className="text-foreground/40">/ {TARGET}h</span>
        </div>
      </div>

      <div className="mt-3 h-2 w-full bg-gold/10 overflow-hidden" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={`${Math.round(pct)}% of sleep target`}>
        {loading ? (
          <div className="h-full w-1/3 animate-pulse bg-gold/30" />
        ) : (
          <div className="h-full bg-gold-gradient transition-all duration-500 motion-reduce:transition-none" style={{ width: `${pct}%` }} />
        )}
      </div>

      <div className="mt-4">
        <Slider
          min={0}
          max={12}
          step={0.5}
          value={[hours]}
          onValueChange={(v) => setHours(v[0])}
          onValueCommit={(v) => persist(v[0])}
          disabled={loading}
          aria-label="Sleep hours"
        />
        <div className="mt-2 flex justify-between text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>0h</span><span>6h</span><span>12h</span>
        </div>
      </div>
    </section>
  );
}
