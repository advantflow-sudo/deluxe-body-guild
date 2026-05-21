import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/deluxe/Logo";
import { GoldButton, OutlineButton, SectionLabel } from "@/components/deluxe/ui";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

const GOALS = ["Lose fat", "Build muscle", "Get stronger", "Improve endurance", "General wellbeing"];
const LEVELS = ["beginner", "intermediate", "advanced"] as const;
const TYPES = ["Gym", "Home", "Cardio", "Strength", "Fat Loss"];
const PLANS = [
  { id: "free", label: "Free", price: "£0", desc: "Core workouts, basic tracking." },
  { id: "premium", label: "Premium", price: "£14/mo", desc: "All plans, AI coach, challenges." },
  { id: "deluxe", label: "Deluxe", price: "£39/mo", desc: "1:1 coaching, nutrition, concierge." },
];

function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState(GOALS[0]);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("beginner");
  const [type, setType] = useState(TYPES[0]);
  const [plan, setPlan] = useState("free");
  const [busy, setBusy] = useState(false);

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("user_profiles_ext").upsert({
      user_id: user.id,
      fitness_goal: goal,
      weight_kg: weight ? parseFloat(weight) : null,
      height_cm: height ? parseFloat(height) : null,
      age: age ? parseInt(age) : null,
      training_level: level,
      preferred_type: type,
      subscription_tier: plan,
      onboarded_at: new Date().toISOString(),
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome to Deluxe.");
    navigate({ to: "/app" });
  };

  return (
    <main className="min-h-screen bg-deluxe-black px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="border border-gold/20 bg-deluxe-forest/30 p-8">
          <SectionLabel>Step {step + 1} of 5</SectionLabel>
          <div className="mt-4 h-1 w-full bg-gold/10">
            <div className="h-full bg-gold transition-all" style={{ width: `${((step + 1) / 5) * 100}%` }} />
          </div>

          {step === 0 && (
            <div className="mt-6">
              <h1 className="font-display text-2xl text-foreground">What's your goal?</h1>
              <div className="mt-4 space-y-2">
                {GOALS.map((g) => (
                  <button key={g} onClick={() => setGoal(g)}
                    className={`w-full border px-4 py-3 text-left text-sm transition ${goal === g ? "border-gold bg-gold/10 text-gold" : "border-gold/20 text-foreground hover:border-gold/50"}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="mt-6">
              <h1 className="font-display text-2xl text-foreground">Your stats</h1>
              <div className="mt-4 space-y-4">
                <Field label="Weight (kg)" value={weight} onChange={setWeight} type="number" />
                <Field label="Height (cm)" value={height} onChange={setHeight} type="number" />
                <Field label="Age" value={age} onChange={setAge} type="number" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="mt-6">
              <h1 className="font-display text-2xl text-foreground">Training level</h1>
              <div className="mt-4 space-y-2">
                {LEVELS.map((l) => (
                  <button key={l} onClick={() => setLevel(l)}
                    className={`w-full border px-4 py-3 text-left text-sm uppercase tracking-[0.18em] transition ${level === l ? "border-gold bg-gold/10 text-gold" : "border-gold/20 text-foreground hover:border-gold/50"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="mt-6">
              <h1 className="font-display text-2xl text-foreground">Preferred workout type</h1>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {TYPES.map((t) => (
                  <button key={t} onClick={() => setType(t)}
                    className={`border px-4 py-3 text-sm transition ${type === t ? "border-gold bg-gold/10 text-gold" : "border-gold/20 text-foreground hover:border-gold/50"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="mt-6">
              <h1 className="font-display text-2xl text-foreground">Choose your plan</h1>
              <div className="mt-4 space-y-3">
                {PLANS.map((p) => (
                  <button key={p.id} onClick={() => setPlan(p.id)}
                    className={`w-full border p-4 text-left transition ${plan === p.id ? "border-gold bg-gold/10" : "border-gold/20 hover:border-gold/50"}`}>
                    <div className="flex justify-between">
                      <span className="font-display text-lg text-foreground">{p.label}</span>
                      <span className="text-gold">{p.price}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex gap-3">
            {step > 0 && <OutlineButton onClick={back} className="flex-1">Back</OutlineButton>}
            {step < 4 ? (
              <GoldButton onClick={next} className="flex-1">Continue</GoldButton>
            ) : (
              <GoldButton onClick={finish} disabled={busy} className="flex-1">
                {busy ? "Saving…" : "Enter Deluxe"}
              </GoldButton>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full border border-gold/20 bg-deluxe-black px-4 py-3 text-sm text-foreground focus:border-gold focus:outline-none" />
    </div>
  );
}
