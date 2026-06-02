import { Sparkles, Pause } from "lucide-react";
import { useReduceMotion } from "@/hooks/useReduceMotion";

/**
 * Compact reduce-motion toggle. Honors system `prefers-reduced-motion` until the user
 * clicks it, after which the user's choice is persisted to localStorage.
 */
export function ReduceMotionToggle({ className = "" }: { className?: string }) {
  const { reduceMotion, toggle, source } = useReduceMotion();
  const label = reduceMotion ? "Animations off" : "Animations on";
  const help = source === "system" && reduceMotion ? " (matches your system setting)" : "";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={reduceMotion}
      aria-label={`${label}. Click to ${reduceMotion ? "enable" : "reduce"} motion${help}.`}
      title={`${label}${help}`}
      className={`group inline-flex items-center gap-2 rounded-full border border-gold/25 bg-deluxe-black/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground transition hover:border-gold hover:text-gold ${className}`}
    >
      {reduceMotion ? (
        <Pause className="h-3 w-3 text-gold" strokeWidth={2} />
      ) : (
        <Sparkles className="h-3 w-3 text-gold" strokeWidth={2} />
      )}
      <span>{reduceMotion ? "Reduce motion" : "Full motion"}</span>
    </button>
  );
}
