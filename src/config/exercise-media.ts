/**
 * Exercise media resolver.
 *
 * Maps a workout exercise (by slug or name) to:
 *  - a real looping demo clip (MP4 assets in src/assets/exercises)
 *  - a form-check reference photo for its movement pattern
 *
 * Everything here is a real asset in the repo — nothing is a placeholder.
 */
import pushForm from "@/assets/form/push.jpg";
import pullForm from "@/assets/form/pull.jpg";
import legsForm from "@/assets/form/legs.jpg";
import coreForm from "@/assets/form/core.jpg";

import backSquat from "@/assets/exercises/back-squat.mp4.asset.json";
import benchPress from "@/assets/exercises/barbell-bench-press.mp4.asset.json";
import barbellCurl from "@/assets/exercises/barbell-curl.mp4.asset.json";
import hipThrust from "@/assets/exercises/barbell-hip-thrust.mp4.asset.json";
import barbellShrug from "@/assets/exercises/barbell-shrug.mp4.asset.json";
import bentOverFly from "@/assets/exercises/bent-over-reverse-fly.mp4.asset.json";
import bentOverRow from "@/assets/exercises/bent-over-row.mp4.asset.json";
import splitSquat from "@/assets/exercises/bulgarian-split-squat.mp4.asset.json";
import cableCrunch from "@/assets/exercises/cable-crunch.mp4.asset.json";
import woodchopper from "@/assets/exercises/cable-woodchopper.mp4.asset.json";
import closeGripBench from "@/assets/exercises/close-grip-bench-press.mp4.asset.json";
import dumbbellShrug from "@/assets/exercises/dumbbell-shrug.mp4.asset.json";
import facePull from "@/assets/exercises/face-pull.mp4.asset.json";
import farmersCarry from "@/assets/exercises/farmers-carry.mp4.asset.json";
import gluteBridge from "@/assets/exercises/glute-bridge.mp4.asset.json";
import hammerCurl from "@/assets/exercises/hammer-curl.mp4.asset.json";
import hangingLegRaise from "@/assets/exercises/hanging-leg-raise.mp4.asset.json";
import inclineCurl from "@/assets/exercises/incline-dumbbell-curl.mp4.asset.json";
import inclinePress from "@/assets/exercises/incline-dumbbell-press.mp4.asset.json";
import jumpRope from "@/assets/exercises/jump-rope.mp4.asset.json";
import latPulldown from "@/assets/exercises/lat-pulldown.mp4.asset.json";
import lateralRaise from "@/assets/exercises/lateral-raise.mp4.asset.json";
import legExtension from "@/assets/exercises/leg-extension.mp4.asset.json";
import legCurl from "@/assets/exercises/lying-leg-curl.mp4.asset.json";
import nordicCurl from "@/assets/exercises/nordic-curl.mp4.asset.json";
import overheadTriExt from "@/assets/exercises/overhead-triceps-extension.mp4.asset.json";
import plank from "@/assets/exercises/plank.mp4.asset.json";
import pullUp from "@/assets/exercises/pull-up.mp4.asset.json";
import pushUps from "@/assets/exercises/push-ups.mp4.asset.json";
import rearDeltFly from "@/assets/exercises/rear-delt-fly.mp4.asset.json";
import reverseCurl from "@/assets/exercises/reverse-curl.mp4.asset.json";
import reversePecDeck from "@/assets/exercises/reverse-pec-deck.mp4.asset.json";
import rdl from "@/assets/exercises/romanian-deadlift.mp4.asset.json";
import ropePushdown from "@/assets/exercises/rope-pushdown.mp4.asset.json";
import russianTwist from "@/assets/exercises/russian-twist.mp4.asset.json";
import seatedCalf from "@/assets/exercises/seated-calf-raise.mp4.asset.json";
import sidePlank from "@/assets/exercises/side-plank.mp4.asset.json";
import singleLegCalf from "@/assets/exercises/single-leg-calf-raise.mp4.asset.json";
import standingCalf from "@/assets/exercises/standing-calf-raise.mp4.asset.json";
import overheadPress from "@/assets/exercises/standing-overhead-press.mp4.asset.json";
import wristCurl from "@/assets/exercises/wrist-curl.mp4.asset.json";

