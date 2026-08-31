import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Sends the signed-in member a test mission reminder through every channel they
 * have enabled: in-app notification, Web Push (real browser subscriptions only)
 * and email when they opted in and Resend is configured.
 */
export const sendTestMissionReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const body = "Test reminder — your daily 100 XP mission is ready to claim.";

    const { error: nErr } = await supabaseAdmin
      .from("notifications")
      .insert({ user_id: userId, kind: "mission_ready", body });

    const { data: ext } = await supabase
      .from("user_profiles_ext")
      .select("mission_reminder_email")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: subs } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id,endpoint,p256dh,auth_key")
      .eq("user_id", userId);

    const { sendPush, pushConfigured } = await import("@/lib/webpush.server");
    let pushed = 0;
    let pushPending = 0;
    for (const sub of subs ?? []) {
      const outcome = await sendPush(sub, {
        title: "Deluxe Fitness",
        body,
        url: "/app?mission=1",
        tag: "df-mission",
      });
      if (outcome === "sent") {
        pushed += 1;
        await supabaseAdmin
          .from("push_subscriptions")
          .update({ last_used_at: new Date().toISOString() })
          .eq("id", sub.id);
      } else if (outcome === "gone") {
        await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
      } else {
        pushPending += 1;
      }
    }

    let emailed = false;
    const resendKey = process.env["RESEND_API_KEY"]?.trim();
    if (ext?.mission_reminder_email && resendKey) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
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
              subject: "Test mission reminder",
              html: `<p>${body}</p><p><a href="https://deluxefitness.app/app?mission=1">Claim your XP</a></p>`,
            }),
          });
          emailed = res.ok;
        } catch {
          emailed = false;
        }
      }
    }

    const logs: { user_id: string; channel: string; is_test: boolean }[] = [];
    if (!nErr) logs.push({ user_id: userId, channel: "in_app", is_test: true });
    for (let i = 0; i < pushed; i++) logs.push({ user_id: userId, channel: "push", is_test: true });
    if (emailed) logs.push({ user_id: userId, channel: "email", is_test: true });
    if (logs.length > 0) await supabaseAdmin.from("reminder_deliveries").insert(logs);

    return {
      inApp: !nErr,
      pushed,
      pushPending,
      emailed,
      pushConfigured: pushConfigured(),
      emailRequested: Boolean(ext?.mission_reminder_email),
      emailConfigured: Boolean(resendKey),
    };
  });
