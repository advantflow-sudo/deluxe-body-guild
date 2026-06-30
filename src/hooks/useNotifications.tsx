import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { haptic } from "@/hooks/useHaptics";

export interface AppNotification {
  id: string;
  kind: "like" | "comment";
  post_id: string;
  actor_id: string;
  actor_name?: string;
  body?: string;
  created_at: string;
  read: boolean;
}

interface Ctx {
  items: AppNotification[];
  unread: number;
  markAllRead: () => void;
  clear: () => void;
}
const NotificationsCtx = createContext<Ctx>({ items: [], unread: 0, markAllRead: () => {}, clear: () => {} });

const KEY = (uid: string) => `df_notifs_v1_${uid}`;
const MAX = 50;

function load(uid: string): AppNotification[] {
  try { return JSON.parse(localStorage.getItem(KEY(uid)) ?? "[]"); } catch { return []; }
}
function save(uid: string, items: AppNotification[]) {
  try { localStorage.setItem(KEY(uid), JSON.stringify(items.slice(0, MAX))); } catch { /* noop */ }
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) { setItems([]); return; }
    const initial = load(user.id);
    setItems(initial);
    seenRef.current = new Set(initial.map((n) => n.id));

    const push = async (n: Omit<AppNotification, "actor_name">) => {
      if (seenRef.current.has(n.id)) return;
      seenRef.current.add(n.id);
      const { data: prof } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", n.actor_id)
        .maybeSingle();
      const full: AppNotification = { ...n, actor_name: prof?.display_name ?? "A member" };
      setItems((prev) => {
        const next = [full, ...prev].slice(0, MAX);
        save(user.id, next);
        return next;
      });
      haptic("light");
      toast(
        n.kind === "like"
          ? `${full.actor_name} liked your post`
          : `${full.actor_name} commented on your post`,
        { description: n.body?.slice(0, 80) },
      );
    };

    const likeChan = supabase
      .channel(`notif-likes-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "post_likes" }, async (payload) => {
        const row = payload.new as { post_id: string; user_id: string; created_at?: string };
        if (row.user_id === user.id) return;
        const { data: post } = await supabase
          .from("community_posts")
          .select("user_id")
          .eq("id", row.post_id)
          .maybeSingle();
        if (post?.user_id !== user.id) return;
        await push({
          id: `like:${row.post_id}:${row.user_id}`,
          kind: "like",
          post_id: row.post_id,
          actor_id: row.user_id,
          created_at: row.created_at ?? new Date().toISOString(),
          read: false,
        });
      })
      .subscribe();

    const cmtChan = supabase
      .channel(`notif-comments-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "post_comments" }, async (payload) => {
        const row = payload.new as { id: string; post_id: string; user_id: string; body: string; created_at?: string };
        if (row.user_id === user.id) return;
        const { data: post } = await supabase
          .from("community_posts")
          .select("user_id")
          .eq("id", row.post_id)
          .maybeSingle();
        if (post?.user_id !== user.id) return;
        await push({
          id: `cmt:${row.id}`,
          kind: "comment",
          post_id: row.post_id,
          actor_id: row.user_id,
          body: row.body,
          created_at: row.created_at ?? new Date().toISOString(),
          read: false,
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(likeChan);
      supabase.removeChannel(cmtChan);
    };
  }, [user]);

  const markAllRead = useCallback(() => {
    if (!user) return;
    setItems((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      save(user.id, next);
      return next;
    });
  }, [user]);

  const clear = useCallback(() => {
    if (!user) return;
    setItems([]);
    save(user.id, []);
  }, [user]);

  const value = useMemo<Ctx>(() => ({
    items,
    unread: items.filter((n) => !n.read).length,
    markAllRead,
    clear,
  }), [items, markAllRead, clear]);

  return <NotificationsCtx.Provider value={value}>{children}</NotificationsCtx.Provider>;
}

export function useNotifications() {
  return useContext(NotificationsCtx);
}
