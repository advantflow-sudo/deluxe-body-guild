import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { exchangeCodeForTokens } from "@/lib/google-fit.server";

/**
 * Google Fit OAuth callback.
 *
 * Google redirects the user's browser here after they authorize Deluxe Fitness.
 * We:
 *   1. Validate the `state` token against `oauth_states` (matches a real user, not expired).
 *   2. Exchange the `code` for access + refresh tokens.
 *   3. Persist them on the `connected_devices` row scoped to that user.
 *   4. Redirect the user back into the app.
 */
export const Route = createFileRoute("/api/public/google-fit/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        const appOrigin = `${url.protocol}//${url.host}`;
        const back = (status: "ok" | "error", reason?: string) => {
          const dest = new URL("/app", appOrigin);
          dest.searchParams.set("google_fit", status);
          if (reason) dest.searchParams.set("reason", reason);
          return Response.redirect(dest.toString(), 302);
        };

        if (error) return back("error", error);
        if (!code || !state) return back("error", "missing_code_or_state");

        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const clientId = process.env.GOOGLE_FIT_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_FIT_CLIENT_SECRET;
        if (!SUPABASE_URL || !SERVICE || !clientId || !clientSecret) {
          return back("error", "server_not_configured");
        }

        const admin = createClient<Database>(SUPABASE_URL, SERVICE, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        // 1. Look up + consume the state token
        const { data: stateRow } = await admin
          .from("oauth_states")
          .select("*")
          .eq("state", state)
          .eq("provider", "google_fit")
          .maybeSingle();

        if (!stateRow) return back("error", "invalid_state");
        if (new Date(stateRow.expires_at).getTime() < Date.now()) {
          await admin.from("oauth_states").delete().eq("id", stateRow.id);
          return back("error", "state_expired");
        }
        await admin.from("oauth_states").delete().eq("id", stateRow.id);

        // 2. Exchange the code for tokens
        let tokens;
        try {
          tokens = await exchangeCodeForTokens({ code, clientId, clientSecret });
        } catch (e) {
          console.error("[google-fit/callback] token exchange failed", e);
          return back("error", "token_exchange_failed");
        }

        // 3. Persist on the user's connected_devices row
        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
        const { error: upsertError } = await admin
          .from("connected_devices")
          .upsert(
            {
              user_id: stateRow.user_id,
              provider: "google_fit",
              display_name: "Google Fit",
              status: "connected",
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token ?? null,
              token_expires_at: expiresAt,
              scopes: tokens.scope.split(" "),
              last_synced_at: null,
            },
            { onConflict: "user_id,provider" },
          );

        if (upsertError) {
          console.error("[google-fit/callback] upsert failed", upsertError);
          return back("error", "persist_failed");
        }

        return back("ok");
      },
    },
  },
});
