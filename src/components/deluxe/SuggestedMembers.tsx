import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { UserPlus, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SectionLabel } from "./ui";
import { haptic } from "@/hooks/useHaptics";

interface Member {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  followers: number;
  following: boolean;
}

export function SuggestedMembers() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,display_name,avatar_url")
        .neq("id", user.id)
        .limit(12);
      const ids = (profiles ?? []).map((p) => p.id);
      if (!ids.length) {
        setMembers([]);
        setLoading(false);
        return;
      }
      const [{ data: followsRows }, { data: myFollows }] = await Promise.all([
        supabase.from("user_followers").select("followed_id").in("followed_id", ids),
        supabase.from("user_followers").select("followed_id").eq("follower_id", user.id).in("followed_id", ids),
      ]);
      const counts = new Map<string, number>();
      (followsRows ?? []).forEach((f: any) => counts.set(f.followed_id, (counts.get(f.followed_id) ?? 0) + 1));
      const mine = new Set((myFollows ?? []).map((f: any) => f.followed_id));
      const list: Member[] = (profiles ?? [])
        .map((p) => ({
          id: p.id,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
          followers: counts.get(p.id) ?? 0,
          following: mine.has(p.id),
        }))
        .sort((a, b) => b.followers - a.followers)
        .slice(0, 8);
      setMembers(list);
      setLoading(false);
    })();
  }, [user]);

  const toggle = async (m: Member) => {
    if (!user) return;
    if (m.following) {
      await supabase.from("user_followers").delete().eq("follower_id", user.id).eq("followed_id", m.id);
    } else {
      await supabase.from("user_followers").insert({ follower_id: user.id, followed_id: m.id });
    }
    setMembers((prev) =>
      prev.map((x) =>
        x.id === m.id ? { ...x, following: !x.following, followers: x.followers + (x.following ? -1 : 1) } : x,
      ),
    );
  };

  if (loading || members.length === 0) return null;

  return (
    <div className="mt-6">
      <SectionLabel>Suggested members</SectionLabel>
      <div className="mt-3 -mx-5 overflow-x-auto px-5 pb-2">
        <div className="flex gap-3">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex w-40 shrink-0 flex-col items-center border border-gold/15 bg-deluxe-forest/20 p-3 text-center"
            >
              <Link to="/app/u/$userId" params={{ userId: m.id }}>
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt="" loading="lazy" decoding="async" className="h-14 w-14 rounded-full border border-gold/30 object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-deluxe-black text-base font-bold text-gold">
                    {(m.display_name ?? "M").charAt(0).toUpperCase()}
                  </div>
                )}
              </Link>
              <Link
                to="/app/u/$userId"
                params={{ userId: m.id }}
                className="mt-2 line-clamp-1 text-xs font-semibold text-foreground hover:text-gold"
              >
                {m.display_name ?? "Member"}
              </Link>
              <div className="mt-0.5 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                {m.followers} followers
              </div>
              <button
                onClick={() => toggle(m)}
                className={`mt-2 flex w-full items-center justify-center gap-1 border px-2 py-1.5 text-[10px] uppercase tracking-[0.2em] transition ${
                  m.following
                    ? "border-gold/30 bg-gold/5 text-gold"
                    : "border-gold bg-gold-gradient text-deluxe-black"
                }`}
              >
                {m.following ? <><UserCheck className="h-3 w-3" /> Following</> : <><UserPlus className="h-3 w-3" /> Follow</>}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