/** slug -> clip URL. Slugs match the exercise asset filenames. */
export const EXERCISE_CLIPS: Record<string, string> = {
  "back-squat": backSquat.url,
  "barbell-bench-press": benchPress.url,
  "barbell-curl": barbellCurl.url,
  "barbell-hip-thrust": hipThrust.url,
  "barbell-shrug": barbellShrug.url,
  "bent-over-reverse-fly": bentOverFly.url,
  "bent-over-row": bentOverRow.url,
  "bulgarian-split-squat": splitSquat.url,
  "cable-crunch": cableCrunch.url,
  "cable-woodchopper": woodchopper.url,
  "close-grip-bench-press": closeGripBench.url,
  "dumbbell-shrug": dumbbellShrug.url,
  "face-pull": facePull.url,
  "farmers-carry": farmersCarry.url,
  "glute-bridge": gluteBridge.url,
  "hammer-curl": hammerCurl.url,
  "hanging-leg-raise": hangingLegRaise.url,
  "incline-dumbbell-curl": inclineCurl.url,
  "incline-dumbbell-press": inclinePress.url,
  "jump-rope": jumpRope.url,
  "lat-pulldown": latPulldown.url,
  "lateral-raise": lateralRaise.url,
  "leg-extension": legExtension.url,
  "lying-leg-curl": legCurl.url,
  "nordic-curl": nordicCurl.url,
  "overhead-triceps-extension": overheadTriExt.url,
  plank: plank.url,
  "pull-up": pullUp.url,
  "push-ups": pushUps.url,
  "rear-delt-fly": rearDeltFly.url,
  "reverse-curl": reverseCurl.url,
  "reverse-pec-deck": reversePecDeck.url,
  "romanian-deadlift": rdl.url,
  "rope-pushdown": ropePushdown.url,
  "russian-twist": russianTwist.url,
  "seated-calf-raise": seatedCalf.url,
  "side-plank": sidePlank.url,
  "single-leg-calf-raise": singleLegCalf.url,
  "standing-calf-raise": standingCalf.url,
  "standing-overhead-press": overheadPress.url,
  "wrist-curl": wristCurl.url,
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Loose name → slug aliases for DB exercises that don't match a filename exactly. */
const ALIASES: Record<string, string> = {
  squat: "back-squat",
  "barbell-squat": "back-squat",
  "bench-press": "barbell-bench-press",
  "push-up": "push-ups",
  pushup: "push-ups",
  pushups: "push-ups",
  "overhead-press": "standing-overhead-press",
  "shoulder-press": "standing-overhead-press",
  deadlift: "romanian-deadlift",
  "barbell-row": "bent-over-row",
  row: "bent-over-row",
  "pull-ups": "pull-up",
  pullup: "pull-up",
  chinup: "pull-up",
  "tricep-pushdown": "rope-pushdown",
  "triceps-pushdown": "rope-pushdown",
  "calf-raise": "standing-calf-raise",
  "leg-curl": "lying-leg-curl",
  "hip-thrust": "barbell-hip-thrust",
  "forearm-plank": "plank",
  skipping: "jump-rope",
};

/**
 * Resolve a demo clip URL for an exercise, matching on slug, alias, then a
 * best-effort token overlap so DB naming variations still get a real video.
 */
export function exerciseClip(nameOrSlug: string | null | undefined): string | undefined {
  if (!nameOrSlug) return undefined;
  const slug = slugify(nameOrSlug);
  if (EXERCISE_CLIPS[slug]) return EXERCISE_CLIPS[slug];
  const alias = ALIASES[slug];
  if (alias && EXERCISE_CLIPS[alias]) return EXERCISE_CLIPS[alias];

  const tokens = slug.split("-").filter((t) => t.length > 2);
  let best: { key: string; score: number } | null = null;
  for (const key of Object.keys(EXERCISE_CLIPS)) {
    const keyTokens = key.split("-");
    const score = tokens.filter((t) => keyTokens.includes(t)).length;
    if (score > 0 && (!best || score > best.score)) best = { key, score };
  }
  return best ? EXERCISE_CLIPS[best.key] : undefined;
}

export interface FormReference {
  image: string;
  label: string;
  cues: string[];
}

const PUSH: FormReference = {
  image: pushForm,
  label: "Press pattern",
  cues: [
    "Shoulder blades pinned back and down before the first rep.",
    "Wrists stacked over elbows — no bar drift.",
    "Ribs down, brace the core, exhale through the press.",
  ],
};

const PULL: FormReference = {
  image: pullForm,
  label: "Pull pattern",
  cues: [
    "Hinge to a flat back — chest proud, no rounding.",
    "Lead with the elbows, finish by squeezing the shoulder blades.",
    "Control the lowering phase for a full two counts.",
  ],
};

const LEGS: FormReference = {
  image: legsForm,
  label: "Squat / hinge pattern",
  cues: [
    "Full foot pressure — mid-foot and heel, not the toes.",
    "Knees track over the toes, never collapsing inward.",
    "Neutral spine from the top of the rep to the bottom.",
  ],
};

const CORE: FormReference = {
  image: coreForm,
  label: "Brace pattern",
  cues: [
    "Straight line from head to heels — no sag, no pike.",
    "Squeeze glutes and quads to lock the position.",
    "Breathe shallow and steady; never hold your breath.",
  ],
};

/** Pick the form-check reference for an exercise / muscle group / block label. */
export function formReference(...hints: (string | null | undefined)[]): FormReference {
  const hay = hints.filter(Boolean).join(" ").toLowerCase();
  if (/(core|abs|abdominal|plank|crunch|oblique|twist|carry)/.test(hay)) return CORE;
  if (/(leg|quad|glute|hamstring|calf|squat|lunge|deadlift|hinge|thrust)/.test(hay)) return LEGS;
  if (/(back|lat|row|pull|curl|bicep|trap|rear delt|forearm)/.test(hay)) return PULL;
  return PUSH;
}
