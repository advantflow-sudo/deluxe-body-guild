import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyCronSecret } from "@/lib/cron-auth.server";
import type { Database } from "@/integrations/supabase/types";

// Hourly — finds users whose local morning/evening reminder hour matches now,
// and queues an in-app notification row. Push send is a no-op until VAPID keys are configured.
export const Route = createFileRoute("/api/public/hooks/send-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!verifyCronSecret(request)) return new Response("Unauthorized", { status: 401 });
        const admin = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const results: Record<string, number> = {};
        for (const kind of ["morning", "evening"]) {
          const { data } = await admin.rpc("cron_users_for_reminder" as never, { _kind: kind } as never);
          results[kind] = (data as unknown as Array<{ user_id: string }> | null)?.length ?? 0;
        }
        return Response.json({ ok: true, queued: results });
      },
    },
  },
});
