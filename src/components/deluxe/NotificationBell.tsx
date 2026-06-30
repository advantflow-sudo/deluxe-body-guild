import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Heart, MessageCircle, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNotifications } from "@/hooks/useNotifications";
import { haptic } from "@/hooks/useHaptics";

export function NotificationBell() {
  const { items, unread, markAllRead, markRead, clear } = useNotifications();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => buttonRef.current?.focus());
  };

  const toggle = () => {
    haptic("selection");
    setOpen((v) => {
      if (!v) markAllRead();
      return !v;
    });
  };

  // Focus trap + Escape close
  useEffect(() => {
    if (!open) return;
    const root = popoverRef.current;
    const focusables = () =>
      Array.from(root?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? []);
    const first = focusables()[0];
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab") return;
      const f = focusables();
      if (!f.length) return;
      const firstEl = f[0];
      const lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={toggle}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="notifications-popover"
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/20 bg-deluxe-black/80 text-gold transition hover:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/60"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[1rem] place-items-center rounded-full bg-gold px-1 text-[9px] font-bold text-deluxe-black"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} aria-hidden="true" />
          <div
            id="notifications-popover"
            ref={popoverRef}
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
            className="absolute right-0 top-11 z-50 w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-gold/30 bg-deluxe-black/95 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-xl"
          >
            <header className="flex items-center justify-between border-b border-gold/15 px-4 py-3">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">Notifications</h2>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    onClick={clear}
                    className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-gold focus:outline-none focus:ring-2 focus:ring-gold/50 rounded"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={close}
                  aria-label="Close notifications"
                  className="text-muted-foreground hover:text-gold focus:outline-none focus:ring-2 focus:ring-gold/50 rounded"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </header>
            <ul className="max-h-[60vh] overflow-y-auto" aria-live="polite">
              {items.length === 0 && (
                <li className="px-4 py-8 text-center text-xs text-muted-foreground">
                  You're all caught up.
                </li>
              )}
              {items.map((n) => (
                <li key={n.id} className="border-b border-gold/10 last:border-b-0">
                  <Link
                    to="/app/community"
                    search={{ p: n.post_id, ...(n.comment_id ? { c: n.comment_id } : {}) } as never}
                    onClick={() => { markRead(n.id); close(); }}
                    className={`flex items-start gap-3 px-4 py-3 transition hover:bg-gold/5 focus:outline-none focus:bg-gold/10 ${n.read_at ? "opacity-70" : ""}`}
                    aria-label={`${n.actor_name} ${n.kind === "like" ? "liked your post" : "commented on your post"}`}
                  >
                    <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-gold/30 bg-deluxe-forest/30 text-gold">
                      {n.kind === "like"
                        ? <Heart className="h-3.5 w-3.5" aria-hidden="true" />
                        : <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />}
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
                    {!n.read_at && (
                      <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    )}
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
