import { useEffect, useRef, useState, CSSProperties } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useReduceMotion } from "@/hooks/useReduceMotion";

export interface AnimatedMediaProps {
  /** Static image fallback (also used for poster). Required. */
  image: string;
  /** Optional animated MP4 URL (typically from an .asset.json import). */
  video?: string;
  /** Meaningful description for screen readers — required. */
  alt: string;
  /** Optional longer caption / description that's read alongside alt. */
  caption?: string;
  /** Wrapper className (sizing, border, etc.). */
  className?: string;
  /** Class applied to the inner media element (object-cover etc.). */
  mediaClassName?: string;
  /** Scroll-driven Ken Burns motion direction variant. */
  variant?: "in" | "alt" | "zoom";
  /** When true: eager load + preload hints; use for above-the-fold hero. */
  priority?: boolean;
  /** Tag for analytics / dev logging. */
  id?: string;
}

/**
 * AnimatedMedia
 *
 * - Renders a still <img> when reduce-motion is on.
 * - Otherwise renders an autoplaying muted looping <video> when a video URL is provided,
 *   falling back to a Ken Burns animated <img>.
 * - Adds scroll-tied subtle scale/translation: motion intensity tracks how much of the
 *   element is on-screen, so the effect feels reactive to where the user is on the page.
 * - Shows a skeleton until the underlying media is decoded.
 * - Emits accurate alt + aria-describedby for screen readers.
 */
export function AnimatedMedia({
  image,
  video,
  alt,
  caption,
  className = "",
  mediaClassName = "h-full w-full object-cover",
  variant = "in",
  priority = false,
  id,
}: AnimatedMediaProps) {
  const { reduceMotion } = useReduceMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1, drives scroll-tied motion
  const descId = caption && id ? `${id}-desc` : undefined;

  // Scroll-tied progress (IntersectionObserver thresholds, cheap & smooth enough).
  useEffect(() => {
    if (reduceMotion) return;
    const node = wrapRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // Compute "vertical progress through viewport" — 0 at entering bottom, 1 at exiting top.
          const rect = entry.boundingClientRect;
          const vh = window.innerHeight || 1;
          // Where the element's center sits vertically in the viewport (0..1, clamped).
          const center = rect.top + rect.height / 2;
          const p = 1 - Math.max(0, Math.min(1, center / vh));
          setProgress(p);
        }
      },
      { threshold: thresholds }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [reduceMotion]);

  // Pause video when offscreen, play when visible (saves CPU & battery).
  useEffect(() => {
    if (reduceMotion || !video) return;
    const node = wrapRef.current;
    const v = videoRef.current;
    if (!node || !v) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting && entry.intersectionRatio > 0.1) {
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: [0, 0.1, 0.5] }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [reduceMotion, video]);

  // Preload hint for priority assets.
  useEffect(() => {
    if (!priority || typeof document === "undefined") return;
    const href = !reduceMotion && video ? video : image;
    const as = !reduceMotion && video ? "video" : "image";
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = as;
    link.href = href;
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [priority, reduceMotion, video, image]);

  // Scroll-driven CSS variables. Subtle but noticeable.
  // scale: 1 -> 1.08 across the viewport pass-through.
  // translate: gentle pan whose sign depends on variant.
  const scale = 1 + progress * 0.08;
  const pan = (progress - 0.5) * 2; // -1..1
  const tx = variant === "alt" ? -pan * 1.5 : pan * 1.5;
  const ty = variant === "zoom" ? 0 : -pan * 1.2;

  const motionStyle: CSSProperties = reduceMotion
    ? {}
    : {
        transform: `scale(${scale.toFixed(3)}) translate3d(${tx.toFixed(2)}%, ${ty.toFixed(2)}%, 0)`,
        transition: "transform 220ms linear",
        willChange: "transform",
      };

  // ---- Reduce motion: plain still image ----
  if (reduceMotion) {
    return (
      <div ref={wrapRef} className={`relative overflow-hidden ${className}`}>
        <img
          src={image}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          aria-describedby={descId}
          className={mediaClassName}
          onLoad={() => setLoaded(true)}
        />
        {!loaded && <Skeleton className="absolute inset-0 rounded-none bg-deluxe-forest/40" />}
        {caption && descId && (
          <span id={descId} className="sr-only">
            {caption}
          </span>
        )}
      </div>
    );
  }

  // ---- Video version ----
  if (video) {
    return (
      <div ref={wrapRef} className={`relative overflow-hidden ${className}`} role="img" aria-label={alt}>
        {!loaded && <Skeleton className="absolute inset-0 z-10 rounded-none bg-deluxe-forest/40" />}
        <video
          ref={videoRef}
          src={video}
          poster={image}
          autoPlay
          loop
          muted
          playsInline
          preload={priority ? "auto" : "metadata"}
          aria-describedby={descId}
          onLoadedData={() => setLoaded(true)}
          onCanPlay={() => setLoaded(true)}
          style={motionStyle}
          className={mediaClassName}
        />
        {caption && descId && (
          <span id={descId} className="sr-only">
            {caption}
          </span>
        )}
      </div>
    );
  }

  // ---- Scroll-tied Ken Burns on still image ----
  return (
    <div ref={wrapRef} className={`relative overflow-hidden ${className}`}>
      <img
        src={image}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        aria-describedby={descId}
        onLoad={() => setLoaded(true)}
        style={motionStyle}
        className={mediaClassName}
      />
      {!loaded && <Skeleton className="absolute inset-0 rounded-none bg-deluxe-forest/40" />}
      {caption && descId && (
        <span id={descId} className="sr-only">
          {caption}
        </span>
      )}
    </div>
  );
}
