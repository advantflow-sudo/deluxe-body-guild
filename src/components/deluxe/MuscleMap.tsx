/** Front/back body map highlighting trained muscle groups by intensity (0–1). */
import bodyFront from "@/assets/body-front.jpg";
import bodyBack from "@/assets/body-back.jpg";

type Spot = { x: number; y: number };
const SPOTS: Record<string, { front: Spot[]; back: Spot[] }> = {
  chest: { front: [{ x: 42, y: 26 }, { x: 58, y: 26 }], back: [] },
  shoulders: { front: [{ x: 32, y: 22 }, { x: 68, y: 22 }], back: [{ x: 32, y: 22 }, { x: 68, y: 22 }] },
  arms: { front: [{ x: 22, y: 34 }, { x: 78, y: 34 }, { x: 17, y: 45 }, { x: 83, y: 45 }], back: [{ x: 22, y: 34 }, { x: 78, y: 34 }] },
  core: { front: [{ x: 50, y: 40 }, { x: 40, y: 44 }, { x: 60, y: 44 }], back: [] },
  back: { front: [], back: [{ x: 50, y: 18 }, { x: 42, y: 34 }, { x: 58, y: 34 }] },
  legs: { front: [{ x: 43, y: 62 }, { x: 57, y: 62 }, { x: 42, y: 84 }, { x: 58, y: 84 }], back: [{ x: 50, y: 52 }, { x: 42, y: 68 }, { x: 58, y: 68 }, { x: 42, y: 86 }, { x: 58, y: 86 }] },
};

export const MAPPED_MUSCLES = Object.keys(SPOTS);

export function MuscleMap({ intensity, size = "md" }: { intensity: Record<string, number>; size?: "sm" | "md" }) {
  const h = size === "sm" ? "h-44" : "h-60";
  const view = (side: "front" | "back", src: string) => (
    <div className={`relative ${h} aspect-[1/2] overflow-hidden border border-gold/15 bg-deluxe-black`}>
      <img src={src} alt={`${side} body map`} className="h-full w-full object-contain opacity-60" loading="lazy" />
      {Object.entries(SPOTS).flatMap(([g, s]) =>
        s[side].map((p, i) => {
          const v = intensity[g] ?? 0;
          if (v <= 0) return null;
          const d = 14 + v * 18;
          return (
            <span key={`${g}${i}`} className="absolute rounded-full bg-gold"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: d, height: d, transform: "translate(-50%,-50%)", opacity: 0.35 + v * 0.55, boxShadow: `0 0 ${d}px hsl(var(--gold, 43 74% 49%))` }} />
          );
        }),
      )}
      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] uppercase tracking-[0.2em] text-muted-foreground">{side}</span>
    </div>
  );
  return <div className="flex justify-center gap-3">{view("front", bodyFront)}{view("back", bodyBack)}</div>;
}

/** Normalise raw set counts per muscle to 0–1. */
export function toIntensity(counts: Record<string, number>) {
  const max = Math.max(1, ...Object.values(counts));
  return Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, v / max]));
}
