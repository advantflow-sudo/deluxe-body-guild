import { useEffect, useState } from "react";

/** Thin gold progress bar pinned to top of viewport. */
export function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setP(max > 0 ? (h.scrollTop / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[55] h-[2px] bg-transparent"
    >
      <div
        className="h-full origin-left bg-gradient-to-r from-gold-dark via-gold-light to-gold transition-[width] duration-100"
        style={{ width: `${p}%` }}
      />
    </div>
  );
}
