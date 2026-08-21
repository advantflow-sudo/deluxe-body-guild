import { useEffect, useState } from "react";
import { Brain, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Fact = { id: string; category: string; key: string; value: string };

export function CoachMemoryPanel({ refreshKey = 0 }: { refreshKey?: number }) {
  const { user } = useAuth();
  const [facts, setFacts] = useState<Fact[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("ai_coach_memory")
      .select("id,category,key,value")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .then(({ data }) => setFacts((data ?? []) as Fact[]));
  }, [user, refreshKey]);

  const forget = async (id: string) => {
    const { error } = await supabase.from("ai_coach_memory").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setFacts((f) => f.filter((x) => x.id !== id));
    toast.success("Forgotten");
  };

  return (
    <div className="mt-4 border border-gold/15 bg-deluxe-black/40">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left"
      >
        <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
          <Brain className="h-3.5 w-3.5" /> Coach memory
          <span className="text-muted-foreground">({facts.length})</span>
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-gold transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-gold/10 p-3">
          {facts.length === 0 ? (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Nothing remembered yet. Tell the coach your goals, equipment, injuries and lifts — it will remember them for
              every future conversation.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {facts.map((f) => (
                <li key={f.id} className="flex items-start justify-between gap-2 border border-gold/10 bg-deluxe-forest/20 px-2.5 py-2">
                  <div className="min-w-0">
                    <div className="text-[9px] uppercase tracking-[0.2em] text-gold">{f.category}</div>
                    <div className="text-xs text-foreground">
                      <span className="text-muted-foreground">{f.key.replace(/_/g, " ")}: </span>
                      {f.value}
                    </div>
                  </div>
                  <button
                    onClick={() => forget(f.id)}
                    aria-label={`Forget ${f.key.replace(/_/g, " ")}`}
                    className="shrink-0 text-muted-foreground transition hover:text-gold"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
