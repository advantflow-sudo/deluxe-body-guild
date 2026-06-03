import { useEffect, useMemo, useRef, useState } from "react";
import { Volume2, VolumeX, Maximize2, Captions } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { track, type AnalyticsProps } from "@/lib/analytics";

interface VideoPlayerProps {
  src?: string;
  /** Optional playlist — plays each clip in order, then loops back to the first. */
  sources?: string[];
  poster?: string;
  className?: string;
  aspect?: "video" | "square" | "portrait";
  caption?: string;
  /** WebVTT captions track URL. */
  captionsUrl?: string;
  captionsLang?: string;
  captionsLabel?: string;
  /** Identifier sent with analytics events (e.g. "hero", "mission"). */
  analyticsId?: string;
  /** Extra props added to every analytics event. */
  analyticsProps?: AnalyticsProps;
  /** Hide all controls — pure video surface only. */
  chromeless?: boolean;
}

/**
 * Premium video player with double-buffered playlist for seamless clip
 * transitions. The inactive <video> preloads the next clip while the active
 * one is playing, then we crossfade on `ended` for zero-flicker handoff.
 *
 * Keyboard: Space/K play, ←/→ seek 5s, ↑/↓ volume, M mute, F fullscreen, C captions.
 */
export function VideoPlayer({
  src,
  sources,
  poster,
  className = "",
  aspect = "video",
  caption,
  captionsUrl,
  captionsLang = "en",
  captionsLabel = "English",
  analyticsId,
  analyticsProps = {},
  chromeless = false,
}: VideoPlayerProps) {
  // Build a healthy playlist; broken sources are removed on first error.
  const initialPlaylist = useMemo(
    () => (sources && sources.length > 0 ? sources : src ? [src] : []),
    [sources, src],
  );
  const [playlist, setPlaylist] = useState<string[]>(initialPlaylist);
  useEffect(() => setPlaylist(initialPlaylist), [initialPlaylist]);

  const [index, setIndex] = useState(0);
  const safeIndex = playlist.length === 0 ? 0 : index % playlist.length;
  const currentSrc = playlist[safeIndex] ?? "";
  const nextSrc =
    playlist.length > 1 ? playlist[(safeIndex + 1) % playlist.length] : "";
  const isPlaylist = playlist.length > 1;

  // Double-buffer: two video elements, one active (visible + playing), one
  // preloading the next clip. `activeAB` toggles between them on each advance.
  const [activeAB, setActiveAB] = useState<"A" | "B">("A");
  const videoA = useRef<HTMLVideoElement>(null);
  const videoB = useRef<HTMLVideoElement>(null);
  const activeRef = activeAB === "A" ? videoA : videoB;
  const inactiveRef = activeAB === "A" ? videoB : videoA;
  const srcA = activeAB === "A" ? currentSrc : nextSrc;
  const srcB = activeAB === "A" ? nextSrc : currentSrc;

  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [started, setStarted] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const [captionsOn, setCaptionsOn] = useState(false);
  const fired25 = useRef(false);
  const fired50 = useRef(false);
  const fired75 = useRef(false);

  const aspectClass =
    aspect === "square" ? "aspect-square" : aspect === "portrait" ? "aspect-[9/16]" : "aspect-video";

  const fire = (event: string, extra: AnalyticsProps = {}) => {
    track(`video_${event}`, {
      video_id: analyticsId ?? "video",
      src: currentSrc,
      clip_index: safeIndex,
      ...analyticsProps,
      ...extra,
    });
  };

  const toggle = () => {
    const v = activeRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  const onPlay = () => {
    setPlaying(true);
    setStarted(true);
    setFirstLoad(false);
    fire("play", { current_time: activeRef.current?.currentTime ?? 0 });
  };
  const onPause = () => {
    setPlaying(false);
    const v = activeRef.current;
    if (v && !v.ended) fire("pause", { current_time: v.currentTime, progress_pct: Math.round(progress) });
  };

  const advance = () => {
    if (!isPlaylist) return;
    fire("complete", { duration: activeRef.current?.duration ?? 0 });
    const next = inactiveRef.current;
    // Start the preloaded clip immediately for a seamless handoff.
    if (next) {
      try {
        next.currentTime = 0;
      } catch {}
      next.muted = muted;
      next.play().catch(() => {});
    }
    setActiveAB((p) => (p === "A" ? "B" : "A"));
    setIndex((i) => (i + 1) % playlist.length);
    fired25.current = false;
    fired50.current = false;
    fired75.current = false;
    setProgress(0);
  };

  const onEnded = () => {
    if (isPlaylist) advance();
  };

  const onError = (badSrc: string) => {
    // Remove broken source and recover gracefully.
    setPlaylist((prev) => {
      if (prev.length <= 1) return prev;
      const filtered = prev.filter((s) => s !== badSrc);
      return filtered.length > 0 ? filtered : prev;
    });
    if (isPlaylist) advance();
  };

  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const next = !muted;
    setMuted(next);
    if (videoA.current) videoA.current.muted = next;
    if (videoB.current) videoB.current.muted = next;
  };

  const goFullscreen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const node = containerRef.current;
    if (!node) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else node.requestFullscreen?.();
  };

  const toggleCaptions = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const v = activeRef.current;
    if (!v || !v.textTracks || v.textTracks.length === 0) return;
    const next = !captionsOn;
    for (let i = 0; i < v.textTracks.length; i++) {
      v.textTracks[i].mode = next ? "showing" : "hidden";
    }
    setCaptionsOn(next);
    fire(next ? "captions_on" : "captions_off");
  };

  const seekBy = (delta: number) => {
    const v = activeRef.current;
    if (!v || !v.duration) return;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + delta));
  };

  const adjustVolume = (delta: number) => {
    const v = activeRef.current;
    if (!v) return;
    v.volume = Math.max(0, Math.min(1, v.volume + delta));
    if (v.volume > 0 && v.muted) {
      v.muted = false;
      setMuted(false);
    }
  };

  const onTimeUpdate = () => {
    const v = activeRef.current;
    if (!v || !v.duration) return;
    const pct = (v.currentTime / v.duration) * 100;
    setProgress(pct);
    if (!fired25.current && pct >= 25) {
      fired25.current = true;
      fire("progress", { milestone: 25 });
    }
    if (!fired50.current && pct >= 50) {
      fired50.current = true;
      fire("progress", { milestone: 50 });
    }
    if (!fired75.current && pct >= 75) {
      fired75.current = true;
      fire("progress", { milestone: 75 });
    }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const v = activeRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    v.currentTime = pct * v.duration;
    fire("seek", { to_pct: Math.round(pct * 100) });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const key = e.key.toLowerCase();
    if ([" ", "k", "arrowleft", "arrowright", "arrowup", "arrowdown", "m", "f", "c"].includes(key)) {
      e.preventDefault();
    }
    switch (key) {
      case " ":
      case "k": toggle(); break;
      case "arrowleft": seekBy(-5); break;
      case "arrowright": seekBy(5); break;
      case "arrowup": adjustVolume(0.1); break;
      case "arrowdown": adjustVolume(-0.1); break;
      case "m": toggleMute(); break;
      case "f": goFullscreen(); break;
      case "c": toggleCaptions(); break;
    }
  };

  // Warm up the inactive video whenever the next source changes.
  useEffect(() => {
    const v = inactiveRef.current;
    if (!v || !nextSrc) return;
    try {
      v.load();
    } catch {}
  }, [nextSrc, activeAB]);

  return (
    <figure className={className}>
      <div
        ref={containerRef}
        onClick={chromeless ? undefined : toggle}
        onKeyDown={chromeless ? undefined : onKeyDown}
        role={chromeless ? undefined : "button"}
        tabIndex={chromeless ? undefined : 0}
        aria-label={caption ? `Video: ${caption}` : "Video player"}
        className={`group relative ${aspectClass} ${chromeless ? "" : "cursor-pointer"} overflow-hidden border border-gold/30 bg-deluxe-black shadow-[0_30px_60px_-30px_rgba(212,175,55,0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold`}
      >
        {firstLoad && (
          <Skeleton className="absolute inset-0 z-10 h-full w-full rounded-none bg-deluxe-forest/40" />
        )}

        {/* Buffer A */}
        <video
          ref={videoA}
          src={srcA}
          poster={poster}
          playsInline
          autoPlay={activeAB === "A"}
          loop={!isPlaylist}
          muted={muted}
          preload="auto"
          crossOrigin={captionsUrl ? "anonymous" : undefined}
          onTimeUpdate={activeAB === "A" ? onTimeUpdate : undefined}
          onPlay={activeAB === "A" ? onPlay : undefined}
          onPause={activeAB === "A" ? onPause : undefined}
          onEnded={activeAB === "A" ? onEnded : undefined}
          onError={() => activeAB === "A" && onError(srcA)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${activeAB === "A" ? "opacity-100" : "opacity-0"}`}
        />

        {/* Buffer B */}
        <video
          ref={videoB}
          src={srcB}
          poster={poster}
          playsInline
          autoPlay={activeAB === "B"}
          loop={!isPlaylist}
          muted={muted}
          preload="auto"
          crossOrigin={captionsUrl ? "anonymous" : undefined}
          onTimeUpdate={activeAB === "B" ? onTimeUpdate : undefined}
          onPlay={activeAB === "B" ? onPlay : undefined}
          onPause={activeAB === "B" ? onPause : undefined}
          onEnded={activeAB === "B" ? onEnded : undefined}
          onError={() => activeAB === "B" && onError(srcB)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${activeAB === "B" ? "opacity-100" : "opacity-0"}`}
        />

        {/* Gradient veil */}
        {!chromeless && (
          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-deluxe-black/80 via-deluxe-black/10 to-transparent transition-opacity duration-300 ${
              playing && started ? "opacity-0 group-hover:opacity-100" : "opacity-100"
            }`}
          />
        )}

        {/* Bottom control bar (no play/pause — videos autoplay) */}
        {!chromeless && started && (
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 px-4 pb-3 pt-8">
            <div
              onClick={seek}
              role="slider"
              aria-label="Seek"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
              className="relative h-1 flex-1 cursor-pointer overflow-hidden bg-foreground/15"
            >
              <div className="absolute inset-y-0 left-0 bg-gold transition-[width]" style={{ width: `${progress}%` }} />
            </div>
            {captionsUrl && (
              <button
                type="button"
                onClick={toggleCaptions}
                aria-label={captionsOn ? "Hide captions" : "Show captions"}
                aria-pressed={captionsOn}
                className={`transition hover:scale-110 ${captionsOn ? "text-gold" : "text-gold/50"}`}
              >
                <Captions className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
              className="text-gold transition hover:scale-110"
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={goFullscreen}
              aria-label="Fullscreen"
              className="text-gold transition hover:scale-110"
            >
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
