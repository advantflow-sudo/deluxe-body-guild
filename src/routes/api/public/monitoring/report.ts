import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Public crash-report sink. Called by the browser (sendBeacon/fetch) for
 * uncaught errors. Input is strictly validated and truncated; nothing is
 * echoed back. Fatal crashes trigger an operational alert.
 */
const ReportSchema = z.object({
  message: z.string().min(1).max(1000),
  stack: z.string().max(4000).optional(),
  severity: z.enum(["error", "fatal", "warning"]).default("error"),
  route: z.string().max(500).optional(),
  userAgent: z.string().max(500).optional(),
  release: z.string().max(100).optional(),
  extra: z.record(z.string(), z.unknown()).optional(),
});

export const Route = createFileRoute("/api/public/monitoring/report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed;
        try {
          parsed = ReportSchema.parse(await request.json());
        } catch {
          return new Response("Bad request", { status: 400 });
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin.from("app_error_events").insert({
            source: "browser",
            severity: parsed.severity,
            message: parsed.message,
            stack: parsed.stack ?? null,
            route: parsed.route ?? null,
            user_agent: parsed.userAgent ?? request.headers.get("user-agent"),
            release: parsed.release ?? null,
            extra: JSON.parse(JSON.stringify(parsed.extra ?? {})),
          });

          if (parsed.severity === "fatal") {
            const { sendOpsAlert } = await import("@/lib/ops-alert.server");
            await sendOpsAlert({
              kind: "crash",
              title: "Deluxe Fitness client crash",
              detail: parsed.message,
              context: { route: parsed.route ?? "unknown", release: parsed.release ?? "unknown" },
            });
          }
        } catch (err) {
          console.error("[monitoring] failed to store report", err);
        }

        return new Response(null, { status: 204 });
      },
    },
  },
});
