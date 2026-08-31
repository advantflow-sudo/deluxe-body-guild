import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyCronSecret } from "@/lib/cron-auth.server";
import type { Database } from "@/integrations/supabase/types";

const TITLES = [
  "Iron Week",
  "Gold Standard",
  "Deluxe Ascent",
  "Momentum Week",
  "Peak Protocol",
  "Relentless Week",
];

/** Monday of the current UTC week, as YYYY-MM-DD. */
function currentWeekStart(): string {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff));
  return monday.toISOString().slice(0, 10);
}

// Runs daily — guarantees the team challenge board always shows the current week
// and retires challenges from previous weeks.
export const Route = createFileRoute("/api/public/hooks/weekly-challenge-rollover")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!verifyCronSecret(request)) return new Response("Unauthorized", { status: 401 });

        const admin = createClient<Database>(
          process.env["SUPABASE_URL"]!,
          process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );

        const week = currentWeekStart();

        const { data: existing, error: readErr } = await admin
          .from("weekly_team_challenges")
          .select("id")
          .eq("week_start", week)
          .limit(1);
        if (readErr) return Response.json({ ok: false, error: readErr.message }, { status: 500 });

        let created = false;
        if ((existing?.length ?? 0) === 0) {
          const weekIndex = Math.floor(Date.parse(week) / (7 * 86_400_000));
          const { error: insErr } = await admin.from("weekly_team_challenges").insert({
            title: TITLES[weekIndex % TITLES.length],
            week_start: week,
            is_active: true,
          });
          if (insErr) return Response.json({ ok: false, error: insErr.message }, { status: 500 });
          created = true;
        }

        // Retire anything older than the current week so the board never looks stale.
        const { error: retireErr } = await admin
          .from("weekly_team_challenges")
          .update({ is_active: false })
          .lt("week_start", week)
          .eq("is_active", true);
        if (retireErr) return Response.json({ ok: false, error: retireErr.message }, { status: 500 });

        return Response.json({ ok: true, week, created });
      },
    },
  },
});
