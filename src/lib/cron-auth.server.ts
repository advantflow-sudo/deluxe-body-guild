import { timingSafeEqual } from "node:crypto";

/**
 * Verifies a request is from our own pg_cron scheduler.
 * The ONLY accepted credential is the server-only CRON_SECRET sent in the
 * `x-cron-secret` header, compared in constant time. The Supabase
 * publishable/anon key is public (it ships in the client bundle) and must
 * never be accepted here.
 * Routes live under `/api/public/*` so this is the only gate.
 */
export function verifyCronSecret(request: Request): boolean {
  const provided = request.headers.get("x-cron-secret");
  const expected = process.env.CRON_SECRET;
  if (!expected || !provided || provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  } catch {
    return false;
  }
}

