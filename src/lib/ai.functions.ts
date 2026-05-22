import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

type AnyMsg = { role: "system" | "user" | "assistant"; content: unknown };

async function callAI(opts: {
  model?: string;
  messages: AnyMsg[];
  tool?: { name: string; description: string; parameters: Record<string, unknown> };
  temperature?: number;
}): Promise<string | Record<string, unknown>> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");
  const body: Record<string, unknown> = {
    model: opts.model ?? "google/gemini-2.5-flash",
    messages: opts.messages,
    temperature: opts.temperature ?? 0.6,
  };
  if (opts.tool) {
    body.tools = [{
      type: "function",
      function: {
        name: opts.tool.name,
        description: opts.tool.description,
        parameters: opts.tool.parameters,
      },
    }];
    body.tool_choice = { type: "function", function: { name: opts.tool.name } };
  }
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    if (res.status === 429) throw new Error("Rate limited — try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted.");
    throw new Error(`AI gateway error ${res.status}: ${t.slice(0, 200)}`);
  }
  const json = await res.json();
  const choice = json.choices?.[0]?.message;
  if (opts.tool) {
    const args = choice?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("AI returned no structured output");
    return JSON.parse(args);
  }
  return (choice?.content ?? "") as string;
}

/* ============================================================
 * 1. Daily Briefing — morning summary from health data
 * ============================================================ */
export const dailyBriefing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const since = new Date(Date.now() - 7 * 864e5).toISOString();
    const today = new Date().toISOString().slice(0, 10);
    const [{ data: ext }, { data: stats }, { data: sessions }, { data: metrics }] = await Promise.all([
      supabase.from("user_profiles_ext").select("fitness_goal,training_level,preferred_type").eq("user_id", userId).maybeSingle(),
      supabase.from("daily_stats").select("*").eq("user_id", userId).gte("stat_date", today).maybeSingle(),
      supabase.from("workout_sessions").select("completed_at,duration_min,calories").eq("user_id", userId).gte("completed_at", since).order("completed_at", { ascending: false }),
      supabase.from("device_metrics").select("metric_type,value,unit,recorded_at").eq("user_id", userId).gte("recorded_at", since).order("recorded_at", { ascending: false }).limit(50),
    ]);
    const prompt = `Goal: ${ext?.fitness_goal ?? "general fitness"} | Level: ${ext?.training_level ?? "intermediate"}.
Today stats: ${JSON.stringify(stats ?? {})}.
Last 7 sessions: ${(sessions ?? []).slice(0, 7).map((s) => `${s.duration_min}min/${s.calories ?? "?"}kcal`).join(", ") || "none"}.
Recent device metrics (steps/hr/sleep/hrv): ${(metrics ?? []).slice(0, 15).map((m) => `${m.metric_type}=${m.value}${m.unit ?? ""}`).join(", ") || "none"}.`;
    const text = await callAI({
      messages: [
        { role: "system", content: "You are the Deluxe Fitness Coach. Write a punchy 4-sentence morning briefing: today's energy read, recommended training intensity, one nutrition cue, one mindset cue. Direct, premium tone. No emojis. No bullet points." },
        { role: "user", content: prompt },
      ],
    });
    return { briefing: text as string };
  });

/* ============================================================
 * 2. Meal Photo → Macros
 * ============================================================ */
export const analyzeMeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { imageDataUrl: string; note?: string }) =>
    z.object({ imageDataUrl: z.string().min(20).max(8_000_000), note: z.string().max(500).optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const result = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You are a precise nutrition estimator. Inspect the meal photo and return realistic macro estimates. If unsure, give a sensible range midpoint." },
        {
          role: "user",
          content: [
            { type: "text", text: `Estimate this meal. Note: ${data.note ?? "n/a"}` },
            { type: "image_url", image_url: { url: data.imageDataUrl } },
          ],
        },
      ],
      tool: {
        name: "log_meal",
        description: "Return structured meal estimate",
        parameters: {
          type: "object",
          properties: {
            name: { type: "string" },
            calories: { type: "number" },
            protein_g: { type: "number" },
            carbs_g: { type: "number" },
            fat_g: { type: "number" },
            confidence: { type: "string", enum: ["low", "medium", "high"] },
            items: { type: "array", items: { type: "string" } },
            notes: { type: "string" },
          },
          required: ["name", "calories", "protein_g", "carbs_g", "fat_g", "confidence", "items"],
          additionalProperties: false,
        },
      },
    });
    return result as any;
  });

/* ============================================================
 * 3. Form Check (image / video frame)
 * ============================================================ */
