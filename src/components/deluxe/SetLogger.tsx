import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Row = { reps: string; kg: string; saved: boolean };

/** Per-set reps × weight logging for one exercise in a live session. */
export function SetLogger({
  sessionId, userId, blockId, exerciseId, sets, targetReps,
}: { sessionId: string; userId: string; blockId: string; exerciseId: string; sets: number; targetReps: string }) {
  const [rows, setRows] = useState<Row[]>(() => Array.from({ length: Math.max(1, sets) }, () => ({ reps: "", kg: "", saved: false })));
  const [last, setLast] = useState<string | null>(null);

  useEffect(() => {
    void supabase
      .from("workout_set_logs")
      .select("reps,weight_kg,session_id")
      .eq("user_id", userId)
      .eq("exercise_id", exerciseId)
      .neq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (!data?.length) return;
        const sid = data[0].session_id;
        const best = data.filter((d) => d.session_id === sid).sort((a, b) => Number(b.weight_kg) - Number(a.weight_kg) || b.reps - a.reps)[0];
        setLast(`${Number(best.weight_kg)}kg × ${best.reps}`);
        setRows((r) => r.map((x) => (x.kg ? x : { ...x, kg: String(Number(best.weight_kg) || "") })));
      });
  }, [userId, exerciseId, sessionId]);

  const save = async (i: number) => {
    const r = rows[i];
    const reps = parseInt(r.reps, 10);
    if (!Number.isFinite(reps) || reps <= 0) return;
    const kg = Math.max(0, parseFloat(r.kg) || 0);
    const { error } = await supabase.from("workout_set_logs").upsert(
      { user_id: userId, session_id: sessionId, block_id: blockId, exercise_id: exerciseId, set_number: i + 1, reps, weight_kg: kg },
      { onConflict: "session_id,block_id,exercise_id,set_number" },
    );
    if (error) return toast.error(error.message);
    setRows((all) => all.map((x, j) => (j === i ? { ...x, saved: true } : x)));
  };

  const update = (i: number, k: "reps" | "kg", v: string) =>
    setRows((all) => all.map((x, j) => (j === i ? { ...x, [k]: v, saved: false } : x)));

  return (
    <div className="border border-t-0 border-gold/10 bg-deluxe-black/40 px-3 py-2">
      {last && <div className="mb-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Last time · <span className="text-gold">{last}</span></div>}
      <div className="space-y-1.5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-10 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Set {i + 1}</span>
            <input inputMode="decimal" aria-label={`Set ${i + 1} weight in kg`} placeholder="kg" value={r.kg}
              onChange={(e) => update(i, "kg", e.target.value)} onBlur={() => save(i)}
              className="w-16 border border-gold/20 bg-deluxe-black px-2 py-1 text-foreground focus:border-gold/60 focus:outline-none" />
            <span className="text-muted-foreground">×</span>
            <input inputMode="numeric" aria-label={`Set ${i + 1} reps`} placeholder={targetReps} value={r.reps}
              onChange={(e) => update(i, "reps", e.target.value)} onBlur={() => save(i)}
              className="w-14 border border-gold/20 bg-deluxe-black px-2 py-1 text-foreground focus:border-gold/60 focus:outline-none" />
            {r.saved && <span className="text-[10px] uppercase tracking-[0.15em] text-gold">Saved</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
