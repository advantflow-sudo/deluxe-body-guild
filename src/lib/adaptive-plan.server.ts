import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

export type AdaptivePlan = {
  rationale: string;
  intensity: "deload" | "moderate" | "build" | "peak";
  readiness: number | null;
  days: Array<{ day: string; focus: string; duration_min: number; blocks: string[] }>;
};

/**
 * Builds a 7-day plan from: recent compliance, strength progression, the
 * member's remembered facts (equipment/limitations) and today's readiness.
 */
export async function buildAdaptivePlan(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<AdaptivePlan> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

  const since = new Date(Date.now() - 21 * 864e5).toISOString();
  const [{ data: ext }, { data: sessions }, { data: recovery }, { data: memory }] = await Promise.all([
    supabase
      .from("user_profiles_ext")
      .select("fitness_goal,training_level,preferred_type,weight_kg")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("workout_sessions")
      .select("completed_at,duration_min,calories,notes")
      .not("completed_at", "is", null)
      .eq("user_id", userId)
      .gte("completed_at", since)
      .order("completed_at"),
    supabase
      .from("recovery_logs")
      .select("log_date,sleep_quality,soreness,fatigue,energy,readiness,note")
      .eq("user_id", userId)
      .order("log_date", { ascending: false })
      .limit(7),
    supabase.from("ai_coach_memory").select("category,key,value").eq("user_id", userId).limit(40),
  ]);

  const latest = (recovery ?? [])[0] ?? null;
  const avgReadiness = (recovery ?? []).length
    ? Math.round((recovery ?? []).reduce((a, r) => a + (r.readiness ?? 0), 0) / (recovery ?? []).length)
    : null;
  const count = (sessions ?? []).length;
  const avgMin = count ? Math.round((sessions ?? []).reduce((a, s) => a + (s.duration_min ?? 0), 0) / count) : 0;

  const prompt = [
    `Goal: ${ext?.fitness_goal ?? "general fitness"} | Level: ${ext?.training_level ?? "intermediate"} | Preferred: ${ext?.preferred_type ?? "hybrid"}${ext?.weight_kg ? ` | ${ext.weight_kg}kg` : ""}`,
    `Last 21 days: ${count} sessions, avg ${avgMin} min. Session notes: ${(sessions ?? []).map((s) => s.notes).filter(Boolean).slice(0, 6).join(" | ") || "none"}`,
    latest
      ? `Today readiness ${latest.readiness}/100 (sleep ${latest.sleep_quality}/5, soreness ${latest.soreness}/5, fatigue ${latest.fatigue}/5, energy ${latest.energy}/5)${latest.note ? `. Note: ${latest.note}` : ""}`
      : "No recovery check-in logged today.",
    avgReadiness !== null ? `7-day average readiness: ${avgReadiness}/100` : "",
    (memory ?? []).length
      ? `Remembered facts: ${(memory ?? []).map((m) => `${m.key}=${m.value}`).join("; ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content:
            "You are the Deluxe Fitness programming engine. Build a recovery-aware 7-day plan. If readiness is under 45, prescribe a deload or active recovery. If compliance is low, reduce sessions and rebuild the habit. Respect equipment limits and injuries from remembered facts. Name a plateau intervention if progress has stalled. Premium, direct tone. No emojis.",
        },
        { role: "user", content: prompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "weekly_plan",
            description: "Recovery-aware 7-day plan",
            parameters: {
              type: "object",
              properties: {
                rationale: { type: "string" },
                intensity: { type: "string", enum: ["deload", "moderate", "build", "peak"] },
                days: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      day: { type: "string" },
                      focus: { type: "string" },
                      duration_min: { type: "number" },
                      blocks: { type: "array", items: { type: "string" } },
                    },
                    required: ["day", "focus", "duration_min", "blocks"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["rationale", "intensity", "days"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "weekly_plan" } },
    }),
  });
  if (!res.ok) {
    if (res.status === 429) throw new Error("Rate limited — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted.");
    throw new Error(`AI gateway error ${res.status}`);
  }
  const json = await res.json();
  const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) throw new Error("AI returned no plan");
  const plan = JSON.parse(args) as Omit<AdaptivePlan, "readiness">;
  return { ...plan, readiness: latest?.readiness ?? null };
}