export const analyzeForm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { imageDataUrl: string; exercise: string }) =>
    z.object({ imageDataUrl: z.string().min(20).max(8_000_000), exercise: z.string().min(1).max(100) }).parse(d),
  )
  .handler(async ({ data }) => {
    const result = await callAI({
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: "You are an elite strength coach. Analyze the lifter's form in this photo/frame. Be specific about joint angles, bar path, posture. Give actionable cues." },
        {
          role: "user",
          content: [
            { type: "text", text: `Exercise: ${data.exercise}. Analyze form.` },
            { type: "image_url", image_url: { url: data.imageDataUrl } },
          ],
        },
      ],
      tool: {
        name: "form_check",
        description: "Structured form analysis",
        parameters: {
          type: "object",
          properties: {
            score: { type: "number", minimum: 0, maximum: 10 },
            strengths: { type: "array", items: { type: "string" } },
            issues: { type: "array", items: { type: "string" } },
            cues: { type: "array", items: { type: "string" } },
            risk: { type: "string", enum: ["low", "moderate", "high"] },
          },
          required: ["score", "strengths", "issues", "cues", "risk"],
          additionalProperties: false,
        },
      },
    });
    return result as any;
  });

/* ============================================================
 * 4. Adaptive Programming — next week plan
 * ============================================================ */
export const adaptProgram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const since = new Date(Date.now() - 14 * 864e5).toISOString();
    const [{ data: ext }, { data: sessions }] = await Promise.all([
      supabase.from("user_profiles_ext").select("fitness_goal,training_level,preferred_type").eq("user_id", userId).maybeSingle(),
      supabase.from("workout_sessions").select("completed_at,duration_min,calories,notes").eq("user_id", userId).gte("completed_at", since).order("completed_at"),
    ]);
    const result = await callAI({
      messages: [
        { role: "system", content: "You design adaptive weekly training plans. Use the user's last 2 weeks of compliance + recovery cues." },
        { role: "user", content: `Goal: ${ext?.fitness_goal ?? "general"}. Level: ${ext?.training_level ?? "intermediate"}. Preferred: ${ext?.preferred_type ?? "hybrid"}. Last 14 days: ${(sessions ?? []).length} sessions, avg ${Math.round((sessions ?? []).reduce((a, s) => a + (s.duration_min ?? 0), 0) / Math.max(1, (sessions ?? []).length))}min.` },
      ],
      tool: {
        name: "weekly_plan",
        description: "Adaptive 7-day plan",
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
              },
            },
          },
          required: ["rationale", "intensity", "days"],
          additionalProperties: false,
        },
      },
    });
    return result as any;
  });

/* ============================================================
 * 5. Progress Photo Compare
 * ============================================================ */
export const comparePhotos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { beforeUrl: string; afterUrl: string }) =>
    z.object({ beforeUrl: z.string().min(20).max(8_000_000), afterUrl: z.string().min(20).max(8_000_000) }).parse(d),
  )
  .handler(async ({ data }) => {
    const result = await callAI({
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: "You are an objective body-composition coach. Compare two progress photos and note visible differences in posture, muscle definition, conditioning. Encouraging but honest. Never make medical claims." },
        {
          role: "user",
          content: [
            { type: "text", text: "Image 1 = before, Image 2 = after." },
            { type: "image_url", image_url: { url: data.beforeUrl } },
            { type: "image_url", image_url: { url: data.afterUrl } },
          ],
        },
      ],
      tool: {
        name: "compare",
        description: "Photo comparison",
        parameters: {
          type: "object",
          properties: {
            summary: { type: "string" },
            improvements: { type: "array", items: { type: "string" } },
            focus_next: { type: "array", items: { type: "string" } },
            posture_note: { type: "string" },
          },
          required: ["summary", "improvements", "focus_next"],
          additionalProperties: false,
        },
      },
    });
    return result as any;
  });

/* ============================================================
 * 6. Plateau Detection
 * ============================================================ */
export const detectPlateau = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const since = new Date(Date.now() - 60 * 864e5).toISOString();
    const { data: sessions } = await supabase
      .from("workout_sessions").select("completed_at,duration_min,calories").eq("user_id", userId)
      .gte("completed_at", since).order("completed_at");
    const result = await callAI({
      messages: [
        { role: "system", content: "You detect training plateaus from session volume/calorie trends. Be quantitative." },
        { role: "user", content: `60 days of sessions: ${JSON.stringify((sessions ?? []).map((s) => ({ d: s.completed_at.slice(0, 10), m: s.duration_min, k: s.calories })))}` },
      ],
      tool: {
        name: "plateau",
        description: "Plateau analysis",
        parameters: {
          type: "object",
          properties: {
            plateau_detected: { type: "boolean" },
            trend: { type: "string", enum: ["climbing", "flat", "declining"] },
            insight: { type: "string" },
            interventions: { type: "array", items: { type: "string" } },
          },
          required: ["plateau_detected", "trend", "insight", "interventions"],
          additionalProperties: false,
        },
      },
    });
    return result as any;
  });

