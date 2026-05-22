import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Heart, MessageCircle, Image as ImageIcon, Dumbbell, Send, Globe, Crown, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import { GoldButton, SectionLabel } from "@/components/deluxe/ui";
import { SuggestedMembers } from "@/components/deluxe/SuggestedMembers";

export const Route = createFileRoute("/_authenticated/app/community")({
  component: CommunityTab,
});

interface Profile { id: string; display_name: string | null; avatar_url: string | null }
interface Post {
  id: string; user_id: string; body: string; image_url: string | null;
  workout_session_id: string | null; visibility: string; created_at: string;
  profile?: Profile;
  workout_title?: string | null;
  likes: number;
  liked: boolean;
  comments: number;
}

function CommunityTab() {
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<"public" | "premium">("public");
  const [linkSession, setLinkSession] = useState<string | "">("");
  const [recentSessions, setRecentSessions] = useState<{ id: string; title: string }[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [openComments, setOpenComments] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: rawPosts } = await supabase
      .from("community_posts")
      .select("id,user_id,body,image_url,workout_session_id,visibility,created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    const list = rawPosts ?? [];
    const userIds = Array.from(new Set(list.map((p) => p.user_id)));
    const sessionIds = list.map((p) => p.workout_session_id).filter(Boolean) as string[];
    const postIds = list.map((p) => p.id);

    const [profilesRes, sessionsRes, likesRes, myLikesRes, commentsRes] = await Promise.all([
      userIds.length
        ? supabase.from("profiles").select("id,display_name,avatar_url").in("id", userIds)
        : Promise.resolve({ data: [] as Profile[] }),
      sessionIds.length
        ? supabase.from("workout_sessions").select("id,workout_id,workouts(title)").in("id", sessionIds)
        : Promise.resolve({ data: [] as any[] }),
      postIds.length
        ? supabase.from("post_likes").select("post_id").in("post_id", postIds)
        : Promise.resolve({ data: [] as any[] }),
      postIds.length && user
        ? supabase.from("post_likes").select("post_id").in("post_id", postIds).eq("user_id", user.id)
        : Promise.resolve({ data: [] as any[] }),
      postIds.length
        ? supabase.from("post_comments").select("post_id").in("post_id", postIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const profMap = new Map((profilesRes.data ?? []).map((p: any) => [p.id, p]));
    const sessMap = new Map((sessionsRes.data ?? []).map((s: any) => [s.id, s.workouts?.title]));
    const likeCount = new Map<string, number>();
    (likesRes.data ?? []).forEach((l: any) => likeCount.set(l.post_id, (likeCount.get(l.post_id) ?? 0) + 1));
    const myLiked = new Set((myLikesRes.data ?? []).map((l: any) => l.post_id));
    const cmtCount = new Map<string, number>();
    (commentsRes.data ?? []).forEach((c: any) => cmtCount.set(c.post_id, (cmtCount.get(c.post_id) ?? 0) + 1));

    setPosts(
      list.map((p) => ({
        ...p,
        profile: profMap.get(p.user_id),
        workout_title: p.workout_session_id ? sessMap.get(p.workout_session_id) : null,
        likes: likeCount.get(p.id) ?? 0,
        liked: myLiked.has(p.id),
        comments: cmtCount.get(p.id) ?? 0,
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    load();
    supabase
      .from("workout_sessions")
      .select("id,workouts(title)")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setRecentSessions(
          (data ?? []).map((s: any) => ({ id: s.id, title: s.workouts?.title ?? "Workout" })),
        );
      });
  }, [user]);

  const handleImage = (f: File | null) => {
    setImageFile(f);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(f ? URL.createObjectURL(f) : null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !body.trim()) return;
    setPosting(true);
    let image_url: string | null = null;
    if (imageFile) {
      const path = `${user.id}/${Date.now()}-${imageFile.name.replace(/\s+/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, imageFile);
      if (upErr) {
        toast.error(upErr.message);
        setPosting(false);
        return;
      }
      image_url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    }
    const { error } = await supabase.from("community_posts").insert({
      user_id: user.id,
      body: body.trim(),
      image_url,
      workout_session_id: linkSession || null,
      visibility,
    });
    setPosting(false);
    if (error) return toast.error(error.message);
    setBody(""); setLinkSession(""); handleImage(null); setVisibility("public");
    toast.success("Posted");
    load();
  };

  const toggleLike = async (post: Post) => {
    if (!user) return;
    if (post.liked) {
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", user.id);
    } else {
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: user.id });
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p,
      ),
    );
  };

  const deletePost = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    await supabase.from("community_posts").delete().eq("id", id);
    setPosts((p) => p.filter((x) => x.id !== id));
  };

  return (
    <div className="mx-auto max-w-2xl px-5 pt-8">
      <SectionLabel>Community</SectionLabel>
      <h1 className="mt-2 font-display text-3xl text-foreground">The Feed</h1>
      <p className="mt-1 text-xs text-muted-foreground">Share milestones, photos, and inspiration.</p>

      <SuggestedMembers />



      {/* Composer */}
      <form onSubmit={submit} className="mt-6 border border-gold/20 bg-deluxe-forest/20 p-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          placeholder="What did you crush today?"
          rows={3}
          className="w-full resize-none border-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {imagePreview && (
          <div className="relative mt-2 inline-block">
            <img src={imagePreview} alt="" className="max-h-48 rounded border border-gold/20" />
            <button type="button" onClick={() => handleImage(null)}
              className="absolute right-1 top-1 rounded-full bg-deluxe-black/80 p-1 text-foreground">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        {recentSessions.length > 0 && (
          <select
            value={linkSession}
            onChange={(e) => setLinkSession(e.target.value)}
            className="mt-2 w-full border border-gold/20 bg-deluxe-black px-2 py-1.5 text-xs text-foreground focus:border-gold focus:outline-none"
          >
            <option value="">Attach a workout (optional)</option>
            {recentSessions.map((s) => (
              <option key={s.id} value={s.id}>🏋️ {s.title}</option>
            ))}
          </select>
        )}
        <div className="mt-3 flex items-center justify-between border-t border-gold/10 pt-3">
          <div className="flex items-center gap-3">
            <label className="cursor-pointer text-muted-foreground hover:text-gold">
              <ImageIcon className="h-4 w-4" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e.target.files?.[0] ?? null)} />
            </label>
            {isPremium && (
              <button type="button" onClick={() => setVisibility(visibility === "public" ? "premium" : "public")}
                className="flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-gold">
                {visibility === "premium" ? <Crown className="h-3 w-3 text-gold" /> : <Globe className="h-3 w-3" />}
                {visibility}
              </button>
            )}
          </div>
          <GoldButton type="submit" disabled={posting || !body.trim()} className="!px-5 !py-2 !text-[10px]">
            {posting ? "Posting…" : "Post"}
          </GoldButton>
        </div>
      </form>

      {/* Feed */}
      <div className="mt-6 space-y-4 pb-12">
        {loading && <div className="text-center text-xs text-muted-foreground">Loading feed…</div>}
        {!loading && posts.length === 0 && (
          <div className="border border-gold/10 bg-deluxe-forest/10 p-8 text-center text-sm text-muted-foreground">
            Be the first to post.
          </div>
        )}
        {posts.map((p) => (
          <article key={p.id} className="border border-gold/15 bg-deluxe-forest/20 p-4">
            <header className="flex items-center justify-between">
              <Link to="/app/u/$userId" params={{ userId: p.user_id }} className="flex items-center gap-3">
                <Avatar url={p.profile?.avatar_url} name={p.profile?.display_name} />
                <div>
                  <div className="text-sm font-semibold text-foreground">{p.profile?.display_name ?? "Member"}</div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                    {p.visibility === "premium" && <span className="ml-2 text-gold">• Premium</span>}
                  </div>
                </div>
              </Link>
              {p.user_id === user?.id && (
                <button onClick={() => deletePost(p.id)} className="text-muted-foreground hover:text-gold">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </header>
            <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{p.body}</p>
            {p.workout_title && (
              <div className="mt-3 inline-flex items-center gap-2 border border-gold/20 bg-deluxe-black px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-gold">
                <Dumbbell className="h-3 w-3" /> {p.workout_title}
              </div>
            )}
            {p.image_url && (
              <img src={p.image_url} alt="" loading="lazy" className="mt-3 max-h-96 w-full rounded border border-gold/10 object-cover" />
            )}
            <div className="mt-4 flex items-center gap-4 border-t border-gold/10 pt-3">
              <button onClick={() => toggleLike(p)}
                className={`flex items-center gap-1.5 text-xs transition-colors ${p.liked ? "text-gold" : "text-muted-foreground hover:text-gold"}`}>
                <Heart className={`h-4 w-4 ${p.liked ? "fill-gold" : ""}`} /> {p.likes}
              </button>
              <button onClick={() => setOpenComments(openComments === p.id ? null : p.id)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold">
                <MessageCircle className="h-4 w-4" /> {p.comments}
              </button>
            </div>
            {openComments === p.id && <Comments postId={p.id} onChange={load} />}
          </article>
        ))}
      </div>
    </div>
  );
}

function Avatar({ url, name }: { url?: string | null; name?: string | null }) {
  if (url) return <img src={url} alt="" className="h-10 w-10 rounded-full border border-gold/30 object-cover" />;
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 bg-deluxe-black text-xs font-bold text-gold">
      {(name ?? "M").charAt(0).toUpperCase()}
    </div>
  );
}

function Comments({ postId, onChange }: { postId: string; onChange: () => void }) {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [text, setText] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("post_comments")
      .select("id,user_id,body,created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    const ids = Array.from(new Set((data ?? []).map((c) => c.user_id)));
    const { data: profs } = ids.length
      ? await supabase.from("profiles").select("id,display_name").in("id", ids)
      : { data: [] };
    const pm = new Map((profs ?? []).map((p: any) => [p.id, p.display_name]));
    setItems((data ?? []).map((c) => ({ ...c, name: pm.get(c.user_id) ?? "Member" })));
  };
  useEffect(() => { load(); }, [postId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    const { error } = await supabase.from("post_comments").insert({ post_id: postId, user_id: user.id, body: text.trim() });
    if (error) return toast.error(error.message);
    setText("");
    await load();
    onChange();
  };

  return (
    <div className="mt-3 space-y-2 border-t border-gold/10 pt-3">
      {items.map((c) => (
        <div key={c.id} className="text-xs">
          <span className="font-semibold text-gold">{c.name}</span>{" "}
          <span className="text-foreground">{c.body}</span>
        </div>
      ))}
      <form onSubmit={submit} className="flex items-center gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000}
          placeholder="Add a comment…"
          className="flex-1 border border-gold/20 bg-deluxe-black px-3 py-1.5 text-xs text-foreground focus:border-gold focus:outline-none" />
        <button type="submit" className="text-gold hover:text-gold/80"><Send className="h-4 w-4" /></button>
      </form>
    </div>
  );
}
