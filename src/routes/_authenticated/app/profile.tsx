import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, Crown, Bell, HelpCircle, FileText, Shield, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GoldButton, OutlineButton, SectionLabel } from "@/components/deluxe/ui";
import { TransformationLevel } from "@/components/deluxe/TransformationLevel";
import { PushPrompt } from "@/components/deluxe/PushPrompt";

export const Route = createFileRoute("/_authenticated/app/profile")({
  component: ProfileTab,
});

interface Ext {
  fitness_goal: string | null; weight_kg: number | null; height_cm: number | null;
  age: number | null; training_level: string | null; preferred_type: string | null;
  subscription_tier: string; notifications_enabled: boolean;
  reminder_morning_hour: number | null; reminder_evening_hour: number | null;
  weekly_recap_enabled: boolean; timezone: string;
}

function ProfileTab() {
  const { user, signOut } = useAuth();
  const [name, setName] = useState("");
  const [ext, setExt] = useState<Ext | null>(null);
  const [saving, setSaving] = useState(false);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: e }, { data: bal }] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
        supabase.from("user_profiles_ext").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("reward_points").select("balance_after").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      setName(p?.display_name ?? "");
      if (e) setExt(e as Ext);
      setPoints(bal?.balance_after ?? 0);
    })();
  }, [user]);

  const save = async () => {
    if (!user || !ext) return;
    setSaving(true);
    const [a, b] = await Promise.all([
      supabase.from("profiles").update({ display_name: name }).eq("id", user.id),
      supabase.from("user_profiles_ext").update({
        fitness_goal: ext.fitness_goal,
        weight_kg: ext.weight_kg, height_cm: ext.height_cm, age: ext.age,
        training_level: ext.training_level, preferred_type: ext.preferred_type,
        notifications_enabled: ext.notifications_enabled,
        reminder_morning_hour: ext.reminder_morning_hour,
        reminder_evening_hour: ext.reminder_evening_hour,
        weekly_recap_enabled: ext.weekly_recap_enabled,
        timezone: ext.timezone,
      }).eq("user_id", user.id),
    ]);
    setSaving(false);
    if (a.error || b.error) return toast.error(a.error?.message ?? b.error?.message ?? "Save failed");
    toast.success("Saved");
  };

  return (
    <div className="mx-auto max-w-2xl px-5 pt-8 pb-28">
      <SectionLabel>Profile</SectionLabel>
      <h1 className="mt-2 font-display text-3xl text-foreground">{name || "Your account"}</h1>
      <p className="mt-1 text-xs text-muted-foreground">{user?.email}</p>

      <div className="mt-6">
        <TransformationLevel points={points} />
      </div>

      <div className="mt-4 flex items-center justify-between border border-gold/30 bg-gold-gradient/10 p-5">
        <div className="flex items-center gap-3">
          <Crown className="h-6 w-6 text-gold" />
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Membership</div>
            <div className="font-display text-xl text-foreground capitalize">{ext?.subscription_tier ?? "Free"}</div>
          </div>
        </div>
        <Link to="/pricing"><OutlineButton className="!px-4 !py-2 !text-[10px]">Upgrade</OutlineButton></Link>
      </div>

      {ext && (
        <div className="mt-4 space-y-4 border border-gold/15 bg-deluxe-forest/20 p-5">
          <SectionLabel>Personal Details</SectionLabel>
          <Field label="Display Name" value={name} onChange={setName} />
          <Field label="Fitness Goal" value={ext.fitness_goal ?? ""} onChange={(v) => setExt({ ...ext, fitness_goal: v })} />
          <div className="grid grid-cols-3 gap-3">
            <Field label="Weight (kg)" type="number" value={String(ext.weight_kg ?? "")} onChange={(v) => setExt({ ...ext, weight_kg: v ? parseFloat(v) : null })} />
            <Field label="Height (cm)" type="number" value={String(ext.height_cm ?? "")} onChange={(v) => setExt({ ...ext, height_cm: v ? parseFloat(v) : null })} />
            <Field label="Age" type="number" value={String(ext.age ?? "")} onChange={(v) => setExt({ ...ext, age: v ? parseInt(v) : null })} />
          </div>
          <Field label="Training Level" value={ext.training_level ?? ""} onChange={(v) => setExt({ ...ext, training_level: v })} />
          <Field label="Preferred Type" value={ext.preferred_type ?? ""} onChange={(v) => setExt({ ...ext, preferred_type: v })} />
          <GoldButton onClick={save} disabled={saving} className="w-full">{saving ? "Saving…" : "Save changes"}</GoldButton>
        </div>
      )}

      <div className="mt-4 border border-gold/15 bg-deluxe-forest/20 p-5 space-y-3">
        <SectionLabel>Re-engagement</SectionLabel>
        <PushPrompt />
        {ext && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Morning reminder (h, 0-23)" type="number" value={String(ext.reminder_morning_hour ?? 8)}
              onChange={(v) => setExt({ ...ext, reminder_morning_hour: v ? Math.max(0, Math.min(23, parseInt(v))) : null })} />
            <Field label="Evening reminder (h, 0-23)" type="number" value={String(ext.reminder_evening_hour ?? 20)}
              onChange={(v) => setExt({ ...ext, reminder_evening_hour: v ? Math.max(0, Math.min(23, parseInt(v))) : null })} />
          </div>
        )}
      </div>

      <div className="mt-4 border border-gold/15 bg-deluxe-forest/20 p-5">
        <SectionLabel>Settings</SectionLabel>
        <div className="mt-3 space-y-1">
          <Row icon={Bell} label="Notifications" onClick={() => ext && setExt({ ...ext, notifications_enabled: !ext.notifications_enabled })}
            right={<span className={`h-5 w-9 rounded-full transition ${ext?.notifications_enabled ? "bg-gold" : "bg-gold/20"} relative`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-deluxe-black transition-all ${ext?.notifications_enabled ? "left-4" : "left-0.5"}`} />
            </span>} />
          <Row icon={Bell} label="Weekly recap" onClick={() => ext && setExt({ ...ext, weekly_recap_enabled: !ext.weekly_recap_enabled })}
            right={<span className={`h-5 w-9 rounded-full transition ${ext?.weekly_recap_enabled ? "bg-gold" : "bg-gold/20"} relative`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-deluxe-black transition-all ${ext?.weekly_recap_enabled ? "left-4" : "left-0.5"}`} />
            </span>} />
          <Row icon={HelpCircle} label="Help & Support" to="/contact" />
          <Row icon={FileText} label="Terms of Service" to="/about" />
          <Row icon={Shield} label="Privacy Policy" to="/about" />
        </div>
      </div>

      <button onClick={signOut}
        className="mt-4 flex w-full items-center justify-center gap-2 border border-gold/30 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold hover:bg-gold/10">
        <LogOut className="h-3.5 w-3.5" /> Sign out
      </button>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}
function Field(props: FieldProps) {
  const { label, value, onChange, type = "text" } = props;
  return (
    <div>
      <label className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-gold/20 bg-deluxe-black px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none" />
    </div>
  );
}

function Row({ icon: Icon, label, to, onClick, right }: { icon: typeof Bell; label: string; to?: string; onClick?: () => void; right?: React.ReactNode }) {
  const content = (
    <div className="flex items-center justify-between border-b border-gold/10 px-1 py-3">
      <div className="flex items-center gap-3"><Icon className="h-4 w-4 text-gold" /><span className="text-sm text-foreground">{label}</span></div>
      {right ?? <ChevronRight className="h-4 w-4 text-muted-foreground" />}
    </div>
  );
  if (to) return <Link to={to}>{content}</Link>;
  return <button onClick={onClick} className="w-full text-left">{content}</button>;
}
