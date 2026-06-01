import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Camera, Plus, Trophy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GoldButton, SectionLabel } from "@/components/deluxe/ui";
import { BodyTimeline } from "@/components/deluxe/BodyTimeline";

export const Route = createFileRoute("/_authenticated/app/progress")({
  component: ProgressTab,
});

interface Measurement { id: string; measured_on: string; weight_kg: number | null; waist_cm: number | null }
interface Session { id: string; completed_at: string; duration_min: number; workouts: { title: string } | null }

function ProgressTab() {
  const { user } = useAuth();
  const [meas, setMeas] = useState<Measurement[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    if (!user) return;
    const [{ data: m }, { data: s }] = await Promise.all([
      supabase.from("body_measurements").select("id,measured_on,weight_kg,waist_cm").eq("user_id", user.id).order("measured_on"),
      supabase.from("workout_sessions").select("id,completed_at,duration_min,workouts(title)").eq("user_id", user.id).order("completed_at", { ascending: false }).limit(10),
    ]);
    if (m) setMeas(m as Measurement[]);
    if (s) setSessions(s as unknown as Session[]);
  };
  useEffect(() => { load(); }, [user]);

  const saveMeasurement = async () => {
    if (!user || (!weight && !waist)) return;
    const { error } = await supabase.from("body_measurements").insert({
      user_id: user.id,
      weight_kg: weight ? parseFloat(weight) : null,
      waist_cm: waist ? parseFloat(waist) : null,
    });
    if (error) return toast.error(error.message);
    toast.success("Logged");
    setWeight(""); setWaist("");
    load();
  };

  const uploadPhoto = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("progress-photos").upload(path, file);
    if (upErr) { toast.error(upErr.message); setUploading(false); return; }
    const { error } = await supabase.from("progress_photos").insert({ user_id: user.id, storage_path: path });
    setUploading(false);
    if (error) return toast.error(error.message);
    toast.success("Photo saved");
  };

  const chartData = meas.filter((m) => m.weight_kg).map((m) => ({ date: m.measured_on.slice(5), weight: m.weight_kg }));
  const totalSessions = sessions.length;
  const badges = [
    { label: "First Workout", earned: totalSessions >= 1 },
    { label: "5 Sessions", earned: totalSessions >= 5 },
    { label: "10 Sessions", earned: totalSessions >= 10 },
    { label: "Logger", earned: meas.length >= 1 },
  ];

  return (
    <div className="mx-auto max-w-2xl px-5 pt-8">
      <SectionLabel>Progress</SectionLabel>
      <h1 className="mt-2 font-display text-3xl text-foreground">Your transformation</h1>

      {user && (
        <div className="mt-6">
          <BodyTimeline userId={user.id} />
        </div>
      )}

      <div className="mt-4 border border-gold/15 bg-deluxe-forest/20 p-5">
        <SectionLabel>Weight Trend</SectionLabel>
        <div className="mt-3 h-48">
          {chartData.length > 1 ? (
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <XAxis dataKey="date" stroke="#888" fontSize={10} />
                <YAxis stroke="#888" fontSize={10} domain={["dataMin - 1", "dataMax + 1"]} />
                <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #c9a24c33" }} />
                <Line type="monotone" dataKey="weight" stroke="#c9a24c" strokeWidth={2} dot={{ fill: "#c9a24c" }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Log 2+ entries to see chart</div>
          )}
        </div>
      </div>

      <div className="mt-4 border border-gold/15 bg-deluxe-forest/20 p-5">
        <SectionLabel>Log Today</SectionLabel>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <input type="number" placeholder="Weight (kg)" value={weight} onChange={(e) => setWeight(e.target.value)}
            className="border border-gold/20 bg-deluxe-black px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none" />
          <input type="number" placeholder="Waist (cm)" value={waist} onChange={(e) => setWaist(e.target.value)}
            className="border border-gold/20 bg-deluxe-black px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none" />
        </div>
        <GoldButton onClick={saveMeasurement} className="mt-3 w-full"><Plus className="h-3 w-3" /> Log measurement</GoldButton>
      </div>

      <div className="mt-4 border border-gold/15 bg-deluxe-forest/20 p-5">
        <SectionLabel>Progress Photo</SectionLabel>
        <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 border border-dashed border-gold/30 px-4 py-6 text-xs uppercase tracking-[0.22em] text-gold hover:bg-gold/5">
          <Camera className="h-4 w-4" />
          {uploading ? "Uploading…" : "Upload photo"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
        </label>
      </div>

      <div className="mt-4 border border-gold/15 bg-deluxe-forest/20 p-5">
        <SectionLabel>Badges</SectionLabel>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {badges.map((b) => (
            <div key={b.label} className={`flex flex-col items-center gap-1 border p-3 text-center ${b.earned ? "border-gold bg-gold/10" : "border-gold/10 opacity-40"}`}>
              <Trophy className={`h-5 w-5 ${b.earned ? "text-gold" : "text-muted-foreground"}`} />
              <span className="text-[9px] uppercase tracking-[0.15em] text-foreground">{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 border border-gold/15 bg-deluxe-forest/20 p-5">
        <SectionLabel>Recent Sessions</SectionLabel>
        <div className="mt-3 space-y-2">
          {sessions.length === 0 && <p className="text-xs text-muted-foreground">No sessions yet — complete one from Workouts.</p>}
          {sessions.map((s) => (
            <div key={s.id} className="flex justify-between border border-gold/10 px-3 py-2 text-sm">
              <span className="text-foreground">{s.workouts?.title ?? "Workout"}</span>
              <span className="text-muted-foreground">{s.duration_min}m · {new Date(s.completed_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
