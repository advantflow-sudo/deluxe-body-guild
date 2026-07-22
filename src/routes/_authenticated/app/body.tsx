import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft, ChevronRight, Clock, Flame, Dumbbell,
  Shield, Zap, Heart, Anchor, Crown, Mountain, Sparkles, Target,
  Save, Trash2, LineChart, FileDown, ChevronDown,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SectionLabel } from "@/components/deluxe/ui";
import { haptic } from "@/hooks/useHaptics";
import { ShareButton } from "@/components/deluxe/ShareButton";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { useAuth } from "@/hooks/useAuth";
import { BodyExportCard } from "@/components/deluxe/BodyExportCard";
import bodyFront from "@/assets/body-front.jpg";
import bodyBack from "@/assets/body-back.jpg";

interface Preset { id: string; name: string; muscles: string[]; view: "front" | "back"; createdAt: string }

const searchSchema = z.object({
  muscles: z.string().optional(),
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

type MuscleDef = {
  label: string;
  tagline: string;
  color: string;              // ring/dot color
  keywords: string[];
  categories: string[];
  Icon: typeof Dumbbell;
  side: "front" | "back";
  // hotspot on the image, percent of image box
  spot: { x: number; y: number };
  // label side and vertical position (percent of image box)
  labelSide: "left" | "right";
  labelY: number;
};

const MUSCLES: Record<string, MuscleDef> = {
  chest:      { label: "Chest",      tagline: "Build & define your chest",   color: "#ef4444", keywords: ["chest","bench","push","press"],           categories: ["Strength"],         Icon: Shield,   side: "front", spot: { x: 50, y: 26 }, labelSide: "left",  labelY: 22 },
  shoulders:  { label: "Shoulders",  tagline: "Build strong shoulders",       color: "#f59e0b", keywords: ["shoulder","press","delt","raise"],         categories: ["Strength"],         Icon: Crown,    side: "front", spot: { x: 32, y: 22 }, labelSide: "left",  labelY: 32 },
  biceps:     { label: "Biceps",     tagline: "Build bigger arms",            color: "#22c55e", keywords: ["bicep","curl","arm"],                      categories: ["Strength"],         Icon: Zap,      side: "front", spot: { x: 22, y: 34 }, labelSide: "left",  labelY: 42 },
  forearms:   { label: "Forearms",   tagline: "Iron grip, iron mind",         color: "#eab308", keywords: ["forearm","grip","wrist"],                  categories: ["Strength"],         Icon: Anchor,   side: "front", spot: { x: 17, y: 45 }, labelSide: "left",  labelY: 52 },
  abs:        { label: "Abs",        tagline: "Strengthen your core",         color: "#a855f7", keywords: ["abs","core","crunch","plank"],             categories: ["Core"],             Icon: Sparkles, side: "front", spot: { x: 50, y: 42 }, labelSide: "left",  labelY: 62 },
  obliques:   { label: "Obliques",   tagline: "Sharpen your midline",         color: "#ec4899", keywords: ["oblique","twist","side"],                  categories: ["Core"],             Icon: Target,   side: "front", spot: { x: 40, y: 44 }, labelSide: "right", labelY: 42 },
  quads:      { label: "Quads",      tagline: "Build powerful legs",          color: "#3b82f6", keywords: ["quad","squat","leg","lunge"],              categories: ["Strength","Hybrid"], Icon: Mountain, side: "front", spot: { x: 43, y: 62 }, labelSide: "left",  labelY: 72 },
  calves_f:   { label: "Calves",     tagline: "Build strong calves",          color: "#14b8a6", keywords: ["calf","calves"],                           categories: ["Strength"],         Icon: Heart,    side: "front", spot: { x: 42, y: 84 }, labelSide: "right", labelY: 82 },

  traps:      { label: "Traps",      tagline: "Build powerful upper traps",   color: "#a855f7", keywords: ["trap","shrug","upper back"],               categories: ["Strength"],         Icon: Crown,    side: "back",  spot: { x: 50, y: 18 }, labelSide: "right", labelY: 20 },
  rear_delts: { label: "Rear Delts", tagline: "Sculpt round shoulders",       color: "#eab308", keywords: ["rear delt","face pull","reverse"],         categories: ["Strength"],         Icon: Zap,      side: "back",  spot: { x: 32, y: 22 }, labelSide: "right", labelY: 30 },
  lats:       { label: "Back",       tagline: "Build a strong back",          color: "#3b82f6", keywords: ["lat","pull","row","back"],                 categories: ["Strength"],         Icon: Shield,   side: "back",  spot: { x: 50, y: 34 }, labelSide: "right", labelY: 40 },
  triceps:    { label: "Triceps",    tagline: "Tone & build triceps",         color: "#22c55e", keywords: ["tricep","dip","extension"],                categories: ["Strength"],         Icon: Zap,      side: "back",  spot: { x: 22, y: 34 }, labelSide: "right", labelY: 50 },
  glutes:     { label: "Glutes",     tagline: "Build & shape your glutes",    color: "#f97316", keywords: ["glute","hip thrust","bridge"],             categories: ["Strength","Hybrid"], Icon: Sparkles, side: "back",  spot: { x: 50, y: 52 }, labelSide: "right", labelY: 60 },
  hamstrings: { label: "Hamstrings", tagline: "Strengthen your hamstrings",   color: "#14b8a6", keywords: ["hamstring","deadlift","curl"],             categories: ["Strength"],         Icon: Mountain, side: "back",  spot: { x: 42, y: 68 }, labelSide: "right", labelY: 70 },
  calves_b:   { label: "Calves",     tagline: "Build strong calves",          color: "#ef4444", keywords: ["calf","calves"],                           categories: ["Strength"],         Icon: Heart,    side: "back",  spot: { x: 42, y: 86 }, labelSide: "right", labelY: 82 },
};

const STORAGE_KEY = "deluxe.body.selection.v1";

function BodyMapTab() {
  const { muscles, view = "front" } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { reduceMotion } = useReduceMotion();
  const [allWorkouts, setAllWorkouts] = useState<Workout[]>([]);
  const [multi, setMulti] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [remoteLoaded, setRemoteLoaded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const logTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const selected = useMemo<string[]>(
    () => (muscles ? muscles.split(",").filter((k: string) => Boolean(MUSCLES[k])) : []),
    [muscles]
  );

  useEffect(() => {
    supabase.from("workouts")
      .select("id,title,category,level,duration_min,calories,description")
      .then(({ data }) => { if (data) setAllWorkouts(data as Workout[]); });
  }, []);

  // Restore from Supabase profile first, fall back to localStorage
  useEffect(() => {
    if (hydrated) return;
    let cancelled = false;
    (async () => {
      let saved: { muscles?: string[]; view?: "front" | "back"; multi?: boolean } | null = null;
      if (user) {
        const { data } = await supabase
          .from("user_profiles_ext")
          .select("body_map_selection, body_map_presets")
          .eq("user_id", user.id)
          .maybeSingle();
        const row = data as { body_map_selection?: typeof saved; body_map_presets?: Preset[] } | null;
        const remote = row?.body_map_selection;
        if (remote && typeof remote === "object") saved = remote;
        if (Array.isArray(row?.body_map_presets)) setPresets(row!.body_map_presets as Preset[]);
      }
      if (!saved) {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) saved = JSON.parse(raw);
        } catch { /* ignore */ }
      }
      if (cancelled) return;
      setHydrated(true);
      setRemoteLoaded(true);
      if (!saved || muscles) return;
      if (saved.multi) setMulti(true);
      const keys = (saved.muscles ?? []).filter((k: string) => Boolean(MUSCLES[k]));
      if (keys.length || saved.view) {
        navigate({
          to: "/app/body",
          search: {
            view: saved.view ?? view,
            ...(keys.length ? { muscles: keys.join(",") } : {}),
          },
          replace: true,
        });
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Persist selection to localStorage + Supabase profile
  useEffect(() => {
    if (!hydrated || !remoteLoaded) return;
    const payload = { muscles: selected, view, multi };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch { /* ignore */ }
    if (user) {
      supabase.from("user_profiles_ext")
        .upsert({ user_id: user.id, body_map_selection: payload }, { onConflict: "user_id" })
        .then(() => { /* fire and forget */ });
    }
  }, [selected, view, multi, hydrated, remoteLoaded, user]);

  const matches = useMemo(() => {
    if (selected.length === 0) return [] as Array<{ w: Workout; score: number; reasons: string[] }>;
    return allWorkouts
      .map((w) => {
        const hay = `${w.title} ${w.description ?? ""}`.toLowerCase();
        let score = 0;
        const reasons: string[] = [];
        for (const key of selected) {
          const m = MUSCLES[key];
          const hitKw = m.keywords.find((k) => hay.includes(k));
          if (hitKw) { score += 2; reasons.push(`${m.label}: matches “${hitKw}”`); }
          if (m.categories.includes(w.category)) { score += 1; reasons.push(`${m.label}: ${w.category} category`); }
        }
        return { w, score, reasons };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }, [selected, allWorkouts]);

  // Log selections (debounced) so the coach can spot trends
  useEffect(() => {
    if (!hydrated || !user || selected.length === 0) return;
    if (logTimer.current) clearTimeout(logTimer.current);
    logTimer.current = setTimeout(() => {
      supabase.from("body_map_selection_logs").insert({
        user_id: user.id,
        muscles: selected,
        view,
        multi,
        matched_count: matches.length,
      }).then(() => { /* ignore */ });
    }, 1200);
    return () => { if (logTimer.current) clearTimeout(logTimer.current); };
  }, [selected, view, multi, matches.length, hydrated, user]);

  // Focus the selection panel when the first selection is made (a11y)
  useEffect(() => {
    if (selected.length === 1) panelRef.current?.focus();
  }, [selected.length]);

  const commitSelection = (keys: string[]) => {
    navigate({
      to: "/app/body",
      search: {
        view,
        ...(keys.length ? { muscles: keys.join(",") } : {}),
      },
    });
  };

  const toggle = (key: string) => {
    haptic("selection");
    if (multi) {
      const set = new Set<string>(selected);
      if (set.has(key)) set.delete(key); else set.add(key);
      commitSelection([...set]);
    } else {
      commitSelection(selected[0] === key ? [] : [key]);
    }
  };

  const clearAll = () => { haptic("light"); commitSelection([]); };
  const setView = (v: "front" | "back") => {
    haptic("light");
    navigate({ to: "/app/body", search: { view: v, ...(muscles ? { muscles } : {}) } });
  };


  const shareUrl = `/app/body?view=${view}${selected.length ? `&muscles=${selected.join(",")}` : ""}`;
  const primary = selected[0] ? MUSCLES[selected[0]] : null;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 pb-28 sm:px-6">
      {/* Skip to results (keyboard/screen reader) */}
      <a
        href="#body-results"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-gold focus:px-3 focus:py-2 focus:text-xs focus:font-semibold focus:uppercase focus:tracking-[0.22em] focus:text-deluxe-black"
      >
        Skip to recommended workouts
      </a>

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link to="/app" className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground hover:text-gold">
          <ChevronLeft className="h-3 w-3" /> Home
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { haptic("light"); setMulti((m) => !m); }}
            className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] transition border ${
              multi ? "bg-gold text-deluxe-black border-gold" : "border-gold/30 text-foreground hover:text-gold"
            }`}
          >
            {multi ? "Multi On" : "Select Multiple"}
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="mt-6 text-center">
        <SectionLabel>Target Your Body</SectionLabel>
        <h1 className="mt-3 font-display text-3xl uppercase tracking-wide text-foreground sm:text-5xl">
          Select a Muscle Group
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-xs text-muted-foreground sm:text-sm">
          Tap a muscle to see the best workouts for that area. {multi ? "Tap more to combine groups." : ""}
        </p>

        {/* Front/Back toggle */}
        <div className="mt-5 inline-flex overflow-hidden rounded-full border border-gold/40 bg-deluxe-forest/20">
          {(["front", "back"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-6 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] transition ${
                view === v ? "bg-gold text-deluxe-black" : "text-foreground hover:text-gold"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Bodies: side-by-side on desktop, single on mobile */}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <BodyFigure
          view="front"
          image={bodyFront}
          visibleOnMobile={view === "front"}
          selected={selected}
          onToggle={toggle}
          reduceMotion={reduceMotion}
        />
        <BodyFigure
          view="back"
          image={bodyBack}
          visibleOnMobile={view === "back"}
          selected={selected}
          onToggle={toggle}
          reduceMotion={reduceMotion}
        />
      </div>

      {/* Live region: announce selection changes */}
      <div aria-live="polite" className="sr-only">
        {selected.length === 0
          ? "No muscle selected"
          : `${selected.length} muscle${selected.length > 1 ? "s" : ""} selected: ${selected.map((k) => MUSCLES[k].label).join(", ")}. ${matches.length} recommended workouts.`}
      </div>

      {/* Selected panel */}
      <div
        id="body-results"
        ref={panelRef}
        tabIndex={-1}
        role="region"
        aria-label="Recommended workouts for your selected muscles"
        className="mt-10 rounded-lg border border-gold/25 bg-deluxe-forest/15 p-5 sm:p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        {selected.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground sm:text-sm">
            Tap any glowing muscle on the body to see personalised workouts.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Selected</div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {selected.map((k) => {
                    const m = MUSCLES[k];
                    return (
                      <span
                        key={k}
                        className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]"
                        style={{ backgroundColor: `${m.color}20`, color: m.color, border: `1px solid ${m.color}60` }}
                      >
                        <m.Icon className="h-3 w-3" /> {m.label}
                        <button
                          aria-label={`Remove ${m.label}`}
                          onClick={() => toggle(k)}
                          className="ml-1 opacity-70 hover:opacity-100"
                        >×</button>
                      </span>
                    );
                  })}
                </div>
                {primary && selected.length === 1 && (
                  <div className="mt-2 text-xs text-muted-foreground">{primary.tagline}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <ShareButton
                  title={`Deluxe Fitness — ${selected.map((k) => MUSCLES[k].label).join(" + ")}`}
                  text="Train these muscles with these workouts"
                  url={shareUrl}
                  label="Share"
                />
                <button onClick={clearAll} className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground hover:text-gold">
                  Clear
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {matches.length === 0 && (
                <div className="col-span-full border border-gold/15 bg-deluxe-black/40 p-4 text-center text-xs text-muted-foreground">
                  No workouts matched yet. Try adding another muscle group.
                </div>
              )}
              {matches.map(({ w, reasons }) => (
                <Link
                  key={w.id}
                  to="/app/workouts"
                  className="group flex flex-col gap-2 border border-gold/15 bg-deluxe-black/50 p-3 transition hover:border-gold/50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold/30 bg-deluxe-forest/30 text-gold">
                        <Dumbbell className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-display text-sm text-foreground">{w.title}</div>
                        <div className="mt-0.5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                          {w.category} · {w.level}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-[11px]">
                      <span className="inline-flex items-center gap-1 text-gold"><Clock className="h-3 w-3" />{w.duration_min}m</span>
                      {w.calories && <span className="inline-flex items-center gap-1 text-muted-foreground"><Flame className="h-3 w-3" />{w.calories}</span>}
                      <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:text-gold" />
                    </div>
                  </div>
                  {reasons.length > 0 && (
                    <div className="flex flex-wrap gap-1 pl-13 text-[10px] text-muted-foreground">
                      <span className="uppercase tracking-[0.22em] text-gold/70">Why:</span>
                      {reasons.slice(0, 3).map((r, i) => (
                        <span key={i} className="rounded-full border border-gold/15 bg-deluxe-forest/20 px-2 py-0.5">{r}</span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Tip */}
      <div className="mt-6 flex items-start gap-3 rounded-lg border border-gold/25 bg-deluxe-forest/10 p-4 text-xs text-muted-foreground">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        <div>
          <span className="text-foreground">Tip:</span> {multi
            ? "Multi-select is on — combine muscles like Chest + Triceps for tailored push days."
            : "Turn on Select Multiple to combine muscle groups for personalised recommendations."}
        </div>
      </div>
    </div>
  );
}

function BodyFigure({
  view, image, visibleOnMobile, selected, onToggle, reduceMotion,
}: {
  view: "front" | "back";
  image: string;
  visibleOnMobile: boolean;
  selected: string[];
  onToggle: (key: string) => void;
  reduceMotion: boolean;
}) {
  const keys = Object.keys(MUSCLES).filter((k: string) => MUSCLES[k].side === view);
  const leftLabels = keys.filter((k: string) => MUSCLES[k].labelSide === "left");
  const rightLabels = keys.filter((k: string) => MUSCLES[k].labelSide === "right");

  return (
    <div className={`${visibleOnMobile ? "block" : "hidden"} lg:block`}>
      <div className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
        {view}
      </div>
      <div
        className="relative mx-auto grid max-w-xl grid-cols-[minmax(0,7rem)_1fr_minmax(0,7rem)] items-stretch gap-2 sm:gap-3"
        role="group"
        aria-label={`${view} body muscle selector`}
      >
        {/* Left labels */}
        <div className="relative">
          {leftLabels.map((k) => (
            <LabelChip key={k} muscleKey={k} active={selected.includes(k)} onClick={() => onToggle(k)} side="left" />
          ))}
        </div>

        {/* Body image + hotspots */}
        <div className="relative aspect-[3/5] overflow-hidden rounded-lg border border-gold/20 bg-deluxe-black">
          <img
            src={image}
            alt={`Anatomical ${view} view of the human body with selectable muscle groups`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Vignette */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.55)_100%)]" />
          {keys.map((k, idx) => {
            const m = MUSCLES[k];
            const active = selected.includes(k);
            return (
              <button
                key={k}
                type="button"
                onClick={() => onToggle(k)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onToggle(k);
                    return;
                  }
                  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                    e.preventDefault();
                    const next = keys[(idx + 1) % keys.length];
                    (document.querySelector(`[data-hotspot="${view}-${next}"]`) as HTMLButtonElement | null)?.focus();
                  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                    e.preventDefault();
                    const prev = keys[(idx - 1 + keys.length) % keys.length];
                    (document.querySelector(`[data-hotspot="${view}-${prev}"]`) as HTMLButtonElement | null)?.focus();
                  }
                }}
                data-hotspot={`${view}-${k}`}
                aria-label={`${m.label} — ${m.tagline}`}
                aria-pressed={active}
                className="group absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-deluxe-black"
                style={{ left: `${m.spot.x}%`, top: `${m.spot.y}%` }}
              >
                <span
                  className={`block h-4 w-4 rounded-full border-2 ${reduceMotion ? "" : "transition-all duration-300"} ${
                    active && !reduceMotion ? "scale-125" : !reduceMotion ? "group-hover:scale-125" : ""
                  }`}
                  style={{
                    backgroundColor: active ? m.color : "rgba(255,255,255,0.9)",
                    borderColor: m.color,
                    boxShadow: active
                      ? `0 0 0 4px ${m.color}55, 0 0 22px ${m.color}`
                      : `0 0 0 2px ${m.color}30`,
                  }}
                />
                {active && !reduceMotion && (
                  <span
                    className="absolute left-1/2 top-1/2 -z-10 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full animate-ping"
                    style={{ backgroundColor: `${m.color}40` }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right labels */}
        <div className="relative">
          {rightLabels.map((k) => (
            <LabelChip key={k} muscleKey={k} active={selected.includes(k)} onClick={() => onToggle(k)} side="right" />
          ))}
        </div>
      </div>
    </div>
  );
}

function LabelChip({
  muscleKey, active, onClick, side,
}: {
  muscleKey: string;
  active: boolean;
  onClick: () => void;
  side: "left" | "right";
}) {
  const m = MUSCLES[muscleKey];
  const Icon = m.Icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${m.label} — ${m.tagline}`}
      aria-pressed={active}
      className={`absolute w-full rounded transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
        side === "left" ? "text-right pr-1" : "text-left pl-1"
      } ${active ? "scale-[1.03]" : ""}`}
      style={{ top: `${m.labelY}%`, transform: `translateY(-50%) ${active ? "scale(1.03)" : ""}` }}
    >
      <div className={`flex items-center gap-2 ${side === "right" ? "" : "flex-row-reverse"}`}>
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 transition"
          style={{
            borderColor: m.color,
            backgroundColor: active ? `${m.color}30` : "rgba(0,0,0,0.4)",
            boxShadow: active ? `0 0 14px ${m.color}80` : "none",
          }}
        >
          <Icon className="h-4 w-4" style={{ color: m.color }} />
        </span>
        <div className={`min-w-0 ${side === "right" ? "text-left" : "text-right"}`}>
          <div
            className="truncate text-[10px] font-bold uppercase tracking-[0.18em] transition"
            style={{ color: active ? m.color : "hsl(var(--foreground))" }}
          >
            {m.label}
          </div>
          <div className="truncate text-[9px] leading-tight text-muted-foreground">{m.tagline}</div>
        </div>
      </div>
    </button>
  );
}
