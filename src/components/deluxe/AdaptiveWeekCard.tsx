import { useState } from "react";
import { CalendarRange, Loader2, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { adaptiveWeek } from "@/lib/coach-memory.functions";
import { SectionLabel } from "@/components/deluxe/ui";

type Plan = {
  rationale: string;
  intensity: string;
  readiness: number | null;
  days: Array<{ day: string; focus: string; duration_min: number; blocks: string[] }>;
};

export function AdaptiveWeekCard() {
  const run = useServerFn(adaptiveWeek);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [openDay, setOpenDay] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const res = (await run()) as Plan;
      setPlan(res);
      setOpenDay(res.days?.[0]?.day ?? null);
    } catch (e) {
      toast.error("Could not build your week", { description: e instanceof Error ? e.message : "unknown error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-5">
      <SectionLabel>Adaptive Week</SectionLabel>
      <div className="mt-3 border border-gold/20 bg-deluxe-forest/25 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 font-display text-base text-foreground">
              <CalendarRange className="h-4 w-4 text-gold" /> Next 7 days
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              Built from your recent training, strength trend, remembered limits and today's readiness.
            </p>
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="shrink-0 inline-flex min-h-11 items-center gap-1.5 bg-gold-gradient px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-deluxe-black disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {plan ? "Rebuild" : "Build"}
          </button>
        </div>

        {plan && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-2 text-[9px] uppercase tracking-[0.2em]">
              <span className="border border-gold/40 px-2 py-1 text-gold">{plan.intensity}</span>
              {plan.readiness !== null && (
                <span className="border border-gold/20 px-2 py-1 text-muted-foreground">Readiness {plan.readiness}/100</span>
              )}
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{plan.rationale}</p>
            <div className="mt-3 divide-y divide-gold/10 border border-gold/10">
              {plan.days.map((d) => (
                <div key={d.day}>
                  <button
                    onClick={() => setOpenDay((v) => (v === d.day ? null : d.day))}
                    aria-expanded={openDay === d.day}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left"
                  >
                    <span className="min-w-0 truncate text-xs text-foreground">
                      <span className="text-gold">{d.day}</span> · {d.focus}
                    </span>
                    <span className="ml-2 shrink-0 text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                      {d.duration_min} min
                    </span>
                  </button>
                  {openDay === d.day && (
                    <ul className="space-y-1 px-3 pb-3 text-[11px] leading-relaxed text-muted-foreground">
                      {d.blocks.map((b, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-gold">·</span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
