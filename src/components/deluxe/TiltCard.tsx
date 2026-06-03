import { useRef, type ReactNode, type CSSProperties } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  max?: number;
  glare?: boolean;
  style?: CSSProperties;
};

/**
 * Subtle 3D tilt on hover with optional gold glare follow.
 * Degrades gracefully on touch (no JS handlers fire without pointer hover).
 */
export function TiltCard({
  children,
  className = "",
  max = 8,
  glare = true,
  style,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const reduce =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.reduceMotion === "true");

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || reduce) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (py - 0.5) * -2 * max;
    const ry = (px - 0.5) * 2 * max;
    el.style.setProperty("--rx", `${rx}deg`);
    el.style.setProperty("--ry", `${ry}deg`);
    el.style.setProperty("--gx", `${px * 100}%`);
    el.style.setProperty("--gy", `${py * 100}%`);
    el.style.setProperty("--ga", `1`);
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", `0deg`);
    el.style.setProperty("--ry", `0deg`);
    el.style.setProperty("--ga", `0`);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={
        {
          transform:
            "perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))",
          transformStyle: "preserve-3d",
          transition: "transform 300ms cubic-bezier(0.22,1,0.36,1)",
          ...style,
        } as CSSProperties
      }
      className={`tilt-card relative ${className}`}
    >
      {children}
      {glare && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
          style={{
            opacity: "var(--ga, 0)",
            background:
              "radial-gradient(380px circle at var(--gx,50%) var(--gy,50%), rgba(230,200,120,0.18), transparent 55%)",
            mixBlendMode: "screen",
          }}
        />
      )}
    </div>
  );
}
