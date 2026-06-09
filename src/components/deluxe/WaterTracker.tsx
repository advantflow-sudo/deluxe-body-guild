import { useCallback, useEffect, useState } from "react";
import { Droplet, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SectionLabel } from "@/components/deluxe/ui";

const TARGET_ML = 3000;
const STEP_ML = 250;
const todayIso = () => new Date().toISOString().slice(0, 10);

export function WaterTracker() {
  const { user } = useAuth();
  const [ml, setMl] = useState(0);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("daily_stats").select("water_ml")
      .eq("user_id", user.id).eq("stat_date", todayIso()).maybeSingle();
    setMl((data?.water_ml as number | undefined) ?? 0);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const update = async (next: number) => {
    if (!user) return;
    const clamped = Math.max(0, Math.min(8000, next));
    setMl(clamped);
    setSaving(true);
    const { error } = await supabase
      .from("daily_stats")
      .upsert(
        { user_id: user.id, stat_date: todayIso(), water_ml: clamped },
        { onConflict: "user_id,stat_date" }
      );
    setSaving(false);
    if (error) {
      toast.error(error.message);
      await load();
    }
  };

  const pct = Math.min(100, Math.round((ml / TARGET_ML) * 100));

  return (
    <section className="mt-5 border border-gold/20 bg-deluxe-forest/20 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplet className="h-3.5 w-3.5 text-gold" />
          <SectionLabel>Hydration</SectionLabel>
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {(ml / 1000).toFixed(2)}L <span className="text-foreground/40">/ {(TARGET_ML / 1000).toFixed(1)}L</span>
        </div>
      </div>

      <div className="mt-3 h-2 w-full bg-gold/10 overflow-hidden">
        <div className="h-full bg-gold-gradient transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => update(ml - STEP_ML)}
          disabled={saving || ml <= 0}
          className="flex h-10 w-10 items-center justify-center border border-gold/30 text-gold hover:bg-gold/10 disabled:opacity-30"
          aria-label="Remove 250ml"
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="text-center">
          <div className="font-display text-2xl text-foreground tabular-nums">{ml}<span className="text-xs text-muted-foreground"> ml</span></div>
          <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">+{STEP_ML}ml per tap</div>
        </div>
        <button
          type="button"
          onClick={() => update(ml + STEP_ML)}
          disabled={saving}
          className="flex h-10 w-10 items-center justify-center bg-gold text-deluxe-black hover:bg-gold-light disabled:opacity-50"
          aria-label="Add 250ml"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
