import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { haptic } from "@/hooks/useHaptics";

export interface AppNotification {
  id: string;
  kind: "like" | "comment";
  post_id: string;
  comment_id?: string | null;
  actor_id: string;
  actor_name?: string;
  body?: string | null;
  created_at: string;
  read_at: string | null;
}

interface Ctx {
  items: AppNotification[];
  unread: number;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationsCtx = createContext<Ctx>({
  items: [],
  unread: 0,
  markAllRead: async () => {},
  markRead: async () => {},
  clear: async () => {},
  refresh: async () => {},
});

const MAX = 50;

/**
 * Show a local notification via the registered service worker when the
 * user has granted permission. Silent no-op otherwise — the in-app toast
 * acts as the fallback.
 */
async function tryShowSystemNotification(title: string, body?: string, url?: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg?.active) {
      reg.active.postMessage({
        type: "df-show-notification",
        title,
        options: { body, icon: "/app-icon-192.png", badge: "/app-icon-192.png", data: { url } },
      });
    }
  } catch {
    /* noop */
  }
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const nameCache = useRef<Map<string, string>>(new Map());

  const enrich = useCallback(async (rows: AppNotification[]) => {
    const missing = Array.from(new Set(rows.map((r) => r.actor_id).filter((id) => id && !nameCache.current.has(id))));
    if (missing.length) {
      const { data } = await supabase.from("profiles").select("id,display_name").in("id", missing);
      (data ?? []).forEach((p) => nameCache.current.set(p.id, p.display_name ?? "A member"));
    }
    return rows.map((r) => ({ ...r, actor_name: nameCache.current.get(r.actor_id) ?? "A member" }));
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id,kind,post_id,comment_id,actor_id,body,created_at,read_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(MAX);
    if (!data) return;
    const enriched = await enrich(data as AppNotification[]);
    setItems(enriched);
  }, [user, enrich]);

  useEffect(() => {
    if (!user) { setItems([]); return; }
    refresh();

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        async (payload) => {
          const row = payload.new as AppNotification;
          const [enriched] = await enrich([row]);
          setItems((prev) => [enriched, ...prev.filter((p) => p.id !== enriched.id)].slice(0, MAX));
          haptic("light");
          const title = enriched.kind === "like"
            ? `${enriched.actor_name} liked your post`
            : `${enriched.actor_name} commented on your post`;
          toast(title, { description: enriched.body?.slice(0, 80) ?? undefined });
          tryShowSystemNotification(title, enriched.body ?? undefined, `/app/community?p=${enriched.post_id}${enriched.comment_id ? `&c=${enriched.comment_id}` : ""}`);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as AppNotification;
          setItems((prev) => prev.map((p) => (p.id === row.id ? { ...p, read_at: row.read_at } : p)));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const oldRow = payload.old as { id: string };
          setItems((prev) => prev.filter((p) => p.id !== oldRow.id));
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, enrich, refresh]);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })));
    await supabase.from("notifications").update({ read_at: now }).eq("user_id", user.id).is("read_at", null);
  }, [user]);

  const markRead = useCallback(async (id: string) => {
    if (!user) return;
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: n.read_at ?? now } : n)));
    await supabase.from("notifications").update({ read_at: now }).eq("id", id).is("read_at", null);
  }, [user]);

  const clear = useCallback(async () => {
    if (!user) return;
    setItems([]);
    await supabase.from("notifications").delete().eq("user_id", user.id);
  }, [user]);

  const value = useMemo<Ctx>(() => ({
    items,
    unread: items.filter((n) => !n.read_at).length,
    markAllRead,
    markRead,
    clear,
    refresh,
  }), [items, markAllRead, markRead, clear, refresh]);

  return <NotificationsCtx.Provider value={value}>{children}</NotificationsCtx.Provider>;
}

export function useNotifications() {
  return useContext(NotificationsCtx);
}
