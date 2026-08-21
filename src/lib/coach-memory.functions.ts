import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Distil durable facts from a coach exchange and store them for future chats. */
export const rememberFromChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { transcript: string }) =>
    z.object({ transcript: z.string().min(10).max(20000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { extractFacts, upsertFacts } = await import("./coach-memory.server");
    const facts = await extractFacts(data.transcript);
    const saved = await upsertFacts(context.supabase, context.userId, facts);
    return { saved, facts };
  });

/** Recovery-aware adaptive plan for the next 7 days. */
export const adaptiveWeek = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { buildAdaptivePlan } = await import("./adaptive-plan.server");
    return buildAdaptivePlan(context.supabase, context.userId);
  });
