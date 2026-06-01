import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Msg = { role: "user" | "assistant" | "system"; content: string };

const BASE_SYSTEM_PROMPT = `You are the Deluxe Fitness AI Coach, the elite, 24/7 personal fitness and lifestyle assistant for the Deluxe Fitness app. Your core philosophy is built on discipline, transformation, and elevation. You are not just a fitness tracker; you are a standard. You guide users to demand more from themselves — mentally, physically, and in every area of life.

CORE IDENTITY & TONE
- Tone: Unapologetic, premium, disciplined, motivating, and authoritative yet supportive. You speak with the confidence of an elite personal trainer.
- Brand Voice: "Discipline. Transform. Become Deluxe." Fitness is not a chore, it is a lifestyle. Build the body and master the mind.
- Language: Direct, concise, impactful. No fluff, no excessive emojis, no passive language. Strong verbs and clear directives.
- Audience: Individuals who refuse to settle — building strength, conditioning, mobility, and a resilient mindset.

MEMORY & PERSONALIZATION
- A MEMBER PROFILE block is provided below. ALWAYS use it. Reference the member by name. Reference their actual goal, training level, weight, current streak, and recent sessions when giving advice.
- If they missed a workout, call it out directly. If they're on a streak, acknowledge it. If their last session was hard/easy, factor that in.
- Never invent numbers — only use values from the MEMBER PROFILE.

KEY RESPONSIBILITIES
1. Personalized Programming & Workouts — generate routines based on their level, goal, and recent activity. Adapt weekly.
2. Nutrition & Hydration — precise calories, macros, hydration tailored to their stats.
3. Wellbeing & Recovery — yoga, breathwork, sleep routines. Mindset drills.
4. Community & Motivation — reinforce streaks, rewards, the Deluxe standard.

INTERACTION GUIDELINES
- Workout requests: use their level/goal from the profile. Deliver sets, reps, rest. Brief motivational intro, recovery cue at the end.
- Nutrition: science-backed. Use their weight to give specific protein/calorie targets.
- Unmotivated user: tough love + actionable steps. "Discipline pays. Show up."

FINAL DIRECTIVE
You are building a standard, not just an app. Every interaction should leave the user focused, accountable, and ready to elevate their life. Become Deluxe.

If asked about medical conditions or injuries, recommend consulting a qualified professional.`;

