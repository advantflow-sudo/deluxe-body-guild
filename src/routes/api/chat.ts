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

    const [{ data: profile }, { data: ext }, { data: stats }, { data: sessions }, { data: lastWorkout }, { data: memory }, { data: recovery }, { data: xp }, { data: nutritionToday }, { data: streak }, { data: habits }, { data: habitLogsToday }, { data: latestPlan }] = await Promise.all([
      supabase.from("profiles").select("display_name,fitness_goal,bio").eq("id", userId).maybeSingle(),
      supabase.from("user_profiles_ext").select("fitness_goal,training_level,preferred_type,weight_kg,height_cm,age,subscription_tier").eq("user_id", userId).maybeSingle(),
      supabase.from("daily_stats").select("steps,calories,water_ml,streak").eq("user_id", userId).eq("stat_date", today).maybeSingle(),
      supabase.from("workout_sessions").select("completed_at,duration_min,calories,notes,workout_id").eq("user_id", userId).not("completed_at", "is", null).gt("duration_min", 0).gte("completed_at", since).order("completed_at", { ascending: false }).limit(7),
      supabase.from("workout_sessions").select("completed_at,workout_id").eq("user_id", userId).not("completed_at", "is", null).gt("duration_min", 0).order("completed_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("ai_coach_memory").select("category,key,value").eq("user_id", userId).limit(40),
      supabase.from("recovery_logs").select("log_date,sleep_quality,soreness,fatigue,energy,readiness,note").eq("user_id", userId).order("log_date", { ascending: false }).limit(3),
      supabase.rpc("get_xp_summary"),
      supabase.from("nutrition_logs").select("calories,protein_g,carbs_g,fat_g,meal_label").eq("user_id", userId).eq("log_date", today),
      supabase.from("streaks").select("current_len,longest_len,last_active_date").eq("user_id", userId).maybeSingle(),
      supabase.from("habits").select("id,name,target_value,unit").eq("user_id", userId).eq("active", true).limit(10),
      supabase.from("habit_logs").select("habit_id,value").eq("user_id", userId).eq("log_date", today),
      supabase.from("meal_plans").select("kcal_target,protein_target_g,carbs_target_g,fat_target_g").eq("user_id", userId).order("plan_date", { ascending: false }).limit(1).maybeSingle(),
    ]);


    // Resolve last workout title if available
    let lastWorkoutTitle: string | null = null;
    let daysSinceLast: number | null = null;
    if (lastWorkout) {
      if (lastWorkout.workout_id) {
        const { data: w } = await supabase.from("workouts").select("title").eq("id", lastWorkout.workout_id).maybeSingle();
        lastWorkoutTitle = w?.title ?? null;
      }
      daysSinceLast = Math.floor((Date.now() - new Date(lastWorkout.completed_at ?? Date.now()).getTime()) / 864e5);
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

    const xpSummary = xp as { total_xp?: number; today_xp?: number; rank?: string } | null;
    if (xpSummary?.rank) {
      lines.push(`- Rank: ${xpSummary.rank} (${xpSummary.total_xp ?? 0} XP total, ${xpSummary.today_xp ?? 0}/100 today)`);
    }

    if (latestPlan) {
      lines.push(`- Nutrition targets: ${latestPlan.kcal_target} kcal, ${latestPlan.protein_target_g}g protein, ${latestPlan.carbs_target_g}g carbs, ${latestPlan.fat_target_g}g fat`);
    }
    const nutritionLogged = (nutritionToday ?? []).reduce(
      (a, n) => ({ kcal: a.kcal + Number(n.calories ?? 0), protein: a.protein + Number(n.protein_g ?? 0) }),
      { kcal: 0, protein: 0 },
    );
    if ((nutritionToday ?? []).length) {
      lines.push(`- Logged today: ${Math.round(nutritionLogged.kcal)} kcal, ${Math.round(nutritionLogged.protein)}g protein across ${nutritionToday!.length} entr${nutritionToday!.length === 1 ? "y" : "ies"}`);
    } else {
      lines.push("- Nutrition: nothing logged yet today.");
    }

    if (streak) {
      lines.push(`- Streak: ${streak.current_len} day${streak.current_len === 1 ? "" : "s"} current, ${streak.longest_len} longest.`);
    }
    if ((habits ?? []).length) {
      const doneIds = new Set((habitLogsToday ?? []).map((h) => h.habit_id));
      const habitLines = (habits ?? []).map((h) => `${h.name}${doneIds.has(h.id) ? " ✓" : ""}`);
      lines.push(`- Habits today: ${habitLines.join(", ")}`);
    }

    const latestRecovery = (recovery ?? [])[0];
    if (latestRecovery) {
      lines.push(
        `- Readiness today: ${latestRecovery.readiness}/100 (sleep ${latestRecovery.sleep_quality}/5, soreness ${latestRecovery.soreness}/5, fatigue ${latestRecovery.fatigue}/5, energy ${latestRecovery.energy}/5)${latestRecovery.note ? `. Member note: ${latestRecovery.note}` : ""}`,
      );
      if ((latestRecovery.readiness ?? 100) < 45) {
        lines.push("- NOTE: Readiness is low. Scale today's training back — deload, mobility or active recovery — and say why.");
      }
    } else {
      lines.push("- Readiness today: not logged. Prompt them to complete the recovery check-in.");
    }

    let block = lines.join("\n");
    if ((memory ?? []).length) {
      const byCat = new Map<string, string[]>();
      for (const m of memory ?? []) {
        const list = byCat.get(m.category) ?? [];
        list.push(`${m.key.replace(/_/g, " ")}: ${m.value}`);
        byCat.set(m.category, list);
      }
      block +=
        "\n\nCOACH MEMORY (long-term facts about this member — use them, never contradict them):\n" +
        [...byCat.entries()].map(([cat, items]) => `- ${cat}: ${items.join("; ")}`).join("\n");
    }

    return "\n\n" + block;
  } catch (e) {
    console.error("buildMemberProfile failed:", e);

    return "";
  }
}

