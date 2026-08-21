import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

export type MemoryFact = {
  category: "goal" | "preference" | "equipment" | "limitation" | "progress" | "general";
  key: string;
  value: string;
};

/** Ask the model to distil durable facts about the member from a chat exchange. */
export async function extractFacts(transcript: string): Promise<MemoryFact[]> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "Extract only DURABLE facts about the member that a coach should remember long term: goals, equipment access, injuries/limitations, schedule and exercise preferences, key lifts and weights, bodyweight. Ignore small talk, one-off questions and anything speculative. Use short snake_case keys (e.g. squat_1rm, home_equipment, knee_injury). Max 6 facts. Return an empty list if nothing durable was said.",
        },
        { role: "user", content: transcript.slice(0, 12000) },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "save_memory",
            description: "Durable member facts",
            parameters: {
              type: "object",
              properties: {
                facts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      category: {
                        type: "string",
                        enum: ["goal", "preference", "equipment", "limitation", "progress", "general"],
                      },
                      key: { type: "string" },
                      value: { type: "string" },
                    },
                    required: ["category", "key", "value"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["facts"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "save_memory" } },
    }),
  });
  if (!res.ok) throw new Error(`AI gateway error ${res.status}`);
  const json = await res.json();
  const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) return [];
  const parsed = JSON.parse(args) as { facts?: MemoryFact[] };
  return (parsed.facts ?? [])
    .filter((f) => f.key && f.value)
    .slice(0, 6)
    .map((f) => ({
      category: f.category,
      key: f.key.toLowerCase().replace(/[^a-z0-9_]+/g, "_").slice(0, 80),
      value: f.value.slice(0, 600),
    }));
}

export async function upsertFacts(
  supabase: SupabaseClient<Database>,
  userId: string,
  facts: MemoryFact[],
) {
  if (!facts.length) return 0;
  const { error } = await supabase
    .from("ai_coach_memory")
    .upsert(
      facts.map((f) => ({ user_id: userId, category: f.category, key: f.key, value: f.value })),
      { onConflict: "user_id,key" },
    );
  if (error) throw new Error(error.message);
  return facts.length;
}

/** Compact memory block for prompt injection. */
export function formatMemory(rows: Array<{ category: string; key: string; value: string }>) {
  if (!rows.length) return "";
  const byCat = new Map<string, string[]>();
  for (const r of rows) {
    const list = byCat.get(r.category) ?? [];
    list.push(`${r.key.replace(/_/g, " ")}: ${r.value}`);
    byCat.set(r.category, list);
  }
  return [
    "COACH MEMORY (long-term facts about this member — use them, never contradict them):",
    ...[...byCat.entries()].map(([cat, items]) => `- ${cat}: ${items.join("; ")}`),
  ].join("\n");
}
