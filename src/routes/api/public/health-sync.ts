import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "crypto";
import { z } from "zod";

const num = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : Number(String(v).replace(",", "."))), z.number().min(min).max(max).optional());

const Body = z.object({
  weight_kg: num(20, 400),
  sleep_hours: num(0, 24),
  steps: num(0, 200000),
  resting_hr: num(20, 250),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/** Receives today's Apple Health readings from the member's iPhone Shortcut. */
export const Route = createFileRoute("/api/public/health-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization") ?? "";
        const raw = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
        if (!/^dfh_[a-f0-9]{48}$/.test(raw)) return Response.json({ error: "Invalid sync key" }, { status: 401 });

        const text = await request.text();
        if (text.length > 4000) return Response.json({ error: "Too large" }, { status: 413 });
        let json: unknown;
        try { json = JSON.parse(text); } catch { return Response.json({ error: "Send JSON" }, { status: 400 }); }
        const parsed = Body.safeParse(json);
        if (!parsed.success) return Response.json({ error: "Invalid values", issues: parsed.error.issues.map((i) => i.path.join(".")) }, { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const hash = createHash("sha256").update(raw).digest("hex");
        const { data: tok } = await supabaseAdmin.from("health_sync_tokens").select("user_id").eq("token_hash", hash).maybeSingle();
        if (!tok) return Response.json({ error: "Invalid sync key" }, { status: 401 });
        const userId = tok.user_id;

        const d = parsed.data;
        const date = d.date ?? new Date().toISOString().slice(0, 10);
        const recorded_at = `${date}T12:00:00.000Z`;
        const rows = ([
          ["weight_kg", d.weight_kg, "kg"],
          ["sleep_hours", d.sleep_hours, "h"],
          ["steps", d.steps !== undefined ? Math.round(d.steps) : undefined, "count"],
          ["resting_hr", d.resting_hr, "bpm"],
        ] as const)
          .filter(([, v]) => v !== undefined)
          .map(([metric_type, value, unit]) => ({ user_id: userId, provider: "apple_health", metric_type, value: value as number, unit, recorded_at }));
        if (!rows.length) return Response.json({ error: "No readings sent" }, { status: 400 });

        const { error } = await supabaseAdmin.from("device_metrics").upsert(rows, { onConflict: "user_id,provider,metric_type,recorded_at" });
        if (error) return Response.json({ error: "Could not save" }, { status: 500 });

        // Mirror into the daily stats and profile the rest of the app already uses.
        const patch: { steps?: number; sleep_hours?: number } = {};
        if (d.steps !== undefined) patch.steps = Math.round(d.steps);
        if (d.sleep_hours !== undefined) patch.sleep_hours = d.sleep_hours;
        if (Object.keys(patch).length) {
          const { data: existing } = await supabaseAdmin.from("daily_stats").select("id").eq("user_id", userId).eq("stat_date", date).maybeSingle();
          if (existing) await supabaseAdmin.from("daily_stats").update(patch).eq("id", existing.id);
          else await supabaseAdmin.from("daily_stats").insert({ user_id: userId, stat_date: date, ...patch });
        }
        if (d.weight_kg !== undefined) await supabaseAdmin.from("user_profiles_ext").update({ weight_kg: d.weight_kg }).eq("user_id", userId);

        const now = new Date().toISOString();
        await supabaseAdmin.from("health_sync_tokens").update({ last_used_at: now }).eq("user_id", userId);
        await supabaseAdmin.from("connected_devices").upsert(
          { user_id: userId, provider: "apple_health", display_name: "Apple Health (Shortcut)", status: "connected", last_synced_at: now },
          { onConflict: "user_id,provider" },
        );
        return Response.json({ ok: true, saved: rows.length });
      },
    },
  },
});