function logChat(
  level: "info" | "warn" | "error",
  event: string,
  fields: Record<string, unknown>,
) {
  const line = `[api/chat] ${event} ${JSON.stringify(fields)}`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

function jsonError(status: number, error: string, code: string, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify({ error, code }), {
    status,
    headers: { "Content-Type": "application/json", ...(extraHeaders ?? {}) },
  });
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const startedAt = Date.now();
        const client = request.headers.get("x-deluxe-client") ?? "unknown";
        try {
          // Require authentication — prevents anonymous use of paid AI credits
          const authHeader = request.headers.get("authorization");
          if (!authHeader?.startsWith("Bearer ")) {
            logChat("warn", "missing_auth_token", {
              client,
              hasHeader: !!authHeader,
              referer: request.headers.get("referer") ?? null,
            });
            return jsonError(401, "Unauthorized", "missing_auth_token");
          }
          const token = authHeader.slice(7);
          const SUPABASE_URL = process.env.SUPABASE_URL;
          const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
          if (!SUPABASE_URL || !SUPABASE_KEY) {
            logChat("error", "server_misconfigured", { client, missing: "supabase_env" });
            return jsonError(500, "Server misconfigured", "server_misconfigured");
          }
          const authClient = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
          });
          const { data: claimsData, error: claimsErr } = await authClient.auth.getClaims(token);
          if (claimsErr || !claimsData?.claims?.sub) {
            logChat("warn", "invalid_token", { client, reason: claimsErr?.message ?? "no_sub" });
            return jsonError(401, "Session expired. Please sign in again.", "invalid_token");
          }

          const body = (await request.json()) as { messages: Msg[]; client?: string };
          const messages = body.messages;
          const source = body.client ?? client;
          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) {
            logChat("error", "server_misconfigured", { client: source, missing: "LOVABLE_API_KEY" });
            return jsonError(500, "LOVABLE_API_KEY is not configured", "server_misconfigured");
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
            const retryAfter = res.headers.get("retry-after");
            logChat("error", "gateway_failure", {
              client: source,
              status: res.status,
              retryAfter,
              ms: Date.now() - startedAt,
            });
            if (res.status === 429) {
              return jsonError(429, "Too many requests. Please try again shortly.", "rate_limited", {
                "Retry-After": retryAfter ?? "5",
              });
            }
            if (res.status === 402 || res.status === 403) {
              return jsonError(
                res.status,
                "AI credits exhausted or blocked by workspace policy.",
                "out_of_credits",
              );
            }
            const t = await res.text();
            logChat("error", "gateway_body", { client: source, status: res.status, body: t.slice(0, 500) });
            return jsonError(502, "The AI service is temporarily unavailable.", "unavailable");
          }

          logChat("info", "gateway_ok", { client: source, ms: Date.now() - startedAt, messages: messages.length });
          return new Response(res.body, {
            headers: { "Content-Type": "text/event-stream" },
          });
        } catch (e) {
          logChat("error", "unhandled", {
            client,
            ms: Date.now() - startedAt,
            message: e instanceof Error ? e.message : String(e),
          });
          return jsonError(500, e instanceof Error ? e.message : "Unknown error", "unavailable");
        }
      },
    },
  },
});

