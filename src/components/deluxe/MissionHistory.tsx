import { useEffect, useState } from "react";
import { ChevronDown, Check, Dumbbell, Droplet, Beef, Sparkles, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SectionLabel } from "@/components/deluxe/ui";
import { haptic } from "@/hooks/useHaptics";

const REASONS = ["mission_workout", "mission_water", "mission_protein", "mission_mindset"] as const;
type Reason = (typeof REASONS)[number];

const META: Record<Reason, { label: string; icon: typeof Dumbbell; xp: number }> = {
  mission_workout: { label: "Workout or planned recovery", icon: Dumbbell, xp: 50 },
  mission_water: { label: "Hydration target", icon: Droplet, xp: 20 },
  mission_protein: { label: "Protein target", icon: Beef, xp: 20 },
  mission_mindset: { label: "Mindset check-in", icon: Sparkles, xp: 10 },
};

type Row = { reason: string; amount: number; event_date: string; created_at: string };
type Day = { date: string; total: number; items: Row[] };

function label(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  const today = new Date();
  const diff = Math.round((today.setHours(12, 0, 0, 0) - d.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

export function MissionHistory({ refreshKey = 0 }: { refreshKey?: number }) {
  const { user } = useAuth();
  const [days, setDays] = useState<Day[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const since = new Date(Date.now() - 89 * 86400000).toISOString().slice(0, 10);
      const { data } = await supabase
        .from("xp_events")
        .select("reason,amount,event_date,created_at")
        .eq("user_id", user.id)
        .in("reason", REASONS as unknown as string[])
        .gte("event_date", since)
        .order("event_date", { ascending: false });

      const map = new Map<string, Day>();
      for (const r of (data ?? []) as Row[]) {
        const d = map.get(r.event_date) ?? { date: r.event_date, total: 0, items: [] };
        d.total += Number(r.amount ?? 0);
        d.items.push(r);
        map.set(r.event_date, d);
      }
      setDays([...map.values()]);
      setLoading(false);
    })();
  }, [user, refreshKey]);

  const perfect = days.filter((d) => d.total >= 100).length;
  const lifetime = days.reduce((s, d) => s + d.total, 0);

  if (loading) return <div className="mt-5 h-32 animate-pulse border border-gold/15 bg-deluxe-forest/10" />;

  return (
    <section className="mt-5 border border-gold/20 bg-deluxe-forest/12 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <SectionLabel>Mission history</SectionLabel>
          <h2 className="mt-1 font-display text-lg text-foreground">Every claim, on the record.</h2>
        </div>
        <History className="h-4 w-4 shrink-0 text-gold" />
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.18em]">
        <span className="border border-gold/30 px-2.5 py-1 text-gold">{perfect} perfect 100 XP days</span>
        <span className="border border-gold/15 px-2.5 py-1 text-muted-foreground">
          {lifetime.toLocaleString()} mission XP · last 90 days
        </span>
      </div>

      {days.length === 0 ? (
        <p className="mt-4 text-[11px] text-muted-foreground">
          No claims logged yet. Complete an action above and your timeline starts today.
        </p>
      ) : (
        <ol className="mt-4 space-y-2">
          {days.map((d) => {
            const isOpen = open === d.date;
            const full = d.total >= 100;
            return (
              <li key={d.date} className="border border-gold/15 bg-deluxe-black/40">
                <button
                  onClick={() => {
                    haptic("selection");
                    setOpen(isOpen ? null : d.date);
                  }}
                  aria-expanded={isOpen}
                  className="flex w-full min-h-12 items-center gap-3 px-3 py-2.5 text-left"
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold ${
                      full ? "bg-gold text-deluxe-black" : "border border-gold/30 text-gold"
                    }`}
                  >
                    {full ? <Check className="h-3.5 w-3.5" /> : d.items.length}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-foreground">{label(d.date)}</span>
                    <span className="block text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                      {d.total} XP · {d.items.length} of 4 actions
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-gold transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <ul className="border-t border-gold/10 px-3 py-2">
                    {REASONS.map((r) => {
                      const hit = d.items.find((i) => i.reason === r);
                      const Icon = META[r].icon;
                      return (
                        <li key={r} className="flex items-center gap-2.5 py-1.5">
                          <Icon className={`h-3.5 w-3.5 shrink-0 ${hit ? "text-gold" : "text-muted-foreground"}`} />
                          <span
                            className={`min-w-0 flex-1 truncate text-[11px] ${
                              hit ? "text-foreground" : "text-muted-foreground line-through"
                            }`}
                          >
                            {META[r].label}
                          </span>
                          <span className="shrink-0 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                            {hit
                              ? `+${hit.amount} XP · ${new Date(hit.created_at).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}`
                              : "Not claimed"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
