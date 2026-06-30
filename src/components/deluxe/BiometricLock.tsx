import { useEffect, useState } from "react";
import { Fingerprint } from "lucide-react";
import { useBiometric } from "@/hooks/useBiometric";
import { haptic } from "@/hooks/useHaptics";

/**
 * Renders a full-screen lock when biometric is enabled on this device.
 * The user must verify with Face ID / Touch ID once per app session.
 */
export function BiometricLock({ children }: { children: React.ReactNode }) {
  const bio = useBiometric();
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const needLock = bio.enabled && !unlocked;

  useEffect(() => {
    if (!bio.enabled) { setUnlocked(true); return; }
    // Auto-prompt on mount.
    bio.verify().then((ok) => {
      if (ok) { setUnlocked(true); haptic("success"); }
    }).catch(() => { /* user can retry */ });
  }, [bio.enabled]);

  const tryUnlock = async () => {
    setError(null);
    try {
      const ok = await bio.verify();
      if (ok) { setUnlocked(true); haptic("success"); }
    } catch (e) {
      haptic("error");
      setError((e as Error).message || "Verification failed");
    }
  };

  if (!needLock) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-deluxe-black px-6 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-full border border-gold/40 bg-deluxe-forest/30 text-gold">
        <Fingerprint className="h-10 w-10" />
      </div>
      <h1 className="mt-6 font-display text-2xl text-foreground">Deluxe Fitness</h1>
      <p className="mt-2 max-w-xs text-xs uppercase tracking-[0.25em] text-muted-foreground">
        Verify to continue
      </p>
      <button
        onClick={tryUnlock}
        className="mt-8 rounded-full border border-gold bg-gold/10 px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold transition hover:bg-gold hover:text-deluxe-black"
      >
        Unlock with Face ID
      </button>
      {error && <p className="mt-4 text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
