import type { SupabaseClient } from "@supabase/supabase-js";

const RANK: Record<string, number> = {
  essential: 1, premium: 1, signature: 2, deluxe: 2, private: 3,
};

/**
 * Server-side membership check. Mirrors usePremium: paid plan tier, or an
 * unexpired points month (Signature-level). Throws 403 when below `min`.
 */
export async function requireTier(
  supabase: SupabaseClient<any>,
  userId: string,
  min: "essential" | "signature",
): Promise<void> {
  const { data } = await supabase
    .from("user_profiles_ext")
    .select("subscription_tier, premium_until")
    .eq("user_id", userId)
    .maybeSingle();
  let rank = RANK[(data?.subscription_tier as string) ?? ""] ?? 0;
  const until = data?.premium_until as string | null | undefined;
  if (until && new Date(until).getTime() > Date.now()) rank = Math.max(rank, 2);
  if (rank < RANK[min]) {
    const label = min === "signature" ? "Signature" : "Essential";
    throw new Response(`This feature needs the ${label} membership.`, { status: 403 });
  }
}
