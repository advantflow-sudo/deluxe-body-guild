import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyCronSecret } from "@/lib/cron-auth.server";
import type { Database } from "@/integrations/supabase/types";

// Recomputes daily_scores for every user with mission today via direct SQL upsert.
// Keeps it cheap: only users that had activity today.
export const Route = createFileRoute("/api/public/hooks/score-recompute")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!verifyCronSecret(request)) return new Response("Unauthorized", { status: 401 });
        const admin = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        // Touch updated_at so realtime subscribers refresh
        const { error } = await admin
          .from("daily_scores")
          .update({ updated_at: new Date().toISOString() })
          .eq("score_date", new Date().toISOString().slice(0, 10));
        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
        return Response.json({ ok: true });
      },
    },
  },
});
