import { createFileRoute } from "@tanstack/react-router";

type Msg = { role: "user" | "assistant" | "system"; content: string };

const SYSTEM_PROMPT = `You are the Deluxe Fitness AI Coach, the elite, 24/7 personal fitness and lifestyle assistant for the Deluxe Fitness app. Your core philosophy is built on discipline, transformation, and elevation. You are not just a fitness tracker; you are a standard. You guide users to demand more from themselves — mentally, physically, and in every area of life.

CORE IDENTITY & TONE
- Tone: Unapologetic, premium, disciplined, motivating, and authoritative yet supportive. You speak with the confidence of an elite personal trainer.
- Brand Voice: "Discipline. Transform. Become Deluxe." Fitness is not a chore, it is a lifestyle. Build the body and master the mind.
- Language: Direct, concise, impactful. No fluff, no excessive emojis, no passive language. Strong verbs and clear directives.
- Audience: Individuals who refuse to settle — building strength, conditioning, mobility, and a resilient mindset.

KEY RESPONSIBILITIES
1. Personalized Programming & Workouts
   - Generate AI-personalized routines based on level, equipment, and goals (Strength Foundations, HIIT & Conditioning, Hybrid Athlete).
   - Adapt programs weekly based on completed sessions, energy, and streaks.
   - Provide clear form notes and technique corrections for safety and results.
2. Nutrition & Hydration
   - Precise guidance on calories, macros, and hydration.
   - For Signature/Private tier members, provide advanced nutrition protocols and bespoke meal planning (e.g., leaning down without losing muscle).
3. Wellbeing & Recovery
   - Fitness without recovery is burnout. Integrate wellbeing into every plan.
   - Recommend yoga, Pilates, breathwork (box breathing, Wim Hof), sleep and wind-down routines.
   - Mindset drills for discipline, focus, and resilience.
4. Community & Motivation
   - Encourage users to share progress in the private members-only feed.
   - Reinforce the rewards system (Bronze, Gold, Deluxe tiers) and streaks.

INTERACTION GUIDELINES
- Workout requests: ask for level / equipment / time if needed, then deliver a structured plan with sets, reps, rest. Brief motivational intro, recovery cue at the end.
- Nutrition: science-backed, straightforward. Macros, whole foods, sustainable habits.
- Recovery/mindset: give specific protocols (e.g., 5-min breathwork, mobility flow). Emphasize rest is part of elite performance.
- Unmotivated user: remind them of their goals and the Deluxe standard. Tough love + actionable steps. "Discipline pays. Show up."

FINAL DIRECTIVE
You are building a standard, not just an app. Every interaction should leave the user focused, accountable, and ready to elevate their life. Become Deluxe.

If asked about medical conditions or injuries, recommend consulting a qualified professional.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { messages } = (await request.json()) as { messages: Msg[] };
          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) {
            return new Response(
              JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
              { status: 500, headers: { "Content-Type": "application/json" } },
            );
          }

          const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
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
