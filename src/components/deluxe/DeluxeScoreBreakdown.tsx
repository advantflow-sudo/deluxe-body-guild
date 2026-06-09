import { useEffect, useState } from "react";
import { Sparkles, TrendingUp } from "lucide-react";
import { SectionLabel } from "@/components/deluxe/ui";
import { useDeluxeScore } from "@/hooks/useDeluxeScore";

function getRating(score: number): { label: string; tone: string } {
  if (score >= 90) return { label: "Elite", tone: "text-gold" };
  if (score >= 75) return { label: "Strong", tone: "text-emerald-400" };
  if (score >= 50) return { label: "Improving", tone: "text-amber-400" };
  return { label: "Rebuild", tone: "text-rose-400" };
}

export function DeluxeScoreBreakdown() {
  const s = useDeluxeScore();
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    if (s.loading) return;
    const start = animated;
    const target = s.total;
    const duration = 800;
    const startedAt = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - startedAt) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setAnimated(Math.round(start + (target - start) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.total, s.loading]);

  const rating = getRating(s.total);
  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference - (Math.min(s.total, 100) / 100) * circumference;

  const components = [
    { label: "Train", earned: s.training, max: 20, hit: s.training >= 20 },
    { label: "Water", earned: s.water, max: 10, hit: s.water >= 10 },
    { label: "Food", earned: s.nutrition, max: 15, hit: s.nutrition >= 15 },
    { label: "Sleep", earned: s.sleep, max: 15, hit: s.sleep >= 15 },
    { label: "Goals", earned: s.dailyGoals, max: 40, hit: s.dailyGoals >= 40 },
  ];

  if (s.loading) {
    return <div className="mt-5 h-44 animate-pulse border border-gold/15 bg-deluxe-forest/10" />;
  }

  return (
    <section className="mt-5 border border-gold/30 bg-deluxe-forest/30 p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-gold" />
        <SectionLabel>Deluxe Score</SectionLabel>
      </div>

      <div className="mt-4 flex items-center gap-5 sm:gap-6">
        <div className="relative h-28 w-28 shrink-0 sm:h-32 sm:w-32">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="42" fill="none" stroke="url(#deluxeBreakGrad)" strokeWidth="6"
              strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
              className="transition-all duration-700"
            />
            <defs>
              <linearGradient id="deluxeBreakGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f5d97a" />
                <stop offset="100%" stopColor="#d4af37" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div
              className={`font-display text-3xl sm:text-4xl tabular-nums ${s.total >= 80 ? "text-gold [text-shadow:0_0_18px_rgba(245,217,122,0.55)]" : "text-foreground"}`}
            >
              {animated}
            </div>
            <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">/ 100</div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Today's Rating</div>
          <div className={`font-display text-2xl sm:text-3xl ${rating.tone}`}>{rating.label}</div>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-gold" />
            {100 - s.total === 0 ? "Perfect day" : `${100 - s.total} pts to Elite`}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-1.5">
        {components.map((c) => {
          const pct = c.max > 0 ? Math.min(1, c.earned / c.max) : 0;
          return (
            <div key={c.label} className="text-center">
              <div className="relative h-1 w-full bg-gold/10 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gold-gradient transition-all duration-700"
                  style={{ width: `${pct * 100}%` }}
                />
              </div>
              <div className="mt-1.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{c.label}</div>
              <div className={`text-[10px] tabular-nums ${c.hit ? "text-gold" : "text-foreground/70"}`}>
                {c.earned}/{c.max}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