async function buildMemberProfile(authHeader: string | null): Promise<string> {
  if (!authHeader?.startsWith("Bearer ")) return "";
  const token = authHeader.slice(7);
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) return "";

  try {
    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { data: claims } = await supabase.auth.getClaims(token);
    const userId = claims?.claims?.sub;
    if (!userId) return "";

    const today = new Date().toISOString().slice(0, 10);
    const since = new Date(Date.now() - 14 * 864e5).toISOString();

    const [{ data: profile }, { data: ext }, { data: stats }, { data: sessions }, { data: lastWorkout }] = await Promise.all([
      supabase.from("profiles").select("display_name,fitness_goal,bio").eq("id", userId).maybeSingle(),
      supabase.from("user_profiles_ext").select("fitness_goal,training_level,preferred_type,weight_kg,height_cm,age,subscription_tier").eq("user_id", userId).maybeSingle(),
      supabase.from("daily_stats").select("steps,calories,water_ml,streak").eq("user_id", userId).eq("stat_date", today).maybeSingle(),
      supabase.from("workout_sessions").select("completed_at,duration_min,calories,notes,workout_id").eq("user_id", userId).gte("completed_at", since).order("completed_at", { ascending: false }).limit(7),
      supabase.from("workout_sessions").select("completed_at,workout_id").eq("user_id", userId).order("completed_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    // Resolve last workout title if available
    let lastWorkoutTitle: string | null = null;
    let daysSinceLast: number | null = null;
    if (lastWorkout) {
      if (lastWorkout.workout_id) {
        const { data: w } = await supabase.from("workouts").select("title").eq("id", lastWorkout.workout_id).maybeSingle();
        lastWorkoutTitle = w?.title ?? null;
      }
      daysSinceLast = Math.floor((Date.now() - new Date(lastWorkout.completed_at).getTime()) / 864e5);
    }

    const name = profile?.display_name?.split(" ")[0] ?? "Athlete";
    const goal = ext?.fitness_goal ?? profile?.fitness_goal ?? "general fitness";
    const level = ext?.training_level ?? "intermediate";
    const tier = ext?.subscription_tier ?? "free";
    const sessionCount = sessions?.length ?? 0;
    const avgMin = sessionCount > 0
      ? Math.round((sessions ?? []).reduce((a, s) => a + (s.duration_min ?? 0), 0) / sessionCount)
      : 0;

    const lines: string[] = [
      "MEMBER PROFILE (use this in every reply):",
      `- Name: ${name}`,
      `- Goal: ${goal}`,
      `- Training level: ${level}`,
      `- Preferred type: ${ext?.preferred_type ?? "hybrid"}`,
      `- Tier: ${tier}`,
    ];
    if (ext?.weight_kg) lines.push(`- Weight: ${ext.weight_kg}kg`);
    if (ext?.height_cm) lines.push(`- Height: ${ext.height_cm}cm`);
    if (ext?.age) lines.push(`- Age: ${ext.age}`);
    lines.push(`- Today: ${stats?.steps ?? 0} steps, ${stats?.calories ?? 0} kcal burned, ${((stats?.water_ml ?? 0) / 1000).toFixed(1)}L water, streak ${stats?.streak ?? 0} days`);
    lines.push(`- Last 14 days: ${sessionCount} sessions, avg ${avgMin} min`);
    if (lastWorkoutTitle) lines.push(`- Last workout: "${lastWorkoutTitle}" (${daysSinceLast} day${daysSinceLast === 1 ? "" : "s"} ago)`);
    else if (daysSinceLast !== null) lines.push(`- Last workout: ${daysSinceLast} day${daysSinceLast === 1 ? "" : "s"} ago`);
    else lines.push("- Last workout: none logged yet");
    if (daysSinceLast !== null && daysSinceLast >= 2) {
      lines.push(`- NOTE: Member missed ${daysSinceLast} day${daysSinceLast === 1 ? "" : "s"}. Acknowledge it directly and pull them back in.`);
    }

    return "\n\n" + lines.join("\n");
  } catch (e) {
    console.error("buildMemberProfile failed:", e);
    return "";
  }
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          // Require authentication — prevents anonymous use of paid AI credits
          const authHeader = request.headers.get("authorization");
          if (!authHeader?.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }
          const token = authHeader.slice(7);
          const SUPABASE_URL = process.env.SUPABASE_URL;
          const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
          if (!SUPABASE_URL || !SUPABASE_KEY) {
            return new Response(JSON.stringify({ error: "Server misconfigured" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }
          const authClient = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
          });
          const { data: claimsData, error: claimsErr } = await authClient.auth.getClaims(token);
          if (claimsErr || !claimsData?.claims?.sub) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          const { messages } = (await request.json()) as { messages: Msg[] };
          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) {
            return new Response(
              JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
              { status: 500, headers: { "Content-Type": "application/json" } },
            );
          }

          const memberProfile = await buildMemberProfile(authHeader);
          const systemPrompt = BASE_SYSTEM_PROMPT + memberProfile;

          const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [{ role: "system", content: systemPrompt }, ...messages],
              stream: true,
            }),
          });

          if (!res.ok) {
            if (res.status === 429) {
              return new Response(
                JSON.stringify({ error: "Too many requests. Please try again shortly." }),
                { status: 429, headers: { "Content-Type": "application/json" } },
              );
            }
            if (res.status === 402) {
              return new Response(
                JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }),
                { status: 402, headers: { "Content-Type": "application/json" } },
              );
            }
            const t = await res.text();
            console.error("AI gateway error:", res.status, t);
            return new Response(JSON.stringify({ error: "AI gateway error" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(res.body, {
            headers: { "Content-Type": "text/event-stream" },
          });
        } catch (e) {
          console.error("chat route error:", e);
          return new Response(
            JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
