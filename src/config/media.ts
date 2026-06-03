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

import heroClip from "@/assets/hero-clip.mp4.asset.json";
import heroAnim from "@/assets/hero-anim.mp4.asset.json";
import workout1 from "@/assets/workout-1-anim.mp4.asset.json";
import workout2 from "@/assets/workout-2-anim.mp4.asset.json";
import workout3 from "@/assets/workout-3-anim.mp4.asset.json";
import communityAnim from "@/assets/community-anim.mp4.asset.json";

const env = import.meta.env;

const FALLBACK_HERO = heroClip.url;
// Reuse hero clip until a dedicated mission clip is provided — avoids broken/3rd-party samples.
const FALLBACK_MISSION = heroClip.url;

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

/** Playlist that auto-advances through every available brand clip. */
export const HERO_PLAYLIST: string[] = [
  heroClip.url,
  heroAnim.url,
  workout1.url,
  workout2.url,
  workout3.url,
  communityAnim.url,
];

/** Mission playlist — different ordering so two players on screen don't mirror each other. */
export const MISSION_PLAYLIST: string[] = [
  workout1.url,
  heroAnim.url,
  workout3.url,
  communityAnim.url,
  workout2.url,
  heroClip.url,
];
