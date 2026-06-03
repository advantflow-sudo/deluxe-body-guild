import { useEffect, useRef } from "react";

/**
 * Global gold cursor spotlight + dot follower.
 * - Hidden on touch devices and when reduce-motion is enabled.
 * - Expands over interactive targets (a, button, [data-magnetic], [role=button]).
 */
export function CursorSpotlight() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;
    const reduce =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.reduceMotion === "true";
    if (reduce) return;

    const dot = dotRef.current!;
    const ring = ringRef.current!;
    const glow = glowRef.current!;

    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let rx = tx;
    let ry = ty;
    let hover = false;
    let raf = 0;

    const move = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      dot.style.transform = `translate3d(${tx - 3}px, ${ty - 3}px, 0)`;
      glow.style.transform = `translate3d(${tx - 200}px, ${ty - 200}px, 0)`;
      const t = e.target as HTMLElement | null;
      const isInteractive =
        !!t &&
        (t.closest(
          'a, button, [role="button"], [data-magnetic], input, textarea, select, label',
        ) !== null);
      if (isInteractive !== hover) {
        hover = isInteractive;
        ring.dataset.hover = hover ? "true" : "false";
      }
    };
    const tick = () => {
      rx += (tx - rx) * 0.18;
      ry += (ty - ry) * 0.18;
      ring.style.transform = `translate3d(${rx - 18}px, ${ry - 18}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", move, { passive: true });
    raf = requestAnimationFrame(tick);
    document.documentElement.classList.add("has-custom-cursor");
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, []);

  return (
    <>
      <div
        ref={glowRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[60] h-[400px] w-[400px] rounded-full opacity-60 mix-blend-screen"
        style={{
          background:
            "radial-gradient(circle, rgba(230,200,120,0.18) 0%, rgba(230,200,120,0.06) 30%, transparent 60%)",
          filter: "blur(20px)",
        }}
      />
      <div
        ref={ringRef}
        aria-hidden
        data-hover="false"
        className="cursor-ring pointer-events-none fixed left-0 top-0 z-[61] h-9 w-9 rounded-full border border-gold/70 transition-[width,height,opacity,border-color] duration-200 ease-out"
      />
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[62] h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_12px_rgba(230,200,120,0.9)]"
      />
    </>
  );
}
