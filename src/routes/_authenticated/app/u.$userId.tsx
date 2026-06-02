import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Trophy, Flame, Dumbbell, UserPlus, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SectionLabel } from "@/components/deluxe/ui";

export const Route = createFileRoute("/_authenticated/app/u/$userId")({
  component: ProfileView,
});

interface Achievement { label: string; date: string; icon: "trophy" | "flame" | "dumbbell" }

function ProfileView() {
  const { userId } = Route.useParams();
  const { user } = useAuth();
  const isSelf = user?.id === userId;
  const [profile, setProfile] = useState<any>(null);
  const [ext, setExt] = useState<any>(null);
  const [counts, setCounts] = useState({ followers: 0, following: 0, posts: 0 });
  const [following, setFollowing] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [posts, setPosts] = useState<any[]>([]);

  const load = async () => {
    const [
      { data: p },
      { data: e },
      { count: fc },
      { count: fwc },
      { count: pc },
      { data: amFollowing },
      { data: sessions },
      { data: claims },
      { data: postList },
    ] = await Promise.all([
      supabase.from("profiles").select("display_name,avatar_url,bio,fitness_goal").eq("id", userId).maybeSingle(),
      supabase.from("user_profiles_ext").select("subscription_tier,training_level,fitness_goal").eq("user_id", userId).maybeSingle(),
      supabase.from("user_followers").select("*", { count: "exact", head: true }).eq("followed_id", userId),
      supabase.from("user_followers").select("*", { count: "exact", head: true }).eq("follower_id", userId),
      supabase.from("community_posts").select("*", { count: "exact", head: true }).eq("user_id", userId),
      user
        ? supabase.from("user_followers").select("id").eq("follower_id", user.id).eq("followed_id", userId).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("workout_sessions")
        .select("id,completed_at,workouts(title)")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })
        .limit(3),
      supabase
        .from("reward_claims")
        .select("claimed_at,rewards_catalog(title)")
        .eq("user_id", userId)
        .order("claimed_at", { ascending: false })
        .limit(3),
      supabase
        .from("community_posts")
        .select("id,body,image_url,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);
    setProfile(p);
    setExt(e);
    setCounts({ followers: fc ?? 0, following: fwc ?? 0, posts: pc ?? 0 });
    setFollowing(!!amFollowing);
    const ach: Achievement[] = [
      ...(sessions ?? []).map((s: any) => ({
        label: `Completed ${s.workouts?.title ?? "workout"}`,
        date: s.completed_at,
        icon: "dumbbell" as const,
      })),
      ...(claims ?? []).map((c: any) => ({
        label: `Redeemed ${c.rewards_catalog?.title ?? "reward"}`,
        date: c.claimed_at,
        icon: "trophy" as const,
      })),
    ]
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
      .slice(0, 5);
    setAchievements(ach);
    setPosts(postList ?? []);
  };
  useEffect(() => { load(); }, [userId, user]);

  const toggleFollow = async () => {
    if (!user || isSelf) return;
    if (following) {
      await supabase.from("user_followers").delete().eq("follower_id", user.id).eq("followed_id", userId);
      setFollowing(false);
      setCounts((c) => ({ ...c, followers: Math.max(0, c.followers - 1) }));
    } else {
      const { error } = await supabase.from("user_followers").insert({ follower_id: user.id, followed_id: userId });
      if (error) return toast.error(error.message);
      setFollowing(true);
      setCounts((c) => ({ ...c, followers: c.followers + 1 }));
    }
  };

  const IconFor = ({ k }: { k: Achievement["icon"] }) =>
    k === "trophy" ? <Trophy className="h-4 w-4 text-gold" /> : k === "flame" ? <Flame className="h-4 w-4 text-gold" /> : <Dumbbell className="h-4 w-4 text-gold" />;

  return (
    <div className="mx-auto max-w-2xl px-5 pt-6 pb-28">
      <Link to="/app/community" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-gold">
        <ArrowLeft className="h-3 w-3" /> Back to feed
      </Link>

      <div className="mt-6 flex items-start gap-4">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="h-20 w-20 rounded-full border border-gold/30 object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-gold/30 bg-deluxe-black text-2xl font-bold text-gold">
            {(profile?.display_name ?? "M").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <h1 className="font-display text-2xl text-foreground">{profile?.display_name ?? "Member"}</h1>
          {ext?.subscription_tier && ext.subscription_tier !== "free" && (
            <span className="mt-1 inline-block text-[10px] uppercase tracking-[0.25em] text-gold">{ext.subscription_tier}</span>
          )}
          {profile?.fitness_goal && <p className="mt-1 text-xs text-muted-foreground">{profile.fitness_goal}</p>}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 border-y border-gold/10 py-4 text-center">
        <Stat n={counts.posts} label="Posts" />
        <Stat n={counts.followers} label="Followers" />
        <Stat n={counts.following} label="Following" />
      </div>

      {!isSelf && (
        <button onClick={toggleFollow}
          className={`mt-4 flex w-full items-center justify-center gap-2 border px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] transition ${
            following ? "border-gold/30 bg-gold/5 text-gold" : "border-gold bg-gold-gradient text-deluxe-black"
          }`}>
          {following ? <><UserCheck className="h-3.5 w-3.5" /> Following</> : <><UserPlus className="h-3.5 w-3.5" /> Follow</>}
        </button>
      )}

      <section className="mt-6">
        <SectionLabel>Recent achievements</SectionLabel>
        <div className="mt-3 space-y-2">
          {achievements.length === 0 && <div className="text-xs text-muted-foreground">No achievements yet.</div>}
          {achievements.map((a, i) => (
            <div key={i} className="flex items-center gap-3 border border-gold/10 bg-deluxe-forest/15 px-3 py-2.5">
              <IconFor k={a.icon} />
              <div className="flex-1 text-sm text-foreground">{a.label}</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {formatDistanceToNow(new Date(a.date), { addSuffix: true })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 pb-12">
        <SectionLabel>Posts</SectionLabel>
        <div className="mt-3 space-y-3">
          {posts.length === 0 && <div className="text-xs text-muted-foreground">No posts yet.</div>}
          {posts.map((p) => (
            <div key={p.id} className="border border-gold/10 bg-deluxe-forest/15 p-3">
              <p className="text-sm text-foreground whitespace-pre-wrap">{p.body}</p>
              {p.image_url && <img src={p.image_url} alt="" loading="lazy" className="mt-2 max-h-64 w-full rounded object-cover" />}
              <div className="mt-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <div className="font-display text-2xl text-foreground">{n}</div>
      <div className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">{label}</div>
    </div>
  );
}
