import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Clock, Flame, Dumbbell } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SectionLabel } from "@/components/deluxe/ui";

const searchSchema = z.object({
  muscle: z.string().optional(),
  view: z.enum(["front", "back"]).optional(),
});

export const Route = createFileRoute("/_authenticated/app/body")({
  validateSearch: (s) => searchSchema.parse(s),
  component: BodyMapTab,
});

interface Workout {
  id: string; title: string; category: string; level: string;
  duration_min: number; calories: number | null; description: string | null;
}

// Each muscle maps to workout categories and a list of keywords used to
// score relevance against workout title/description.
const MUSCLES: Record<string, { label: string; categories: string[]; keywords: string[]; side: "front" | "back" }> = {
  chest:       { label: "Chest",       categories: ["Strength"],            keywords: ["chest", "bench", "push", "press"], side: "front" },
  shoulders:   { label: "Shoulders",   categories: ["Strength"],            keywords: ["shoulder", "press", "delt", "raise"], side: "front" },
  biceps:      { label: "Biceps",      categories: ["Strength"],            keywords: ["bicep", "curl", "arm"], side: "front" },
  forearms:    { label: "Forearms",    categories: ["Strength"],            keywords: ["forearm", "grip", "wrist"], side: "front" },
  abs:         { label: "Abs",         categories: ["Core"],                keywords: ["abs", "core", "crunch", "plank"], side: "front" },
  obliques:    { label: "Obliques",    categories: ["Core"],                keywords: ["oblique", "twist", "side"], side: "front" },
  quads:       { label: "Quads",       categories: ["Strength", "Hybrid"],  keywords: ["quad", "squat", "leg", "lunge"], side: "front" },
  calves_f:    { label: "Calves",      categories: ["Strength"],            keywords: ["calf", "calves", "calve"], side: "front" },
  traps:       { label: "Traps",       categories: ["Strength"],            keywords: ["trap", "shrug", "upper back"], side: "back" },
  lats:        { label: "Lats",        categories: ["Strength"],            keywords: ["lat", "pull", "row", "back"], side: "back" },
  lower_back:  { label: "Lower Back",  categories: ["Strength", "Core"],    keywords: ["lower back", "deadlift", "hyperextension"], side: "back" },
  triceps:     { label: "Triceps",     categories: ["Strength"],            keywords: ["tricep", "dip", "extension"], side: "back" },
  glutes:      { label: "Glutes",      categories: ["Strength", "Hybrid"],  keywords: ["glute", "hip thrust", "bridge"], side: "back" },
  hamstrings:  { label: "Hamstrings",  categories: ["Strength"],            keywords: ["hamstring", "deadlift", "curl"], side: "back" },
  calves_b:    { label: "Calves",      categories: ["Strength"],            keywords: ["calf", "calves", "calve"], side: "back" },
};

