import { timingSafeEqual } from "node:crypto";

/**
 * Verifies a request is from our own pg_cron scheduler.
 * Accepts EITHER:
 *  - `x-cron-secret` matching CRON_SECRET (legacy), OR
 *  - `apikey` matching the project's Supabase publishable/anon key (standard pg_cron pattern).
 * Routes live under `/api/public/*` so this is the only gate.
 */
export function verifyCronSecret(request: Request): boolean {
  const cronSecret = request.headers.get("x-cron-secret");
  const expectedCron = process.env.CRON_SECRET;
  if (expectedCron && cronSecret && cronSecret.length === expectedCron.length) {
    try {
      if (timingSafeEqual(Buffer.from(cronSecret), Buffer.from(expectedCron))) return true;
    } catch {}
  }

  const apikey = request.headers.get("apikey");
  const expectedAnon = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (expectedAnon && apikey && apikey.length === expectedAnon.length) {
    try {
      if (timingSafeEqual(Buffer.from(apikey), Buffer.from(expectedAnon))) return true;
    } catch {}
  }
  return false;
}