/* ============================================================
 * 7. Weekly Recap
 * ============================================================ */
export const weeklyRecap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const since = new Date(Date.now() - 7 * 864e5).toISOString();
    const [{ data: sessions }, { data: stats }] = await Promise.all([
      supabase.from("workout_sessions").select("completed_at,duration_min,calories").eq("user_id", userId).gte("completed_at", since),
      supabase.from("daily_stats").select("steps,calories,water_ml,streak,stat_date").eq("user_id", userId).gte("stat_date", since.slice(0, 10)),
    ]);
    const totalMin = (sessions ?? []).reduce((a, s) => a + (s.duration_min ?? 0), 0);
    const totalKcal = (sessions ?? []).reduce((a, s) => a + (s.calories ?? 0), 0);
    const totalSteps = (stats ?? []).reduce((a, s) => a + (s.steps ?? 0), 0);
    const streak = Math.max(0, ...(stats ?? []).map((s) => s.streak ?? 0));
    const text = await callAI({
      messages: [
        { role: "system", content: "Write a sharp, shareable weekly recap as 3 short lines. Premium tone. No emojis." },
        { role: "user", content: `Sessions: ${(sessions ?? []).length}, Minutes: ${totalMin}, Calories: ${totalKcal}, Steps: ${totalSteps}, Streak: ${streak}` },
      ],
    });
    return { recap: text as string, totals: { sessions: (sessions ?? []).length, minutes: totalMin, calories: totalKcal, steps: totalSteps, streak } };
  });

/* ============================================================
 * 8. Injury Triage
 * ============================================================ */
export const injuryTriage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { complaint: string }) => z.object({ complaint: z.string().min(3).max(2000) }).parse(d))
  .handler(async ({ data }) => {
    const result = await callAI({
      messages: [
        { role: "system", content: "You triage training-related discomfort. NEVER diagnose. Always recommend a qualified professional for red flags (numbness, sharp pain, swelling, instability). Provide modifications, mobility drills, when to rest, when to see a pro." },
        { role: "user", content: data.complaint },
      ],
      tool: {
        name: "triage",
        description: "Triage report",
        parameters: {
          type: "object",
          properties: {
            severity: { type: "string", enum: ["mild", "moderate", "see_professional"] },
            likely_factors: { type: "array", items: { type: "string" } },
            modifications: { type: "array", items: { type: "string" } },
            mobility_drills: { type: "array", items: { type: "string" } },
            red_flags: { type: "array", items: { type: "string" } },
            see_pro_if: { type: "string" },
          },
          required: ["severity", "likely_factors", "modifications", "mobility_drills", "see_pro_if"],
          additionalProperties: false,
        },
      },
    });
    return result as any;
  });

/* ============================================================
 * 9. Streak Recovery Prompt
 * ============================================================ */
export const streakRecovery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: ext } = await supabase.from("user_profiles_ext").select("fitness_goal,training_level").eq("user_id", userId).maybeSingle();
    const text = await callAI({
      messages: [
        { role: "system", content: "User missed a day. Write 2 sentences of tough-love motivation, then output a 10-minute 'reset' micro-workout (4 moves, sets x reps)." },
        { role: "user", content: `Goal: ${ext?.fitness_goal ?? "general"}. Level: ${ext?.training_level ?? "intermediate"}.` },
      ],
    });
    return { reset: text as string };
  });

/* ============================================================
 * 10. Buddy Matchmaking
 * ============================================================ */
export const matchBuddy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: me } = await supabase.from("user_profiles_ext").select("fitness_goal,training_level,preferred_type").eq("user_id", userId).maybeSingle();
    if (!me) return { matches: [] };
    const { data: pool } = await supabase
      .from("user_profiles_ext")
      .select("user_id,fitness_goal,training_level,preferred_type")
      .neq("user_id", userId)
      .limit(50);
    const scored = (pool ?? []).map((p) => {
      let score = 0;
      if (p.fitness_goal === me.fitness_goal) score += 3;
      if (p.training_level === me.training_level) score += 2;
      if (p.preferred_type === me.preferred_type) score += 2;
      return { user_id: p.user_id, score, goal: p.fitness_goal, level: p.training_level };
    }).filter((m) => m.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);
    const ids = scored.map((s) => s.user_id);
    const { data: profs } = await supabase.from("profiles").select("id,display_name,avatar_url,bio").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    return {
      matches: scored.map((s) => ({
        ...s,
        profile: (profs ?? []).find((p) => p.id === s.user_id) ?? null,
      })),
    };
  });
