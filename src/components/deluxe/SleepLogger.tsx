import { useCallback, useEffect, useState } from "react";
import { Moon } from "lucide-react";
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
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("daily_stats").select("sleep_hours")
      .eq("user_id", user.id).eq("stat_date", todayIso()).maybeSingle();
    setHours(Number(data?.sleep_hours ?? 0));
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const persist = async (val: number) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("daily_stats")
      .upsert(
        { user_id: user.id, stat_date: todayIso(), sleep_hours: val },
        { onConflict: "user_id,stat_date" }
      );
    setSaving(false);
    if (error) toast.error(error.message);
  };

  const pct = Math.min(100, (hours / TARGET) * 100);

  return (
    <section className="mt-5 border border-gold/20 bg-deluxe-forest/20 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Moon className="h-3.5 w-3.5 text-gold" />
          <SectionLabel>Sleep Last Night</SectionLabel>
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {hours.toFixed(1)}h <span className="text-foreground/40">/ {TARGET}h</span>
        </div>
      </div>

      <div className="mt-3 h-2 w-full bg-gold/10 overflow-hidden">
        <div className="h-full bg-gold-gradient transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-4">
        <Slider
          min={0}
          max={12}
          step={0.5}
          value={[hours]}
          onValueChange={(v) => setHours(v[0])}
          onValueCommit={(v) => persist(v[0])}
          disabled={saving}
        />
        <div className="mt-2 flex justify-between text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>0h</span><span>6h</span><span>12h</span>
        </div>
      </div>
    </section>
  );
}
