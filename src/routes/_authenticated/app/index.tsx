import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Flame, Footprints, Droplet, Activity, Sparkles, ChevronRight,
  Users, Apple, Crown, Trophy, Dumbbell, Clock,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SectionLabel } from "@/components/deluxe/ui";
import { ConnectedDevices } from "@/components/deluxe/ConnectedDevices";

export const Route = createFileRoute("/_authenticated/app/")({
  component: HomeTab,
});

const QUOTES = [
  "Discipline is the highest form of self-respect.",
  "The body achieves what the mind believes.",
  "Champions are made in the off-season.",
  "Excellence is a daily ritual.",
  "Train as if your future self is watching.",
];

interface Workout { id: string; title: string; category: string; duration_min: number; level: string; calories: number | null }
interface Session { id: string; completed_at: string; duration_min: number; calories: number | null; workout_id: string | null }
interface Challenge { id: string; title: string; goal_metric: string; goal_target: number; ends_on: string | null; points_reward: number }

function HomeTab() {
  const { user } = useAuth();
  const [name, setName] = useState("Athlete");
  const [today, setToday] = useState<Workout | null>(null);
  const [stats, setStats] = useState({ steps: 0, calories: 0, water_ml: 0, streak: 0 });
  const [points, setPoints] = useState(0);
  const [weekly, setWeekly] = useState<{ day: string; workouts: number; calories: number; minutes: number }[]>([]);
  const [recent, setRecent] = useState<Session[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [weekTotals, setWeekTotals] = useState({ sessions: 0, minutes: 0, calories: 0 });
  const quote = QUOTES[new Date().getDate() % QUOTES.length];

  useEffect(() => {
    if (!user) return;
    (async () => {
      const sevenDaysAgo = subDays(startOfDay(new Date()), 6).toISOString();
      const [{ data: prof }, { data: ext }, { data: w }, { data: ds }, { data: pts }, { data: sessions }, { data: ch }] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
        supabase.from("user_profiles_ext").select("training_level, preferred_type").eq("user_id", user.id).maybeSingle(),
        supabase.from("workouts").select("id,title,category,duration_min,level,calories").limit(20),
        supabase.from("daily_stats").select("*").eq("user_id", user.id).eq("stat_date", new Date().toISOString().slice(0, 10)).maybeSingle(),
        supabase.from("reward_points").select("balance_after").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("workout_sessions").select("id,completed_at,duration_min,calories,workout_id").eq("user_id", user.id).gte("completed_at", sevenDaysAgo).order("completed_at", { ascending: false }),
        supabase.from("challenges").select("id,title,goal_metric,goal_target,ends_on,points_reward").gte("ends_on", new Date().toISOString().slice(0, 10)).order("ends_on", { ascending: true }).limit(3),
      ]);

      if (prof?.display_name) setName(prof.display_name.split(" ")[0]);
      if (w?.length) {
        const match = w.find((x) => x.level === ext?.training_level) ?? w[0];
        setToday(match as Workout);
      }
      if (ds) setStats({ steps: ds.steps, calories: ds.calories, water_ml: ds.water_ml, streak: ds.streak });
      if (pts) setPoints(pts.balance_after);
      if (ch) setChallenges(ch as Challenge[]);

      // Bucket sessions into the last 7 days
      const buckets: Record<string, { workouts: number; calories: number; minutes: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        buckets[d] = { workouts: 0, calories: 0, minutes: 0 };
      }
      let totalSessions = 0, totalMin = 0, totalCal = 0;
      (sessions ?? []).forEach((s) => {
        const k = s.completed_at.slice(0, 10);
        if (buckets[k]) {
          buckets[k].workouts += 1;
          buckets[k].minutes += s.duration_min ?? 0;
          buckets[k].calories += s.calories ?? 0;
        }
        totalSessions += 1;
        totalMin += s.duration_min ?? 0;
        totalCal += s.calories ?? 0;
      });
      setWeekly(Object.entries(buckets).map(([d, v]) => ({ day: format(new Date(d), "EEE"), ...v })));
      setWeekTotals({ sessions: totalSessions, minutes: totalMin, calories: totalCal });
      setRecent((sessions ?? []).slice(0, 4) as Session[]);
    })();
  }, [user]);

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 sm:px-5 sm:pt-8">
      <SectionLabel>Dashboard</SectionLabel>
      <h1 className="mt-2 font-display text-2xl text-foreground sm:text-3xl">Good day, {name}.</h1>
      <p className="mt-1 text-xs italic text-muted-foreground">"{quote}"</p>

      {today && (
        <Link to="/app/workouts" className="mt-5 block border border-gold/30 bg-gold-gradient/10 p-5 transition hover:border-gold sm:p-6">
          <SectionLabel>Today's Workout</SectionLabel>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display text-lg text-foreground sm:text-xl truncate">{today.title}</h2>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:text-[11px]">
                {today.category} · {today.duration_min} min · {today.level}
              </p>
            </div>
            <ChevronRight className="h-6 w-6 shrink-0 text-gold" />
          </div>
        </Link>
      )}

      {/* Today's stats */}
      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3">
        <StatCard icon={Footprints} label="Steps" value={stats.steps.toLocaleString()} />
        <StatCard icon={Flame} label="Calories" value={stats.calories.toLocaleString()} />
        <StatCard icon={Droplet} label="Water" value={`${(stats.water_ml / 1000).toFixed(1)}L`} />
        <StatCard icon={Activity} label="Streak" value={`${stats.streak}d`} />
      </div>

      {/* This week summary + chart */}
      <div className="mt-5 border border-gold/20 bg-deluxe-forest/20 p-4 sm:p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <SectionLabel>This Week</SectionLabel>
            <div className="mt-1 font-display text-xl text-foreground sm:text-2xl">
              {weekTotals.sessions} <span className="text-sm text-muted-foreground">sessions</span>
            </div>
          </div>
          <div className="text-right text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <div><span className="text-foreground">{weekTotals.minutes}</span> min</div>
            <div className="mt-0.5"><span className="text-foreground">{weekTotals.calories.toLocaleString()}</span> kcal</div>
          </div>
        </div>

        <div className="mt-4 h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weekly} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="cal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--gold, 42 65% 55%))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--gold, 42 65% 55%))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "rgba(10,10,10,0.95)",
                  border: "1px solid rgba(212,175,55,0.3)",
                  borderRadius: 0,
                  fontSize: 11,
                }}
                labelStyle={{ color: "#d4af37", textTransform: "uppercase", letterSpacing: "0.15em", fontSize: 10 }}
              />
              <Area
                type="monotone"
                dataKey="calories"
                stroke="#d4af37"
                strokeWidth={2}
                fill="url(#cal)"
                name="Calories"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <ConnectedDevices />



      {/* Recent activity */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <SectionLabel>Recent Activity</SectionLabel>
          <Link to="/app/progress" className="text-[10px] uppercase tracking-[0.2em] text-gold hover:underline">All</Link>
        </div>
        <div className="mt-3 space-y-2">
          {recent.length === 0 && (
            <div className="border border-gold/15 bg-deluxe-forest/10 p-4 text-center text-xs text-muted-foreground">
              No sessions yet this week. Time to train.
            </div>
          )}
          {recent.map((s) => (
            <div key={s.id} className="flex items-center justify-between border border-gold/15 bg-deluxe-forest/20 p-3 sm:p-4">
              <div className="flex items-center gap-3 min-w-0">
                <Dumbbell className="h-4 w-4 shrink-0 text-gold" />
                <div className="min-w-0">
                  <div className="text-sm text-foreground">Workout session</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {format(new Date(s.completed_at), "EEE, MMM d · h:mm a")}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-gold" />{s.duration_min}m</span>
                {s.calories != null && <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-gold" />{s.calories}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active challenges */}
      {challenges.length > 0 && (
        <div className="mt-5">
          <SectionLabel>Active Challenges</SectionLabel>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {challenges.map((c) => (
              <div key={c.id} className="border border-gold/20 bg-deluxe-forest/20 p-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-gold" />
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">+{c.points_reward} pts</div>
                </div>
                <div className="mt-1.5 font-display text-base text-foreground">{c.title}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Goal: {c.goal_target} {c.goal_metric}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rewards + shortcuts */}
      <Link to="/app/rewards" className="mt-5 flex items-center justify-between border border-gold/20 bg-deluxe-forest/30 p-4 hover:border-gold/50 sm:p-5">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-gold" />
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Reward Points</div>
            <div className="font-display text-2xl text-foreground">{points.toLocaleString()}</div>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-gold" />
      </Link>

      <div className="mt-3 grid grid-cols-2 gap-2.5 pb-6 sm:gap-3">
        <Link to="/app/community" className="group flex items-center gap-3 border border-gold/20 bg-deluxe-forest/20 p-3 hover:border-gold/50 sm:p-4">
          <Users className="h-5 w-5 shrink-0 text-gold" />
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Community</div>
            <div className="text-sm text-foreground">Open feed</div>
          </div>
        </Link>
        <Link to="/app/nutrition" className="group relative flex items-center gap-3 border border-gold/20 bg-deluxe-forest/20 p-3 hover:border-gold/50 sm:p-4">
          <Apple className="h-5 w-5 shrink-0 text-gold" />
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Nutrition <Crown className="h-3 w-3 text-gold" />
            </div>
            <div className="text-sm text-foreground">AI meals</div>
          </div>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Flame; label: string; value: string }) {
  return (
    <div className="border border-gold/15 bg-deluxe-forest/20 p-3 sm:p-4">
      <Icon className="h-4 w-4 text-gold" />
      <div className="mt-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-lg text-foreground sm:text-xl">{value}</div>
    </div>
  );
}
