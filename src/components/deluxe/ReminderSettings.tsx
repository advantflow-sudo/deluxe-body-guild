import { useCallback, useEffect, useState } from "react";
import { Bell, Droplet, Loader2, Moon, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SectionLabel } from "@/components/deluxe/ui";
import { Switch } from "@/components/ui/switch";

interface Prefs {
  reminder_water_enabled: boolean;
  reminder_water_hour: number | null;
  reminder_sleep_enabled: boolean;
  reminder_evening_hour: number | null;
  reminder_goals_enabled: boolean;
  reminder_goals_hour: number | null;
  notifications_enabled: boolean;
}

const DEFAULTS: Prefs = {
  reminder_water_enabled: true, reminder_water_hour: 14,
  reminder_sleep_enabled: true, reminder_evening_hour: 22,
  reminder_goals_enabled: true, reminder_goals_hour: 9,
  notifications_enabled: true,
};

export function ReminderSettings() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("user_profiles_ext")
      .select("reminder_water_enabled,reminder_water_hour,reminder_sleep_enabled,reminder_evening_hour,reminder_goals_enabled,reminder_goals_hour,notifications_enabled")
      .eq("user_id", user.id).maybeSingle();
    if (error) toast.error(error.message);
    if (data) {
      setPrefs({
        reminder_water_enabled: data.reminder_water_enabled ?? true,
        reminder_water_hour: data.reminder_water_hour ?? 14,
        reminder_sleep_enabled: data.reminder_sleep_enabled ?? true,
        reminder_evening_hour: data.reminder_evening_hour ?? 22,
        reminder_goals_enabled: data.reminder_goals_enabled ?? true,
        reminder_goals_hour: data.reminder_goals_hour ?? 9,
        notifications_enabled: data.notifications_enabled ?? true,
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const save = async (patch: Partial<Prefs>) => {
    if (!user) return;
    const prev = prefs;
    const next = { ...prefs, ...patch };
    setPrefs(next); // optimistic
    setSaving(true);
    const { error } = await supabase
      .from("user_profiles_ext")
      .upsert({ user_id: user.id, ...next }, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      setPrefs(prev);
      toast.error(`Couldn't save: ${error.message}`);
    }
  };

  const rows = [
    {
      key: "water" as const,
      icon: Droplet,
      label: "Hydration",
      desc: "Mid-afternoon nudge to top up.",
      enabled: prefs.reminder_water_enabled,
      hour: prefs.reminder_water_hour,
      onEnable: (v: boolean) => save({ reminder_water_enabled: v }),
      onHour: (h: number) => save({ reminder_water_hour: h }),
    },
    {
      key: "sleep" as const,
      icon: Moon,
      label: "Sleep",
      desc: "Wind-down reminder before bed.",
      enabled: prefs.reminder_sleep_enabled,
      hour: prefs.reminder_evening_hour,
      onEnable: (v: boolean) => save({ reminder_sleep_enabled: v }),
      onHour: (h: number) => save({ reminder_evening_hour: h }),
    },
    {
      key: "goals" as const,
      icon: Sparkles,
      label: "Daily Goals",
      desc: "Morning checklist nudge.",
      enabled: prefs.reminder_goals_enabled,
      hour: prefs.reminder_goals_hour,
      onEnable: (v: boolean) => save({ reminder_goals_enabled: v }),
      onHour: (h: number) => save({ reminder_goals_hour: h }),
    },
  ];

  return (
    <section
      className="mt-5 border border-gold/20 bg-deluxe-forest/20 p-4 sm:p-5"
      aria-labelledby="reminders-heading"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-3.5 w-3.5 text-gold" />
          <SectionLabel id="reminders-heading">Reminders</SectionLabel>
          {saving && <Loader2 className="h-3 w-3 animate-spin text-gold/70" aria-label="Saving" />}
        </div>
        <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          All notifications
          <Switch
            checked={prefs.notifications_enabled}
            onCheckedChange={(v) => save({ notifications_enabled: v })}
            disabled={loading}
            aria-label="Enable all notifications"
          />
        </label>
      </div>

      <ul className="mt-3 space-y-2" aria-label="Reminder preferences">
        {rows.map((r) => {
          const muted = !prefs.notifications_enabled || !r.enabled;
          return (
            <li
              key={r.key}
              className={`flex items-center gap-3 border border-gold/15 bg-deluxe-black/30 p-3 ${muted ? "opacity-60" : ""}`}
            >
              <r.icon className="h-4 w-4 shrink-0 text-gold" aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-foreground">{r.label}</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{r.desc}</div>
              </div>
              <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <span className="sr-only">{r.label} time</span>
                <select
                  value={r.hour ?? 9}
                  onChange={(e) => r.onHour(parseInt(e.target.value, 10))}
                  disabled={loading || !prefs.notifications_enabled || !r.enabled}
                  aria-label={`${r.label} reminder time`}
                  className="border border-gold/30 bg-deluxe-black px-2 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 disabled:opacity-40"
                >
                  {Array.from({ length: 24 }).map((_, h) => (
                    <option key={h} value={h}>
                      {h.toString().padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
              </label>
              <Switch
                checked={r.enabled}
                onCheckedChange={r.onEnable}
                disabled={loading || !prefs.notifications_enabled}
                aria-label={`Enable ${r.label} reminders`}
              />
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
        Delivered via push when this device is subscribed. Quiet hours respected.
      </p>
    </section>
  );
}
