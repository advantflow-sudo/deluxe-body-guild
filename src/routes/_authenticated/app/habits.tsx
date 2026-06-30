import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GoldButton, SectionLabel } from "@/components/deluxe/ui";
import { haptic } from "@/hooks/useHaptics";

export const Route = createFileRoute("/_authenticated/app/habits")({
  component: HabitsTab,
});

interface Habit {
  id: string;
  name: string;
  habit_type: string;
  target_value: number;
  unit: string | null;
  icon: string | null;
  active: boolean;
  sort_order: number;
}

const PRESETS = [
  { name: "Drink water", icon: "💧", habit_type: "water", target_value: 8, unit: "glasses" },
  { name: "10,000 steps", icon: "👣", habit_type: "steps", target_value: 10000, unit: "steps" },
  { name: "8 hours sleep", icon: "😴", habit_type: "sleep", target_value: 8, unit: "hours" },
  { name: "Meditate", icon: "🧘", habit_type: "meditation", target_value: 10, unit: "min" },
  { name: "Stretch", icon: "🤸", habit_type: "custom", target_value: 10, unit: "min" },
  { name: "Read", icon: "📖", habit_type: "custom", target_value: 20, unit: "pages" },
];

function HabitsTab() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Record<string, Set<string>>>({}); // habit_id -> set of dates
  const [loading, setLoading] = useState(true);
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customTarget, setCustomTarget] = useState("1");
  const [customUnit, setCustomUnit] = useState("");
  const [customIcon, setCustomIcon] = useState("✨");

  const dates = Array.from({ length: 30 }, (_, i) => format(subDays(new Date(), 29 - i), "yyyy-MM-dd"));

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: h }, { data: l }] = await Promise.all([
      supabase.from("habits").select("*").eq("active", true).order("sort_order"),
      supabase.from("habit_logs").select("habit_id,log_date").gte("log_date", dates[0]),
    ]);
    setHabits((h ?? []) as Habit[]);
    const m: Record<string, Set<string>> = {};
    (l ?? []).forEach((r: any) => {
      if (!m[r.habit_id]) m[r.habit_id] = new Set();
      m[r.habit_id].add(r.log_date);
    });
    setLogs(m);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [user]);

  const addPreset = async (p: typeof PRESETS[number]) => {
    if (!user) return;
    if (habits.some((h) => h.name === p.name)) return toast.info("Already tracking this");
    const { error } = await supabase.from("habits").insert({
      user_id: user.id, ...p, sort_order: habits.length,
    });
    if (error) return toast.error(error.message);
    toast.success(`${p.name} added`);
    await load();
  };

  const addCustom = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !customName.trim()) return;
    const { error } = await supabase.from("habits").insert({
      user_id: user.id,
      name: customName.trim(),
      icon: customIcon,
      target_value: Number(customTarget) || 1,
      unit: customUnit.trim() || null,
      habit_type: "custom",
      sort_order: habits.length,
    });
    if (error) return toast.error(error.message);
    setCustomName(""); setCustomTarget("1"); setCustomUnit(""); setShowCustom(false);
    toast.success("Habit added");
    await load();
  };

  const remove = async (h: Habit) => {
    if (!confirm(`Stop tracking "${h.name}"?`)) return;
    await supabase.from("habits").update({ active: false }).eq("id", h.id);
    await load();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 pb-8 sm:px-5 sm:pt-8">
      <SectionLabel>Daily Habits</SectionLabel>
      <h1 className="mt-2 font-display text-3xl text-foreground">Build the rituals.</h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Each habit you check off today contributes up to 40 points to your Deluxe Score.
      </p>

      {/* Active habits with 30-day grid */}
      <div className="mt-6 space-y-3">
        {loading && <div className="text-center text-xs text-muted-foreground">Loading…</div>}
        {!loading && habits.length === 0 && (
          <div className="border border-gold/15 bg-deluxe-forest/10 p-6 text-center text-sm text-muted-foreground">
            No habits yet. Add one from the suggestions below.
          </div>
        )}
        {habits.map((h) => {
          const set = logs[h.id] ?? new Set<string>();
          const last30 = dates.filter((d) => set.has(d)).length;
          return (
            <div key={h.id} className="border border-gold/20 bg-deluxe-forest/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                  <div className="text-2xl">{h.icon ?? "✨"}</div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-foreground">{h.name}</div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {h.target_value} {h.unit ?? ""} · {last30}/30 days
                    </div>
                  </div>
                </div>
                <button onClick={() => { haptic("warning"); remove(h); }} className="text-muted-foreground hover:text-gold">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-30 gap-[2px]" style={{ gridTemplateColumns: "repeat(30, minmax(0, 1fr))" }}>
                {dates.map((d) => (
                  <div
                    key={d}
                    title={d}
                    className={`aspect-square ${set.has(d) ? "bg-gold" : "bg-gold/10"}`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick-add presets */}
      <div className="mt-8">
        <SectionLabel>Suggested</SectionLabel>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PRESETS.map((p) => {
            const added = habits.some((h) => h.name === p.name);
            return (
              <button
                key={p.name}
                disabled={added}
                onClick={() => { haptic("success"); addPreset(p); }}
                className={`flex items-center gap-2 border p-3 text-left transition-colors ${
                  added ? "border-gold/10 bg-deluxe-black/40 opacity-40" : "border-gold/20 bg-deluxe-forest/20 hover:border-gold/50"
                }`}
              >
                <span className="text-xl">{p.icon}</span>
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-foreground">{p.name}</div>
                  <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                    {p.target_value} {p.unit}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom */}
      <div className="mt-6">
        {!showCustom ? (
          <button
            onClick={() => setShowCustom(true)}
            className="flex w-full items-center justify-center gap-2 border border-dashed border-gold/30 p-3 text-xs uppercase tracking-[0.2em] text-gold hover:border-gold/60"
          >
            <Plus className="h-4 w-4" /> Custom habit
          </button>
        ) : (
          <form onSubmit={addCustom} className="space-y-2 border border-gold/20 bg-deluxe-forest/20 p-4">
            <div className="flex items-center gap-2">
              <input
                value={customIcon}
                onChange={(e) => setCustomIcon(e.target.value)}
                maxLength={2}
                className="w-12 border border-gold/20 bg-deluxe-black px-2 py-1.5 text-center text-lg focus:border-gold focus:outline-none"
              />
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Habit name"
                maxLength={60}
                required
                className="flex-1 border border-gold/20 bg-deluxe-black px-3 py-1.5 text-sm text-foreground focus:border-gold focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={customTarget}
                onChange={(e) => setCustomTarget(e.target.value)}
                className="w-24 border border-gold/20 bg-deluxe-black px-3 py-1.5 text-sm text-foreground focus:border-gold focus:outline-none"
              />
              <input
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                placeholder="unit (optional)"
                maxLength={20}
                className="flex-1 border border-gold/20 bg-deluxe-black px-3 py-1.5 text-sm text-foreground focus:border-gold focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => setShowCustom(false)} className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-gold">
                Cancel
              </button>
              <GoldButton type="submit" className="!px-5 !py-2 !text-[10px]">Add</GoldButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
