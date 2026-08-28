import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyCronSecret } from "@/lib/cron-auth.server";
import type { Database } from "@/integrations/supabase/types";

// Hourly — nudges members whose local reminder hour is now and whose daily
// 100 XP mission is not fully claimed yet. Writes an in-app notification,
// sends Web Push where a real subscription exists, and optionally emails.
export const Route = createFileRoute("/api/public/hooks/mission-reminder")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!verifyCronSecret(request)) return new Response("Unauthorized", { status: 401 });

        const admin = createClient<Database>(
          process.env["SUPABASE_URL"]!,
          process.env["SUPABASE_SERVICE_ROLE_KEY"]!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );

        const { data, error } = await admin.rpc("cron_mission_reminder_users" as never);
        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

        const due = (data as unknown as Array<{
          user_id: string;
          email_opt_in: boolean;
          push_opt_in?: boolean;
          claimed_xp: number;
        }> | null) ?? [];

        let notified = 0;
        let pushed = 0;
        let emailed = 0;
        const resendKey = process.env["RESEND_API_KEY"]?.trim();

        for (const row of due) {
          const remaining = Math.max(0, 100 - Number(row.claimed_xp ?? 0));
          const body = `Your daily mission is ready — ${remaining} XP left to claim today.`;

          const { error: nErr } = await admin.from("notifications").insert({
            user_id: row.user_id,
            kind: "mission_ready",
            body,
          });
          if (!nErr) {
            notified += 1;
            await admin.from("reminder_deliveries").insert({
              user_id: row.user_id,
              channel: "in_app",
              claimed_xp_at_send: Number(row.claimed_xp ?? 0),
            });
          }

          // Web Push — only rows created by a real browser subscription.
          const { data: subs } = row.push_opt_in === false ? { data: [] } : await admin
            .from("push_subscriptions")
            .select("id,endpoint")
            .eq("user_id", row.user_id);
          for (const sub of subs ?? []) {
            if (!sub.endpoint.startsWith("http")) continue;
            try {
              const res = await fetch(sub.endpoint, {
                method: "POST",
                headers: { TTL: "3600", "Content-Type": "application/octet-stream" },
              });
              if (res.status === 404 || res.status === 410) {
                await admin.from("push_subscriptions").delete().eq("id", sub.id);
              } else if (res.ok) {
                pushed += 1;
                await admin
                  .from("push_subscriptions")
                  .update({ last_used_at: new Date().toISOString() })
                  .eq("id", sub.id);
                await admin.from("reminder_deliveries").insert({
                  user_id: row.user_id,
                  channel: "push",
                  claimed_xp_at_send: Number(row.claimed_xp ?? 0),
                });
              }
            } catch {
              // Delivery failures must never break the batch.
            }
          }

          if (row.email_opt_in && resendKey) {
            const { data: authUser } = await admin.auth.admin.getUserById(row.user_id);
            const email = authUser?.user?.email;
            if (email) {
              try {
                const res = await fetch("https://api.resend.com/emails", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${resendKey}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    from: "Deluxe Fitness <missions@deluxefitness.app>",
                    to: [email],
                    subject: `${remaining} XP left on today's mission`,
                    html: `<p>${body}</p><p><a href="https://deluxefitness.app/app?mission=1">Claim your XP</a></p>`,
                  }),
                });
                if (res.ok) {
                  emailed += 1;
                  await admin.from("reminder_deliveries").insert({
                    user_id: row.user_id,
                    channel: "email",
                    claimed_xp_at_send: Number(row.claimed_xp ?? 0),
                  });
                }
              } catch {
                // Email is a best-effort channel.
              }
            }
          }
        }

        return Response.json({ ok: true, due: due.length, notified, pushed, emailed });
      },
    },
  },
});
