import type { CSSProperties } from "react";

/** Subtle animated gold grid + drifting beams background. */
export function AnimatedGrid({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={style}
    >
      <div className="absolute inset-0 animated-grid opacity-[0.18]" />
      <div className="absolute inset-0 animated-beams" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-deluxe-black" />
    </div>
  );
}
