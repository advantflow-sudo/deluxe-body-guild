import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, LineChart as LineChartIcon, Dumbbell, Flame, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SectionLabel } from "@/components/deluxe/ui";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/app/body-trends")({
  head: () => ({
    meta: [
      { title: "Body Trends — Deluxe Fitness" },
      { name: "description", content: "Track your muscle targets, completion rates, and workout outcomes over time." },
    ],
  }),
  component: BodyTrends,
});

interface Log { id: string; muscles: string[]; view: string; multi: boolean; matched_count: number; created_at: string }
interface Session { id: string; workout_id: string; duration_min: number | null; calories: number | null; completed_at: string }

const RANGE_DAYS = 30;

function BodyTrends() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const since = new Date(Date.now() - RANGE_DAYS * 86400000).toISOString();
    (async () => {
      const [{ data: logRows }, { data: sessRows }] = await Promise.all([
        supabase.from("body_map_selection_logs").select("id,muscles,view,multi,matched_count,created_at")
          .eq("user_id", user.id).gte("created_at", since).order("created_at", { ascending: true }),
        supabase.from("workout_sessions").select("id,workout_id,duration_min,calories,completed_at")
          .eq("user_id", user.id).gte("completed_at", since).order("completed_at", { ascending: true }),
      ]);
      setLogs((logRows ?? []) as Log[]);
      setSessions((sessRows ?? []) as Session[]);
      setLoading(false);
    })();
  }, [user]);

  const muscleCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of logs) for (const m of l.muscles ?? []) map.set(m, (map.get(m) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  }, [logs]);

  const dailySelections = useMemo(() => bucketByDay(logs.map((l) => l.created_at), RANGE_DAYS), [logs]);
  const dailyCompletions = useMemo(() => bucketByDay(sessions.map((s) => s.completed_at), RANGE_DAYS), [sessions]);

  const totalSelections = logs.length;
  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((a, s) => a + (s.duration_min ?? 0), 0);
  const totalCalories = sessions.reduce((a, s) => a + (s.calories ?? 0), 0);
  const completionRate = totalSelections > 0 ? Math.round((totalSessions / totalSelections) * 100) : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-28 sm:px-6">
      <div className="flex items-center justify-between">
        <Link to="/app/body" className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground hover:text-gold">
          <ChevronLeft className="h-3 w-3" /> Target Your Body
        </Link>
        <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Last {RANGE_DAYS} days</span>
      </div>

      <div className="mt-6 text-center">
        <SectionLabel>Coach View</SectionLabel>
        <h1 className="mt-3 font-display text-3xl uppercase tracking-wide text-foreground sm:text-4xl">Body Trends</h1>
        <p className="mx-auto mt-2 max-w-xl text-xs text-muted-foreground sm:text-sm">
          Your hotspot selections, workout completions, and outcomes — for you and your coach.
        </p>
      </div>

      {loading ? (
        <div className="mt-16 text-center text-xs text-muted-foreground">Loading trends…</div>
      ) : (
        <>
          <div className="mt-8 grid gap-3 sm:grid-cols-4">
            <Stat icon={Target} label="Selections" value={totalSelections} />
            <Stat icon={Dumbbell} label="Workouts completed" value={totalSessions} sub={`${completionRate}% follow-through`} />
            <Stat icon={LineChartIcon} label="Total minutes" value={totalMinutes} />
            <Stat icon={Flame} label="Calories burned" value={totalCalories} />
          </div>

          <section className="mt-8 rounded-lg border border-gold/20 bg-deluxe-forest/10 p-5">
            <div className="text-[10px] uppercase tracking-[0.28em] text-gold/80">Daily activity</div>
            <h2 className="mt-1 font-display text-xl text-foreground">Selections vs completions</h2>
            <div className="mt-4">
              <DualBarChart days={RANGE_DAYS} a={dailySelections} b={dailyCompletions} aLabel="Selections" bLabel="Completions" />
            </div>
          </section>

          <section className="mt-6 rounded-lg border border-gold/20 bg-deluxe-forest/10 p-5">
            <div className="text-[10px] uppercase tracking-[0.28em] text-gold/80">Muscle focus</div>
            <h2 className="mt-1 font-display text-xl text-foreground">Most-selected hotspots</h2>
            {muscleCounts.length === 0 ? (
              <div className="mt-4 text-xs text-muted-foreground">No hotspot selections logged yet.</div>
            ) : (
              <ul className="mt-4 space-y-2">
                {muscleCounts.map(([label, count]) => {
                  const pct = Math.round((count / muscleCounts[0][1]) * 100);
                  return (
                    <li key={label}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="capitalize text-foreground">{label.replace("_", " ")}</span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-deluxe-black/60">
                        <div className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="mt-6 rounded-lg border border-gold/20 bg-deluxe-forest/10 p-5">
            <div className="text-[10px] uppercase tracking-[0.28em] text-gold/80">Workout outcomes</div>
            <h2 className="mt-1 font-display text-xl text-foreground">Duration & calories over time</h2>
            <div className="mt-4">
              <Sparkline data={sessions.map((s) => s.duration_min ?? 0)} label="Duration (min)" color="#d4af37" />
              <div className="mt-4">
                <Sparkline data={sessions.map((s) => s.calories ?? 0)} label="Calories" color="#f59e0b" />
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: typeof Target; label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-lg border border-gold/20 bg-deluxe-forest/10 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-gold" />
      </div>
      <div className="mt-2 font-display text-2xl text-foreground">{value.toLocaleString()}</div>
      {sub && <div className="mt-0.5 text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function bucketByDay(dates: string[], days: number) {
  const out = new Array(days).fill(0);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  for (const iso of dates) {
    const d = new Date(iso); d.setHours(0, 0, 0, 0);
    const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
    const idx = days - 1 - diff;
    if (idx >= 0 && idx < days) out[idx] += 1;
  }
  return out;
}

function DualBarChart({ days, a, b, aLabel, bLabel }: { days: number; a: number[]; b: number[]; aLabel: string; bLabel: string }) {
  const max = Math.max(1, ...a, ...b);
  const W = 720, H = 180, pad = 20;
  const bw = (W - pad * 2) / days;
  return (
    <>
      <div className="mb-2 flex items-center gap-4 text-[10px] uppercase tracking-[0.22em]">
        <span className="inline-flex items-center gap-1 text-gold"><span className="h-2 w-2 rounded-full bg-gold" />{aLabel}</span>
        <span className="inline-flex items-center gap-1 text-muted-foreground"><span className="h-2 w-2 rounded-full bg-[#22c55e]" />{bLabel}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${aLabel} vs ${bLabel} bar chart for the last ${days} days`}>
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="rgba(212,175,55,0.2)" />
        {a.map((v, i) => {
          const h = ((v / max) * (H - pad * 2));
          const x = pad + i * bw;
          const h2 = ((b[i] / max) * (H - pad * 2));
          return (
            <g key={i}>
              <rect x={x + 1} y={H - pad - h} width={Math.max(1, bw / 2 - 2)} height={h} fill="#d4af37" opacity={0.9} />
              <rect x={x + bw / 2 + 1} y={H - pad - h2} width={Math.max(1, bw / 2 - 2)} height={h2} fill="#22c55e" opacity={0.85} />
            </g>
          );
        })}
      </svg>
    </>
  );
}

function Sparkline({ data, label, color }: { data: number[]; label: string; color: string }) {
  if (data.length === 0) return <div className="text-xs text-muted-foreground">No {label.toLowerCase()} data yet.</div>;
  const max = Math.max(1, ...data);
  const W = 720, H = 80, pad = 10;
  const step = (W - pad * 2) / Math.max(1, data.length - 1);
  const points = data.map((v, i) => `${pad + i * step},${H - pad - (v / max) * (H - pad * 2)}`).join(" ");
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        <span>{label}</span>
        <span>max {max}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${label} sparkline`}>
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}
