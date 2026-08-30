import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  Sparkles, Sunrise, Apple, Camera, Calendar, Images, TrendingDown,
  Trophy, Stethoscope, Flame, Users, Loader2, Upload, ChevronRight,
} from "lucide-react";
import { SectionLabel } from "@/components/deluxe/ui";
import { usePremium } from "@/hooks/usePremium";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fileToScaledDataUrl } from "@/lib/imageUtils";
import { reportError } from "@/lib/monitoring";
import { TodayNutritionRings } from "@/components/deluxe/TodayNutritionRings";

import {
  dailyBriefing, analyzeMeal, analyzeForm, adaptProgram, comparePhotos,
  detectPlateau, weeklyRecap, injuryTriage, streakRecovery, matchBuddy,
} from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/app/ai")({
  component: AIStudio,
});

type FeatureKey =
  | "briefing" | "meal" | "form" | "program" | "photos"
  | "plateau" | "recap" | "injury" | "streak" | "buddy";

const FEATURES: { key: FeatureKey; title: string; sub: string; icon: typeof Sparkles; premium?: boolean }[] = [
  { key: "briefing", title: "Daily Briefing", sub: "Morning read on energy, training & nutrition", icon: Sunrise },
  { key: "meal", title: "Meal Scan", sub: "Snap your plate — get macros in seconds", icon: Apple, premium: true },
  { key: "form", title: "Form Check", sub: "Upload a lift photo for AI form analysis", icon: Camera, premium: true },
  { key: "program", title: "Adaptive Plan", sub: "Next week, rewritten to match your recovery", icon: Calendar },
  { key: "photos", title: "Progress Compare", sub: "Side-by-side AI body composition read", icon: Images, premium: true },
  { key: "plateau", title: "Plateau Detector", sub: "Spot stagnation before it kills momentum", icon: TrendingDown },
  { key: "recap", title: "Weekly Recap", sub: "Shareable highlight reel of your week", icon: Trophy },
  { key: "injury", title: "Injury Triage", sub: "Smart modifications & when to see a pro", icon: Stethoscope },
  { key: "streak", title: "Streak Recovery", sub: "Missed a day? 10-min reset workout", icon: Flame },
  { key: "buddy", title: "Buddy Match", sub: "Find athletes on your wavelength", icon: Users },
];

function AIStudio() {
  const { isPremium } = usePremium();
  const [active, setActive] = useState<FeatureKey | null>(null);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-6 pb-8 sm:px-5">
      <SectionLabel>AI Studio</SectionLabel>
      <h1 className="mt-2 font-display text-2xl text-foreground sm:text-3xl">
        Your <span className="text-gold-gradient italic">intelligence stack</span>
      </h1>
      <p className="mt-2 text-xs text-muted-foreground">
        Ten AI features powered by your training, nutrition, and recovery data.
      </p>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {FEATURES.map((f) => {
          const locked = f.premium && !isPremium;
          return (
            <button
              key={f.key}
              onClick={() => {
                if (locked) { toast.error("Upgrade to Premium to unlock."); return; }
                setActive(f.key);
              }}
              className="group flex items-start gap-3 border border-gold/15 bg-deluxe-black/40 p-3.5 text-left transition hover:border-gold/60"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-gold/30 bg-deluxe-forest/30">
                <f.icon className="h-4 w-4 text-gold" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-sm text-foreground">{f.title}</span>
                  {f.premium && <span className="rounded-sm bg-gold-gradient px-1 py-0.5 text-[8px] font-bold uppercase text-deluxe-black">Pro</span>}
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{f.sub}</div>
              </div>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gold/50 group-hover:text-gold" />
            </button>
          );
        })}
      </div>

      {active && (
        <div className="mt-6 border border-gold/25 bg-deluxe-forest/20 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-display text-base text-foreground">
              {FEATURES.find((f) => f.key === active)?.title}
            </div>
            <button onClick={() => setActive(null)} className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-gold">Close</button>
          </div>
          <FeaturePanel feature={active} />
        </div>
      )}
    </div>
  );
}

