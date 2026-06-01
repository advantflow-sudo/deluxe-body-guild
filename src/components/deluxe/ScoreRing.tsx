import { useEffect, useState } from "react";

interface Props {
  score: number;
  workoutPts?: number;
  habitsPts?: number;
  mindsetPts?: number;
  socialPts?: number;
  size?: number;
}

export function ScoreRing({
  score,
  workoutPts = 0,
  habitsPts = 0,
  mindsetPts = 0,
  socialPts = 0,
  size = 140,
}: Props) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 50);
    return () => clearTimeout(t);
  }, [score]);

  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(animated, 100) / 100) * c;

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(212,175,55,0.12)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#scoreGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          fill="none"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#f5d76e" />
          </linearGradient>
        </defs>
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-4xl text-foreground tabular-nums">{Math.round(animated)}</div>
        <div className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">Deluxe Score</div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
        {[
          { label: "Train", v: workoutPts, max: 40 },
          { label: "Habits", v: habitsPts, max: 40 },
          { label: "Mind", v: mindsetPts, max: 10 },
          { label: "Social", v: socialPts, max: 10 },
        ].map((b) => (
          <div key={b.label} className="min-w-[44px]">
            <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{b.label}</div>
            <div className="mt-0.5 text-xs font-semibold text-gold tabular-nums">
              {b.v}<span className="text-muted-foreground">/{b.max}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
