import { useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2 } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  aspect?: "video" | "square" | "portrait";
  caption?: string;
}

/**
 * Premium video player with custom gold play overlay and inline controls.
 * Drop your branded MP4 at `public/...` and pass the path as `src`.
 */
export function VideoPlayer({ src, poster, className = "", aspect = "video", caption }: VideoPlayerProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [started, setStarted] = useState(false);

  const aspectClass =
    aspect === "square" ? "aspect-square" : aspect === "portrait" ? "aspect-[9/16]" : "aspect-video";

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
      setStarted(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = ref.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const goFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    ref.current?.requestFullscreen?.();
  };

  const onTimeUpdate = () => {
    const v = ref.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const v = ref.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    v.currentTime = pct * v.duration;
  };

  return (
    <figure className={className}>
      <div
        onClick={toggle}
        className={`group relative ${aspectClass} cursor-pointer overflow-hidden border border-gold/30 bg-deluxe-black shadow-[0_30px_60px_-30px_rgba(212,175,55,0.45)]`}
      >
        <video
          ref={ref}
          src={src}
          poster={poster}
          playsInline
          muted={muted}
          onTimeUpdate={onTimeUpdate}
          onEnded={() => setPlaying(false)}
          className="h-full w-full object-cover"
        />

        {/* Gradient veil */}
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-deluxe-black/80 via-deluxe-black/10 to-transparent transition-opacity duration-300 ${
            playing && started ? "opacity-0 group-hover:opacity-100" : "opacity-100"
          }`}
        />

        {/* Center play / pause */}
        <div
          className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
            playing && started ? "opacity-0 group-hover:opacity-100" : "opacity-100"
          }`}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-gold/60 bg-deluxe-black/60 backdrop-blur-sm transition group-hover:scale-110 group-hover:border-gold sm:h-24 sm:w-24">
            {playing ? (
              <Pause className="h-8 w-8 text-gold" strokeWidth={1.5} />
            ) : (
              <Play className="h-8 w-8 translate-x-0.5 text-gold" strokeWidth={1.5} fill="currentColor" />
            )}
          </div>
        </div>

        {/* Bottom control bar */}
        {started && (
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 px-4 pb-3 pt-8">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggle();
              }}
              aria-label={playing ? "Pause" : "Play"}
              className="text-gold transition hover:scale-110"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" fill="currentColor" />}
            </button>
            <div
              onClick={seek}
              className="relative h-1 flex-1 cursor-pointer overflow-hidden bg-foreground/15"
            >
              <div className="absolute inset-y-0 left-0 bg-gold transition-[width]" style={{ width: `${progress}%` }} />
            </div>
            <button onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} className="text-gold transition hover:scale-110">
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button onClick={goFullscreen} aria-label="Fullscreen" className="text-gold transition hover:scale-110">
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      {caption && (
        <figcaption className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