function FeaturePanel({ feature }: { feature: FeatureKey }) {
  switch (feature) {
    case "briefing": return <BriefingPanel />;
    case "meal": return <MealPanel />;
    case "form": return <FormPanel />;
    case "program": return <ProgramPanel />;
    case "photos": return <PhotosPanel />;
    case "plateau": return <PlateauPanel />;
    case "recap": return <RecapPanel />;
    case "injury": return <InjuryPanel />;
    case "streak": return <StreakPanel />;
    case "buddy": return <BuddyPanel />;
  }
}

/* ---------- shared bits ---------- */
function Btn({ onClick, loading, children }: { onClick: () => void; loading?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={loading}
      className="inline-flex items-center gap-2 bg-gold-gradient px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-deluxe-black disabled:opacity-50">
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
      {children}
    </button>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 border border-gold/15 bg-deluxe-black/50 p-3 text-sm text-foreground"><div className="prose-deluxe">{children}</div></div>;
}


/* ---------- 1. Briefing ---------- */
function BriefingPanel() {
  const fn = useServerFn(dailyBriefing);
  const [out, setOut] = useState(""); const [loading, setLoading] = useState(false);
  async function run() {
    setLoading(true);
    try { const r = await fn({ data: undefined as any }); setOut(r.briefing); }
    catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }
  return <div><Btn onClick={run} loading={loading}>Generate briefing</Btn>{out && <Card><ReactMarkdown>{out}</ReactMarkdown></Card>}</div>;
}

/* ---------- 2. Meal ---------- */
type MealScan = {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  portion_estimate?: string;
  confidence: "low" | "medium" | "high";
  items?: string[];
  suggestions?: string[];
  notes?: string;
};

function MealPanel() {
  const fn = useServerFn(analyzeMeal);
  const { user } = useAuth();
  const [img, setImg] = useState<string | null>(null);
  const [result, setResult] = useState<MealScan | null>(null);
  const [edit, setEdit] = useState<MealScan | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [note, setNote] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(f: File) {
    setResult(null); setEdit(null); setSaved(false);
    setLoading(true);
    try {
      const url = await fileToScaledDataUrl(f);
      setImg(url);
      const r = (await fn({ data: { imageDataUrl: url, note: note || undefined } })) as MealScan;
      setResult(r);
      setEdit({ ...r });
      if (r.confidence === "low") {
        toast("I'm not completely sure what this is — please check the foods and portions before saving.");
      }
    } catch (e: any) {
      reportError({
        message: `meal-scan failed: ${e?.message ?? "unknown"}`,
        severity: "error",
        extra: { area: "meal-scan", fileKb: Math.round(f.size / 1024), type: f.type },
      });
      toast.error(e?.message ?? "Couldn't analyze that photo. Try a clearer, well-lit shot.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmAndSave() {
    if (!user || !edit) return;
    setSaving(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { error } = await supabase.from("nutrition_logs").insert({
        user_id: user.id,
        log_date: today,
        meal_label: edit.name,
        calories: Math.round(edit.calories),
        protein_g: Math.round(edit.protein_g),
        carbs_g: Math.round(edit.carbs_g),
        fat_g: Math.round(edit.fat_g),
      });
      if (error) throw error;
      setSaved(true);
      toast.success("Meal saved to today's nutrition log.");
    } catch (e: any) {
      reportError({ message: `meal-scan save failed: ${e?.message ?? "unknown"}`, severity: "error", extra: { area: "meal-scan" } });
      toast.error("Couldn't save the meal — try again.");
    } finally {
      setSaving(false);
    }
  }

  const num = (v: string) => Math.max(0, Number(v.replace(/[^\d.]/g, "")) || 0);

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 border border-gold/40 bg-deluxe-black/60 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-foreground">
          <Upload className="h-3.5 w-3.5" /> {img ? "Retake photo" : "Snap meal photo"}
        </button>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note (e.g. 'large portion')"
          className="min-w-40 flex-1 border border-gold/20 bg-deluxe-black/60 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground"
        />
      </div>
      {img && <img src={img} alt="meal" className="mt-3 max-h-56 border border-gold/20" />}
      {loading && (
        <div className="mt-3 space-y-2" aria-live="polite">
          <div className="text-xs text-muted-foreground"><Loader2 className="inline h-3 w-3 animate-spin" /> Analyzing your plate…</div>
          <div className="h-2 w-full animate-pulse bg-gold/10" />
        </div>
      )}
      {edit && !loading && (
        <Card>
          {edit.confidence === "low" && (
            <div className="mb-3 border border-amber-400/40 bg-amber-400/10 p-2 text-[11px] text-amber-200">
              Low confidence — review and edit the foods and portions below before saving.
            </div>
          )}
          <label className="block text-[10px] uppercase tracking-[0.2em] text-gold">Meal name</label>
          <input
            value={edit.name}
            onChange={(e) => setEdit({ ...edit, name: e.target.value })}
            className="mt-1 w-full border border-gold/20 bg-deluxe-black/60 px-3 py-2 font-display text-base text-gold"
          />
          <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
            {([["kcal", "calories"], ["P (g)", "protein_g"], ["C (g)", "carbs_g"], ["F (g)", "fat_g"]] as const).map(([label, key]) => (
              <div key={key} className="border border-gold/20 p-2">
                <input
                  value={Math.round(edit[key])}
                  onChange={(e) => setEdit({ ...edit, [key]: num(e.target.value) })}
                  inputMode="numeric"
                  className="w-full bg-transparent text-center font-display text-foreground focus:outline-none"
                  aria-label={label}
                />
                <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
          {edit.portion_estimate && <div className="mt-2 text-[11px] text-muted-foreground">Portion: {edit.portion_estimate}</div>}
          <div className="mt-1 text-[11px] text-muted-foreground">
            Confidence: {edit.confidence}{edit.items?.length ? ` · ${edit.items.join(", ")}` : ""}
          </div>
          {edit.suggestions?.length ? <List label="Suggestions" items={edit.suggestions} /> : null}
          {edit.notes && <p className="mt-2 text-[11px] text-muted-foreground">{edit.notes}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {saved ? (
              <Link to="/app/nutrition" className="inline-flex items-center gap-2 bg-gold-gradient px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-deluxe-black">
                View in Nutrition <ChevronRight className="h-3 w-3" />
              </Link>
            ) : (
              <Btn onClick={confirmAndSave} loading={saving}>Confirm & log meal</Btn>
            )}
            <button onClick={() => { setResult(null); setEdit(null); setImg(null); setSaved(false); }} className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-gold">
              Discard
            </button>
          </div>
        </Card>
      )}
      <div className="mt-5 border-t border-gold/10 pt-5">
        <TodayNutritionRings />
        <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Every scanned meal lands here instantly
        </p>
      </div>
    </div>

  );
}
function Macro({ label, v }: { label: string; v: number }) {
  return <div className="border border-gold/20 p-2"><div className="font-display text-foreground">{Math.round(v)}</div><div className="text-[10px] text-muted-foreground uppercase">{label}</div></div>;
}

/* ---------- 3. Form ---------- */
function FormPanel() {
  const fn = useServerFn(analyzeForm); const toDataUrl = fileToScaledDataUrl;
  const [exercise, setExercise] = useState("Back Squat");
  const [img, setImg] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  async function go() {
    if (!img) return toast.error("Upload a photo first");
    setLoading(true);
    try { setResult(await fn({ data: { imageDataUrl: img, exercise } })); }
    catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }
  return (
    <div>
      <input value={exercise} onChange={(e) => setExercise(e.target.value)} placeholder="Exercise"
        className="w-full border border-gold/20 bg-deluxe-black/60 px-3 py-2 text-sm text-foreground" />
      <input ref={inputRef} type="file" accept="image/*" capture="environment" hidden
        onChange={async (e) => { const f = e.target.files?.[0]; if (f) setImg(await toDataUrl(f)); }} />
      <div className="mt-2 flex gap-2">
        <button onClick={() => inputRef.current?.click()} className="border border-gold/40 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-foreground">
          {img ? "Change photo" : "Upload"}
        </button>
        <Btn onClick={go} loading={loading}>Analyze</Btn>
      </div>
      {img && <img src={img} alt="form" className="mt-3 max-h-56 border border-gold/20" />}
      {result && (
        <Card>
          <div className="mb-2 flex items-center gap-2">
            <span className="font-display text-2xl text-gold">{result.score}/10</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Risk: {result.risk}</span>
          </div>
          <List label="Strengths" items={result.strengths} />
          <List label="Issues" items={result.issues} />
          <List label="Cues" items={result.cues} />
        </Card>
      )}
    </div>
  );
}
function List({ label, items }: { label: string; items?: string[] }) {
  if (!items?.length) return null;
  return <div className="mt-2"><div className="text-[10px] uppercase tracking-[0.2em] text-gold">{label}</div><ul className="ml-4 list-disc text-sm text-foreground">{items.map((i, k) => <li key={k}>{i}</li>)}</ul></div>;
}

/* ---------- 4. Program ---------- */
function ProgramPanel() {
  const fn = useServerFn(adaptProgram);
  const [r, setR] = useState<any>(null); const [loading, setLoading] = useState(false);
  async function run() { setLoading(true); try { setR(await fn({ data: undefined as any })); } catch (e: any) { toast.error(e.message); } finally { setLoading(false); } }
  return (
    <div>
      <Btn onClick={run} loading={loading}>Generate next-week plan</Btn>
      {r && (
        <Card>
          <div className="text-[10px] uppercase tracking-[0.2em] text-gold">Intensity: {r.intensity}</div>
          <p className="mt-1 text-sm text-foreground">{r.rationale}</p>
          <div className="mt-3 space-y-2">
            {r.days?.map((d: any, i: number) => (
              <div key={i} className="border border-gold/15 bg-deluxe-black/40 p-2">
                <div className="font-display text-sm text-gold">{d.day} · {d.focus} · {d.duration_min}min</div>
                <ul className="ml-4 list-disc text-xs text-foreground">{d.blocks?.map((b: string, k: number) => <li key={k}>{b}</li>)}</ul>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ---------- 5. Photos ---------- */
function PhotosPanel() {
  const fn = useServerFn(comparePhotos); const toDataUrl = fileToScaledDataUrl;
  const [a, setA] = useState<string | null>(null); const [b, setB] = useState<string | null>(null);
  const [r, setR] = useState<any>(null); const [loading, setLoading] = useState(false);
  async function go() {
    if (!a || !b) return toast.error("Need both photos");
    setLoading(true); try { setR(await fn({ data: { beforeUrl: a, afterUrl: b } })); }
    catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }
  const pick = (set: (s: string) => void) => {
    const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*";
    inp.onchange = async () => { const f = inp.files?.[0]; if (f) set(await toDataUrl(f)); };
    inp.click();
  };
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => pick(setA)} className="border border-gold/30 bg-deluxe-black/40 p-2 text-xs text-foreground">
          {a ? <img src={a} className="max-h-32 mx-auto" /> : "Upload BEFORE"}
        </button>
        <button onClick={() => pick(setB)} className="border border-gold/30 bg-deluxe-black/40 p-2 text-xs text-foreground">
          {b ? <img src={b} className="max-h-32 mx-auto" /> : "Upload AFTER"}
        </button>
      </div>
      <div className="mt-3"><Btn onClick={go} loading={loading}>Compare</Btn></div>
      {r && (
        <Card>
          <p className="text-sm">{r.summary}</p>
          <List label="Improvements" items={r.improvements} />
          <List label="Focus next" items={r.focus_next} />
          {r.posture_note && <p className="mt-2 text-[11px] text-muted-foreground">{r.posture_note}</p>}
        </Card>
      )}
    </div>
  );
}

/* ---------- 6. Plateau ---------- */
function PlateauPanel() {
  const fn = useServerFn(detectPlateau);
  const [r, setR] = useState<any>(null); const [loading, setLoading] = useState(false);
  async function run() { setLoading(true); try { setR(await fn({ data: undefined as any })); } catch (e: any) { toast.error(e.message); } finally { setLoading(false); } }
  return (
    <div>
      <Btn onClick={run} loading={loading}>Scan last 60 days</Btn>
      {r && (
        <Card>
          <div className="font-display text-base text-gold">{r.plateau_detected ? "Plateau detected" : "On track"} · {r.trend}</div>
          <p className="mt-1 text-sm">{r.insight}</p>
          <List label="Interventions" items={r.interventions} />
        </Card>
      )}
    </div>
  );
}

/* ---------- 7. Recap ---------- */
function RecapPanel() {
  const fn = useServerFn(weeklyRecap);
  const [r, setR] = useState<any>(null); const [loading, setLoading] = useState(false);
  async function run() { setLoading(true); try { setR(await fn({ data: undefined as any })); } catch (e: any) { toast.error(e.message); } finally { setLoading(false); } }
  return (
    <div>
      <Btn onClick={run} loading={loading}>Build my week</Btn>
      {r && (
        <Card>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <Macro label="sess" v={r.totals.sessions} />
            <Macro label="min" v={r.totals.minutes} />
            <Macro label="kcal" v={r.totals.calories} />
            <Macro label="streak" v={r.totals.streak} />
          </div>
          <div className="mt-3 whitespace-pre-wrap text-sm">{r.recap}</div>
        </Card>
      )}
    </div>
  );
}

/* ---------- 8. Injury ---------- */
function InjuryPanel() {
  const fn = useServerFn(injuryTriage);
  const [c, setC] = useState(""); const [r, setR] = useState<any>(null); const [loading, setLoading] = useState(false);
  async function run() {
    if (c.trim().length < 5) return;
    setLoading(true); try { setR(await fn({ data: { complaint: c } })); }
    catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }
  return (
    <div>
      <textarea value={c} onChange={(e) => setC(e.target.value)} rows={3} placeholder="e.g. left knee aches on lunges, started Monday…"
        className="w-full border border-gold/20 bg-deluxe-black/60 p-2 text-sm text-foreground" />
      <div className="mt-2"><Btn onClick={run} loading={loading}>Triage</Btn></div>
      {r && (
        <Card>
          <div className="font-display text-base text-gold">Severity: {r.severity}</div>
          <List label="Likely factors" items={r.likely_factors} />
          <List label="Modifications" items={r.modifications} />
          <List label="Mobility drills" items={r.mobility_drills} />
          <List label="Red flags" items={r.red_flags} />
          <p className="mt-2 text-[11px] text-muted-foreground">See a pro if: {r.see_pro_if}</p>
        </Card>
      )}
    </div>
  );
}

/* ---------- 9. Streak ---------- */
function StreakPanel() {
  const fn = useServerFn(streakRecovery);
  const [r, setR] = useState(""); const [loading, setLoading] = useState(false);
  async function run() { setLoading(true); try { const o = await fn({ data: undefined as any }); setR(o.reset); } catch (e: any) { toast.error(e.message); } finally { setLoading(false); } }
  return <div><Btn onClick={run} loading={loading}>Get reset workout</Btn>{r && <Card><ReactMarkdown>{r}</ReactMarkdown></Card>}</div>;
}

/* ---------- 10. Buddy ---------- */
function BuddyPanel() {
  const fn = useServerFn(matchBuddy);
  const [r, setR] = useState<any>(null); const [loading, setLoading] = useState(false);
  async function run() { setLoading(true); try { setR(await fn({ data: undefined as any })); } catch (e: any) { toast.error(e.message); } finally { setLoading(false); } }
  return (
    <div>
      <Btn onClick={run} loading={loading}>Find matches</Btn>
      {r && (
        <div className="mt-3 space-y-2">
          {r.matches?.length === 0 && <div className="text-xs text-muted-foreground">No strong matches yet — invite more friends.</div>}
          {r.matches?.map((m: any) => (
            <div key={m.user_id} className="flex items-center gap-3 border border-gold/15 bg-deluxe-black/40 p-2">
              {m.profile?.avatar_url ? <img src={m.profile.avatar_url} alt="" loading="lazy" decoding="async" className="h-9 w-9 rounded-full" /> : <div className="h-9 w-9 bg-deluxe-forest/40" />}
              <div className="flex-1">
                <div className="font-display text-sm text-foreground">{m.profile?.display_name ?? "Athlete"}</div>
                <div className="text-[11px] text-muted-foreground">{m.goal} · {m.level}</div>
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-gold">{m.score}/7</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
