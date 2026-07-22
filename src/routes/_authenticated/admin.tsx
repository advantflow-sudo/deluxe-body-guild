import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Dumbbell, Award, Trophy, BarChart3, ArrowLeft, ShieldAlert, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { SectionLabel, GoldDivider, OutlineButton } from "@/components/deluxe/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Logo } from "@/components/deluxe/Logo";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Deluxe Fitness" },
      { name: "description", content: "Operate the Deluxe Fitness platform." },
    ],
  }),
  component: AdminPage,
});

interface Counts {
  users: number;
  premium: number;
  workouts: number;
  sessions: number;
  rewards: number;
  pendingClaims: number;
  challenges: number;
  posts: number;
}

function AdminPage() {
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-deluxe-black">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Loading…</div>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-deluxe-black px-6 text-center">
        <ShieldAlert className="h-10 w-10 text-gold" />
        <SectionLabel>Restricted</SectionLabel>
        <h1 className="font-display text-3xl text-foreground">Admin access only</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          This area is reserved for Deluxe operators. If you should have access, contact the team.
        </p>
        <OutlineButton onClick={() => navigate({ to: "/app" })}>Back to app</OutlineButton>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deluxe-black">
      <header className="border-b border-gold/15 bg-deluxe-black/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/"><Logo /></Link>
          <Link
            to="/app"
            className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground hover:text-gold"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to app
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <SectionLabel>Operator Console</SectionLabel>
        <h1 className="mt-3 font-display text-3xl text-foreground sm:text-4xl md:text-5xl">
          Admin <span className="text-gold-gradient italic font-serif font-light">Dashboard</span>
        </h1>
        <div className="mt-5"><GoldDivider /></div>

        <Overview />

        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/_authenticated/admin/domain-health">
            <OutlineButton>Domain health</OutlineButton>
          </Link>
        </div>

        <Tabs defaultValue="users" className="mt-10">
          <TabsList className="grid w-full grid-cols-2 gap-2 bg-deluxe-forest/20 sm:grid-cols-5">
            <TabsTrigger value="users"><Users className="mr-2 h-3.5 w-3.5" />Users</TabsTrigger>
            <TabsTrigger value="workouts"><Dumbbell className="mr-2 h-3.5 w-3.5" />Workouts</TabsTrigger>
            <TabsTrigger value="rewards"><Award className="mr-2 h-3.5 w-3.5" />Rewards</TabsTrigger>
            <TabsTrigger value="challenges"><Trophy className="mr-2 h-3.5 w-3.5" />Challenges</TabsTrigger>
            <TabsTrigger value="analytics"><BarChart3 className="mr-2 h-3.5 w-3.5" />Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6"><UsersPanel /></TabsContent>
          <TabsContent value="workouts" className="mt-6"><WorkoutsPanel /></TabsContent>
          <TabsContent value="rewards" className="mt-6"><RewardsPanel /></TabsContent>
          <TabsContent value="challenges" className="mt-6"><ChallengesPanel /></TabsContent>
          <TabsContent value="analytics" className="mt-6"><AnalyticsPanel /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Overview() {
  const [c, setC] = useState<Counts>({ users: 0, premium: 0, workouts: 0, sessions: 0, rewards: 0, pendingClaims: 0, challenges: 0, posts: 0 });

  useEffect(() => {
    (async () => {
      const [u, pr, w, s, r, pc, ch, po] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("user_profiles_ext").select("user_id", { count: "exact", head: true }).neq("subscription_tier", "free"),
        supabase.from("workouts").select("id", { count: "exact", head: true }),
        supabase.from("workout_sessions").select("id", { count: "exact", head: true }),
        supabase.from("rewards_catalog").select("id", { count: "exact", head: true }),
        supabase.from("reward_claims").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("challenges").select("id", { count: "exact", head: true }),
        supabase.from("community_posts").select("id", { count: "exact", head: true }),
      ]);
      setC({
        users: u.count ?? 0,
        premium: pr.count ?? 0,
        workouts: w.count ?? 0,
        sessions: s.count ?? 0,
        rewards: r.count ?? 0,
        pendingClaims: pc.count ?? 0,
        challenges: ch.count ?? 0,
        posts: po.count ?? 0,
      });
    })();
  }, []);

  const tiles = [
    { label: "Members", value: c.users, sub: `${c.premium} premium` },
    { label: "Workouts", value: c.workouts, sub: `${c.sessions} sessions logged` },
    { label: "Rewards", value: c.rewards, sub: `${c.pendingClaims} pending claims` },
    { label: "Challenges", value: c.challenges, sub: `${c.posts} community posts` },
  ];
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="border border-gold/15 bg-deluxe-forest/20 p-5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{t.label}</div>
          <div className="mt-3 font-display text-3xl text-foreground">{t.value.toLocaleString()}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">{t.sub}</div>
        </div>
      ))}
    </div>
  );
}

