import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, Award, Calendar, Dumbbell, Flame, Heart, LogOut, TrendingUp, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/deluxe/Logo";
import { GoldButton, OutlineButton, SectionLabel } from "@/components/deluxe/ui";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Deluxe Fitness" },
      { name: "description", content: "Your personal Deluxe Fitness command center." },
    ],
  }),
  component: Dashboard,
});

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  fitness_goal: string | null;
}

function Dashboard() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, avatar_url, bio, fitness_goal")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user]);

  const firstName = profile?.display_name?.split(" ")[0] ?? "Athlete";

  const stats = [
    { label: "Workouts This Week", value: "4", icon: Dumbbell, sub: "+1 vs last week" },
    { label: "Streak", value: "12d", icon: Flame, sub: "Personal best" },
    { label: "Calories Burned", value: "8,420", icon: Activity, sub: "This week" },
    { label: "Rewards", value: "320", icon: Award, sub: "Points earned" },
  ];

  const today = [
    { title: "Upper Body Strength", time: "45 min", tag: "Strength", icon: Dumbbell },
    { title: "Mobility Flow", time: "20 min", tag: "Recovery", icon: Heart },
  ];

  return (
    <main className="min-h-screen bg-deluxe-black">
      <header className="border-b border-gold/15 bg-deluxe-black/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/"><Logo /></Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="hidden text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground hover:text-gold md:inline">
              Back to site
            </Link>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-2 border border-gold/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold hover:bg-gold/10"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-12">
        <SectionLabel>Member Dashboard</SectionLabel>
        <h1 className="mt-3 font-display text-4xl text-foreground md:text-5xl">
          Welcome back, {firstName}.
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          {profile?.fitness_goal
            ? `Goal: ${profile.fitness_goal}. Stay locked in.`
            : "Set your goal in your profile to personalize your plan."}
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="border border-gold/15 bg-deluxe-forest/20 p-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {s.label}
                </span>
                <s.icon className="h-4 w-4 text-gold" />
              </div>
              <div className="mt-4 font-display text-3xl text-foreground">{s.value}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          <section className="lg:col-span-2 border border-gold/15 bg-deluxe-forest/20 p-8">
            <div className="flex items-center justify-between">
              <div>
                <SectionLabel>Today's Plan</SectionLabel>
                <h2 className="mt-2 font-display text-2xl text-foreground">Your sessions</h2>
              </div>
              <Calendar className="h-5 w-5 text-gold" />
            </div>
            <div className="mt-6 space-y-4">
              {today.map((t) => (
                <div key={t.title} className="flex items-center justify-between border border-gold/10 bg-deluxe-black/40 p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center border border-gold/30">
                      <t.icon className="h-4 w-4 text-gold" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{t.title}</div>
                      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                        {t.tag} · {t.time}
                      </div>
                    </div>
                  </div>
                  <OutlineButton className="!px-4 !py-2 !text-[10px]">Start</OutlineButton>
                </div>
              ))}
            </div>
          </section>

          <aside className="border border-gold/15 bg-deluxe-forest/20 p-8">
            <SectionLabel>AI Coach</SectionLabel>
            <h2 className="mt-2 font-display text-2xl text-foreground">Today's insight</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              "You're on a 12-day streak. Sleep was below average last night — prioritize mobility today and dial intensity to 80%."
            </p>
            <GoldButton className="mt-6 w-full">Ask coach</GoldButton>
          </aside>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          <Card icon={TrendingUp} title="Progress" body="Track your body composition, lifts, and weekly volume." cta="View progress" />
          <Card icon={Users} title="Community" body="Join challenges and connect with athletes who push you." cta="Open community" />
          <Card icon={Award} title="Rewards" body="Convert your streak into perks, gear, and exclusive content." cta="Redeem points" />
        </div>
      </div>
    </main>
  );
}

function Card({ icon: Icon, title, body, cta }: { icon: typeof TrendingUp; title: string; body: string; cta: string }) {
  return (
    <div className="border border-gold/15 bg-deluxe-forest/20 p-8">
      <Icon className="h-5 w-5 text-gold" />
      <h3 className="mt-4 font-display text-xl text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      <button className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold hover:text-gold-light">
        {cta} →
      </button>
    </div>
  );
}
