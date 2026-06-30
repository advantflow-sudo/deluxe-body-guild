import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Heart, MessageCircle, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNotifications } from "@/hooks/useNotifications";
import { haptic } from "@/hooks/useHaptics";

export function NotificationBell() {
  const { items, unread, markAllRead, clear } = useNotifications();
  const [open, setOpen] = useState(false);

  const toggle = () => {
    haptic("selection");
    setOpen((v) => {
      if (!v) markAllRead();
      return !v;
    });
  };

  return (
    <div className="relative">
      <button
        onClick={toggle}
        aria-label={unread ? `${unread} new notifications` : "Notifications"}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/20 bg-deluxe-black/80 text-gold transition hover:border-gold/50"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[1rem] place-items-center rounded-full bg-gold px-1 text-[9px] font-bold text-deluxe-black">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-gold/30 bg-deluxe-black/95 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-xl">
            <header className="flex items-center justify-between border-b border-gold/15 px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">Notifications</div>
              <div className="flex items-center gap-1">
                {items.length > 0 && (
                  <button onClick={clear} className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-gold">
                    Clear
                  </button>
                )}
                <button onClick={() => setOpen(false)} aria-label="Close" className="text-muted-foreground hover:text-gold">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>
            <ul className="max-h-[60vh] overflow-y-auto">
              {items.length === 0 && (
                <li className="px-4 py-8 text-center text-xs text-muted-foreground">
                  You're all caught up.
                </li>
              )}
              {items.map((n) => (
                <li key={n.id} className="border-b border-gold/10 last:border-b-0">
                  <Link
                    to="/app/community"
                    search={{ p: n.post_id } as never}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 transition hover:bg-gold/5"
                  >
                    <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-gold/30 bg-deluxe-forest/30 text-gold">
                      {n.kind === "like" ? <Heart className="h-3.5 w-3.5" /> : <MessageCircle className="h-3.5 w-3.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-foreground">
                        <span className="font-semibold text-gold">{n.actor_name}</span>{" "}
                        {n.kind === "like" ? "liked your post" : "commented on your post"}
                      </p>
                      {n.body && <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{n.body}</p>}
                      <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