interface UserRow {
  id: string;
  display_name: string | null;
  fitness_goal: string | null;
  created_at: string;
  tier?: string;
}

function UsersPanel() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, display_name, fitness_goal, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      const ids = (profs ?? []).map((p) => p.id);
      const { data: exts } = ids.length
        ? await supabase.from("user_profiles_ext").select("user_id, subscription_tier").in("user_id", ids)
        : { data: [] as { user_id: string; subscription_tier: string }[] };
      const map = new Map(exts!.map((e) => [e.user_id, e.subscription_tier]));
      setRows((profs ?? []).map((p) => ({ ...p, tier: map.get(p.id) ?? "free" })));
    })();
  }, []);

  const filtered = rows.filter((r) =>
    !q || (r.display_name ?? "").toLowerCase().includes(q.toLowerCase()) || r.id.includes(q)
  );

  return (
    <Panel title="Members" subtitle="Most recent 50 signups">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name or id…"
        className="mb-4 w-full border border-gold/20 bg-deluxe-black/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none"
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gold/15 text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Tier</th>
              <th className="py-2 pr-4">Goal</th>
              <th className="py-2 pr-4">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-gold/5 hover:bg-deluxe-forest/10">
                <td className="py-2 pr-4 text-foreground">{r.display_name ?? <span className="text-muted-foreground">—</span>}</td>
                <td className="py-2 pr-4">
                  <span className={`text-[10px] uppercase tracking-[0.18em] ${r.tier === "free" ? "text-muted-foreground" : "text-gold"}`}>
                    {r.tier}
                  </span>
                </td>
                <td className="py-2 pr-4 text-muted-foreground">{r.fitness_goal ?? "—"}</td>
                <td className="py-2 pr-4 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="py-6 text-center text-sm text-muted-foreground">No members found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function WorkoutsPanel() {
  const [rows, setRows] = useState<{ id: string; title: string; category: string; level: string; duration_min: number; is_premium: boolean }[]>([]);
  useEffect(() => {
    supabase.from("workouts").select("id,title,category,level,duration_min,is_premium").order("created_at", { ascending: false }).then(({ data }) => setRows(data ?? []));
  }, []);
  return (
    <Panel title="Workout Library" subtitle={`${rows.length} workouts`}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((w) => (
          <div key={w.id} className="border border-gold/15 bg-deluxe-forest/20 p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-base text-foreground">{w.title}</h3>
              {w.is_premium && <span className="text-[9px] uppercase tracking-[0.2em] text-gold">Premium</span>}
            </div>
            <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {w.category} · {w.level} · {w.duration_min}min
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="text-sm text-muted-foreground">No workouts yet.</div>}
      </div>
    </Panel>
  );
}

function RewardsPanel() {
  const [catalog, setCatalog] = useState<{ id: string; title: string; cost_points: number; type: string; active: boolean }[]>([]);
  const [claims, setClaims] = useState<{ id: string; status: string; claimed_at: string; reward_id: string; user_id: string }[]>([]);

  const load = async () => {
    const [c, cl] = await Promise.all([
      supabase.from("rewards_catalog").select("id,title,cost_points,type,active").order("cost_points"),
      supabase.from("reward_claims").select("id,status,claimed_at,reward_id,user_id").order("claimed_at", { ascending: false }).limit(30),
    ]);
    setCatalog(c.data ?? []);
    setClaims(cl.data ?? []);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: string) => {
    await supabase.from("reward_claims").update({ status }).eq("id", id);
    load();
  };

  return (
    <div className="space-y-6">
      <Panel title="Pending & Recent Claims" subtitle="Approve or reject member redemptions">
        <div className="space-y-2">
          {claims.map((c) => (
            <div key={c.id} className="flex flex-col gap-2 border border-gold/10 bg-deluxe-black/40 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm text-foreground">Reward #{c.reward_id.slice(0, 8)}</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  User {c.user_id.slice(0, 8)} · {new Date(c.claimed_at).toLocaleDateString()} · {c.status}
                </div>
              </div>
              {c.status === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => setStatus(c.id, "approved")} className="border border-gold/40 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-gold hover:bg-gold/10">Approve</button>
                  <button onClick={() => setStatus(c.id, "rejected")} className="border border-destructive/40 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-destructive hover:bg-destructive/10">Reject</button>
                </div>
              )}
            </div>
          ))}
          {claims.length === 0 && <div className="text-sm text-muted-foreground">No claims yet.</div>}
        </div>
      </Panel>

      <Panel title="Catalog" subtitle={`${catalog.length} items`}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.map((r) => (
            <div key={r.id} className="border border-gold/15 bg-deluxe-forest/20 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-base text-foreground">{r.title}</h3>
                <span className="text-[10px] uppercase tracking-[0.2em] text-gold">{r.cost_points} pts</span>
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {r.type} · {r.active ? "active" : "inactive"}
              </div>
            </div>
          ))}
          {catalog.length === 0 && <div className="text-sm text-muted-foreground">No rewards yet.</div>}
        </div>
      </Panel>
    </div>
  );
}

