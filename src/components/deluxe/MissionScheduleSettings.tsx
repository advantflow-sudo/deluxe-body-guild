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
  quiet_hours_enabled: boolean;
  quiet_start_hour: number;
  quiet_end_hour: number;
}

function inQuietHours(hour: number, start: number, end: number) {
  if (start === end) return false;
  return start < end ? hour >= start && hour < end : hour >= start || hour < end;
}

/** Local date + hour in a given timezone right now. */
function zoneNow(tz: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    return { date: `${get("year")}-${get("month")}-${get("day")}`, hour: parseInt(get("hour"), 10) % 24 };
  } catch {
    const d = new Date();
    return { date: d.toISOString().slice(0, 10), hour: d.getUTCHours() };
  }
}

/** Next occurrences (local dates in the chosen timezone) honouring days + quiet hours. */
function nextReminders(s: Schedule, count = 3) {
  const out: string[] = [];
  if (!s.mission_reminder_enabled) return out;
  if (s.quiet_hours_enabled && inQuietHours(s.mission_reminder_hour, s.quiet_start_hour, s.quiet_end_hour)) return out;
  const now = zoneNow(s.timezone);
  for (let i = 0; i < 30 && out.length < count; i++) {
    const base = new Date(`${now.date}T12:00:00Z`);
    base.setUTCDate(base.getUTCDate() + i);
    const isoDow = ((base.getUTCDay() + 6) % 7) + 1;
    const dayOk =
      s.mission_reminder_days === "all" ||
      (s.mission_reminder_days === "weekdays" && isoDow <= 5) ||
      (s.mission_reminder_days === "weekends" && isoDow >= 6);
    if (!dayOk) continue;
    if (i === 0 && s.mission_reminder_hour <= now.hour) continue;
    const label = base.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
    out.push(`${i === 0 ? "Today" : label} · ${String(s.mission_reminder_hour).padStart(2, "0")}:00`);
  }
  return out;
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
    quiet_hours_enabled: false,
    quiet_start_hour: 22,
    quiet_end_hour: 7,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    // Placeholder zones stored by older signups (UTC / Etc-GMT aliases) make reminders
    // fire at the wrong local hour — adopt the device zone instead.
    const isPlaceholderZone = (tz: string | null | undefined) =>
      !tz || /^(UTC|GMT|Etc\/(UTC|GMT|Greenwich)|Africa\/Abidjan)$/i.test(tz);
    const { data } = await supabase
      .from("user_profiles_ext")
      .select(
        "mission_reminder_enabled,mission_reminder_hour,mission_reminder_days,mission_reminder_push,mission_reminder_email,timezone,quiet_hours_enabled,quiet_start_hour,quiet_end_hour",
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
        quiet_hours_enabled: data.quiet_hours_enabled ?? false,
        quiet_start_hour: data.quiet_start_hour ?? 22,
        quiet_end_hour: data.quiet_end_hour ?? 7,
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

  const upcoming = nextReminders(sched);

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

      <div className="mt-3 border border-gold/15 bg-deluxe-black/30 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <MoonStar className="h-4 w-4 shrink-0 text-gold" aria-hidden />
            <div className="min-w-0">
              <div className="text-sm text-foreground">Quiet hours</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Never nudge me while I sleep
              </div>
            </div>
          </div>
          <Switch
            checked={sched.quiet_hours_enabled}
            disabled={loading}
            onCheckedChange={(v) => {
              haptic("selection");
              void save({ quiet_hours_enabled: v });
            }}
            aria-label="Enable quiet hours"
          />
        </div>
        {sched.quiet_hours_enabled && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(
              [
                { key: "quiet_start_hour" as const, label: "Quiet from", value: sched.quiet_start_hour },
                { key: "quiet_end_hour" as const, label: "Quiet until", value: sched.quiet_end_hour },
              ]
            ).map((f) => (
              <label key={f.key} className="block">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{f.label}</span>
                <select
                  value={f.value}
                  disabled={loading}
                  onChange={(e) => void save({ [f.key]: parseInt(e.target.value, 10) } as Partial<Schedule>)}
                  className="mt-1 w-full border border-gold/20 bg-deluxe-black px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none disabled:opacity-50"
                >
                  {Array.from({ length: 24 }).map((_, h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, "0")}:00
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 border border-gold/15 bg-deluxe-black/30 p-3">
        <div className="flex items-center gap-2">
          <BellRing className="h-3.5 w-3.5 text-gold" aria-hidden />
          <SectionLabel>Next reminders</SectionLabel>
        </div>
        {upcoming.length === 0 ? (
          <p className="mt-2 text-[11px] text-muted-foreground">
            {sched.mission_reminder_enabled
              ? "Your reminder time falls inside quiet hours, so nothing is scheduled. Move the time or narrow quiet hours."
              : "Reminders are switched off, so nothing is scheduled."}
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {upcoming.map((u) => (
              <li key={u} className="flex flex-wrap items-center gap-2 text-[11px] text-foreground">
                <span>{u}</span>
                <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{sched.timezone}</span>
                {sched.mission_reminder_push && (
                  <span className="border border-gold/25 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-gold">
                    Push
                  </span>
                )}
                {sched.mission_reminder_email && (
                  <span className="border border-gold/25 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-gold">
                    Email
                  </span>
                )}
                {!sched.mission_reminder_push && !sched.mission_reminder_email && (
                  <span className="text-[9px] uppercase tracking-[0.16em] text-muted-foreground">In-app only</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground">
        Reminders only fire when today's 100 XP is still unclaimed, skip your quiet hours, and open straight to your
        mission.
      </p>
    </section>
  );
}
