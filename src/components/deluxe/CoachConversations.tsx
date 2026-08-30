/**
 * Conversation history drawer for the AI Coach — lists the member's past
 * coach threads and lets them start a fresh one.
 */
import { useEffect, useState } from "react";
import { History, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type ConversationSummary = { id: string; title: string; updated_at: string };

export function CoachConversations({
  userId,
  activeId,
  refreshKey,
  onSelect,
  onNew,
}: {
  userId: string | undefined;
  activeId: string | null;
  refreshKey: number;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ConversationSummary[]>([]);

  useEffect(() => {
    if (!userId || !open) return;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("ai_conversations")
        .select("id,title,updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(30);
      if (!cancelled) setItems(data ?? []);
    })();
    return () => { cancelled = true; };
  }, [userId, open, refreshKey]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1.5 border border-gold/25 bg-deluxe-black/40 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground transition hover:border-gold/60 hover:text-foreground"
        >
          <History className="h-3 w-3" /> History
        </button>
        <button
          onClick={onNew}
          className="inline-flex items-center gap-1.5 border border-gold/25 bg-deluxe-black/40 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground transition hover:border-gold/60 hover:text-foreground"
        >
          <Plus className="h-3 w-3" /> New chat
        </button>
      </div>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 max-h-72 w-72 overflow-y-auto border border-gold/25 bg-deluxe-black shadow-xl">
          <div className="flex items-center justify-between border-b border-gold/15 px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Past threads</span>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {items.length === 0 ? (
            <div className="px-3 py-4 text-xs text-muted-foreground">No conversations yet.</div>
          ) : (
            items.map((c) => (
              <button
                key={c.id}
                onClick={() => { onSelect(c.id); setOpen(false); }}
                className={`block w-full truncate border-b border-gold/10 px-3 py-2 text-left text-xs transition hover:bg-gold/10 ${
                  c.id === activeId ? "bg-gold/10 text-gold" : "text-foreground"
                }`}
              >
                {c.title || "Untitled chat"}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
