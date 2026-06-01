import { timingSafeEqual } from "node:crypto";

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