function ChallengesPanel() {
  const [rows, setRows] = useState<{ id: string; title: string; goal_metric: string; goal_target: number; points_reward: number; is_premium: boolean; starts_on: string | null; ends_on: string | null }[]>([]);
  useEffect(() => {
    supabase.from("challenges").select("id,title,goal_metric,goal_target,points_reward,is_premium,starts_on,ends_on").order("created_at", { ascending: false }).then(({ data }) => setRows(data ?? []));
  }, []);
  return (
    <Panel title="Challenges" subtitle={`${rows.length} active and upcoming`}>
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((c) => (
          <div key={c.id} className="border border-gold/15 bg-deluxe-forest/20 p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-base text-foreground">{c.title}</h3>
              {c.is_premium && <span className="text-[9px] uppercase tracking-[0.2em] text-gold">Premium</span>}
            </div>
            <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {c.goal_target} {c.goal_metric} · {c.points_reward} pts
            </div>
            {(c.starts_on || c.ends_on) && (
              <div className="mt-1 text-[10px] text-muted-foreground">
                {c.starts_on ?? "?"} → {c.ends_on ?? "?"}
              </div>
            )}
          </div>
        ))}
        {rows.length === 0 && <div className="text-sm text-muted-foreground">No challenges yet.</div>}
      </div>
    </Panel>
  );
}

function AnalyticsPanel() {
  const [data, setData] = useState({ last7Sessions: 0, last7Users: 0, last7Posts: 0, totalCalories: 0 });

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 7 * 86400_000).toISOString();
      const [s, u, p] = await Promise.all([
        supabase.from("workout_sessions").select("calories", { count: "exact" }).gte("completed_at", since),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since),
        supabase.from("community_posts").select("id", { count: "exact", head: true }).gte("created_at", since),
      ]);
      const totalCal = (s.data ?? []).reduce((a: number, r: { calories: number | null }) => a + (r.calories ?? 0), 0);
      setData({
        last7Sessions: s.count ?? 0,
        last7Users: u.count ?? 0,
        last7Posts: p.count ?? 0,
        totalCalories: totalCal,
      });
    })();
  }, []);

  const tiles = [
    { label: "New members (7d)", value: data.last7Users },
    { label: "Workouts logged (7d)", value: data.last7Sessions },
    { label: "Community posts (7d)", value: data.last7Posts },
    { label: "Calories burned (7d)", value: data.totalCalories },
  ];

  return (
    <Panel title="Last 7 days" subtitle="Platform activity">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="border border-gold/15 bg-deluxe-forest/20 p-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{t.label}</div>
            <div className="mt-3 font-display text-3xl text-foreground">{t.value.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="border border-gold/15 bg-deluxe-forest/10 p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="font-display text-xl text-foreground">{title}</h2>
        {subtitle && <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