function BodyMapTab() {
  const { muscle, view = "front" } = Route.useSearch();
  const navigate = useNavigate();
  const [allWorkouts, setAllWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    supabase.from("workouts")
      .select("id,title,category,level,duration_min,calories,description")
      .then(({ data }) => { if (data) setAllWorkouts(data as Workout[]); });
  }, []);

  const activeMuscle = muscle && MUSCLES[muscle] ? MUSCLES[muscle] : null;

  const matches = useMemo(() => {
    if (!activeMuscle) return [];
    const kw = activeMuscle.keywords;
    return allWorkouts
      .map((w) => {
        const hay = `${w.title} ${w.description ?? ""}`.toLowerCase();
        const kwHit = kw.some((k) => hay.includes(k));
        const catHit = activeMuscle.categories.includes(w.category);
        const score = (kwHit ? 2 : 0) + (catHit ? 1 : 0);
        return { w, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.w);
  }, [activeMuscle, allWorkouts]);

  const setMuscle = (key: string | null) =>
    navigate({ to: "/app/body", search: { view, ...(key ? { muscle: key } : {}) } });

  const setView = (v: "front" | "back") =>
    navigate({ to: "/app/body", search: { view: v, ...(muscle ? { muscle } : {}) } });

  return (
    <div className="mx-auto max-w-2xl px-5 pt-8 pb-28">
      <div className="flex items-center justify-between">
        <Link to="/app" className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground hover:text-gold">
          <ChevronLeft className="h-3 w-3" /> Home
        </Link>
        <div className="flex border border-gold/30">
          {(["front", "back"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] transition ${
                view === v ? "bg-gold text-deluxe-black" : "text-foreground hover:text-gold"
              }`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      <SectionLabel className="mt-6">Target Your Body</SectionLabel>
      <h1 className="mt-2 font-display text-3xl text-foreground">Tap a muscle</h1>
      <p className="mt-1 text-xs text-muted-foreground">Pick a region and we'll surface workouts that train it.</p>

      <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_1fr]">
        <div className="flex justify-center">
          <BodySvg view={view} activeKey={activeMuscle ? Object.keys(MUSCLES).find((k) => MUSCLES[k] === activeMuscle) ?? null : null}
                   onPick={(k) => setMuscle(k)} />
        </div>
        <div>
          {activeMuscle ? (
            <div>
              <SectionLabel>Selected</SectionLabel>
              <div className="mt-1 flex items-center justify-between">
                <h2 className="font-display text-2xl text-gold">{activeMuscle.label}</h2>
                <button onClick={() => setMuscle(null)} className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground hover:text-gold">Clear</button>
              </div>
              <div className="mt-4 space-y-2">
                {matches.length === 0 && (
                  <div className="border border-gold/15 bg-deluxe-forest/10 p-4 text-center text-xs text-muted-foreground">
                    No workouts found for {activeMuscle.label} yet.
                  </div>
                )}
                {matches.map((w) => (
                  <Link key={w.id} to="/app/workouts"
                    className="block border border-gold/15 bg-deluxe-forest/20 p-4 transition hover:border-gold/40">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-foreground">
                          <Dumbbell className="h-3.5 w-3.5 shrink-0 text-gold" />
                          <span className="truncate font-display text-base">{w.title}</span>
                        </div>
                        <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                          {w.category} · {w.level}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="flex items-center gap-1 text-xs text-gold"><Clock className="h-3 w-3" />{w.duration_min}m</div>
                        {w.calories && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Flame className="h-3 w-3" />{w.calories}</div>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="border border-gold/15 bg-deluxe-forest/10 p-6 text-center text-xs text-muted-foreground">
              Tap a glowing region on the body to see matching workouts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Stylised front/back silhouette with clickable muscle regions. */
function BodySvg({
  view,
  activeKey,
  onPick,
}: {
  view: "front" | "back";
  activeKey: string | null;
  onPick: (key: string) => void;
}) {
  const regions = view === "front" ? FRONT_REGIONS : BACK_REGIONS;
  return (
    <svg viewBox="0 0 200 420" className="h-[520px] w-auto" role="img" aria-label={`${view} body map`}>
      <defs>
        <linearGradient id="bodyFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      {/* Silhouette */}
      <path d={SILHOUETTE} fill="url(#bodyFill)" stroke="rgba(212,175,55,0.35)" strokeWidth="1" />
      {/* Muscle regions */}
      {regions.map((r) => {
        const isActive = activeKey === r.key;
        return (
          <g key={r.key} onClick={() => onPick(r.key)} className="cursor-pointer" tabIndex={0}
             onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onPick(r.key); }}>
            <path d={r.d}
              fill={isActive ? "rgba(212,175,55,0.55)" : "rgba(212,175,55,0.12)"}
              stroke={isActive ? "#d4af37" : "rgba(212,175,55,0.4)"}
              strokeWidth={isActive ? 1.5 : 0.8}
              filter={isActive ? "url(#glow)" : undefined}
              className="transition-all hover:fill-[rgba(212,175,55,0.35)]"
            >
              <title>{MUSCLES[r.key]?.label ?? r.key}</title>
            </path>
          </g>
        );
      })}
    </svg>
  );
}

// Generic vitruvian silhouette path — head, torso, arms, legs.
const SILHOUETTE =
  "M100 18 c-12 0 -20 9 -20 21 c0 9 5 17 12 20 l-2 8 c-12 2 -22 6 -28 14 l-12 30 c-3 8 -5 16 -5 24 l0 18 c0 6 -3 12 -8 18 l-8 14 c-3 6 -2 10 3 10 c4 0 8 -3 11 -8 l8 -12 c2 -3 3 -7 3 -11 l4 2 c2 12 4 26 7 40 c2 10 -2 22 -2 34 l0 50 c0 12 2 26 4 38 c1 8 -1 18 -3 28 l-3 16 c-1 6 2 9 7 9 c4 0 8 -3 10 -9 l4 -14 c2 -7 4 -16 5 -24 c1 -8 3 -16 6 -22 c2 -4 4 -10 4 -16 l0 -36 c2 4 4 8 4 12 l0 38 c0 6 2 12 4 16 c3 6 5 14 6 22 c1 8 3 17 5 24 l4 14 c2 6 6 9 10 9 c5 0 8 -3 7 -9 l-3 -16 c-2 -10 -4 -20 -3 -28 c2 -12 4 -26 4 -38 l0 -50 c0 -12 -4 -24 -2 -34 c3 -14 5 -28 7 -40 l4 -2 c0 4 1 8 3 11 l8 12 c3 5 7 8 11 8 c5 0 6 -4 3 -10 l-8 -14 c-5 -6 -8 -12 -8 -18 l0 -18 c0 -8 -2 -16 -5 -24 l-12 -30 c-6 -8 -16 -12 -28 -14 l-2 -8 c7 -3 12 -11 12 -20 c0 -12 -8 -21 -20 -21 z";

interface Region { key: string; d: string }

// Approximate muscle group ellipses/paths over the silhouette.
const FRONT_REGIONS: Region[] = [
  { key: "chest",     d: "M70 80 q15 -8 30 0 q15 -8 30 0 q-5 18 -15 22 q-15 4 -30 0 q-10 -4 -15 -22 z" },
  { key: "shoulders", d: "M55 75 q10 -10 20 -2 q-5 12 -12 14 q-8 -2 -8 -12 z M145 75 q-10 -10 -20 -2 q5 12 12 14 q8 -2 8 -12 z" },
  { key: "biceps",    d: "M50 110 q-6 14 -3 28 q8 -2 10 -12 q1 -10 -7 -16 z M150 110 q6 14 3 28 q-8 -2 -10 -12 q-1 -10 7 -16 z" },
  { key: "forearms",  d: "M44 144 q-4 18 0 32 q8 -4 10 -16 q-2 -12 -10 -16 z M156 144 q4 18 0 32 q-8 -4 -10 -16 q2 -12 10 -16 z" },
  { key: "abs",       d: "M85 110 q15 -3 30 0 q2 30 -2 60 q-13 4 -26 0 q-4 -30 -2 -60 z" },
  { key: "obliques",  d: "M70 118 q5 30 8 50 q-8 -2 -12 -8 q-2 -20 4 -42 z M130 118 q-5 30 -8 50 q8 -2 12 -8 q2 -20 -4 -42 z" },
  { key: "quads",     d: "M76 200 q12 -4 22 0 q2 40 -4 70 q-12 4 -20 0 q-6 -34 2 -70 z M124 200 q-12 -4 -22 0 q-2 40 4 70 q12 4 20 0 q6 -34 -2 -70 z" },
  { key: "calves_f",  d: "M78 290 q10 -2 18 0 q-2 30 -8 50 q-8 2 -12 0 q-2 -26 2 -50 z M122 290 q-10 -2 -18 0 q2 30 8 50 q8 2 12 0 q2 -26 -2 -50 z" },
];

const BACK_REGIONS: Region[] = [
  { key: "traps",     d: "M82 70 q18 -6 36 0 q-3 14 -18 16 q-15 -2 -18 -16 z" },
  { key: "lats",      d: "M68 95 q14 -4 28 0 l0 50 q-18 -2 -26 -16 q-4 -16 -2 -34 z M132 95 q-14 -4 -28 0 l0 50 q18 -2 26 -16 q4 -16 2 -34 z" },
  { key: "triceps",   d: "M52 110 q-8 16 -4 32 q8 -4 10 -14 q1 -12 -6 -18 z M148 110 q8 16 4 32 q-8 -4 -10 -14 q-1 -12 6 -18 z" },
  { key: "lower_back",d: "M82 150 q18 -4 36 0 q2 22 -2 36 q-16 4 -32 0 q-4 -16 -2 -36 z" },
  { key: "glutes",    d: "M76 190 q24 -6 48 0 q4 24 -2 38 q-22 6 -44 0 q-6 -14 -2 -38 z" },
  { key: "hamstrings",d: "M76 232 q12 -4 22 0 q4 36 -2 60 q-12 4 -20 0 q-6 -30 0 -60 z M124 232 q-12 -4 -22 0 q-4 36 2 60 q12 4 20 0 q6 -30 0 -60 z" },
  { key: "calves_b",  d: "M78 300 q10 -2 18 0 q-2 28 -8 46 q-8 2 -12 0 q-2 -24 2 -46 z M122 300 q-10 -2 -18 0 q2 28 8 46 q8 2 12 0 q2 -24 -2 -46 z" },
];
