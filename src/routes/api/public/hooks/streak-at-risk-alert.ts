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
        // For each at-risk user with an active partnership, queue a system nudge from their partner.
        let alerted = 0;
        for (const u of users) {
          const { data: p } = await admin
            .from("partnerships")
            .select("id,user_a,user_b")
            .or(`user_a.eq.${u.user_id},user_b.eq.${u.user_id}`)
            .eq("status", "active")
            .maybeSingle();
          if (!p) continue;
          const partner = p.user_a === u.user_id ? p.user_b : p.user_a;
          await admin.from("partner_nudges").insert({
            partnership_id: p.id,
            from_user: partner,
            to_user: u.user_id,
            kind: "system_streak_risk",
            message: `Your ${u.current_len}-day streak is at risk — finish today's mission!`,
          });
          alerted++;
        }
        return Response.json({ ok: true, alerted });
      },
    },
  },
});
