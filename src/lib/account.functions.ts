/**
 * Account self-service: export my data, delete my account.
 *
 * Both run as the signed-in member. Export reads through the member's own
 * session (RLS applies). Deletion needs the Auth Admin API, so the privileged
 * client is loaded inside the handler after the caller has been verified.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EXPORT_TABLES = [
  "profiles",
  "user_profiles_ext",
  "nutrition_logs",
  "meal_plans",
  "saved_meal_plans",
  "workout_sessions",
  "habits",
  "habit_logs",
  "body_measurements",
  "recovery_logs",
  "xp_events",
  "streaks",
  "daily_scores",
  "daily_missions",
  "reward_points",
  "reward_claims",
  "community_posts",
  "progress_photos",
  "connected_devices",
  "push_subscriptions",
  "reminder_deliveries",
] as const;

export const exportMyData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const out: Record<string, unknown> = {
      exported_at: new Date().toISOString(),
      user_id: context.userId,
    };
    for (const table of EXPORT_TABLES) {
      const key = table === "profiles" ? "id" : "user_id";
      const { data, error } = await (context.supabase.from(table) as any)
        .select("*")
        .eq(key, context.userId);
      out[table] = error ? { error: error.message } : (data ?? []);
    }
    return out;
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Remove private storage objects first (they are not cascaded by auth delete).
    for (const bucket of ["meal-photos", "progress-photos", "avatars"]) {
      const { data: files } = await supabaseAdmin.storage.from(bucket).list(userId, { limit: 1000 });
      const paths = (files ?? []).map((f) => `${userId}/${f.name}`);
      if (paths.length) await supabaseAdmin.storage.from(bucket).remove(paths);
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return { deleted: true };
  });
