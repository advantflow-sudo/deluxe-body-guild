import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Apple, Dumbbell, TrendingUp, Users, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { HomeMissionHub } from "@/components/deluxe/HomeMissionHub";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({
    meta: [
      { title: "Dashboard | Deluxe Fitness" },
      { name: "description", content: "One ring, one next move: your daily 100 XP mission, streak, hydration, protein and sleep at a glance." },
      { property: "og:title", content: "Dashboard | Deluxe Fitness" },
      { property: "og:description", content: "One ring, one next move: your daily 100 XP mission, streak, hydration, protein and sleep at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomeTab,
  validateSearch: (search: Record<string, unknown>): { mission?: "1" } =>
    search["mission"] === "1" || search["mission"] === 1 ? { mission: "1" } : {},
});

const QUOTES = [
  "Discipline is the highest form of self-respect.",
  "The body achieves what the mind believes.",
  "Champions are made in the off-season.",
  "Excellence is a daily ritual.",
  "Train as if your future self is watching.",
];

function HomeTab() {
  const { user } = useAuth();
  const [name, setName] = useState("Athlete");
  const quote = QUOTES[new Date().getDate() % QUOTES.length];
  const { mission } = Route.useSearch();

  useEffect(() => {
    if (!user) return;
    void supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.display_name) setName(data.display_name.split(" ")[0]);
      });
  }, [user]);

  // Deep link from mission reminders → highlight the claimable mission hub.
  useEffect(() => {
    if (mission !== "1") return;
    const t = window.setTimeout(() => {
      const el = document.getElementById("mission");
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-gold/70");
      window.setTimeout(() => el.classList.remove("ring-2", "ring-gold/70"), 2600);
    }, 500);
    return () => window.clearTimeout(t);
  }, [mission]);

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 pb-28 sm:px-5 sm:pt-8">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="font-display text-2xl text-foreground sm:text-3xl">Good day, {name}.</h1>
        <span className="shrink-0 text-[9px] uppercase tracking-[0.2em] text-gold">Deluxe</span>
      </div>
      <p className="mt-1 text-xs italic text-muted-foreground">"{quote}"</p>

      <HomeMissionHub />

      {/* Compact shortcuts — everything long-form now lives in Plan and Stats. */}
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Shortcut to="/app/workouts" icon={Dumbbell} label="Train" detail="Today's session" />
        <Shortcut to="/app/nutrition" icon={Apple} label="Plan" detail="Meals & macros" />
        <Shortcut to="/app/progress" icon={TrendingUp} label="Stats" detail="History & exports" />
        <Shortcut to="/app/community" icon={Users} label="Community" detail="Open feed" />
      </div>

      <Link to="/app/body" className="mt-2.5 flex items-center justify-between border border-gold/40 bg-gradient-to-br from-deluxe-forest/40 to-deluxe-black p-4 transition hover:border-gold">
        <div>
          <div className="text-[9px] uppercase tracking-[0.22em] text-gold">Signature</div>
          <div className="mt-0.5 font-display text-lg text-foreground">Target Your Body</div>
          <div className="text-[11px] text-muted-foreground">Tap a muscle. Get the workout.</div>
        </div>
        <ChevronRight className="h-5 w-5 text-gold" />
      </Link>
    </div>
  );
}

function Shortcut({
  to,
  icon: Icon,
  label,
  detail,
}: {
  to: "/app/workouts" | "/app/nutrition" | "/app/progress" | "/app/community";
  icon: typeof Dumbbell;
  label: string;
  detail: string;
}) {
  return (
    <Link to={to} className="flex items-center gap-3 border border-gold/20 bg-deluxe-forest/20 p-3 hover:border-gold/50">
      <Icon className="h-5 w-5 shrink-0 text-gold" />
      <div className="min-w-0">
        <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
        <div className="truncate text-sm text-foreground">{detail}</div>
      </div>
    </Link>
  );
}
