import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyCronSecret } from "@/lib/cron-auth.server";
import type { Database } from "@/integrations/supabase/types";

// Hourly — finds users whose streak is at risk (no completion today) and queues a nudge row.
export const Route = createFileRoute("/api/public/hooks/streak-at-risk-alert")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!verifyCronSecret(request)) return new Response("Unauthorized", { status: 401 });
        const hour = new Date().getUTCHours();
        // Only fire the alert in the user-prime "evening risk" window (18-21 UTC).
        if (hour < 18 || hour > 21) return Response.json({ ok: true, skipped: true });

        const admin = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data, error } = await admin.rpc("cron_streak_at_risk_users" as never);
        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
        const users = (data ?? []) as Array<{ user_id: string; current_len: number }>;
        // Emit partner_nudges as "system" cheers; partner UI already subscribes.
        const rows = users.flatMap((u) => [{
          from_user: u.user_id,
          to_user: u.user_id,
          kind: "system_streak_risk",
          message: `Your ${u.current_len}-day streak is at risk — finish today's mission!`,
        }]);
        if (rows.length > 0) {
          await admin.from("partner_nudges").insert(rows);
        }
        return Response.json({ ok: true, alerted: users.length });
      },
    },
  },
});
