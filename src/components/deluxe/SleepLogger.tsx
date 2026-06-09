import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Moon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SectionLabel } from "@/components/deluxe/ui";
import { Slider } from "@/components/ui/slider";

const TARGET = 7.5;
const todayIso = () => new Date().toISOString().slice(0, 10);

export function SleepLogger() {
  const { user } = useAuth();
  const [hours, setHours] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const lastSaved = useRef(0);

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("daily_stats").select("sleep_hours")
      .eq("user_id", user.id).eq("stat_date", todayIso()).maybeSingle();
    if (error) toast.error(error.message);
    const val = Number(data?.sleep_hours ?? 0);
    setHours(val);
    lastSaved.current = val;
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const persist = async (val: number) => {
    if (!user) return;
    const previous = lastSaved.current;
    setSaving(true);
    const { error } = await supabase
      .from("daily_stats")
      .upsert(
        { user_id: user.id, stat_date: todayIso(), sleep_hours: val },
        { onConflict: "user_id,stat_date" }
      );
    setSaving(false);
    if (error) {
      setHours(previous);
      toast.error(`Couldn't save sleep: ${error.message}`);
    } else {
      lastSaved.current = val;
    }
  };

  const pct = Math.min(100, (hours / TARGET) * 100);

  return (
    <section className="mt-5 border border-gold/20 bg-deluxe-forest/20 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Moon className="h-3.5 w-3.5 text-gold" />
          <SectionLabel>Sleep Last Night</SectionLabel>
          {saving && <Loader2 className="h-3 w-3 animate-spin text-gold/70" />}
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground tabular-nums">
          {hours.toFixed(1)}h <span className="text-foreground/40">/ {TARGET}h</span>
        </div>
      </div>

      <div className="mt-3 h-2 w-full bg-gold/10 overflow-hidden">
        {loading ? (
          <div className="h-full w-1/3 animate-pulse bg-gold/30" />
        ) : (
          <div className="h-full bg-gold-gradient transition-all duration-500" style={{ width: `${pct}%` }} />
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
        />
        <div className="mt-2 flex justify-between text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>0h</span><span>6h</span><span>12h</span>
        </div>
      </div>
    </section>
  );
}
