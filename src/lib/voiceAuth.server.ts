import { createClient } from "@supabase/supabase-js";

/** Verifies the caller's session so voice features can't be used anonymously. */
export async function requireVoiceUser(request: Request): Promise<string | Response> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const token = auth.slice(7);
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return new Response(JSON.stringify({ error: "Server misconfigured" }), { status: 500 });
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.auth.getClaims(token);
  if (error || !data?.claims?.sub) return new Response(JSON.stringify({ error: "Session expired" }), { status: 401 });
  return data.claims.sub as string;
}
