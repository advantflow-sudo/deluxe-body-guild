import { useEffect, useRef } from "react";

const COLORS = ["#f5d97a", "#d4af37", "#fff4c1", "#b8901f"];
const PIECES = 32;

interface Props { fire: boolean; onDone?: () => void }

export function Confetti({ fire, onDone }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fire || !ref.current) return;
    const host = ref.current;
    const pieces: HTMLSpanElement[] = [];

    for (let i = 0; i < PIECES; i++) {
      const el = document.createElement("span");
      const size = 4 + Math.random() * 6;
      const angle = (Math.PI * 2 * i) / PIECES + Math.random() * 0.4;
      const distance = 80 + Math.random() * 140;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance - 30;
      const rot = Math.random() * 720 - 360;
      el.style.cssText = `position:absolute;left:50%;top:50%;width:${size}px;height:${size * 0.4}px;background:${COLORS[i % COLORS.length]};transform:translate(-50%,-50%);pointer-events:none;border-radius:1px;opacity:0;`;
      host.appendChild(el);
      pieces.push(el);
      el.animate(
        [
          { transform: "translate(-50%,-50%) scale(0.6) rotate(0deg)", opacity: 1 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1) rotate(${rot}deg)`, opacity: 1, offset: 0.7 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 120}px)) scale(0.8) rotate(${rot + 90}deg)`, opacity: 0 },
        ],
        { duration: 1400 + Math.random() * 600, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" }
      );
    }

    const t = setTimeout(() => {
      pieces.forEach((p) => p.remove());
      onDone?.();
    }, 2200);
    return () => { clearTimeout(t); pieces.forEach((p) => p.remove()); };
  }, [fire, onDone]);

  return <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 overflow-visible" />;
}
