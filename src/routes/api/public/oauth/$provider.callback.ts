import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { exchangeCode, getProvider } from "@/lib/oauth-providers.server";

/**
 * Unified OAuth callback for Fitbit / Strava / Oura.
 *
 * Register in each provider's developer console:
 *   https://deluxefitness.app/api/public/oauth/fitbit/callback
 *   https://deluxefitness.app/api/public/oauth/strava/callback
 *   https://deluxefitness.app/api/public/oauth/oura/callback
 */
export const Route = createFileRoute("/api/public/oauth/$provider/callback")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");
        const providerId = params.provider;

        const appOrigin = `${url.protocol}//${url.host}`;
        const back = (status: "ok" | "error", reason?: string) => {
          const dest = new URL("/app", appOrigin);
          dest.searchParams.set(providerId, status);
          if (reason) dest.searchParams.set("reason", reason);
          return Response.redirect(dest.toString(), 302);
        };

        const cfg = getProvider(providerId);
        if (!cfg) return back("error", "unsupported_provider");
        if (error) return back("error", error);
        if (!code || !state) return back("error", "missing_code_or_state");

        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!SUPABASE_URL || !SERVICE) return back("error", "server_not_configured");

        const admin = createClient<Database>(SUPABASE_URL, SERVICE, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: stateRow } = await admin
          .from("oauth_states")
          .select("*")
          .eq("state", state)
          .eq("provider", providerId)
          .maybeSingle();

        if (!stateRow) return back("error", "invalid_state");
        if (new Date(stateRow.expires_at).getTime() < Date.now()) {
          await admin.from("oauth_states").delete().eq("id", stateRow.id);
          return back("error", "state_expired");
        }
        await admin.from("oauth_states").delete().eq("id", stateRow.id);

        let tokens;
        try {
          tokens = await exchangeCode(cfg, code);
        } catch (e) {
          console.error(`[oauth/${providerId}/callback] exchange failed`, e);
          return back("error", "token_exchange_failed");
        }

        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
        const { error: upsertError } = await admin
          .from("connected_devices")
          .upsert(
            {
              user_id: stateRow.user_id,
              provider: providerId,
              display_name: cfg.displayName,
              status: "connected",
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token ?? null,
              token_expires_at: expiresAt,
              scopes: tokens.scope ? tokens.scope.split(/[,\s]+/).filter(Boolean) : null,
              last_synced_at: null,
            },
            { onConflict: "user_id,provider" },
          );

        if (upsertError) {
          console.error(`[oauth/${providerId}/callback] upsert failed`, upsertError);
          return back("error", "persist_failed");
        }
        return back("ok");
      },
    },
  },
});
