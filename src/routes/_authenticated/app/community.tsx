import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef, type FormEvent } from "react";
import { Heart, MessageCircle, Image as ImageIcon, Dumbbell, Send, Globe, Crown, X, Trash2, MoreHorizontal, Flag, BellOff, Hash, AtSign } from "lucide-react";
import { renderRichText } from "@/lib/richText";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePremium } from "@/hooks/usePremium";
import { GoldButton, SectionLabel } from "@/components/deluxe/ui";
import { SuggestedMembers } from "@/components/deluxe/SuggestedMembers";
import { haptic } from "@/hooks/useHaptics";
import { ShareButton } from "@/components/deluxe/ShareButton";
import { useConfirm } from "@/components/deluxe/ConfirmDialog";
import { CommunityTabBar, type CommunityTab } from "@/components/deluxe/CommunityTabBar";
import { CommunityStories, type StoryItem } from "@/components/deluxe/CommunityStories";
import { QuickCreate, POST_TYPES, type PostType } from "@/components/deluxe/QuickCreate";

const MUTE_KEY = "df_muted_posts_v1";
const REPORT_KEY = "df_reported_posts_v1";
const MUTE_COMMENT_USER_KEY = "df_muted_comment_users_v1";
const REPORT_COMMENT_KEY = "df_reported_comments_v1";
function readSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try { return new Set(JSON.parse(localStorage.getItem(key) ?? "[]")); } catch { return new Set(); }
}
function writeSet(key: string, s: Set<string>) {
  try { localStorage.setItem(key, JSON.stringify(Array.from(s))); } catch { /* noop */ }
}

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
  const [muted, setMuted] = useState<Set<string>>(() => readSet(MUTE_KEY));
  const [reported, setReported] = useState<Set<string>>(() => readSet(REPORT_KEY));
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [focusCommentId, setFocusCommentId] = useState<string | null>(null);
  const scrolledRef = useRef(false);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const [tab, setTab] = useState<CommunityTab>("feed");
  const [postType, setPostType] = useState<PostType>("workout");
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const activeType = POST_TYPES.find((t) => t.id === postType) ?? POST_TYPES[0];

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_followers")
      .select("followed_id")
      .eq("follower_id", user.id)
      .then(({ data }) => setFollowing(new Set((data ?? []).map((r) => r.followed_id))));
  }, [user]);

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

    // Resolve signed URLs for any image_url that is a storage path (new posts)
    const pathRows = list.filter((p) => p.image_url && !p.image_url.startsWith("http"));
    const signedMap = new Map<string, string>();
    if (pathRows.length) {
      await Promise.all(
        pathRows.map(async (p) => {
          const { data: signed } = await supabase.storage
            .from("progress-photos")
            .createSignedUrl(p.image_url as string, 3600);
          if (signed?.signedUrl) signedMap.set(p.id, signed.signedUrl);
        }),
      );
    }

    setPosts(
      list.map((p) => ({
        ...p,
        image_url: p.image_url && !p.image_url.startsWith("http")
          ? signedMap.get(p.id) ?? null
          : p.image_url,
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

  // Realtime: refresh feed when posts/comments/likes change.
  useEffect(() => {
    if (!user) return;
    // Coalesce realtime bursts: trailing-edge debounce + single in-flight reload.
    // Prevents UI jank when many likes/comments land in a short window.
    let timer: ReturnType<typeof setTimeout> | null = null;
    let inFlight = false;
    let pending = false;
    const WINDOW_MS = 1200;
    const refresh = () => {
      if (timer) return;
      timer = setTimeout(async () => {
        timer = null;
        if (inFlight) { pending = true; return; }
        inFlight = true;
        try { await load(); } finally {
          inFlight = false;
          if (pending) { pending = false; refresh(); }
        }
      }, WINDOW_MS);
    };
    const channel = supabase
      .channel("community-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_posts" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "post_comments" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "post_likes" }, refresh)
      .subscribe();
    return () => { if (timer) clearTimeout(timer); supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);


  // Deep-link: /app/community?p=POSTID(&c=COMMENTID) — scroll & focus once posts load.
  useEffect(() => {
    if (loading || scrolledRef.current || typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const pid = sp.get("p");
    const cid = sp.get("c");
    if (!pid) return;
    scrolledRef.current = true;
    if (!posts.some((p) => p.id === pid)) {
      toast.error("That post is no longer available.");
      return;
    }
    setOpenComments(pid);
    if (cid) setFocusCommentId(cid);
    requestAnimationFrame(() => {
      const el = document.getElementById(`post-${pid}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-gold/60");
        setTimeout(() => el.classList.remove("ring-2", "ring-gold/60"), 2400);
      }
    });
  }, [loading, posts]);

  const confirmDialog = useConfirm();

  // Hashtag/mention filters from URL (?tag=, ?u=)
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  const { activeTag, activeUser } = useMemo(() => {
    const sp = new URLSearchParams(searchStr ?? "");
    return { activeTag: sp.get("tag")?.toLowerCase() ?? null, activeUser: sp.get("u") ?? null };
  }, [searchStr]);

  const filteredPosts = useMemo(() => {
    let base = posts.filter((p) => !muted.has(p.user_id) && !reported.has(p.id));
    if (tab === "following") {
      base = base.filter((p) => following.has(p.user_id) || p.user_id === user?.id);
    }
    if (activeTag) {
      const needle = `#${activeTag}`;
      return base.filter((p) => p.body.toLowerCase().includes(needle));
    }
    if (activeUser) {
      const needle = activeUser.toLowerCase();
      return base.filter((p) => {
        if (p.body.toLowerCase().includes(`@${needle}`)) return true;
        return (p.profile?.display_name ?? "").toLowerCase().includes(needle);
      });
    }
    return base;
  }, [posts, muted, reported, activeTag, activeUser, tab, following, user?.id]);

  // Stories rail — most recent poster per member in the last 48h.
  const stories = useMemo(() => {
    const seen = new Map<string, StoryItem>();
    const cutoff = Date.now() - 48 * 60 * 60 * 1000;
    for (const p of posts) {
      if (muted.has(p.user_id) || seen.has(p.user_id)) continue;
      const ts = new Date(p.created_at).getTime();
      seen.set(p.user_id, {
        userId: p.user_id,
        name: p.profile?.display_name ?? "Member",
        avatarUrl: p.profile?.avatar_url ?? null,
        preview: p.image_url,
        fresh: ts >= cutoff,
      });
    }
    return Array.from(seen.values()).slice(0, 15);
  }, [posts, muted]);

  const muteUser = async (post: Post) => {
    const ok = await confirmDialog({
      title: "Mute member",
      description: `Hide all posts from ${post.profile?.display_name ?? "this member"}. You can undo this later from settings.`,
      confirmLabel: "Mute",
      tone: "warning",
      icon: <BellOff className="h-5 w-5" />,
    });
    if (!ok) return;
    const next = new Set(muted);
    next.add(post.user_id);
    setMuted(next);
    writeSet(MUTE_KEY, next);
    toast.success("Muted. You won't see their posts.");
    setMenuFor(null);
  };

  const reportPost = async (post: Post) => {
    const ok = await confirmDialog({
      title: "Report post",
      description: "Our moderation team will review this post within 24 hours. Thanks for keeping the community premium.",
      confirmLabel: "Report",
      tone: "danger",
      icon: <Flag className="h-5 w-5" />,
    });
    if (!ok) return;
    const next = new Set(reported);
    next.add(post.id);
    setReported(next);
    writeSet(REPORT_KEY, next);
    toast.success("Reported. Thank you for keeping the community safe.");
    setMenuFor(null);
  };


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
      const path = `${user.id}/posts/${Date.now()}-${imageFile.name.replace(/\s+/g, "_")}`;
      // Use private progress-photos bucket; store path only, sign at read time
      const { error: upErr } = await supabase.storage.from("progress-photos").upload(path, imageFile);
      if (upErr) {
        toast.error(upErr.message);
        setPosting(false);
        return;
      }
      image_url = path;
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

  const likeInFlight = useRef<Set<string>>(new Set());
  const toggleLike = async (post: Post) => {
    if (!user || likeInFlight.current.has(post.id)) return;
    likeInFlight.current.add(post.id);
    const wasLiked = post.liked;
    // Optimistic update first, roll back on failure.
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, liked: !wasLiked, likes: p.likes + (wasLiked ? -1 : 1) } : p,
      ),
    );
    const { error } = wasLiked
      ? await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", user.id)
      : await supabase.from("post_likes").insert({ post_id: post.id, user_id: user.id });
    if (error) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, liked: wasLiked, likes: p.likes + (wasLiked ? 1 : -1) } : p,
        ),
      );
      toast.error(error.message);
    }
    likeInFlight.current.delete(post.id);
  };

  const deletePost = async (id: string) => {
    const ok = await confirmDialog({
      title: "Delete post",
      description: "This will permanently remove your post and its comments. This cannot be undone.",
      confirmLabel: "Delete",
      tone: "danger",
      icon: <Trash2 className="h-5 w-5" />,
    });
    if (!ok) return;
    const { error } = await supabase.from("community_posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setPosts((p) => p.filter((x) => x.id !== id));
  };

  return (
    <div className="mx-auto max-w-2xl px-5 pt-8 pb-28">
      <SectionLabel>Community</SectionLabel>
      <h1 className="mt-2 font-display text-3xl text-foreground">The Feed</h1>
      <p className="mt-1 text-xs text-muted-foreground">Share milestones, photos, and inspiration.</p>

      <CommunityStories items={stories} onCreate={() => composerRef.current?.focus()} />

      <CommunityTabBar active={tab} onSelect={setTab} />

      <SuggestedMembers />

      {/* Quick create */}
      <form onSubmit={submit} className="mt-6 border border-gold/20 bg-deluxe-forest/20 p-4">
        <QuickCreate value={postType} onChange={setPostType} />
        <textarea
          ref={composerRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          placeholder={activeType.placeholder}
          rows={3}
          className="mt-3 w-full resize-none border-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {postType === "photo" && !imagePreview && (
          <p className="text-[10px] text-muted-foreground">
            Progress photos post to your chosen audience only — premium keeps it members-only.
          </p>
        )}

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

      {/* Active filter banner */}
      {(activeTag || activeUser) && (
        <div className="mt-4 flex items-center justify-between border border-gold/30 bg-deluxe-forest/30 px-3 py-2 text-xs">
          <div className="flex items-center gap-2 text-foreground">
            {activeTag ? <Hash className="h-3.5 w-3.5 text-gold" /> : <AtSign className="h-3.5 w-3.5 text-gold" />}
            <span className="uppercase tracking-[0.2em] text-muted-foreground">Filter</span>
            <span className="font-semibold text-gold">{activeTag ?? activeUser}</span>
            <span className="text-muted-foreground">· {filteredPosts.length} result{filteredPosts.length === 1 ? "" : "s"}</span>
          </div>
          <Link to="/app/community" className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-gold">Clear</Link>
        </div>
      )}

      {/* Feed */}
      <div className="mt-6 space-y-4 pb-12">
        {loading && <div className="text-center text-xs text-muted-foreground">Loading feed…</div>}
        {!loading && filteredPosts.length === 0 && (
          <div className="border border-gold/10 bg-deluxe-forest/10 p-8 text-center text-sm text-muted-foreground">
            {activeTag || activeUser ? "No posts match this filter yet." : "Be the first to post."}
          </div>
        )}
        {filteredPosts.map((p) => (
          <article
            key={p.id}
            id={`post-${p.id}`}
            className="relative scroll-mt-24 border border-gold/15 bg-deluxe-forest/20 p-4 transition-shadow"
          >
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
              <div className="flex items-center gap-2">
                {p.user_id === user?.id && (
                  <button onClick={() => { haptic("warning"); deletePost(p.id); }} className="text-muted-foreground hover:text-gold" aria-label="Delete post">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                {p.user_id !== user?.id && (
                  <div className="relative">
                    <button
                      onClick={() => { haptic("selection"); setMenuFor(menuFor === p.id ? null : p.id); }}
                      className="text-muted-foreground hover:text-gold"
                      aria-label="More options"
                      aria-haspopup="menu"
                      aria-expanded={menuFor === p.id}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {menuFor === p.id && (
                      <div role="menu" className="absolute right-0 top-6 z-20 w-44 border border-gold/30 bg-deluxe-black/95 p-1 shadow-xl backdrop-blur">
                        <button
                          role="menuitem"
                          onClick={() => muteUser(p)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground hover:bg-gold/10"
                        >
                          <BellOff className="h-3.5 w-3.5" /> Mute member
                        </button>
                        <button
                          role="menuitem"
                          onClick={() => reportPost(p)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-300 hover:bg-red-500/10"
                        >
                          <Flag className="h-3.5 w-3.5" /> Report post
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </header>
            <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{renderRichText(p.body)}</p>
            {p.workout_title && (
              <div className="mt-3 inline-flex items-center gap-2 border border-gold/20 bg-deluxe-black px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-gold">
                <Dumbbell className="h-3 w-3" /> {p.workout_title}
              </div>
            )}
            {p.image_url && (
              <img src={p.image_url} alt="" loading="lazy" className="mt-3 max-h-96 w-full rounded border border-gold/10 object-cover" />
            )}
            <div className="mt-4 flex items-center gap-4 border-t border-gold/10 pt-3">
              <button onClick={() => { haptic(p.liked ? "light" : "success"); toggleLike(p); }}
                className={`flex items-center gap-1.5 text-xs transition-colors ${p.liked ? "text-gold" : "text-muted-foreground hover:text-gold"}`}>
                <Heart className={`h-4 w-4 ${p.liked ? "fill-gold" : ""}`} /> {p.likes}
              </button>
              <button onClick={() => { haptic("selection"); setOpenComments(openComments === p.id ? null : p.id); }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold">
                <MessageCircle className="h-4 w-4" /> {p.comments}
              </button>
              <ShareButton
                title={`Deluxe Fitness — ${p.profile?.display_name ?? "Member"}`}
                text={p.body.slice(0, 140)}
                url={`/app/community?p=${p.id}`}
                label="Share"
                className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold"
              />
            </div>
            {openComments === p.id && (
              <Comments
                postId={p.id}
                onChange={load}
                focusCommentId={focusCommentId}
              />
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function Avatar({ url, name }: { url?: string | null; name?: string | null }) {
  if (url) return <img src={url} alt="" loading="lazy" decoding="async" className="h-10 w-10 rounded-full border border-gold/30 object-cover" />;
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 bg-deluxe-black text-xs font-bold text-gold">
      {(name ?? "M").charAt(0).toUpperCase()}
    </div>
  );
}

function Comments({
  postId,
  onChange,
  focusCommentId,
}: {
  postId: string;
  onChange: () => void;
  focusCommentId?: string | null;
}) {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const focusedRef = useRef(false);
  const missingNoticedRef = useRef(false);
  const [mutedUsers, setMutedUsers] = useState<Set<string>>(() => readSet(MUTE_COMMENT_USER_KEY));
  const [reportedComments, setReportedComments] = useState<Set<string>>(() => readSet(REPORT_COMMENT_KEY));
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const confirmDialog = useConfirm();

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
    setLoaded(true);
  };
  useEffect(() => { load(); }, [postId]);

  // Scroll to the targeted comment once loaded — with graceful fallback.
  useEffect(() => {
    if (!focusCommentId || focusedRef.current || !loaded) return;
    const visible = items.filter(
      (c) => !mutedUsers.has(c.user_id) && !reportedComments.has(c.id),
    );
    if (!visible.some((c) => c.id === focusCommentId)) {
      if (!missingNoticedRef.current) {
        missingNoticedRef.current = true;
        focusedRef.current = true;
        toast.error("That reply is no longer available.");
      }
      return;
    }
    focusedRef.current = true;
    requestAnimationFrame(() => {
      const el = document.getElementById(`comment-${focusCommentId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("bg-gold/10", "ring-2", "ring-gold/50");
        setTimeout(() => el.classList.remove("bg-gold/10", "ring-2", "ring-gold/50"), 2600);
      }
    });
  }, [items, focusCommentId, loaded, mutedUsers, reportedComments]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    haptic("light");
    const { error } = await supabase.from("post_comments").insert({ post_id: postId, user_id: user.id, body: text.trim() });
    if (error) { haptic("error"); return toast.error(error.message); }
    haptic("success");
    setText("");
    await load();
    onChange();
  };

  const muteCommentAuthor = async (c: any) => {
    const ok = await confirmDialog({
      title: "Mute member",
      description: `Hide all replies from ${c.name}. You can undo this later from settings.`,
      confirmLabel: "Mute",
      tone: "warning",
      icon: <BellOff className="h-5 w-5" />,
    });
    if (!ok) return;
    const next = new Set(mutedUsers);
    next.add(c.user_id);
    setMutedUsers(next);
    writeSet(MUTE_COMMENT_USER_KEY, next);
    toast.success("Muted. Their replies are hidden.");
    setMenuFor(null);
  };

  const reportComment = async (c: any) => {
    const ok = await confirmDialog({
      title: "Report reply",
      description: "Our moderation team will review this reply within 24 hours. Thanks for keeping the community premium.",
      confirmLabel: "Report",
      tone: "danger",
      icon: <Flag className="h-5 w-5" />,
    });
    if (!ok) return;
    const next = new Set(reportedComments);
    next.add(c.id);
    setReportedComments(next);
    writeSet(REPORT_COMMENT_KEY, next);
    toast.success("Reported. Thank you for keeping the community safe.");
    setMenuFor(null);
  };

  const deleteComment = async (c: any) => {
    const ok = await confirmDialog({
      title: "Delete reply",
      description: "This will permanently remove your reply. This cannot be undone.",
      confirmLabel: "Delete",
      tone: "danger",
      icon: <Trash2 className="h-5 w-5" />,
    });
    if (!ok) return;
    const { error } = await supabase.from("post_comments").delete().eq("id", c.id);
    if (error) { haptic("error"); return toast.error(error.message); }
    await load();
    onChange();
  };

  const visible = items.filter((c) => !mutedUsers.has(c.user_id) && !reportedComments.has(c.id));

  return (
    <div className="mt-3 space-y-2 border-t border-gold/10 pt-3">
      {visible.map((c) => (
        <div
          key={c.id}
          id={`comment-${c.id}`}
          className="group flex items-start justify-between gap-2 rounded px-1 py-1 text-xs transition-all"
        >
          <div className="min-w-0">
            <span className="font-semibold text-gold">{c.name}</span>{" "}
            <span className="text-foreground">{renderRichText(String(c.body))}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <ShareButton
              title="Deluxe Fitness reply"
              text={`${c.name}: ${String(c.body).slice(0, 140)}`}
              url={`/app/community?p=${postId}&c=${c.id}`}
              label=""
              className="text-muted-foreground opacity-0 transition hover:text-gold group-hover:opacity-100"
            />
            {c.user_id === user?.id ? (
              <button
                onClick={() => deleteComment(c)}
                className="text-muted-foreground opacity-0 transition hover:text-gold group-hover:opacity-100"
                aria-label="Delete reply"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => { haptic("selection"); setMenuFor(menuFor === c.id ? null : c.id); }}
                  className="text-muted-foreground opacity-0 transition hover:text-gold group-hover:opacity-100"
                  aria-label="More reply options"
                  aria-haspopup="menu"
                  aria-expanded={menuFor === c.id}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
                {menuFor === c.id && (
                  <div role="menu" className="absolute right-0 top-5 z-20 w-44 border border-gold/30 bg-deluxe-black/95 p-1 shadow-xl backdrop-blur">
                    <button
                      role="menuitem"
                      onClick={() => muteCommentAuthor(c)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground hover:bg-gold/10"
                    >
                      <BellOff className="h-3.5 w-3.5" /> Mute member
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => reportComment(c)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-300 hover:bg-red-500/10"
                    >
                      <Flag className="h-3.5 w-3.5" /> Report reply
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
      <form onSubmit={submit} className="flex items-center gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000}
          placeholder="Add a comment…"
          className="flex-1 border border-gold/20 bg-deluxe-black px-3 py-1.5 text-xs text-foreground focus:border-gold focus:outline-none" />
        <button type="submit" aria-label="Send comment" className="text-gold hover:text-gold/80"><Send className="h-4 w-4" /></button>
      </form>
    </div>
  );
}
