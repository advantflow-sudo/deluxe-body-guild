/**
 * Animated media manifest — maps each still image to its animated MP4 counterpart.
 *
 * Add new entries here when you generate a new animated clip; consumers (AnimatedMedia)
 * use this manifest so we never wire video URLs by hand across routes.
 */
import hero from "@/assets/hero.jpg";
import workout1 from "@/assets/workout-1.jpg";
import workout2 from "@/assets/workout-2.jpg";
import workout3 from "@/assets/workout-3.jpg";
import community from "@/assets/community.jpg";

import heroAnim from "@/assets/hero-anim.mp4.asset.json";
import w1Anim from "@/assets/workout-1-anim.mp4.asset.json";
import w2Anim from "@/assets/workout-2-anim.mp4.asset.json";
import w3Anim from "@/assets/workout-3-anim.mp4.asset.json";
import communityAnim from "@/assets/community-anim.mp4.asset.json";

export interface MediaEntry {
  image: string;
  video?: string;
  alt: string;
  caption: string;
}

export const MEDIA = {
  hero: {
    image: hero,
    video: heroAnim.url,
    alt: "A focused athlete training in a low-lit luxury gym",
    caption:
      "Wide cinematic shot of an athlete mid-set, golden rim light catching the bar, slow camera push-in.",
  },
  workout1: {
    image: workout1,
    video: w1Anim.url,
    alt: "Loaded barbell on a wooden lifting platform",
    caption: "Close-up of a loaded barbell with chalk dust drifting in warm gym light.",
  },
  workout2: {
    image: workout2,
    video: w2Anim.url,
    alt: "Coach demonstrating a precision movement with a member",
    caption: "AI-driven training session — coach guiding a member through a precision lift.",
  },
  workout3: {
    image: workout3,
    video: w3Anim.url,
    alt: "Row of kettlebells lined up on a polished gym floor",
    caption: "Kettlebells lined up at the edge of the training floor under directional spotlights.",
  },
  community: {
    image: community,
    video: communityAnim.url,
    alt: "Members on the training floor at a Deluxe community session",
    caption:
      "Slow pan across a packed training floor — members spotting each other, warm ambient light.",
  },
} satisfies Record<string, MediaEntry>;

export type MediaKey = keyof typeof MEDIA;
