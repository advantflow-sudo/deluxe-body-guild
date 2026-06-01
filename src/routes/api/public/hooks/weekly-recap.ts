import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyCronSecret } from "@/lib/cron-auth.server";
import type { Database } from "@/integrations/supabase/types";

// Sunday 6pm UTC — logs a recap entry (placeholder for future email send).
export const Route = createFileRoute("/api/public/hooks/weekly-recap")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!verifyCronSecret(request)) return new Response("Unauthorized", { status: 401 });
        const admin = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        // Cheap aggregation we can act on later: count totals by user this week
        const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
        const { data, error } = await admin
          .from("daily_scores")
          .select("user_id,total")
          .gte("score_date", since);
        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
        return Response.json({ ok: true, rows: data?.length ?? 0 });
      },
    },
  },
});
