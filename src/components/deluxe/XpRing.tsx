import { useEffect, useRef, useState } from "react";

/**
 * Animated daily XP ring. The stroke sweeps and the number counts up whenever
 * the value changes, so a claim feels instant and rewarding.
 */
export function XpRing({
  value,
  total = 100,
  size = 148,
  label = "XP today",
}: {
  value: number;
  total?: number;
  size?: number;
  label?: string;
}) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    const to = value;
    prev.current = value;
    if (from === to) {
      setDisplay(to);
      return;
    }
    const start = performance.now();
    const duration = 700;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, display / total));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-gold/12" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#xpRingGold)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.22,1,0.36,1)" }}
        />
        <defs>
          <linearGradient id="xpRingGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f0dfa8" />
            <stop offset="100%" stopColor="#c9a24c" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-3xl leading-none text-foreground">{display}</div>
        <div className="mt-1 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
        <div className="text-[9px] uppercase tracking-[0.22em] text-gold">of {total}</div>
      </div>
    </div>
  );
}
