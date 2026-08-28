import { useCallback, useEffect, useState } from "react";
import { BellRing, CalendarClock, Loader2, Mail, MoonStar, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SectionLabel } from "@/components/deluxe/ui";
import { Switch } from "@/components/ui/switch";
import { haptic } from "@/hooks/useHaptics";

type Days = "all" | "weekdays" | "weekends";

interface Schedule {
  mission_reminder_enabled: boolean;
  mission_reminder_hour: number;
  mission_reminder_days: Days;
  mission_reminder_push: boolean;
  mission_reminder_email: boolean;
  timezone: string;
}

const DAY_OPTIONS: { value: Days; label: string; hint: string }[] = [
  { value: "all", label: "Every day", hint: "7 days a week" },
  { value: "weekdays", label: "Weekdays", hint: "Mon – Fri" },
  { value: "weekends", label: "Weekends", hint: "Sat & Sun" },
];

function zoneList(browserZone: string) {
  const supported = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf;
  const zones = supported ? supported("timeZone") : ["UTC", "Europe/London", "America/New_York"];
  return zones.includes(browserZone) ? zones : [browserZone, ...zones];
}

export function MissionScheduleSettings() {
  const { user } = useAuth();
  const browserZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const [sched, setSched] = useState<Schedule>({
    mission_reminder_enabled: true,
    mission_reminder_hour: 18,
    mission_reminder_days: "all",
    mission_reminder_push: true,
    mission_reminder_email: false,
    timezone: browserZone,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_profiles_ext")
      .select(
        "mission_reminder_enabled,mission_reminder_hour,mission_reminder_days,mission_reminder_push,mission_reminder_email,timezone",
      )
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      setSched({
        mission_reminder_enabled: data.mission_reminder_enabled ?? true,
        mission_reminder_hour: data.mission_reminder_hour ?? 18,
        mission_reminder_days: ((data.mission_reminder_days as Days | null) ?? "all"),
        mission_reminder_push: data.mission_reminder_push ?? true,
        mission_reminder_email: data.mission_reminder_email ?? false,
        timezone: data.timezone || browserZone,
      });
    }
    setLoading(false);
  }, [user, browserZone]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (patch: Partial<Schedule>) => {
    if (!user) return;
    const prev = sched;
    const next = { ...sched, ...patch };
    setSched(next);
    setSaving(true);
    const { error } = await supabase.from("user_profiles_ext").update(patch).eq("user_id", user.id);
    setSaving(false);
    if (error) {
      setSched(prev);
      toast.error(`Couldn't save: ${error.message}`);
    }
  };

  const localPreview = (() => {
    try {
      const d = new Date();
      d.setHours(sched.mission_reminder_hour, 0, 0, 0);
      return new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: sched.timezone,
        timeZoneName: "short",
      }).format(d);
    } catch {
      return `${String(sched.mission_reminder_hour).padStart(2, "0")}:00`;
    }
  })();

  return (
    <section className="mt-4 border border-gold/20 bg-deluxe-forest/20 p-5" aria-labelledby="mission-schedule-heading">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-3.5 w-3.5 text-gold" aria-hidden />
        <SectionLabel id="mission-schedule-heading">Mission reminder schedule</SectionLabel>
        {saving && <Loader2 className="h-3 w-3 animate-spin text-gold/70" aria-label="Saving" />}
      </div>

      <div className="mt-3 flex items-center justify-between border border-gold/15 bg-deluxe-black/30 p-3">
        <div className="min-w-0">
          <div className="text-sm text-foreground">Remind me to claim my 100 XP</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Next nudge at {localPreview}
          </div>
        </div>
        <Switch
          checked={sched.mission_reminder_enabled}
          disabled={loading}
          onCheckedChange={(v) => {
            haptic("selection");
            void save({ mission_reminder_enabled: v });
          }}
          aria-label="Enable mission reminders"
        />
      </div>

      <div className={`mt-3 grid gap-3 sm:grid-cols-2 ${sched.mission_reminder_enabled ? "" : "opacity-60"}`}>
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Reminder time</span>
          <select
            value={sched.mission_reminder_hour}
            disabled={loading || !sched.mission_reminder_enabled}
            onChange={(e) => void save({ mission_reminder_hour: parseInt(e.target.value, 10) })}
            className="mt-1 w-full border border-gold/20 bg-deluxe-black px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none disabled:opacity-50"
          >
            {Array.from({ length: 24 }).map((_, h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Timezone</span>
          <select
            value={sched.timezone}
            disabled={loading || !sched.mission_reminder_enabled}
            onChange={(e) => void save({ timezone: e.target.value })}
            className="mt-1 w-full border border-gold/20 bg-deluxe-black px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none disabled:opacity-50"
          >
            {zoneList(browserZone).map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className={`mt-3 ${sched.mission_reminder_enabled ? "" : "opacity-60"}`}>
        <legend className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Days</legend>
        <div className="mt-1 grid grid-cols-3 gap-2">
          {DAY_OPTIONS.map((o) => {
            const active = sched.mission_reminder_days === o.value;
            return (
              <button
                key={o.value}
                type="button"
                disabled={loading || !sched.mission_reminder_enabled}
                aria-pressed={active}
                onClick={() => {
                  haptic("selection");
                  void save({ mission_reminder_days: o.value });
                }}
                className={`min-h-12 border px-2 py-2 text-center transition ${
                  active ? "border-gold/60 bg-gold/12 text-gold" : "border-gold/15 bg-deluxe-black/30 text-muted-foreground"
                }`}
              >
                <span className="block text-xs">{o.label}</span>
                <span className="block text-[9px] uppercase tracking-[0.16em] opacity-70">{o.hint}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <ul className={`mt-3 space-y-2 ${sched.mission_reminder_enabled ? "" : "opacity-60"}`}>
        {[
          {
            key: "push" as const,
            icon: Smartphone,
            label: "Push notification",
            desc: "Delivered to subscribed devices.",
            value: sched.mission_reminder_push,
            onChange: (v: boolean) => save({ mission_reminder_push: v }),
          },
          {
            key: "email" as const,
            icon: Mail,
            label: "Email",
            desc: "Sent to your account address.",
            value: sched.mission_reminder_email,
            onChange: (v: boolean) => save({ mission_reminder_email: v }),
          },
        ].map((c) => (
          <li key={c.key} className="flex items-center gap-3 border border-gold/15 bg-deluxe-black/30 p-3">
            <c.icon className="h-4 w-4 shrink-0 text-gold" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="text-sm text-foreground">{c.label}</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{c.desc}</div>
            </div>
            <Switch
              checked={c.value}
              disabled={loading || !sched.mission_reminder_enabled}
              onCheckedChange={(v) => {
                haptic("selection");
                void c.onChange(v);
              }}
              aria-label={`Enable ${c.label} mission reminders`}
            />
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[10px] text-muted-foreground">
        Reminders only fire when today's 100 XP is still unclaimed, and open straight to your mission.
      </p>
    </section>
  );
}
