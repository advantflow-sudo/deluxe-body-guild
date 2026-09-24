/** 7/30/90-day muscle activity from stored workout recaps, with imbalance hints. */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SectionLabel } from "@/components/deluxe/ui";
import { MuscleMap, MAPPED_MUSCLES, toIntensity } from "@/components/deluxe/MuscleMap";

const RANGES = [7, 30, 90] as const;

export function MuscleActivity() {
  const { user } = useAuth();
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [sessions, setSessions] = useState(0);

  useEffect(() => {
    if (!user) return;
    const since = new Date(Date.now() - days * 864e5).toISOString();
    void supabase.from("workout_sessions").select("recap").eq("user_id", user.id).not("recap", "is", null).gte("completed_at", since)
      .then(({ data }) => {
        const c: Record<string, number> = {};
        for (const r of data ?? []) for (const [k, v] of Object.entries((r.recap as { muscles?: Record<string, number> })?.muscles ?? {})) c[k] = (c[k] ?? 0) + Number(v);
        setCounts(c);
        setSessions(data?.length ?? 0);
      });
  }, [user, days]);

  const total = Object.values(counts).reduce((s, v) => s + v, 0);
  const neglected = total >= 12 ? MAPPED_MUSCLES.filter((m) => (counts[m] ?? 0) < total * 0.05) : [];
  const push = (counts.chest ?? 0) + (counts.shoulders ?? 0);
  const pull = counts.back ?? 0;
  const ratioNote = total >= 12 && push > 0 && pull > 0 && (push / pull > 1.8 || pull / push > 1.8)
    ? `${push > pull ? "Pushing" : "Pulling"} volume is about ${Math.round(Math.max(push / pull, pull / push) * 10) / 10}× the other — worth balancing.`
    : null;

  return (
    <section className="mt-6 border border-gold/20 bg-deluxe-black/40 p-4">
      <div className="flex items-center justify-between">
        <SectionLabel>Muscle activity</SectionLabel>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button key={r} onClick={() => setDays(r)} aria-pressed={days === r}
              className={`px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.15em] ${days === r ? "bg-gold text-deluxe-black" : "border border-gold/30 text-muted-foreground"}`}>{r}d</button>
          ))}
        </div>
      </div>
      {total === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">Finish a workout to start building your muscle map.</p>
      ) : (
        <>
          <div className="mt-4"><MuscleMap intensity={toIntensity(counts)} /></div>
          <ul className="mt-4 grid grid-cols-3 gap-1.5 text-center">
            {MAPPED_MUSCLES.map((m) => (
              <li key={m} className="border border-gold/10 py-1.5">
                <div className="font-display text-base text-gold tabular-nums">{counts[m] ?? 0}</div>
                <div className="text-[8px] uppercase tracking-[0.2em] text-muted-foreground">{m} sets</div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-muted-foreground">{sessions} session{sessions === 1 ? "" : "s"} in the last {days} days.</p>
          {(neglected.length > 0 || ratioNote) && (
            <div className="mt-2 border border-gold/20 bg-gold/5 p-2.5 text-[11px] leading-relaxed text-foreground">
              {neglected.length > 0 && <div>Little or no work for: <span className="text-gold">{neglected.join(", ")}</span>.</div>}
              {ratioNote && <div>{ratioNote}</div>}
            </div>
          )}
        </>
      )}
    </section>
  );
}
