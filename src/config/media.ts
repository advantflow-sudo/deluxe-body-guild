/**
 * Media configuration.
 *
 * Swap branded clips without editing route files:
 * 1. Drop your MP4 at `public/hero.mp4` and `public/mission.mp4` — or any URL.
 * 2. OR set the env vars in your project: VITE_HERO_VIDEO_URL, VITE_MISSION_VIDEO_URL,
 *    VITE_HERO_VIDEO_CAPTIONS_URL, VITE_MISSION_VIDEO_CAPTIONS_URL.
 *
 * Captions should be WebVTT (.vtt) files.
 */

const env = import.meta.env;

const FALLBACK_HERO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
const FALLBACK_MISSION =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";

export interface MediaClip {
  src: string;
  captionsUrl?: string;
  captionsLang?: string;
  captionsLabel?: string;
}

export const HERO_CLIP: MediaClip = {
  src: env.VITE_HERO_VIDEO_URL || FALLBACK_HERO,
  captionsUrl: env.VITE_HERO_VIDEO_CAPTIONS_URL || undefined,
  captionsLang: env.VITE_HERO_VIDEO_CAPTIONS_LANG || "en",
  captionsLabel: env.VITE_HERO_VIDEO_CAPTIONS_LABEL || "English",
};

export const MISSION_CLIP: MediaClip = {
  src: env.VITE_MISSION_VIDEO_URL || FALLBACK_MISSION,
  captionsUrl: env.VITE_MISSION_VIDEO_CAPTIONS_URL || undefined,
  captionsLang: env.VITE_MISSION_VIDEO_CAPTIONS_LANG || "en",
  captionsLabel: env.VITE_MISSION_VIDEO_CAPTIONS_LABEL || "English",
};
