import { useEffect, useRef, useState } from "react";
import { Sparkles, TrendingUp } from "lucide-react";
import { SectionLabel } from "@/components/deluxe/ui";
import { useDeluxeScore } from "@/hooks/useDeluxeScore";
import { Confetti } from "./Confetti";
import { ScoreBreakdownDrawer, type ScoreCategory } from "./ScoreBreakdownDrawer";

function getRating(score: number): { label: string; tone: string } {
  if (score >= 90) return { label: "Elite", tone: "text-gold" };
  if (score >= 75) return { label: "Strong", tone: "text-emerald-400" };
  if (score >= 50) return { label: "Improving", tone: "text-amber-400" };
  return { label: "Rebuild", tone: "text-rose-400" };
}

const todayIso = () => new Date().toISOString().slice(0, 10);
const CONFETTI_KEY = (d: string) => `df_score_confetti_${d}`;

export function DeluxeScoreBreakdown() {
  const s = useDeluxeScore();
  const [animated, setAnimated] = useState(0);
  const [confetti, setConfetti] = useState(false);
  const [openCat, setOpenCat] = useState<ScoreCategory | null>(null);
  const lastTotal = useRef(0);

  useEffect(() => {
    if (s.loading) return;
    const start = animated;
    const target = s.total;
    const duration = 900;
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

  // Confetti: fire once per day when crossing into 100
  useEffect(() => {
    if (s.loading) return;
    const prev = lastTotal.current;
    lastTotal.current = s.total;
    if (s.total >= 100 && prev < 100) {
      if (typeof window !== "undefined") {
        const key = CONFETTI_KEY(todayIso());
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, "1");
          setConfetti(true);
        }
      }
    }
  }, [s.total, s.loading]);

  const rating = getRating(s.total);
  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference - (Math.min(s.total, 100) / 100) * circumference;
  const glow = s.total >= 80;

  const components: { key: ScoreCategory; label: string; earned: number; max: number }[] = [
    { key: "training", label: "Train", earned: s.training, max: 20 },
    { key: "water", label: "Water", earned: s.water, max: 10 },
    { key: "nutrition", label: "Food", earned: s.nutrition, max: 15 },
    { key: "sleep", label: "Sleep", earned: s.sleep, max: 15 },
    { key: "goals", label: "Goals", earned: s.dailyGoals, max: 40 },
  ];

  if (s.loading) {
    return <div className="mt-5 h-44 animate-pulse border border-gold/15 bg-deluxe-forest/10" />;
  }

  return (
    <>
      <section className="relative mt-5 border border-gold/30 bg-deluxe-forest/30 p-5 sm:p-6">
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
                style={glow ? { filter: "drop-shadow(0 0 6px rgba(245,217,122,0.7))" } : undefined}
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
                className={`font-display text-3xl sm:text-4xl tabular-nums transition-all ${
                  glow ? "text-gold [text-shadow:0_0_20px_rgba(245,217,122,0.7)]" : "text-foreground"
                }`}
              >
                {animated}
              </div>
              <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">/ 100</div>
            </div>
            <Confetti fire={confetti} onDone={() => setConfetti(false)} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Today's Rating</div>
            <div className={`font-display text-2xl sm:text-3xl ${rating.tone}`}>{rating.label}</div>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-gold" />
              {100 - s.total === 0 ? "Perfect day" : `${100 - s.total} pts to Elite`}
            </div>
            <div className="mt-1 text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70">
              Tap a category for details
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-5 gap-1.5">
          {components.map((c) => {
            const pct = c.max > 0 ? Math.min(1, c.earned / c.max) : 0;
            const hit = c.earned >= c.max;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setOpenCat(c.key)}
                className="group text-center transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                aria-label={`View ${c.label} breakdown`}
              >
                <div className="relative h-1 w-full bg-gold/10 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gold-gradient transition-all duration-700"
                    style={{ width: `${pct * 100}%` }}
                  />
                </div>
                <div className="mt-1.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground group-hover:text-gold">
                  {c.label}
                </div>
                <div className={`text-[10px] tabular-nums ${hit ? "text-gold" : "text-foreground/70"}`}>
                  {c.earned}/{c.max}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <ScoreBreakdownDrawer
        open={openCat !== null}
        onOpenChange={(o) => !o && setOpenCat(null)}
        category={openCat}
        score={s}
      />
    </>
  );
}
