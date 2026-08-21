import { useEffect, useState } from "react";
import { HeartPulse, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SectionLabel } from "@/components/deluxe/ui";

type Row = {
  sleep_quality: number;
  soreness: number;
  fatigue: number;
  energy: number;
  note: string | null;
  readiness: number;
};

const FIELDS = [
  { key: "sleep_quality", label: "Sleep quality", low: "Poor", high: "Perfect" },
  { key: "energy", label: "Energy", low: "Empty", high: "Charged" },
  { key: "soreness", label: "Soreness", low: "None", high: "Severe" },
  { key: "fatigue", label: "Fatigue", low: "Fresh", high: "Wrecked" },
] as const;

function readinessVerdict(r: number) {
  if (r >= 80) return { label: "Primed", advice: "Push intensity — go for a PB today." };
  if (r >= 60) return { label: "Ready", advice: "Train as planned. Keep form sharp." };
  if (r >= 40) return { label: "Moderate", advice: "Trim volume ~20%. Focus on technique." };
  return { label: "Low", advice: "Deload or active recovery. Sleep is the session today." };
}

export function RecoveryCheckin() {
  const { user } = useAuth();
  const [values, setValues] = useState<Row>({
    sleep_quality: 3,
    soreness: 3,
    fatigue: 3,
    energy: 3,
    note: "",
    readiness: 0,
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("recovery_logs")
        .select("sleep_quality,soreness,fatigue,energy,note,readiness")
        .eq("user_id", user.id)
        .eq("log_date", new Date().toISOString().slice(0, 10))
        .maybeSingle();
      if (data) {
        setValues({ ...(data as Row), note: data.note ?? "" });
        setSaved(true);
      }
    };
    load();
  }, [user]);

  const submit = async () => {
    setSaving(true);
    const { data, error } = await supabase.rpc("log_recovery", {
      _sleep_quality: values.sleep_quality,
      _soreness: values.soreness,
      _fatigue: values.fatigue,
      _energy: values.energy,
      _note: values.note?.trim() ? values.note.trim() : undefined,
    });
    setSaving(false);
    if (error) {
      toast.error("Could not save check-in", { description: error.message });
      return;
    }
    const row = data as unknown as Row;
    setValues({ ...row, note: row.note ?? "" });
    setSaved(true);
    await supabase.rpc("award_xp", { _reason: "recovery" });
    toast.success(`Readiness ${row.readiness}/100`, {
      description: readinessVerdict(row.readiness).advice,
    });
  };

  const verdict = readinessVerdict(values.readiness);

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between">
        <SectionLabel>Recovery &amp; Readiness</SectionLabel>
        {saved && (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-gold">
            <Check className="h-3 w-3" /> Logged today
          </span>
        )}
      </div>

      <div className="mt-3 border border-gold/20 bg-deluxe-forest/25 p-4">
        <div className="flex items-center gap-3">
          <HeartPulse className="h-5 w-5 text-gold" />
          <div className="min-w-0 flex-1">
            <div className="font-display text-lg text-foreground">
              {saved ? `${values.readiness}` : "—"}
              <span className="ml-1 text-xs text-muted-foreground">/100 readiness</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {saved ? `${verdict.label} · ${verdict.advice}` : "Log today to tune your training"}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <span>{f.label}</span>
                <span className="text-gold">{values[f.key]}/5</span>
              </div>
              <div className="mt-1.5 flex gap-1.5" role="group" aria-label={f.label}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${f.label} ${n} of 5`}
                    aria-pressed={values[f.key] === n}
                    onClick={() => setValues((v) => ({ ...v, [f.key]: n }))}
                    className={`h-8 flex-1 border text-[11px] transition focus:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
                      values[f.key] === n
                        ? "border-gold bg-gold-gradient font-semibold text-deluxe-black"
                        : "border-gold/25 bg-deluxe-black/50 text-muted-foreground hover:border-gold/60"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="mt-1 flex justify-between text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70">
                <span>{f.low}</span>
                <span>{f.high}</span>
              </div>
            </div>
          ))}
        </div>

        <textarea
          value={values.note ?? ""}
          onChange={(e) => setValues((v) => ({ ...v, note: e.target.value.slice(0, 500) }))}
          placeholder="Anything the coach should know? (sore shoulder, bad sleep…)"
          rows={2}
          className="mt-3 w-full resize-none border border-gold/20 bg-deluxe-black/50 p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold/60 focus:outline-none"
        />

        <button
          onClick={submit}
          disabled={saving}
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 bg-gold-gradient px-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-deluxe-black transition disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <HeartPulse className="h-3.5 w-3.5" />}
          {saved ? "Update check-in" : "Save check-in · +10 XP"}
        </button>
      </div>
    </div>
  );
}
