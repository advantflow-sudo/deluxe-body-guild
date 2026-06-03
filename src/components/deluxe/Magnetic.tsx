import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  strength?: number;
  className?: string;
};

/**
 * Wraps children and applies a magnetic pull toward the cursor on hover.
 * No-op on touch + reduce-motion.
 */
export function Magnetic({ children, strength = 0.35, className = "" }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.reduceMotion === "true"
    )
      return;

    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - (rect.left + rect.width / 2);
      const my = e.clientY - (rect.top + rect.height / 2);
      tx = mx * strength;
      ty = my * strength;
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
    };
    const tick = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [strength]);

  return (
    <span
      ref={ref}
      data-magnetic
      className={`inline-block will-change-transform ${className}`}
    >
      {children}
    </span>
  );
}
