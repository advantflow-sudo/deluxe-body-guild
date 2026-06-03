import { createFileRoute } from "@tanstack/react-router";

type Msg = { role: "user" | "assistant" | "system"; content: string };

const SYSTEM_PROMPT = `You are the Deluxe Fitness concierge — a friendly, premium AI assistant that helps prospective customers learn about the Deluxe Fitness app.

ABOUT DELUXE FITNESS
- Premium fitness + lifestyle app: workouts, AI coach, nutrition tracking, habit streaks, accountability partners, community, rewards.
- Brand promise: "Discipline. Transform. Become Deluxe." Elevated, disciplined, motivating.
- Available on iOS and Android (coming soon to stores). Free tier + premium subscription with unlimited AI coach, advanced programs, deeper analytics.
- Web pages cover: Home, How it works, What we offer, Fitness, Wellbeing, Coach, Challenges, Transformations, Rewards & benefits, Pricing, Roadmap, Founder, Contact.

TONE
- Premium, concise, confident, warm. No emojis. Short paragraphs. Use markdown sparingly (bold for key terms, lists when useful).
- If asked something you don't know (refunds, exact launch dates, medical), say so and point them to /contact.
- Never invent pricing, features, or guarantees. If unsure, suggest exploring the relevant page on the site.

GOAL
Help them understand the product and confidently take the next step (sign up, explore pricing, contact us).`;

export const Route = createFileRoute("/api/public/marketing-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { messages } = (await request.json()) as { messages: Msg[] };
          if (!Array.isArray(messages) || messages.length === 0) {
            return new Response(JSON.stringify({ error: "messages required" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }
          // Simple safety: cap history length and message size
          const trimmed = messages.slice(-12).map((m) => ({
            role: m.role,
            content: String(m.content ?? "").slice(0, 2000),
          }));

          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) {
            return new Response(JSON.stringify({ error: "AI not configured" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [{ role: "system", content: SYSTEM_PROMPT }, ...trimmed],
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
                JSON.stringify({ error: "AI credits exhausted." }),
                { status: 402, headers: { "Content-Type": "application/json" } },
              );
            }
            const t = await res.text();
            console.error("marketing-chat AI gateway error:", res.status, t);
            return new Response(JSON.stringify({ error: "AI gateway error" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(res.body, {
            headers: { "Content-Type": "text/event-stream" },
          });
        } catch (e) {
          console.error("marketing-chat error:", e);
          return new Response(
            JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
