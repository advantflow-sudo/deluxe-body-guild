import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Reports whether email reminders can actually be delivered right now, so the
 * UI can disable the email toggle instead of silently promising emails.
 */
export const getEmailDeliveryStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = authUser?.user?.email ?? null;

    const { probeEmailDelivery } = await import("@/lib/email-templates/send-email");
    const status = await probeEmailDelivery(email ?? "delivery-check@example.com");

    return { ...status, hasAddress: Boolean(email) };
  });
