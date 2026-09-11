/**
 * Loads the user's unified daily targets (audit M2 single source of truth).
 * All resolution logic lives in src/lib/loadTargets.ts so every screen —
 * Home rings, Plan, Deluxe Score, Water, Weekly summary — shows one number.
 */
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { computeTargets, type DailyTargets, type ProfileExtLike } from "@/lib/targets";
import { loadTargets } from "@/lib/loadTargets";

export function useTargets(): { targets: DailyTargets; loading: boolean; ext: ProfileExtLike | null } {
  const { user } = useAuth();
  const [ext, setExt] = useState<ProfileExtLike | null>(null);
  const [targets, setTargets] = useState<DailyTargets>(() => computeTargets(null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const resolved = await loadTargets(user.id);
      if (cancelled) return;
      setExt(resolved.ext);
      setTargets(resolved.targets);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { targets, loading, ext };
}
