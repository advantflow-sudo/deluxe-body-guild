import { useCallback, useEffect, useState } from "react";
import { Bell, Check, Mail, RefreshCw, Smartphone, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SectionLabel } from "@/components/deluxe/ui";
import { haptic } from "@/hooks/useHaptics";

type Entry = {
  id: string;
  channel: string;
  kind: string;
  is_test: boolean;
  sent_at: string;
  claimed_after: boolean;
};

const CHANNEL: Record<string, { label: string; icon: typeof Bell }> = {
  push: { label: "Push", icon: Smartphone },
  email: { label: "Email", icon: Mail },
  in_app: { label: "In-app", icon: Bell },
};

export function ReminderHistory({ refreshKey = 0 }: { refreshKey?: number }) {
  const { user } = useAuth();
  const [rows, setRows] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.rpc("get_reminder_history", { _limit: 50 });
    setRows((data ?? []) as Entry[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const claimed = rows.filter((r) => r.claimed_after).length;

  return (
    <section className="mt-4 border border-gold/20 bg-deluxe-forest/12 p-5" aria-labelledby="reminder-history-heading">
      <div className="flex items-start justify-between gap-3">
        <div>
          <SectionLabel id="reminder-history-heading">Reminder history</SectionLabel>
          <h2 className="mt-1 font-display text-lg text-foreground">Every nudge, and what followed.</h2>
        </div>
        <button
          type="button"
          onClick={() => {
            haptic("light");
            void load();
          }}
          className="inline-flex min-h-10 items-center gap-2 border border-gold/25 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.18em] text-gold transition hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="mt-4 h-20 animate-pulse border border-gold/15 bg-deluxe-black/30" />
      ) : rows.length === 0 ? (
        <p className="mt-3 text-[11px] text-muted-foreground">
          No reminders sent yet. Send a test reminder above and it will appear here.
        </p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.18em]">
            <span className="border border-gold/30 px-2.5 py-1 text-gold">
              {claimed} of {rows.length} led to a claim
            </span>
          </div>
          <ul className="mt-3 divide-y divide-gold/10 border border-gold/15 bg-deluxe-black/30">
            {rows.map((r) => {
              const meta = CHANNEL[r.channel] ?? CHANNEL["in_app"]!;
              const Icon = meta.icon;
              return (
                <li key={r.id} className="flex items-center gap-3 px-3 py-2.5">
                  <Icon className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-foreground">
                      {meta.label}
                      {r.is_test ? " · test" : ""}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {new Date(r.sent_at).toLocaleString()}
                    </div>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 border px-2 py-1 text-[9px] uppercase tracking-[0.16em] ${
                      r.claimed_after ? "border-gold/50 text-gold" : "border-gold/15 text-muted-foreground"
                    }`}
                  >
                    {r.claimed_after ? <Check className="h-3 w-3" aria-hidden /> : <X className="h-3 w-3" aria-hidden />}
                    {r.claimed_after ? "Claimed" : "No claim"}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
