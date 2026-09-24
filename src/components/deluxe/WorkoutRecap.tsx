import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Trophy, TrendingUp, TrendingDown, Flame, Share2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { GoldButton, OutlineButton, SectionLabel } from "@/components/deluxe/ui";
import { ShareButton } from "@/components/deluxe/ShareButton";
import { MuscleMap, toIntensity } from "@/components/deluxe/MuscleMap";
import { recapPostText, type Recap } from "@/lib/workoutRecap";

export function WorkoutRecap({ recap, sessionId, userId, onClose }: { recap: Recap; sessionId: string; userId: string; onClose: () => void }) {
  const [posted, setPosted] = useState(false);
  const [posting, setPosting] = useState(false);
  const diff = recap.prevVolumeKg && recap.volumeKg ? Math.round(((recap.volumeKg - recap.prevVolumeKg) / recap.prevVolumeKg) * 100) : null;

  const share = async () => {
    setPosting(true);
    const { error } = await supabase.from("community_posts").insert({ user_id: userId, body: recapPostText(recap), workout_session_id: sessionId, visibility: "public" });
    setPosting(false);
    if (error) return toast.error(error.message);
    setPosted(true);
    toast.success("Shared to Community");
  };

  const stat = (label: string, value: string) => (
    <div className="border border-gold/15 bg-deluxe-black/60 px-2 py-2 text-center">
      <div className="font-display text-lg text-gold tabular-nums">{value}</div>
      <div className="text-[8px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
    </div>
  );

  return (
    <div>
      {/* Branded recap card */}
      <div className="relative border border-gold/40 bg-gradient-to-b from-deluxe-forest/30 to-deluxe-black p-4">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
        <div className="flex items-center justify-between">
          <SectionLabel>Deluxe recap · {recap.type}</SectionLabel>
          {recap.streak > 0 && <span className="inline-flex items-center gap-1 text-[10px] text-gold"><Flame className="h-3 w-3" />{recap.streak}-day streak</span>}
        </div>
        <h2 className="mt-1 font-display text-2xl text-foreground">{recap.workout}</h2>

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {stat("min", String(recap.durationMin))}
          {stat("sets", String(recap.workingSets))}
          {stat("reps", String(recap.totalReps))}
          {stat("kg vol", recap.volumeKg ? recap.volumeKg.toLocaleString() : "—")}
        </div>
        <div className="mt-1.5 grid grid-cols-3 gap-1.5">
          {stat("XP", `+${recap.xp}`)}
          {stat("kcal", recap.calories ? String(recap.calories) : "—")}
          {stat("PBs", String(recap.pbs.length))}
        </div>

        {diff !== null && (
          <div className={`mt-3 flex items-center gap-1.5 text-xs ${diff >= 0 ? "text-gold" : "text-muted-foreground"}`}>
            {diff >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {diff >= 0 ? "+" : ""}{diff}% volume vs your last {recap.workout}
          </div>
        )}

        {recap.pbs.length > 0 && (
          <ul className="mt-3 space-y-1">
            {recap.pbs.map((p) => (
              <li key={p.name} className="flex items-center gap-2 text-xs text-foreground"><Trophy className="h-3.5 w-3.5 text-gold" /> New PB · {p.name} {p.kg}kg × {p.reps}</li>
            ))}
          </ul>
        )}

        {Object.keys(recap.muscles).length > 0 && (
          <div className="mt-4">
            <div className="mb-2 text-[9px] uppercase tracking-[0.2em] text-gold">Muscles trained · {Object.keys(recap.muscles).join(", ")}</div>
            <MuscleMap intensity={toIntensity(recap.muscles)} size="sm" />
          </div>
        )}

        {recap.exercises.length > 0 && (
          <ul className="mt-4 divide-y divide-gold/10 border-t border-gold/10 text-xs">
            {recap.exercises.map((e) => (
              <li key={e.name} className="flex justify-between py-1.5">
                <span className="text-foreground">{e.name}</span>
                <span className="text-muted-foreground">{e.sets} sets{e.topKg ? ` · top ${e.topKg}kg × ${e.topReps}` : ""}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <OutlineButton onClick={share} disabled={posted || posting} className="w-full">
          <Share2 className="h-3 w-3" /> {posted ? "Shared" : posting ? "Sharing…" : "Share to Community"}
        </OutlineButton>
        <Link to="/app/progress" className="inline-flex items-center justify-center border border-gold/40 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold hover:bg-gold/10">
          View progress
        </Link>
      </div>
      <div className="mt-3 flex justify-center">
        <ShareButton title={`Deluxe Fitness — ${recap.workout}`} text={recapPostText(recap)} url="/app/progress" label="Share outside the app" />
      </div>
      <GoldButton onClick={onClose} className="mt-4 w-full">Done</GoldButton>
    </div>
  );
}
